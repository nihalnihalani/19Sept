import type { Metadata } from "next";
import { Manrope, Source_Code_Pro } from "next/font/google";

import "./globals.css";

// Google Font
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-manrope",
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-source-code-pro",
});

export const metadata: Metadata = {
  title: "Alchemy Studio - AI-Powered Creative Platform",
  description: "Transform your ideas into stunning images and videos using Google's cutting-edge AI models. Experience the magic of AI creativity with Veo 3, Imagen 4, and Gemini 2.5 Flash.",
};

export default function RootLayout({
  children,
}: React.PropsWithChildren) {
  return (
    <html lang="en" className="dark">
      <body className={`${manrope.variable} ${sourceCodePro.variable}`}>
        <main>{children}</main>
      </body>
    </html>
  );
}
