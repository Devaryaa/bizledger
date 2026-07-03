import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listSuppliersWithOutstanding } from "@/lib/services/ledgerService";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const suppliers = await listSuppliersWithOutstanding();
  return NextResponse.json(suppliers);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const supplier = await prisma.supplier.create({
    data: { name: body.name, phone: body.phone, businessId: body.businessId },
  });
  return NextResponse.json(supplier, { status: 201 });
}
