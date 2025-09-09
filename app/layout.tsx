import type { Metadata } from "next";
import { Manrope, Source_Code_Pro } from "next/font/google";

import "./globals.css";
import AnimatedBackground from "@/components/ui/AnimatedBackground";

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
  title: "Github",
  description: "Github",
};

export default function RootLayout({
  children,
}: React.PropsWithChildren<{}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${manrope.variable} ${sourceCodePro.variable} bg-gray-900 text-gray-100`}>
        <AnimatedBackground />
        <main>{children}</main>
      </body>
    </html>
  );
}
