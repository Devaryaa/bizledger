import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/customers", label: "Customers" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/reports", label: "Reports" },
  { href: "/users", label: "Users", adminOnly: true },
  { href: "/audit-log", label: "Audit log", adminOnly: true },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = (session.user as any).role;

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 border-r border-[var(--border)] p-4 space-y-6">
        <div>
          <p className="font-medium">BizLedger</p>
          <p className="text-xs text-[var(--muted)]">{session.user?.name} · {role}</p>
        </div>
        <nav className="space-y-1">
          {NAV.filter((item) => !item.adminOnly || role === "ADMIN").map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block text-sm px-3 py-2 rounded-md hover:bg-[var(--bg)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
