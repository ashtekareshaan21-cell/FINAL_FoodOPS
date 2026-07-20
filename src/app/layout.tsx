import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FoodOps | High-Efficiency Surplus Food Rescue Logistics",
  description: "Dynamic coordination platform connecting donors, NGOs, and volunteers to minimize food waste and carbon emissions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
