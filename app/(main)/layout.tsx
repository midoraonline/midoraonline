import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import MidoraInfoChatWidget from "@/components/midoraInfoChatWidget";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-[5.25rem] sm:pt-[5.75rem]">
        <div className="dm-container py-5 sm:py-8 lg:py-10">{children}</div>
      </main>
      <Footer />
      <MidoraInfoChatWidget />
    </div>
  );
}

