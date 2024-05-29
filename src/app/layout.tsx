"use client";

import React from "react";
import Header from "@/components/Header";
import { config } from "@/app/config";
import "./globals.css";
import web3Onboard from "@/components/WalletContext";
import { Web3OnboardProvider } from "@web3-onboard/react";
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
        <link rel="icon" href={config.metadata.icon} sizes="any" />
      </>
      <body>
        <Web3OnboardProvider web3Onboard={web3Onboard}>
          <Header />
          {children}
        </Web3OnboardProvider>
      </body>
    </html>
  );
}
