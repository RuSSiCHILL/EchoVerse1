import type { Metadata } from "next";
import { Inter } from "next/font/google";
import './styles.css';

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "VK-подобный блог",
  description: "Социальная сеть для обмена постами",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${inter.className}`}>
        {children}
      </body>
    </html>
  );
}