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
        // const erc725js = new ERC725(
        //   LSP5Schema,
        //   "0xf35cf5b387e2dd0d44924cf6a050eb19e5d00099",
        //   RCP_MAINNET
        // );

        // const result = await erc725js.getData("LSP5ReceivedAssets[]");
        // console.log("result", result);
        const tokenAddress = "0x01e4386127a976bf65961a6a117c1a5b12703fd3";

        //*************************
        // const provider = new ethers.JsonRpcProvider(RPC_ENDPOINT);
        // const ethersProvider = new ethers.providers.Web3Provider(
        //   walletProvider,
        //   "any"
        // );
        // const signer = ethersProvider.getSigner(address);
        // const myAsset = new ethers.Contract(tokenAddress, [
        //   {
        //     inputs: [
        //       {
        //         internalType: "bytes4",
        //         name: "_interfaceId",
        //         type: "bytes4",
        //       },
        //     ],
        //     name: "supportsInterface",
        //     outputs: [
        //       {
        //         internalType: "bool",
        //         name: "",
        //         type: "bool",
        //       },
        //     ],
        //     stateMutability: "view",
        //     type: "function",
        //   },
        //   signer,
        // ]);

        // const isLSP7 = await myAsset.supportsInterface(
        //   INTERFACE_IDS.LSP7DigitalAsset
        // );

        // const isLSP8 = await myAsset.supportsInterface(
        //   INTERFACE_IDS.LSP8IdentifiableDigitalAsset
        // );

        // console.log(isLSP7, isLSP8); // each, true or false
        //*&*********************** */
        const erc725 = new ERC725(LSP4Schema, tokenAddress, RCP_MAINNET);

        // Step 1: Fetch the LSP4Metadata key
        const metadataResult = await erc725.getData("LSP4Metadata"); // LSP4Metadata key
        const _tokenName = await erc725.getData("LSP4TokenName"); // LSP4Metadata key
        const _tokenSymbol = await erc725.getData("LSP4TokenName"); // LSP4Metadata key
        console.log("Token Name:", _tokenName.value);
        console.log("Token Symbol:", _tokenSymbol.value);
        // const tokenName = await erc725.getData("LSP4TokenName"); // LSP4Metadata key

        if (metadataResult?.value) {
          // Step 2: Get the metadata URI (e.g., ipfs://QmHash)
          const metadataUri = (metadataResult.value as { url: string }).url;
          const metadataUrl = metadataUri.replace(
            "ipfs://",
            "https://ipfs.io/ipfs/"
          );

          // Step 3: Fetch the metadata JSON file
          const response = await fetch(metadataUrl);
          const metadataJson = await response.json();
          console.log("metadataJson", metadataJson);

          let ipfsHashUri;
          if (metadataJson.LSP4Metadata?.images) {
            ipfsHashUri = metadataJson.LSP4Metadata?.images[0][0].url;
          } 

          const ipfsHashUrl = ipfsHashUri.replace(
            "ipfs://",
            "https://api.universalprofile.cloud/image/"
          );
          // setIpfsHash(ipfsHashUrl);
          console.log("ipfsHashUrl", ipfsHashUrl);
        }
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
