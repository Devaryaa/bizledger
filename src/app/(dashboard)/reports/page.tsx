"use client";

import { useState } from "react";
import { formatINR } from "@/components/dashboard/StatCard";

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function runReport() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const res = await fetch(`/api/transactions?${params.toString()}`);
    const transactions = await res.json();
    const totalIncome = transactions
      .filter((t: any) => t.type === "INCOME")
      .reduce((s: number, t: any) => s + Number(t.amount), 0);
    const totalExpense = transactions
      .filter((t: any) => t.type === "EXPENSE")
      .reduce((s: number, t: any) => s + Number(t.amount), 0);
    setReport({ transactions, totalIncome, totalExpense, netProfit: totalIncome - totalExpense });
    setLoading(false);
  }

  function exportCsv() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    window.location.href = `/api/reports/export?${params.toString()}`;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-medium">Reports</h1>

      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-sm block">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border border-[var(--border)] rounded-md px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm block">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border border-[var(--border)] rounded-md px-3 py-2 text-sm" />
        </div>
        <button onClick={runReport} disabled={loading} className="bg-[var(--primary)] text-white text-sm px-4 py-2 rounded-md">
          {loading ? "Running…" : "Run report"}
        </button>
        <button onClick={exportCsv} className="border border-[var(--border)] text-sm px-4 py-2 rounded-md">
          Export CSV
        </button>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4">
              <p className="text-xs text-[var(--muted)]">Total income</p>
              <p className="text-xl font-medium text-[var(--primary)]">{formatINR(report.totalIncome)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-[var(--muted)]">Total expense</p>
              <p className="text-xl font-medium text-[var(--danger)]">{formatINR(report.totalExpense)}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-[var(--muted)]">Net profit</p>
              <p className="text-xl font-medium">{formatINR(report.netProfit)}</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
                  <th className="p-3">Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {report.transactions.map((t: any) => (
                  <tr key={t.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="p-3">{new Date(t.date).toLocaleDateString("en-IN")}</td>
                    <td className={t.type === "INCOME" ? "text-[var(--primary)]" : "text-[var(--danger)]"}>{t.type}</td>
                    <td>{formatINR(Number(t.amount))}</td>
                    <td>{t.description ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
