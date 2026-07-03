import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCustomerLedgerSummary } from "@/lib/services/ledgerService";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: params.id } });
  const ledger = await getCustomerLedgerSummary(params.id);
  return NextResponse.json({ customer, ledger });
}
