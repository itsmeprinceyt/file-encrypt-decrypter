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

const isDevelopment = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `connect-src 'self'${isDevelopment ? " http://localhost:* ws://localhost:* http://127.0.0.1:* ws://127.0.0.1:*" : ""}`,
  "object-src 'none'",
  "base-uri 'none'",
  "frame-src 'none'",
  "form-action 'none'",
].join("; ");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Content-Security-Policy" content={contentSecurityPolicy} />
      </head>
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
