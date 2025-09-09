import type { Metadata } from "next";
import { Manrope, Source_Code_Pro } from "next/font/google";

import "./globals.css";

// Google Font
const manrope = Manrope({
  subsets: ["latin"],
  display: "swap", // This is the default, but good to be explicit
  variable: "--font-manrope", // This creates a CSS variable for us
});

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-code-pro", // CSS variable for the mono font
});

export const metadata: Metadata = {
  title: "Alchemy Studio",
  description: "An AI-powered studio for media generation",
  icons: {
    icon: "/imgs/gemini_icon.svg", // This could be updated to a new logo file if available
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${manrope.variable} ${sourceCodePro.variable} bg-gray-900 text-gray-100`}>
        <main>{children}</main>
      </body>
    </html>
  );
}
