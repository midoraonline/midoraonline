"use client";

import { Mail, MapPin } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import ShopsBrowseSkeleton from "@/components/skeletons/ShopsBrowseSkeleton";

export default function ShopsDirectoryLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-border bg-surface/80">
        <div className="dm-container flex h-9 items-center justify-center sm:justify-between">
          <div className="hidden items-center gap-4 text-xs text-muted sm:flex">
            <span className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
              <Mail className="size-3.5 text-accent" />
              midoraonline@gmail.com
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-accent" />
              Kampala, Uganda
            </span>
          </div>
          <div className="text-xs text-muted">
            Rent a shop for{" "}
            <span className="font-semibold text-foreground">5,000 UGX/month</span>
          </div>
        </div>
      </div>
      <Navbar />

      <main className="flex-1">
        <div className="dm-container py-5 sm:py-8 lg:py-10">
          <ShopsBrowseSkeleton />
        </div>
      </main>

      <Footer />
    </div>
  );
}
