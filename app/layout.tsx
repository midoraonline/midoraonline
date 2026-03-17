import type { Metadata } from "next";
import { Geist, Manrope } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${manrope.variable} antialiased bg-background text-foreground`}
      >
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <div className="dm-container py-8">{children}</div>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
