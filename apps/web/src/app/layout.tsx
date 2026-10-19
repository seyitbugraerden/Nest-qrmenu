import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nest | Coffee & Kitchen Menü",
  description:
    "Nest menüsünü keşfedin. Özenle hazırlanan kahveler, tatlılar ve taze lezzetler.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
