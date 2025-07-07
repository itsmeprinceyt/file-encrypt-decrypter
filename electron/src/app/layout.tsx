import type { Metadata } from "next";
import { Suspense } from "react";

import "./globals.css";

import Loader from "./(components)/Loader";

export const metadata: Metadata = {
  title: "Electron + NextJS + Tailwind",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased`}
      >
        <Suspense fallback={<Loader/>}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}