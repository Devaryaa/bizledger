export type Role = "ADMIN" | "MANAGER" | "ACCOUNTANT" | "STAFF";

export type Permission =
  | "transaction:create"
  | "transaction:edit"
  | "transaction:delete"
  | "user:manage"
  | "audit:view"
  | "report:export"
  | "category:manage";

const PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "transaction:create",
    "transaction:edit",
    "transaction:delete",
    "user:manage",
    "audit:view",
    "report:export",
    "category:manage",
  ],
  MANAGER: ["transaction:create", "transaction:edit", "transaction:delete", "audit:view", "report:export"],
  ACCOUNTANT: ["transaction:create", "transaction:edit", "transaction:delete", "report:export"],
  STAFF: ["transaction:create"],
};

export function can(role: Role | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermission(role: Role | undefined | null, permission: Permission) {
  if (!can(role, permission)) {
    throw new Error(`Forbidden: role ${role ?? "none"} lacks permission ${permission}`);
  }
}
