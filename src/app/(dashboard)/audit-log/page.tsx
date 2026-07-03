"use client";

import { useEffect, useState } from "react";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/audit-log")
      .then((r) => r.json())
      .then((d) => (Array.isArray(d) ? setLogs(d) : setError(d.error ?? "Failed to load")));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-medium">Audit log</h1>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
              <th className="p-3">Time</th>
              <th>Entity</th>
              <th>Action</th>
              <th>Actor</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-[var(--border)] last:border-0">
                <td className="p-3">{new Date(l.createdAt).toLocaleString("en-IN")}</td>
                <td>
                  {l.entityType} #{l.entityId.slice(0, 8)}
                </td>
                <td>{l.action}</td>
                <td>{l.actor?.name}</td>
              </tr>
            ))}
            {logs.length === 0 && !error && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-[var(--muted)]">
                  No audit entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
