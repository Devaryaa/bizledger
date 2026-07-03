"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatINR } from "@/components/dashboard/StatCard";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/customers").then((r) => r.json()).then(setCustomers);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-medium">Customers</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
              <th className="p-3">Name</th>
              <th>Phone</th>
              <th>Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-[var(--border)] last:border-0">
                <td className="p-3">
                  <Link href={`/customers/${c.id}`} className="text-[var(--primary)] font-medium">
                    {c.name}
                  </Link>
                </td>
                <td>{c.phone ?? "—"}</td>
                <td className={c.outstanding > 0 ? "text-[var(--danger)]" : ""}>
                  {formatINR(c.outstanding)}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={3} className="p-6 text-center text-[var(--muted)]">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
