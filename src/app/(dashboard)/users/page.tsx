"use client";

import { useEffect, useState } from "react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => (Array.isArray(d) ? setUsers(d) : setError(d.error ?? "Failed to load users")));
  }

  useEffect(load, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setForm({ name: "", email: "", password: "", role: "STAFF" });
      load();
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to create user");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-medium">Users</h1>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted)] border-b border-[var(--border)]">
              <th className="p-3">Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-[var(--border)] last:border-0">
                <td className="p-3">{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.isActive ? "Active" : "Disabled"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleSubmit} className="card p-4 space-y-3">
        <p className="font-medium text-sm">Add user</p>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-[var(--border)] rounded-md px-3 py-2 text-sm"
          />
          <input
            placeholder="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border border-[var(--border)] rounded-md px-3 py-2 text-sm"
          />
          <input
            placeholder="Password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border border-[var(--border)] rounded-md px-3 py-2 text-sm"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="border border-[var(--border)] rounded-md px-3 py-2 text-sm"
          >
            {["ADMIN", "MANAGER", "ACCOUNTANT", "STAFF"].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <button disabled={saving} className="bg-[var(--primary)] text-white text-sm px-4 py-2 rounded-md disabled:opacity-50">
          {saving ? "Adding…" : "Add user"}
        </button>
      </form>
    </div>
  );
}
