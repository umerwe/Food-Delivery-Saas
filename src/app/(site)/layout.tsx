import "../globals.css";
import { Footer } from "@/components/layout/footer/Footer";
import { SiteFloatingCart } from "@/components/layout/cart/SiteFloatingCart";
import { Navbar } from "@/components/layout/navbar/Navbar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      {children}
      <SiteFloatingCart />
      <Footer />
    </>
  );
}
