import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createTransaction, listTransactions } from "@/lib/services/transactionService";
import { can } from "@/lib/rbac";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const transactions = await listTransactions({
    businessId: searchParams.get("businessId") || undefined,
    type: (searchParams.get("type") as any) || undefined,
    search: searchParams.get("search") || undefined,
    from: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
    to: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
  });
  return NextResponse.json(transactions);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (!can(role, "transaction:create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const transaction = await createTransaction({
    ...body,
    amount: Number(body.amount),
    enteredById: (session.user as any).id,
    source: "WEB",
  });
  return NextResponse.json(transaction, { status: 201 });
}
