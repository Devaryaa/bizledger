import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateTransaction, deleteTransaction } from "@/lib/services/transactionService";
import { can } from "@/lib/rbac";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (!can(role, "transaction:edit")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updated = await updateTransaction(params.id, body, (session.user as any).id);
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (!can(role, "transaction:delete")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await deleteTransaction(params.id, (session.user as any).id);
  return NextResponse.json({ success: true });
}
