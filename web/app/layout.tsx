import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <--- ⚠️ 必须有这一行！

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NovelStack",
  description: "Private Novel Writing Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={inter.className} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
