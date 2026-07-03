"use client";

import { useEffect, useState } from "react";
import { StatCard, formatINR } from "@/components/dashboard/StatCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#1D9E75", "#D85A30", "#378ADD", "#BA7517", "#7F77DD"];

export default function DashboardClient() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-sm text-[var(--muted)]">Loading…</p>;

  const { overall, perBusiness, recentTransactions, topCategories } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-medium">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Today's income" value={formatINR(overall.todayIncome)} tone="success" />
        <StatCard label="Today's expenses" value={formatINR(overall.todayExpense)} tone="danger" />
        <StatCard label="Today's profit" value={formatINR(overall.todayProfit)} />
        <StatCard label="Cash in hand" value={formatINR(overall.cashInHand)} />
        <StatCard label="Monthly income" value={formatINR(overall.monthIncome)} tone="success" />
        <StatCard label="Monthly expenses" value={formatINR(overall.monthExpense)} tone="danger" />
        <StatCard label="Monthly profit" value={formatINR(overall.monthProfit)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {perBusiness.map(({ business, summary }: any) => (
          <div key={business.id} className="card p-4 space-y-2">
            <p className="font-medium text-sm">{business.name} summary</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-[var(--muted)]">Today income</p>
              <p className="text-right">{formatINR(summary.todayIncome)}</p>
              <p className="text-[var(--muted)]">Today expense</p>
              <p className="text-right">{formatINR(summary.todayExpense)}</p>
              <p className="text-[var(--muted)]">Month profit</p>
              <p className="text-right">{formatINR(summary.monthProfit)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4">
          <p className="font-medium text-sm mb-2">Top expense categories</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={topCategories} dataKey="amount" nameKey="name" outerRadius={80}>
                {topCategories.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatINR(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <p className="font-medium text-sm mb-2">Income vs expense (per business)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={perBusiness.map(({ business, summary }: any) => ({
                name: business.name,
                Income: summary.monthIncome,
                Expense: summary.monthExpense,
              }))}
            >
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v: number) => formatINR(v)} />
              <Bar dataKey="Income" fill="#1D9E75" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expense" fill="#D85A30" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4">
        <p className="font-medium text-sm mb-2">Recent transactions</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
              <th className="py-2">Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Business</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.map((t: any) => (
              <tr key={t.id} className="border-b border-[var(--border)] last:border-0">
                <td className="py-2">{new Date(t.date).toLocaleDateString("en-IN")}</td>
                <td className={t.type === "INCOME" ? "text-[var(--primary)]" : "text-[var(--danger)]"}>
                  {t.type}
                </td>
                <td>{formatINR(Number(t.amount))}</td>
                <td>{t.business?.name}</td>
                <td>{t.description || t.customer?.name || t.supplier?.name || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
