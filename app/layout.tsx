import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Midora Online",
  description: "Midora Online is a platform for online shopping, Create your shop and market wit Midora Online",
  keywords: ["midora", "online", "shopping", "ecommerce", "shops", "stores", "products", 
    "services", "business", "brand", "company", "branding", "marketing", 
    "advertising",],
  authors: [{ name: "Midora Online", url: "https://www.midoraonline.com" }],
  creator: "Midora Online",
  publisher: "Midora Online",
  openGraph: {
    title: "Midora Online",
    description: "Midora Online is a platform for online shopping",
    url: "https://www.midoraonline.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakarta.variable} ${fraunces.variable} ${ibmPlexMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        {children}
      </body>
    </html>
  );
}
