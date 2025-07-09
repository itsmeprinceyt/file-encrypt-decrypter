import type { Metadata } from "next";
import { Suspense } from "react";

import "./globals.css";

import Loader from "./(components)/Loader";

export const metadata: Metadata = {
  title: "File Encrypter Decrypter - ItsMe Prince",
  description: "A secure and modern AES-GCM file encryption/decryption app built with Electron and Next.js.",
  keywords: [
    "Electron",
    "Next.js",
    "File Encryption",
    "AES-GCM",
    "Encrypt Decrypt",
    "Tailwind CSS",
    "Prince Encryptor",
    "Secure File App"
  ],
  authors: [{ name: "ItsMe Prince", url: "https://github.com/itsmeprinceyt" }],
  creator: "ItsMe Prince",
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
        <Suspense fallback={<Loader />}>
          {children}
        </Suspense>
      </body>
    </html>
  );
}