import BottomNav from "@/components/BottomNav";

export default function ShopsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-[var(--bottom-nav-clearance)] md:pb-0">
      {children}
      <BottomNav />
    </div>
  );
}
