import { prisma } from "@/lib/prisma";
import { startOfDay, startOfMonth, endOfDay } from "date-fns";

export async function getCashBalance(businessId?: string) {
  const where = businessId ? { businessId } : {};

  const [openingBalances, incomeAgg, expenseAgg] = await Promise.all([
    prisma.openingBalance.findMany({
      where: businessId ? { businessId } : {},
    }),
    prisma.transaction.aggregate({
      where: { ...where, type: "INCOME" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...where, type: "EXPENSE" },
      _sum: { amount: true },
    }),
  ]);

  const opening = openingBalances.reduce((sum, ob) => sum + Number(ob.amount), 0);
  const totalIncome = Number(incomeAgg._sum.amount ?? 0);
  const totalExpense = Number(expenseAgg._sum.amount ?? 0);
  const closing = opening + totalIncome - totalExpense;

  return {
    openingBalance: opening,
    totalDeposits: totalIncome,
    totalExpenses: totalExpense,
    closingBalance: closing,
    cashInHand: closing,
  };
}

export async function getDashboardSummary(businessId?: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);

  const where = businessId ? { businessId } : {};

  const [todayIncome, todayExpense, monthIncome, monthExpense, cash] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...where, type: "INCOME", date: { gte: todayStart, lte: todayEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...where, type: "EXPENSE", date: { gte: todayStart, lte: todayEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...where, type: "INCOME", date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...where, type: "EXPENSE", date: { gte: monthStart } },
      _sum: { amount: true },
    }),
    getCashBalance(businessId),
  ]);

  const ti = Number(todayIncome._sum.amount ?? 0);
  const te = Number(todayExpense._sum.amount ?? 0);
  const mi = Number(monthIncome._sum.amount ?? 0);
  const me = Number(monthExpense._sum.amount ?? 0);

  return {
    todayIncome: ti,
    todayExpense: te,
    todayProfit: ti - te,
    monthIncome: mi,
    monthExpense: me,
    monthProfit: mi - me,
    cashInHand: cash.cashInHand,
  };
}
