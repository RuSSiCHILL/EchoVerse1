import type { Metadata } from "next";
import { Inter } from "next/font/google";
import './styles.css';

const inter = Inter({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "EchoVerse",
  description: "Социальная сеть для обмена постами и общения",
  icons: {
    // Основная иконка
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }, 
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    // Для PWA
    shortcut: '/favicon.ico',
  },
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