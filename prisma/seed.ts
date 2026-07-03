import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_EXPENSE_CATEGORIES = [
  "Transport",
  "Food",
  "Salary",
  "Electricity",
  "Rent",
  "Purchase",
  "Maintenance",
  "Fuel",
  "Miscellaneous",
];

async function main() {
  const wholesale = await prisma.business.upsert({
    where: { slug: "wholesale" },
    update: {},
    create: { name: "Wholesale", slug: "wholesale" },
  });
  const retail = await prisma.business.upsert({
    where: { slug: "retail" },
    update: {},
    create: { name: "Retail", slug: "retail" },
  });

  for (const name of DEFAULT_EXPENSE_CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, type: "EXPENSE", isDefault: true },
    });
  }
  await prisma.category.upsert({
    where: { name: "Sales" },
    update: {},
    create: { name: "Sales", type: "INCOME", isDefault: true },
  });

  const users = [
    { name: "Owner Admin", email: "admin@bizledger.test", role: "ADMIN" as const },
    { name: "Ops Manager", email: "manager@bizledger.test", role: "MANAGER" as const },
    { name: "Accounts", email: "accountant@bizledger.test", role: "ACCOUNTANT" as const },
    { name: "Floor Staff", email: "staff@bizledger.test", role: "STAFF" as const },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash("Password123!", 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, passwordHash, role: u.role },
    });
  }

  await prisma.openingBalance.upsert({
    where: { businessId: wholesale.id },
    update: {},
    create: { businessId: wholesale.id, amount: 50000 },
  });
  await prisma.openingBalance.upsert({
    where: { businessId: retail.id },
    update: {},
    create: { businessId: retail.id, amount: 20000 },
  });

  console.log("Seed complete. Login with any of:");
  users.forEach((u) => console.log(`  ${u.email} / Password123!  (${u.role})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
