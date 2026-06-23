import type { Metadata } from "next";
import "./globals.css";
import { onest } from "@/lib/fonts";
import { Toaster } from "sonner";
import { Providers } from "@/app/providers";

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://deliveryway.dcodax.co");
const siteTitle = "Deliveryway | Fresh Food Delivery";
const siteDescription =
  "Order fresh meals from your local restaurant with Deliveryway. Browse offers, menu favourites, delivery, pickup, reservations, and gift cards.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: siteTitle,
    template: "%s | Deliveryway",
  },
  description: siteDescription,
  applicationName: "Deliveryway",
  keywords: [
    "Deliveryway",
    "food delivery",
    "restaurant delivery",
    "pickup",
    "online food ordering",
    "restaurant offers",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Deliveryway",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "Deliveryway fresh food delivery preview",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${onest.className} ${onest.variable}`}>
        <Providers>
          <Toaster position="top-right" richColors />

          {children}
        </Providers>
      </body>
    </html>
  );
}
