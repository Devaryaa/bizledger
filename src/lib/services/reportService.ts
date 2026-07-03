import { prisma } from "@/lib/prisma";
import { Parser } from "json2csv";

export async function generateReport(params: {
  businessId?: string;
  from?: Date;
  to?: Date;
}) {
  const transactions = await prisma.transaction.findMany({
    where: {
      businessId: params.businessId,
      date: { gte: params.from, lte: params.to },
    },
    include: { business: true, category: true, customer: true, supplier: true, enteredBy: true },
    orderBy: { date: "desc" },
  });

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + Number(t.amount), 0);

  const byCategory: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type === "EXPENSE") {
      const key = t.category?.name ?? "Uncategorized";
      byCategory[key] = (byCategory[key] ?? 0) + Number(t.amount);
    }
  }

  return {
    transactions,
    totalIncome,
    totalExpense,
    netProfit: totalIncome - totalExpense,
    byCategory,
  };
}

export function transactionsToCsv(transactions: any[]) {
  const fields = [
    { label: "Date", value: (row: any) => new Date(row.date).toISOString().slice(0, 10) },
    { label: "Type", value: "type" },
    { label: "Amount", value: (row: any) => Number(row.amount) },
    { label: "Business", value: (row: any) => row.business?.name ?? "" },
    { label: "Category", value: (row: any) => row.category?.name ?? "" },
    { label: "Customer", value: (row: any) => row.customer?.name ?? "" },
    { label: "Supplier", value: (row: any) => row.supplier?.name ?? "" },
    { label: "Description", value: "description" },
    { label: "Payment Mode", value: "paymentMode" },
    { label: "Entered By", value: (row: any) => row.enteredBy?.name ?? "" },
  ];
  const parser = new Parser({ fields });
  return parser.parse(transactions);
}
