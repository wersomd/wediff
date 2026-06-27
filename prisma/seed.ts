import { PrismaClient, TransactionType, AccountType } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const expenseCategories = [
  "Groceries",
  "Eating out",
  "Transport",
  "Housing",
  "Health",
  "Entertainment",
  "Shopping",
  "Other",
];

const incomeCategories = ["Salary", "Freelance", "Gifts", "Other"];

async function main() {
  for (const name of expenseCategories) {
    await db.category.upsert({
      where: { name_type: { name, type: TransactionType.EXPENSE } },
      update: {},
      create: { name, type: TransactionType.EXPENSE },
    });
  }

  for (const name of incomeCategories) {
    await db.category.upsert({
      where: { name_type: { name, type: TransactionType.INCOME } },
      update: {},
      create: { name, type: TransactionType.INCOME },
    });
  }

  if ((await db.account.count()) === 0) {
    await db.account.create({
      data: { name: "Main", type: AccountType.CARD, currency: "KZT" },
    });
  }

  // Single-user account (credentials from env; password is hashed, never stored plain).
  const email = process.env.APP_USER_EMAIL;
  const password = process.env.APP_USER_PASSWORD;
  if (email && password) {
    const passwordHash = await bcrypt.hash(password, 10);
    await db.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash },
    });
    console.log(`User ready: ${email}`);
  } else {
    console.warn("APP_USER_EMAIL / APP_USER_PASSWORD not set — skipped user seed.");
  }

  console.log("Seed complete.");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
