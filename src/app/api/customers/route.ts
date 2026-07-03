import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listCustomersWithOutstanding } from "@/lib/services/ledgerService";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const customers = await listCustomersWithOutstanding();
  return NextResponse.json(customers);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const customer = await prisma.customer.create({
    data: { name: body.name, phone: body.phone, businessId: body.businessId },
  });
  return NextResponse.json(customer, { status: 201 });
}
