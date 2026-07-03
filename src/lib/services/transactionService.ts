import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/services/auditService";
import type { PaymentMode, TransactionSource, TransactionType } from "@prisma/client";

export interface CreateTransactionInput {
  type: TransactionType; // EXPENSE | INCOME
  amount: number;
  description?: string;
  businessId: string;
  categoryId?: string;
  customerId?: string;
  supplierId?: string;
  paymentMode?: PaymentMode;
  date?: Date;
  enteredById: string;
  source?: TransactionSource; // WEB | TELEGRAM | WHATSAPP — defaults to WEB
  rawMessage?: string;
}

const LARGE_EXPENSE_THRESHOLD = Number(process.env.LARGE_EXPENSE_THRESHOLD ?? 10000);

/**
 * Creates a transaction, writes the matching customer/supplier ledger entry
 * (with running balance), writes an audit log row, and raises a
 * large-expense notification — all inside one DB transaction.
 *
 * This is the single write-path for transactions. The web UI calls this.
 * The Telegram bot (Phase 2) and WhatsApp adapter (Phase 4) will call this
 * exact same function — they only need to resolve a ParsedTransactionDraft
 * into these input fields before calling it.
 */
export async function createTransaction(input: CreateTransactionInput) {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        type: input.type,
        amount: input.amount,
        description: input.description,
        businessId: input.businessId,
        categoryId: input.categoryId,
        customerId: input.customerId,
        supplierId: input.supplierId,
        paymentMode: input.paymentMode ?? "CASH",
        date: input.date ?? new Date(),
        enteredById: input.enteredById,
        source: input.source ?? "WEB",
        rawMessage: input.rawMessage,
      },
    });

    // Customer ledger: INCOME against a customer = PAYMENT_IN, otherwise
    // (rare) an EXPENSE tagged to a customer is not ledgered.
    if (input.customerId && input.type === "INCOME") {
      const last = await tx.customerLedgerEntry.findFirst({
        where: { customerId: input.customerId },
        orderBy: { createdAt: "desc" },
      });
      const prevBalance = last ? Number(last.runningBalance) : 0;
      const newBalance = prevBalance - input.amount; // payment reduces outstanding
      await tx.customerLedgerEntry.create({
        data: {
          customerId: input.customerId,
          transactionId: transaction.id,
          entryType: "PAYMENT_IN",
          amount: input.amount,
          runningBalance: newBalance,
        },
      });
    }

    // Supplier ledger: EXPENSE against a supplier = PURCHASE increases payable.
    if (input.supplierId && input.type === "EXPENSE") {
      const last = await tx.supplierLedgerEntry.findFirst({
        where: { supplierId: input.supplierId },
        orderBy: { createdAt: "desc" },
      });
      const prevBalance = last ? Number(last.runningBalance) : 0;
      const newBalance = prevBalance + input.amount;
      await tx.supplierLedgerEntry.create({
        data: {
          supplierId: input.supplierId,
          transactionId: transaction.id,
          entryType: "PURCHASE",
          amount: input.amount,
          runningBalance: newBalance,
        },
      });
    }

    await logAudit(tx, {
      entityType: "Transaction",
      entityId: transaction.id,
      action: "CREATE",
      newValue: transaction,
      actorId: input.enteredById,
      transactionId: transaction.id,
    });

    if (input.type === "EXPENSE" && input.amount >= LARGE_EXPENSE_THRESHOLD) {
      await tx.notification.create({
        data: {
          type: "LARGE_EXPENSE",
          title: "Large expense recorded",
          message: `₹${input.amount.toLocaleString("en-IN")} expense: ${input.description ?? "no description"}`,
        },
      });
    }

    return transaction;
  });
}

/** Record a sale raised against a customer (increases their outstanding balance). */
export async function recordCustomerSale(params: {
  customerId: string;
  businessId: string;
  amount: number;
  description?: string;
  enteredById: string;
}) {
  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        type: "INCOME",
        amount: params.amount,
        description: params.description,
        businessId: params.businessId,
        customerId: params.customerId,
        enteredById: params.enteredById,
        source: "WEB",
      },
    });
    const last = await tx.customerLedgerEntry.findFirst({
      where: { customerId: params.customerId },
      orderBy: { createdAt: "desc" },
    });
    const prevBalance = last ? Number(last.runningBalance) : 0;
    await tx.customerLedgerEntry.create({
      data: {
        customerId: params.customerId,
        transactionId: transaction.id,
        entryType: "SALE",
        amount: params.amount,
        runningBalance: prevBalance + params.amount,
      },
    });
    await logAudit(tx, {
      entityType: "Transaction",
      entityId: transaction.id,
      action: "CREATE",
      newValue: transaction,
      actorId: params.enteredById,
      transactionId: transaction.id,
    });
    return transaction;
  });
}

export async function updateTransaction(
  id: string,
  data: Partial<CreateTransactionInput>,
  actorId: string
) {
  const old = await prisma.transaction.findUniqueOrThrow({ where: { id } });
  const updated = await prisma.transaction.update({ where: { id }, data });
  await logAudit(prisma, {
    entityType: "Transaction",
    entityId: id,
    action: "UPDATE",
    oldValue: old,
    newValue: updated,
    actorId,
    transactionId: id,
  });
  return updated;
}

export async function deleteTransaction(id: string, actorId: string) {
  const old = await prisma.transaction.findUniqueOrThrow({ where: { id } });
  await prisma.transaction.delete({ where: { id } });
  await logAudit(prisma, {
    entityType: "Transaction",
    entityId: id,
    action: "DELETE",
    oldValue: old,
    actorId,
  });
  return old;
}

export async function listTransactions(filters: {
  businessId?: string;
  type?: TransactionType;
  from?: Date;
  to?: Date;
  search?: string;
  customerId?: string;
  supplierId?: string;
  take?: number;
}) {
  return prisma.transaction.findMany({
    where: {
      businessId: filters.businessId,
      type: filters.type,
      customerId: filters.customerId,
      supplierId: filters.supplierId,
      date: { gte: filters.from, lte: filters.to },
      OR: filters.search
        ? [
            { description: { contains: filters.search, mode: "insensitive" } },
            { customer: { name: { contains: filters.search, mode: "insensitive" } } },
            { supplier: { name: { contains: filters.search, mode: "insensitive" } } },
          ]
        : undefined,
    },
    include: { business: true, category: true, customer: true, supplier: true, enteredBy: true },
    orderBy: { date: "desc" },
    take: filters.take ?? 100,
  });
}
