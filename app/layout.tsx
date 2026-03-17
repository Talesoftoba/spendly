import type { Metadata } from "next";
import { Syne, DM_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/layout/providers"; 

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}