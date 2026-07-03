import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSupplierLedgerSummary } from "@/lib/services/ledgerService";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supplier = await prisma.supplier.findUniqueOrThrow({ where: { id: params.id } });
  const ledger = await getSupplierLedgerSummary(params.id);
  return NextResponse.json({ supplier, ledger });
}
