"use client";

import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { config } from "@/app/config";
import "./globals.css";
import { UPConnectionProvider } from '@/contexts/UPConnectionContext';

/**
 * Defines the basic layout for the application. It includes the
 * ApolloProvider for GraphQL support, global font styling, and a consistent layout for all pages.
 *
 * This version integrates indexer for improved loading speed when retrieving LSP metadata on Lukso chain.
 *
 * @param children - The pages to be rendered within the layout and header.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US">
      <head>
        <title>{config.metadata.title}</title>
        <meta name="description" content={config.metadata.description} />
        <link rel="icon" href={config.metadata.icon} sizes="any" />
      </head>
      <body>
        <UPConnectionProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </UPConnectionProvider>
      </body>
    </html>
  );
}
