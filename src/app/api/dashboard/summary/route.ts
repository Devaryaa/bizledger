import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/services/cashBalanceService";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businesses = await prisma.business.findMany({ where: { isActive: true } });

  const overall = await getDashboardSummary();
  const perBusiness = await Promise.all(
    businesses.map(async (b) => ({ business: b, summary: await getDashboardSummary(b.id) }))
  );

  const recentTransactions = await prisma.transaction.findMany({
    take: 10,
    orderBy: { date: "desc" },
    include: { business: true, category: true, customer: true, supplier: true },
  });

  const topCategoriesRaw = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { type: "EXPENSE" },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 5,
  });
  const categories = await prisma.category.findMany({
    where: { id: { in: topCategoriesRaw.map((c) => c.categoryId).filter(Boolean) as string[] } },
  });
  const topCategories = topCategoriesRaw.map((c) => ({
    name: categories.find((cat) => cat.id === c.categoryId)?.name ?? "Uncategorized",
    amount: Number(c._sum.amount ?? 0),
  }));

  return NextResponse.json({ overall, perBusiness, recentTransactions, topCategories });
}
