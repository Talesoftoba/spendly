import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/layout/providers"; 
import { getServerSession } from "next-auth";
import { authOptions } from "./lib/auth"; 
import { prisma } from "./lib/prisma";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500", "600"],
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
    // Default to USD
  }

  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${outfit.variable} ${jetbrainsMono.variable}`}
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