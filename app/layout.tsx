import type { Metadata } from "next";
import { SiteNav } from "@/components/nav";
import { SiteFooter } from "@/components/footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://thelingo.xyz"),
  title: {
    default: "TheLingo | Practice Spanish & French Speaking Online with Real People",
    template: "%s | TheLingo",
  },
  description:
    "Prove your real language capability in 1v1 competitive ranked matches, blind AI judging, and cultural micro-societies.",
  openGraph: {
    title: "TheLingo | Practice Spanish & French Speaking Online with Real People",
    description:
      "Competitive ranked duels, blind AI judging, and FS (Fluency Score) ratings to make your language fluency impossible to fake.",
    type: "website",
    siteName: "TheLingo",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://thelingo.xyz/#organization",
      name: "TheLingo",
      url: "https://thelingo.xyz",
      logo: "https://thelingo.xyz/icon.png",
      description: "Competitive ranked language learning platform featuring head-to-head duels and blind judging.",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://thelingo.xyz/#application",
      name: "TheLingo Platform",
      operatingSystem: "Web",
      applicationCategory: "EducationalApplication",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
