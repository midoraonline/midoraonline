import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import AppStateProvider from "@/components/providers/AppStateProvider";
import AppToaster from "@/components/providers/AppToaster";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import MerchantPresenceHeartbeat from "@/components/MerchantPresenceHeartbeat";
import PresenceTracker from "@/components/PresenceTracker";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v13-appRouter";
import { AnalyticsProvider } from "@/providers/analyticsProvider";
import "./globals.css";

// Runs in <head> before hydration so the correct theme class is on <html>
// before first paint — avoids a light-to-dark flash for users who prefer dark.
const themeInitScript = `(function(){try{var s=localStorage.getItem('midora-theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s==='dark'||s==='light'?s:(d?'dark':'light');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

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


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${plusJakarta.variable} ${fraunces.variable} ${ibmPlexMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <AppRouterCacheProvider>
          <ThemeProvider>
            <AppStateProvider>
              <AnalyticsProvider>
                <MerchantPresenceHeartbeat />
                <PresenceTracker />
                {children}
              </AnalyticsProvider>
            </AppStateProvider>
          </ThemeProvider>
        </AppRouterCacheProvider>
        <AppToaster />
      </body>
    </html>
  );
}
