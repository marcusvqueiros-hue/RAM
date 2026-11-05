import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "RAM · Atividades de Segurança", template: "%s · RAM" },
  description: "Registro e acompanhamento das ações mensais dos técnicos de segurança.",
  authors: [{ name: "Marcus Vinicius Silva Queiros" }],
  creator: "Marcus Vinicius Silva Queiros",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#8a1c33" };

// Define o tema antes da primeira pintura (evita "flash" claro → escuro).
const TEMA_INICIAL = `try{var t=localStorage.getItem('ram-tema');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_INICIAL }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
