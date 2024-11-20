"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { ERC725 } from "@erc725/erc725.js";
import LSP5Schema from "@erc725/erc725.js/schemas/LSP5ReceivedAssets.json";
import LSP4Schema from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers5/react";
const RCP_MAINNET = "https://42.rpc.thirdweb.com";
const RPC_ENDPOINT = "https://rpc.l16.lukso.network";
import lsp8Artifact from "@lukso/lsp-smart-contracts/artifacts/LSP8IdentifiableDigitalAsset.json";
import { INTERFACE_IDS } from "@lukso/lsp-smart-contracts";

interface IpfsHash {
  url: string;
  width: number;
  height: number;
}

interface TokenMetadata {
  type: number;
  name: string;
  symbol: string;
  creator: number;
  contractAddress: number;
  ipfsHash: IpfsHash;
}

const Feed: React.FC = () => {
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata[]>([]);

  useEffect(() => {
    async function init() {
      if (address && walletProvider) {
        const fetchUrl =
          "https://ipfs.io/ipfs/bafkreigajyr54h4c7saoyzif7dlp4r4csmftemou7ll4efxhdyzkpashwm";
        const response = await fetch("/api/getAssetsByIpfsHash", {
          method: "POST",
          body: fetchUrl,
        });
        const metadataJson = await response.json();
        console.log("metadataJson", metadataJson);
      }
    }
    init();
  }, [isConnected]);

  return (
    <div>
      <h1>My LSP8 Collections</h1>
    </div>
  );
};

export default Feed;
