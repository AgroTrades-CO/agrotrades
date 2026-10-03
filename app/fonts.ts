import { DM_Sans, Playfair_Display } from "next/font/google";

// Fontes servidas pelo próprio site (next/font descarrega-as no build): o
// browser não contacta o Google. As variáveis CSS são usadas em globals.css.
const display = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "900"],
  variable: "--font-display",
  display: "swap",
});

const body = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const fontVariables = `${display.variable} ${body.variable}`;
