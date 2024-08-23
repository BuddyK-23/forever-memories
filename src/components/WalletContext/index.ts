// Import the necessary components
import { createWeb3Modal, defaultConfig } from "@web3modal/ethers5/react";

const projectId = "a1bda241f0519c5d662bd07e0705acaf";

// Setup the Metadata
const walletConnectMetadata = {
  name: "Ferever Memory",
  description: "dApp using Wallet Connect",
  url: "https://forever-memory.vercel.app/",
  icons: ["https://my.dapp.domain/icon.svg"],
};

// Initialize the Configuration Element
const walletConnectConfig = defaultConfig({
  metadata: walletConnectMetadata,
});

// Define the supported networks
const supportedChains = [
  {
    chainId: 4021,
    name: "LUKSO Testnet",
    currency: "LYXt",
    explorerUrl: "https://explorer.execution.testnet.lukso.network/",
    rpcUrl: "https://4201.rpc.thirdweb.com/",
  },
  {
    chainId: 42,
    name: "LUKSO Mainnet",
    currency: "LYX",
    explorerUrl: "https://explorer.lukso.network",
    rpcUrl: "https://42.rpc.thirdweb.com/",
  },
];

// Define chain images for the network screen
const walletConnectChainImages = {
  42: "https://my.dapp.domain/lyx_symbol.svg",
  4201: "https://my.dapp.domain/lyx_symbol.svg",
};

// Create the Web3 Modal Instance
export const walletConnectInstance = createWeb3Modal({
  ethersConfig: walletConnectConfig,
  chains: supportedChains,
  projectId, // Import the project ID from https://cloud.walletconnect.com
  chainImages: walletConnectChainImages,
  featuredWalletIds: ["NONE"], // OPTIONAL: Only show wallets that are installed by the user
});
