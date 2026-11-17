import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Fontes hospedadas no próprio projeto (subconjunto latino, cobre o português): o build não depende do Google
// e o navegador do aluno não faz requisições a terceiros. Fontes variáveis, licença OFL (Baloo 2 e Nunito).
const display = localFont({ src: "../fonts/baloo2-latin.woff2", weight: "600 800", variable: "--font-display", display: "swap" });
const body = localFont({ src: "../fonts/nunito-latin.woff2", weight: "400 800", variable: "--font-body", display: "swap" });

// Inter (relatórios e gráficos do painel), também hospedada no projeto. Fonte variável, licença OFL.
const inter = localFont({ src: "../fonts/inter-latin.woff2", weight: "400 700", variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Financity — A jornada das decisões financeiras",
  description: "Jogo educacional de Educação Financeira para o 8º ano.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
