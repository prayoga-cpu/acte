import type { Metadata } from "next";
import { Inter, Montserrat, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});
const splineSansMono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "ACTE — Journal du temps",
  description: "Suivi du temps et facturation automatiques pour cabinets d'avocats.",
};

// Applied before paint so a returning visitor's saved theme never flashes
// to the dark default first (theme toggle persists via localStorage, see
// components/theme-toggle.tsx).
const THEME_INIT_SCRIPT = `
(function () {
  try {
    if (localStorage.getItem("acte-theme") === "light") {
      document.documentElement.classList.add("light");
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${montserrat.variable} ${inter.variable} ${splineSansMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="h-[100dvh] overflow-hidden font-body text-ivory antialiased">{children}</body>
    </html>
  );
}
