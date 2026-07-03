export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "danger";
}) {
  const color =
    tone === "success" ? "text-[var(--primary)]" : tone === "danger" ? "text-[var(--danger)]" : "text-[var(--fg)]";
  return (
    <div className="card p-4">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className={`text-2xl font-medium mt-1 ${color}`}>{value}</p>
    </div>
  );
}

export function formatINR(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
