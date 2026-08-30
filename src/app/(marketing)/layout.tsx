import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { RouteTransition } from "@/components/route-transition";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <RouteTransition>{children}</RouteTransition>
      </main>
      <Footer />
    </div>
  );
}
