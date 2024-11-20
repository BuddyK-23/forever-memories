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
const RPC_MAINNET = "https://42.rpc.thirdweb.com";

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

  const fetchMetadata = async () => {
    if (address && walletProvider) {
      const erc725js = new ERC725(
        LSP5Schema,
        "0x3c33871d7ff685433cdba55a85a5960fd9feb007",
        RPC_MAINNET
      );

      let tokenMetadata_: TokenMetadata[] = [];
      let ipfsHash_: IpfsHash[] = [];

      const tokensData_ = await erc725js.getData("LSP5ReceivedAssets[]");
      const tokens = tokensData_.value as string[];
      const tLength = tokens.length;
      console.log("tokens", tokens);
      console.log("tokens.length", tokens.length);

      if (tokens.length > 0) {
        for (let i = 0; i < tLength; i++) {
          const erc725 = new ERC725(LSP4Schema, tokens[i], RPC_MAINNET);

          // Step 1: Fetch the LSP4Metadata key
          const metadataResult = await erc725.getData("LSP4Metadata");
          const tokenName = await erc725.getData("LSP4TokenName");
          const tokenSymbol = await erc725.getData("LSP4TokenName");
          console.log("Token Name:", tokenName.value);
          console.log("Token Symbol:", tokenSymbol.value);
          console.log("Token ID:", tokens[i]);

          let ipfsHashUrl: string = "";
          const defaultIpfsHashUrl: string =
            "https://api.universalprofile.cloud/image/QmRnodxiibv3CnEa59eiYyNyjahCVAvLUi2JE9Zsp5bZn3";

          if (metadataResult?.value) {
            // Step 2: Get the metadata URI (e.g., ipfs://QmHash)
            const metadataUri = (metadataResult.value as { url: string }).url;
            const metadataUrl = metadataUri.replace(
              "ipfs://",
              "https://ipfs.io/ipfs/"
            );

            console.log("metadataUri", metadataUri);
            console.log("metadataUrl", metadataUrl);

            const response = await fetch("/api/getAssetsByIpfsHash", {
              method: "POST",
              body: metadataUrl,
            });
            const metadataJson = await response.json();
            const data = metadataJson.metadataJson;
            console.log("data", data);

            let ipfsHashUri = "";
            if (data.LSP4Metadata?.images.length > 0) {
              ipfsHashUri = data.LSP4Metadata?.images[0][0].url;
              ipfsHashUrl = ipfsHashUri.replace(
                "ipfs://",
                "https://api.universalprofile.cloud/image/"
              );
            }
          }
        }
      }
      console.log("tokenMetadata", tokenMetadata_);
    }
  };

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

  useEffect(() => {
    fetchMetadata();
  }, [isConnected]);

  return (
    <div>
      <h1>My LSP8 Collections</h1>
    </div>
  );
};

export default Feed;
