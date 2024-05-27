import React from "react";
import Header from "@/components/Header";
import { config } from "@/app/config";
import "./globals.css";

/**
 * Defines the basic layout for the application. It includes the
 * global font styling and a consistent layout for all pages.
 *
 * @param children - The pages to be rendered within the layout and header.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <>
        <title>{config.metadata.title}</title>
        <meta name="description" content={config.metadata.description} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
