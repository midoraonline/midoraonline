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
      <main className="flex-1">
        <div className="dm-container py-8">{children}</div>
      </main>
      <Footer />
      <MidoraInfoChatWidget />
    </div>
  );
}

