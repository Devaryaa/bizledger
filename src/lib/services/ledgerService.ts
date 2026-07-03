import { prisma } from "@/lib/prisma";

export async function getCustomerLedgerSummary(customerId: string) {
  const entries = await prisma.customerLedgerEntry.findMany({
    where: { customerId },
    include: { transaction: true },
    orderBy: { createdAt: "asc" },
  });

  const totalSales = entries
    .filter((e) => e.entryType === "SALE")
    .reduce((s, e) => s + Number(e.amount), 0);
  const totalReceived = entries
    .filter((e) => e.entryType === "PAYMENT_IN")
    .reduce((s, e) => s + Number(e.amount), 0);
  const outstanding = entries.length ? Number(entries[entries.length - 1].runningBalance) : 0;
  const lastPayment = [...entries].reverse().find((e) => e.entryType === "PAYMENT_IN");

  return {
    totalSales,
    totalReceived,
    outstanding,
    lastPaymentDate: lastPayment?.createdAt ?? null,
    entries,
  };
}

export async function getSupplierLedgerSummary(supplierId: string) {
  const entries = await prisma.supplierLedgerEntry.findMany({
    where: { supplierId },
    include: { transaction: true },
    orderBy: { createdAt: "asc" },
  });

  const totalPurchases = entries
    .filter((e) => e.entryType === "PURCHASE")
    .reduce((s, e) => s + Number(e.amount), 0);
  const totalPaid = entries
    .filter((e) => e.entryType === "PAYMENT_OUT")
    .reduce((s, e) => s + Number(e.amount), 0);
  const outstanding = entries.length ? Number(entries[entries.length - 1].runningBalance) : 0;
  const lastPayment = [...entries].reverse().find((e) => e.entryType === "PAYMENT_OUT");

  return {
    totalPurchases,
    totalPaid,
    outstanding,
    lastPaymentDate: lastPayment?.createdAt ?? null,
    entries,
  };
}

export async function listCustomersWithOutstanding(businessId?: string) {
  const customers = await prisma.customer.findMany({
    where: businessId ? { businessId } : {},
    include: { ledgerEntries: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return customers
    .map((c) => ({
      ...c,
      outstanding: c.ledgerEntries[0] ? Number(c.ledgerEntries[0].runningBalance) : 0,
    }))
    .sort((a, b) => b.outstanding - a.outstanding);
}

export async function listSuppliersWithOutstanding(businessId?: string) {
  const suppliers = await prisma.supplier.findMany({
    where: businessId ? { businessId } : {},
    include: { ledgerEntries: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return suppliers
    .map((s) => ({
      ...s,
      outstanding: s.ledgerEntries[0] ? Number(s.ledgerEntries[0].runningBalance) : 0,
    }))
    .sort((a, b) => b.outstanding - a.outstanding);
}
