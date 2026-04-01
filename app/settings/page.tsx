import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth"; 
import { redirect } from "next/navigation";
import { getUserCategories } from "../lib/data"; 
import { prisma } from "../lib/prisma"; 
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const [categories, user] = await Promise.all([
    getUserCategories(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { currency: true, name: true },
    }),
  ]);

  return (
    <SettingsClient
      categories={categories}
      savedName={user?.name ?? ""}
      savedCurrency={user?.currency ?? "USD"}
    />
  );
}