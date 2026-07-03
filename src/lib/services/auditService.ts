import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function logAudit(
  tx: Prisma.TransactionClient | typeof prisma,
  params: {
    entityType: string;
    entityId: string;
    action: "CREATE" | "UPDATE" | "DELETE";
    oldValue?: unknown;
    newValue?: unknown;
    actorId: string;
    transactionId?: string;
  }
) {
  await tx.auditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      oldValue: params.oldValue ? JSON.parse(JSON.stringify(params.oldValue)) : undefined,
      newValue: params.newValue ? JSON.parse(JSON.stringify(params.newValue)) : undefined,
      actorId: params.actorId,
      transactionId: params.transactionId,
    },
  });
}
