import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { SiteNav } from "@/components/chrome/SiteNav";
import { SiteFooter } from "@/components/chrome/SiteFooter";
import "./globals.css";

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: "York Zhou — Portfolio",
    template: "%s · York Zhou",
  },
  description: "Cinematic case studies in AI product, agent systems, and urban research.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh" data-locale="zh" className={`${fontSans.variable} ${fontMono.variable}`}>
      <body>
        <LocaleProvider>
          <SiteNav />
          <main className="relative">{children}</main>
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
