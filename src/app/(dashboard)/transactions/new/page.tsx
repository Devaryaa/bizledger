"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTransactionPage() {
  const router = useRouter();
  const [meta, setMeta] = useState<any>(null);
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [form, setForm] = useState<any>({
    amount: "",
    description: "",
    businessId: "",
    categoryId: "",
    customerId: "",
    supplierId: "",
    paymentMode: "CASH",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/meta")
      .then((r) => r.json())
      .then((m) => {
        setMeta(m);
        setForm((f: any) => ({ ...f, businessId: m.businesses[0]?.id ?? "" }));
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        amount: form.amount,
        description: form.description || undefined,
        businessId: form.businessId,
        categoryId: type === "EXPENSE" ? form.categoryId || undefined : undefined,
        customerId: type === "INCOME" ? form.customerId || undefined : undefined,
        supplierId: type === "EXPENSE" ? form.supplierId || undefined : undefined,
        paymentMode: form.paymentMode,
      }),
    });
    setSaving(false);
    if (res.ok) router.push("/transactions");
  }

  if (!meta) return <p className="text-sm text-[var(--muted)]">Loading…</p>;

  const expenseCategories = meta.categories.filter((c: any) => c.type === "EXPENSE");

  return (
    <div className="max-w-md space-y-4">
      <h1 className="text-xl font-medium">New transaction</h1>

      <div className="flex gap-2">
        {(["EXPENSE", "INCOME"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`flex-1 py-2 rounded-md text-sm font-medium border ${
              type === t
                ? t === "EXPENSE"
                  ? "bg-[var(--danger)] text-white border-[var(--danger)]"
                  : "bg-[var(--primary)] text-white border-[var(--primary)]"
                : "border-[var(--border)]"
            }`}
          >
            {t === "EXPENSE" ? "Expense" : "Income"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="card p-4 space-y-3">
        <div>
          <label className="text-sm">Amount (₹)</label>
          <input
            type="number"
            required
            autoFocus
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm">Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={type === "EXPENSE" ? "e.g. Diesel, Tea, Stock purchase" : "e.g. Cash sale"}
            className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm">Business</label>
          <select
            value={form.businessId}
            onChange={(e) => setForm({ ...form, businessId: e.target.value })}
            className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm"
          >
            {meta.businesses.map((b: any) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {type === "EXPENSE" && (
          <>
            <div>
              <label className="text-sm">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm"
              >
                <option value="">— None —</option>
                {expenseCategories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm">Supplier (optional)</label>
              <select
                value={form.supplierId}
                onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm"
              >
                <option value="">— None —</option>
                {meta.suppliers.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {type === "INCOME" && (
          <div>
            <label className="text-sm">Customer (optional)</label>
            <select
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm"
            >
              <option value="">— None —</option>
              {meta.customers.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-sm">Payment mode</label>
          <select
            value={form.paymentMode}
            onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
            className="w-full border border-[var(--border)] rounded-md px-3 py-2 text-sm"
          >
            {["CASH", "BANK_TRANSFER", "UPI", "CARD", "CHEQUE", "OTHER"].map((m) => (
              <option key={m} value={m}>
                {m.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[var(--primary)] text-white rounded-md py-2 text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save transaction"}
        </button>
      </form>
    </div>
  );
}
