import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bauservice Email-Automation",
  description: "Internes Tool für personalisierte Werbe-E-Mails",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  );
}
