import type { Metadata } from "next";
import { Syne, DM_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/layout/providers"; 
import { getServerSession } from "next-auth";
import { authOptions } from "./lib/auth";
import { prisma } from "./lib/prisma";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-dm-mono",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "Spendly — Personal Finance Tracker",
  description: "Track your income, expenses and budgets in one place.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch user currency on server so it's available immediately
  let currency = "USD";
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { currency: true },
      });
      if (user?.currency) currency = user.currency;
    }
  } catch {
    // Default to USD if fetch fails
  }

  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${syne.variable} ${dmMono.variable}`}
    >
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('spendly-theme');
                if (theme && theme !== 'dark') {
                  document.documentElement.setAttribute('data-theme', theme);
                }
              } catch {}
            `,
          }}
        />
        <Providers currency={currency}>{children}</Providers>
      </body>
    </html>
  );
}