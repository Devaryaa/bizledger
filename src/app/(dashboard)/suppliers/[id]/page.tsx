"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatINR, StatCard } from "@/components/dashboard/StatCard";

export default function SupplierLedgerPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/suppliers/${id}`).then((r) => r.json()).then(setData);
  }, [id]);

  if (!data) return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  const { supplier, ledger } = data;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-medium">{supplier.name}</h1>
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total purchases" value={formatINR(ledger.totalPurchases)} />
        <StatCard label="Paid" value={formatINR(ledger.totalPaid)} tone="success" />
        <StatCard label="Outstanding payable" value={formatINR(ledger.outstanding)} tone="danger" />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
              <th className="p-3">Date</th>
              <th>Entry</th>
              <th>Amount</th>
              <th>Running balance</th>
            </tr>
          </thead>
          <tbody>
            {ledger.entries.map((e: any) => (
              <tr key={e.id} className="border-b border-[var(--border)] last:border-0">
                <td className="p-3">{new Date(e.createdAt).toLocaleDateString("en-IN")}</td>
                <td className={e.entryType === "PURCHASE" ? "text-[var(--danger)]" : "text-[var(--primary)]"}>
                  {e.entryType === "PURCHASE" ? "Purchase" : "Payment made"}
                </td>
                <td>{formatINR(Number(e.amount))}</td>
                <td>{formatINR(Number(e.runningBalance))}</td>
              </tr>
            ))}
            {ledger.entries.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-[var(--muted)]">
                  No ledger entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
