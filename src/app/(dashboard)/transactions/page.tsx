"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatINR } from "@/components/dashboard/StatCard";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/transactions${q}`)
      .then((r) => r.json())
      .then(setTransactions);
  }, [search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium">Transactions</h1>
        <Link href="/transactions/new" className="bg-[var(--primary)] text-white text-sm px-4 py-2 rounded-md">
          + New transaction
        </Link>
      </div>

      <input
        placeholder="Search by description, customer, supplier…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm border border-[var(--border)] rounded-md px-3 py-2 text-sm"
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
              <th className="p-3">Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Business</th>
              <th>Category</th>
              <th>Party</th>
              <th>Entered by</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-[var(--border)] last:border-0">
                <td className="p-3">{new Date(t.date).toLocaleDateString("en-IN")}</td>
                <td className={t.type === "INCOME" ? "text-[var(--primary)]" : "text-[var(--danger)]"}>
                  {t.type}
                </td>
                <td>{formatINR(Number(t.amount))}</td>
                <td>{t.business?.name}</td>
                <td>{t.category?.name ?? "—"}</td>
                <td>{t.customer?.name ?? t.supplier?.name ?? "—"}</td>
                <td>{t.enteredBy?.name}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-[var(--muted)]">
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
