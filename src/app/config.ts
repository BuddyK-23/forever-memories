/**
 * Metadata of the application
 */
export const config = {
  metadata: {
    title: "Forever Moments",
    description: "LUKSO based dApp",
    url: "https://forever-moments",
    icon: "favicon.ico",
  },
  extension: {
    name: "Universal Profiles",
    url: "https://chrome.google.com/webstore/detail/universal-profiles/abpickdkkbnbcoepogfhkhennhfhehfn?hl=en",
  },
  walletTools: {
    // Exchange this value with your own project ID
    walletConnectProjectID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  },
};
