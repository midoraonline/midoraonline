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
      <main className="flex-1 pt-[5.125rem] sm:pt-[5.625rem]">
        <div className="dm-container pt-3 pb-5 sm:pt-4 sm:pb-8 lg:pt-5 lg:pb-10">{children}</div>
      </main>
      <Footer />
      <MidoraInfoChatWidget />
    </div>
  );
}

