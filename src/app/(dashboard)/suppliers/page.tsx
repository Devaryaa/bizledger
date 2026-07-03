"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatINR } from "@/components/dashboard/StatCard";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/suppliers").then((r) => r.json()).then(setSuppliers);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-medium">Suppliers</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
              <th className="p-3">Name</th>
              <th>Phone</th>
              <th>Outstanding payable</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-b border-[var(--border)] last:border-0">
                <td className="p-3">
                  <Link href={`/suppliers/${s.id}`} className="text-[var(--primary)] font-medium">
                    {s.name}
                  </Link>
                </td>
                <td>{s.phone ?? "—"}</td>
                <td className={s.outstanding > 0 ? "text-[var(--danger)]" : ""}>
                  {formatINR(s.outstanding)}
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-[var(--muted)]">
                  No suppliers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
