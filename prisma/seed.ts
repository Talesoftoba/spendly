import "dotenv/config";
import { PrismaClient, TransactionType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const hashedPassword = await bcrypt.hash("password123", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@spendly.com" },
    update: {},
    create: {
      email: "demo@spendly.com",
      name: "Sam Toba",
      password: hashedPassword,
      currency: "USD",
    },
  });

  console.log("✅ User created:", user.email);

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: "Housing" } },
      update: {},
      create: { userId: user.id, name: "Housing", icon: "🏠", color: "#e8ff47" },
    }),
    prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: "Food" } },
      update: {},
      create: { userId: user.id, name: "Food", icon: "🛒", color: "#47ffe8" },
    }),
    prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: "Transport" } },
      update: {},
      create: { userId: user.id, name: "Transport", icon: "🚗", color: "#ff6b47" },
    }),
    prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: "Shopping" } },
      update: {},
      create: { userId: user.id, name: "Shopping", icon: "🛍️", color: "#a847ff" },
    }),
    prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: "Bills" } },
      update: {},
      create: { userId: user.id, name: "Bills", icon: "💡", color: "#4778ff" },
    }),
    prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: "Entertainment" } },
      update: {},
      create: { userId: user.id, name: "Entertainment", icon: "🎬", color: "#ff47a8" },
    }),
    prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: "Income" } },
      update: {},
      create: { userId: user.id, name: "Income", icon: "💼", color: "#47ff78" },
    }),
  ]);

  const [housing, food, transport, shopping, bills, entertainment, income] =
    categories;

  console.log("✅ Categories created:", categories.length);

  // Create transactions for last 3 months
  const now = new Date();

  const transactions = [
    // Current month
    {
      title: "Salary Deposit",
      amount: 5400,
      type: TransactionType.INCOME,
      categoryId: income.id,
      date: new Date(now.getFullYear(), now.getMonth(), 28),
    },
    {
      title: "Freelance Project",
      amount: 850,
      type: TransactionType.INCOME,
      categoryId: income.id,
      date: new Date(now.getFullYear(), now.getMonth(), 20),
    },
    {
      title: "Rent Payment",
      amount: 1200,
      type: TransactionType.EXPENSE,
      categoryId: housing.id,
      date: new Date(now.getFullYear(), now.getMonth(), 1),
    },
    {
      title: "Grocery Store",
      amount: 84.50,
      type: TransactionType.EXPENSE,
      categoryId: food.id,
      date: new Date(now.getFullYear(), now.getMonth(), 5),
    },
    {
      title: "Netflix",
      amount: 15.99,
      type: TransactionType.EXPENSE,
      categoryId: entertainment.id,
      date: new Date(now.getFullYear(), now.getMonth(), 7),
    },
    {
      title: "Fuel",
      amount: 62,
      type: TransactionType.EXPENSE,
      categoryId: transport.id,
      date: new Date(now.getFullYear(), now.getMonth(), 10),
    },
    {
      title: "Amazon Purchase",
      amount: 124.99,
      type: TransactionType.EXPENSE,
      categoryId: shopping.id,
      date: new Date(now.getFullYear(), now.getMonth(), 12),
    },
    {
      title: "Electricity Bill",
      amount: 89,
      type: TransactionType.EXPENSE,
      categoryId: bills.id,
      date: new Date(now.getFullYear(), now.getMonth(), 14),
    },
    {
      title: "Restaurant",
      amount: 45.80,
      type: TransactionType.EXPENSE,
      categoryId: food.id,
      date: new Date(now.getFullYear(), now.getMonth(), 16),
    },
    {
      title: "Clothing",
      amount: 200,
      type: TransactionType.EXPENSE,
      categoryId: shopping.id,
      date: new Date(now.getFullYear(), now.getMonth(), 18),
    },
    // Last month
    {
      title: "Salary Deposit",
      amount: 5400,
      type: TransactionType.INCOME,
      categoryId: income.id,
      date: new Date(now.getFullYear(), now.getMonth() - 1, 28),
    },
    {
      title: "Bonus",
      amount: 1200,
      type: TransactionType.INCOME,
      categoryId: income.id,
      date: new Date(now.getFullYear(), now.getMonth() - 1, 15),
    },
    {
      title: "Rent Payment",
      amount: 1200,
      type: TransactionType.EXPENSE,
      categoryId: housing.id,
      date: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    },
    {
      title: "Groceries",
      amount: 120,
      type: TransactionType.EXPENSE,
      categoryId: food.id,
      date: new Date(now.getFullYear(), now.getMonth() - 1, 10),
    },
    {
      title: "Shopping spree",
      amount: 350,
      type: TransactionType.EXPENSE,
      categoryId: shopping.id,
      date: new Date(now.getFullYear(), now.getMonth() - 1, 20),
    },
    // Two months ago
    {
      title: "Salary Deposit",
      amount: 5400,
      type: TransactionType.INCOME,
      categoryId: income.id,
      date: new Date(now.getFullYear(), now.getMonth() - 2, 28),
    },
    {
      title: "Rent Payment",
      amount: 1200,
      type: TransactionType.EXPENSE,
      categoryId: housing.id,
      date: new Date(now.getFullYear(), now.getMonth() - 2, 1),
    },
    {
      title: "Internet Bill",
      amount: 49,
      type: TransactionType.EXPENSE,
      categoryId: bills.id,
      date: new Date(now.getFullYear(), now.getMonth() - 2, 5),
    },
    {
      title: "Uber rides",
      amount: 85,
      type: TransactionType.EXPENSE,
      categoryId: transport.id,
      date: new Date(now.getFullYear(), now.getMonth() - 2, 12),
    },
  ];

  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.transaction.createMany({
    data: transactions.map((t) => ({ ...t, userId: user.id })),
  });

  console.log("✅ Transactions created:", transactions.length);

  // Create budgets for current month
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const budgetData = [
    { categoryId: food.id,          limit: 300 },
    { categoryId: transport.id,     limit: 350 },
    { categoryId: shopping.id,      limit: 400 },
    { categoryId: bills.id,         limit: 300 },
    { categoryId: entertainment.id, limit: 100 },
  ];

  for (const b of budgetData) {
    await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: {
          userId: user.id,
          categoryId: b.categoryId,
          month: currentMonth,
          year: currentYear,
        },
      },
      update: { limit: b.limit },
      create: {
        userId: user.id,
        ...b,
        month: currentMonth,
        year: currentYear,
      },
    });
  }

  console.log("✅ Budgets created:", budgetData.length);
  console.log("\n🎉 Seed complete!");
  console.log("   Demo login: demo@spendly.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });