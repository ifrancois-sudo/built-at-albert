import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import { DEFAULT_LOCALE } from "@/i18n";
import { LocaleProvider } from "@/i18n/provider";
import { SessionProvider } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE_URL } from "@/lib/public-config";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Built at Albert",
    template: "%s — Built at Albert",
  },
  description:
    "Plateforme interne Albert School : proposer une idée d'outil, voter, la construire, la livrer.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Built at Albert",
    description: "Les outils dont les élèves ont besoin, construits par les élèves.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The page is built once as a static file, so the language attribute starts
    // at the default and LocaleProvider corrects it on mount.
    <html lang={DEFAULT_LOCALE} className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <SessionProvider>
          <LocaleProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-paper-raised focus:px-4 focus:py-2 focus:shadow"
            >
              Aller au contenu / Skip to content
            </a>
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </LocaleProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
