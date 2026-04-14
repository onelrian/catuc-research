import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--app-font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--app-font-serif",
});

export const metadata: Metadata = {
  title: "CATUC Research Platform",
  description: "A professional platform for CATUC Bamenda academic research and surveys.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} antialiased font-sans`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
