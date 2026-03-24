"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";
import { z } from "zod";

// ─── Auth Helper ───────────────────────────────────────────────────────────────

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// ─── Register ──────────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function registerUser(data: unknown) {
  const parsed = RegisterSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) return { error: { email: ["Email already in use"] } };

  const bcrypt = await import("bcryptjs");
  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
    },
  });

  const defaultCategories = [
    { name: "Housing",       icon: "🏠", color: "#e8ff47" },
    { name: "Food",          icon: "🛒", color: "#47ffe8" },
    { name: "Transport",     icon: "🚗", color: "#ff6b47" },
    { name: "Shopping",      icon: "🛍️", color: "#a847ff" },
    { name: "Bills",         icon: "💡", color: "#4778ff" },
    { name: "Entertainment", icon: "🎬", color: "#ff47a8" },
    { name: "Income",        icon: "💼", color: "#47ff78" },
  ];

  await prisma.category.createMany({
    data: defaultCategories.map((c) => ({ ...c, userId: user.id })),
  });

  return { success: true };
}

// ─── Transaction Actions ───────────────────────────────────────────────────────

const TransactionSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["INCOME", "EXPENSE"]),
  categoryId: z.string().optional(),
  note: z.string().optional(),
  date: z.string(),
});

export async function createTransaction(data: unknown) {
  const userId = await requireUser();

  const parsed = TransactionSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.transaction.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
      userId,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { success: true };
}

export async function updateTransaction(id: string, data: unknown) {
  const userId = await requireUser();

  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!existing) return { error: "Transaction not found" };

  const parsed = TransactionSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.transaction.update({
    where: { id },
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const userId = await requireUser();

  const existing = await prisma.transaction.findFirst({
    where: { id, userId },
  });
  if (!existing) return { error: "Transaction not found" };

  await prisma.transaction.delete({ where: { id } });

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  return { success: true };
}

// ─── Budget Actions ────────────────────────────────────────────────────────────

const BudgetSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  limit: z.number().positive("Limit must be positive"),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
});

export async function upsertBudget(data: unknown) {
  const userId = await requireUser();

  const parsed = BudgetSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.budget.upsert({
    where: {
      userId_categoryId_month_year: {
        userId,
        categoryId: parsed.data.categoryId,
        month: parsed.data.month,
        year: parsed.data.year,
      },
    },
    update: { limit: parsed.data.limit },
    create: { ...parsed.data, userId },
  });

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteBudget(id: string) {
  const userId = await requireUser();

  const existing = await prisma.budget.findFirst({
    where: { id, userId },
  });
  if (!existing) return { error: "Budget not found" };

  await prisma.budget.delete({ where: { id } });

  revalidatePath("/budgets");
  return { success: true };
}

// ─── Update Profile ────────────────────────────────────────────────────────────



  export async function updateProfile(data: unknown) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: { auth: ["Not authenticated"] } };
  }

  const UpdateProfileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    currency: z.string().min(3).max(3),
  });

  const parsed = UpdateProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        currency: parsed.data.currency,
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (e) {
    console.error("updateProfile error:", e);
    return { error: { server: ["Failed to update profile"] } };
  }
}

// ─── Category Actions ──────────────────────────────────────────────────────────

const CategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(30, "Name too long"),
  color: z.string().min(4, "Color is required"),
});

export async function createCategory(data: unknown) {
  const userId = await requireUser();

  const parsed = CategorySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  // Check if category with same name already exists for this user
  const existing = await prisma.category.findUnique({
    where: {
      userId_name: {
        userId,
        name: parsed.data.name,
      },
    },
  });

  if (existing) return { error: { name: ["Category already exists"] } };

  const category = await prisma.category.create({
    data: {
      userId,
      name: parsed.data.name,
      color: parsed.data.color,
      icon: "📦", // default icon — we'll handle display with letter avatar
    },
  });

  revalidatePath("/settings");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  return { success: true, category };
}

export async function deleteCategory(id: string) {
  const userId = await requireUser();

  const existing = await prisma.category.findFirst({
    where: { id, userId },
  });
  if (!existing) return { error: "Category not found" };

  // Check if category has transactions attached
  const transactionCount = await prisma.transaction.count({
    where: { categoryId: id },
  });

  // Check if category has budgets attached
  const budgetCount = await prisma.budget.count({
    where: { categoryId: id },
  });

  if (transactionCount > 0 || budgetCount > 0) {
    return {
      error: `Cannot delete — this category has ${transactionCount} transaction(s) and ${budgetCount} budget(s) attached to it.`,
    };
  }

  await prisma.category.delete({ where: { id } });

  revalidatePath("/settings");
  revalidatePath("/transactions");
  revalidatePath("/budgets");
  return { success: true };
}