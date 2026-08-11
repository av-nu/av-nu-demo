import type { Metadata } from "next";
import {
  Abril_Fatface,
  Archivo_Black,
  Bebas_Neue,
  Caveat,
  DM_Sans,
  DM_Serif_Display,
  Dancing_Script,
  Inter,
  JetBrains_Mono,
  Lora,
  Noto_Serif,
  Playfair_Display,
  Space_Grotesk,
  Work_Sans,
} from "next/font/google";
import "./globals.css";

import { AppShell } from "@/components/layout/AppShell";

const headline = Noto_Serif({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["600"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

// Composer type catalog (see FONT_CATALOG in lib/editorial). next/font requires
// each loader to be its own module-scope const. The @font-face rules are cheap to
// declare; a browser only downloads a face once text actually uses it, so
// offering a wide range does not cost every visitor a payload.
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["400", "700"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], weight: ["400", "600"] });
const dmSerif = DM_Serif_Display({ variable: "--font-dm-serif", subsets: ["latin"], weight: ["400"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: ["400", "500", "700"] });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], weight: ["400", "600"] });
const workSans = Work_Sans({ variable: "--font-work-sans", subsets: ["latin"], weight: ["400", "600"] });
const bebas = Bebas_Neue({ variable: "--font-bebas", subsets: ["latin"], weight: ["400"] });
const archivoBlack = Archivo_Black({ variable: "--font-archivo-black", subsets: ["latin"], weight: ["400"] });
const abril = Abril_Fatface({ variable: "--font-abril", subsets: ["latin"], weight: ["400"] });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], weight: ["400", "700"] });
const dancingScript = Dancing_Script({ variable: "--font-dancing-script", subsets: ["latin"], weight: ["400", "700"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"], weight: ["400", "700"] });

const composerFontVars = [
  playfair, lora, dmSerif, dmSans, spaceGrotesk, workSans,
  bebas, archivoBlack, abril, caveat, dancingScript, jetbrainsMono,
].map((font) => font.variable).join(" ");

export const metadata: Metadata = {
  title: "av | nu",
  description: "Marketplace demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${headline.variable} ${body.variable} ${composerFontVars} antialiased`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
