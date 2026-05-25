import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import { SiteNav } from "@/components/chrome/SiteNav";
import { SiteFooter } from "@/components/chrome/SiteFooter";
import { ReaderProvider } from "@/components/reader/ReaderContext";
import { ResidentStoryReader } from "@/components/reader/ResidentStoryReader";
import { OrientationGate } from "@/components/chrome/OrientationGate";
import { listResidentStories } from "@/lib/content/list-resident-stories";
import { loadProjectStructure } from "@/lib/content/load-project-structure";
import "./globals.css";

// Single-project site — the act index in SiteNav is anchored to this slug.
const PROJECT_SLUG = "synthetic-socio-wind-tunnel";

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
  // Aggregated at request/build time; passed to the client-side ReaderProvider.
  const residentStories = listResidentStories();
  const project = loadProjectStructure(PROJECT_SLUG);
  return (
    <html lang="zh" data-locale="zh" className={`${fontSans.variable} ${fontMono.variable}`}>
      <body>
        <LocaleProvider>
          <ReaderProvider stories={residentStories}>
            <SiteNav acts={project?.acts ?? []} />
            <main className="relative">{children}</main>
            <SiteFooter />
            <ResidentStoryReader />
          </ReaderProvider>
          <OrientationGate />
        </LocaleProvider>
      </body>
    </html>
  );
}
