import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MidoraInfoChatWidget from "@/components/midoraInfoChatWidget";
import BottomNav from "@/components/BottomNav";
import { Mail, MapPin } from "lucide-react";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar — scrolls away naturally */}
      <div className="border-b border-primary/20 bg-primary text-primary-foreground">
        <div className="dm-container flex h-9 items-center justify-center sm:justify-between">
          <div className="hidden items-center gap-4 text-xs text-white/75 sm:flex">
            <a
              href="mailto:midoraonline@gmail.com"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
            >
              <Mail className="size-3.5 text-accent" />
              midoraonline@gmail.com
            </a>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-accent" />
              Kampala, Uganda
            </span>
          </div>
          <div className="text-xs text-white/80">
            Rent a shop for{" "}
            <span className="font-semibold text-accent">5,000 UGX/month</span>
          </div>
        </div>
      </div>
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">
        <div className="dm-container pt-6 pb-8 sm:pt-8 sm:pb-10 lg:pt-10 lg:pb-12">{children}</div>
      </main>
      <Footer />
      <BottomNav />
      <MidoraInfoChatWidget />
    </div>
  );
}
