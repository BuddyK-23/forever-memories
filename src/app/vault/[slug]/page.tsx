"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import ForeverMemoryCollection from "@/artifacts/ForeverMemoryCollection.json";
import { ethers } from "ethers";
import { useConnectWallet } from "@web3-onboard/react";
import { bytes32ToAddress, hexToDecimal } from "@/utils/format"; // Adjust the import path as necessary
import { ERC725 } from "@erc725/erc725.js";
import lsp4Schema from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
import { ERC725YDataKeys } from "@lukso/lsp-smart-contracts";
import { generateEncryptionKey, decryptFile } from "@/utils/upload";


interface TokenData {
  cid: string;
  tokenSymbol: string;
  tokenName: string;
  tokenId: string;
}

// Define the types you expect
type URLDataWithHash = {
  url: string;
  hash: string;
};

type Data = string | number | boolean | URLDataWithHash | Data[];

// Type guard to check if the value has a 'url' property
function hasUrlProperty(value: any): value is URLDataWithHash {
  return value && typeof value === "object" && "url" in value;
}

export default function Page({ params }: { params: { slug: string } }) {
  const vaultAddress = params.slug;

  const [tokenDataArray, setTokenDataArray] = useState<TokenData[]>([]);
  const [vaultName, setVaultName] = useState<string>();
  const [vaultCid, setVaultCid] = useState<string>();
  const [vaultSymbol, setVaultSymbol] = useState<string>();
  const [{ wallet }] = useConnectWallet();
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  
  useEffect(() => {
    fetchNFT();
  }, [wallet]);

  const fetchNFT = async () => {
    if (wallet) {
      const encryptionKey = await generateEncryptionKey(
        process.env.NEXT_PUBLIC_ENCRYPTION_KEY!
      );

      const ethersProvider = new ethers.providers.Web3Provider(
        wallet.provider,
        "any"
      );
      const owner = wallet.accounts[0].address;
      const signer = ethersProvider.getSigner(owner);

      const VaultContract = new ethers.Contract(
        vaultAddress,
        ForeverMemoryCollection.abi,
        signer
      );

      const vaultAsset = new ERC725(
        lsp4Schema,
        vaultAddress,
        process.env.NEXT_PUBLIC_DEVELOPMENT_ENVIRONMENT_TYPE == "1"
          ? process.env.NEXT_PUBLIC_MAINNET_URL
          : process.env.NEXT_PUBLIC_TESTNET_URL,
        {
          ipfsGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY,
        }
      );

      const name = await vaultAsset.getData("LSP4TokenName");
      const symbol = await vaultAsset.getData("LSP4TokenSymbol");
      setVaultName(name.value as string);
      setVaultSymbol(symbol.value as string);
      const vault = await vaultAsset.getData("LSP4Metadata");
      let vault_ipfsHash;
      if (hasUrlProperty(vault?.value)) {
        vault_ipfsHash = vault.value.url;
      } else {
        // Handle the case where vault?.value does not have a 'url' property
        console.log("The value does not have a 'url' property.");
      }
      const response = await fetch(`https://ipfs.io/ipfs/${vault_ipfsHash}`);
      if (!response.ok) {
        throw new Error("Failed to fetch image from IPFS");
      }
      const encryptedData = await response.arrayBuffer();
      const decryptedData = await decryptFile(
        new Uint8Array(encryptedData),
        encryptionKey
      );
      const blob = new Blob([decryptedData]); // Creating a blob from decrypted data
      const _vaultCid = URL.createObjectURL(blob);
      setVaultCid(_vaultCid);

      const result = await VaultContract.tokenIdsOf(vaultAddress);

      // NFT info
      if (result.length > 0) {
        for (let i = 0; i < result.length; i++) {
          let lsp7Contract = new ethers.Contract(
            bytes32ToAddress(result[i]),
            ForeverMemoryCollection.abi,
            signer
          );
          const balance = await lsp7Contract.balanceOf(owner);
          if (hexToDecimal(balance._hex) == 0) continue;
          const tokenIdMetadata = await VaultContract.getDataForTokenId(
            result[i],
            ERC725YDataKeys.LSP4["LSP4Metadata"]
          );

          const erc725js = new ERC725(lsp4Schema);
          const decodedMetadata = erc725js.decodeData([
            {
              keyName: "LSP4Metadata",
              value: tokenIdMetadata,
            },
          ]);
          const ipfsHash = decodedMetadata[0].value.url;

          const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
          if (!response.ok) {
            throw new Error("Failed to fetch image from IPFS");
          }
          const encryptedData = await response.arrayBuffer();
          const decryptedData = await decryptFile(
            new Uint8Array(encryptedData),
            encryptionKey
          );
          const blob = new Blob([decryptedData]); // Creating a blob from decrypted data
          const objectURL = URL.createObjectURL(blob);

          // const encryptedData = await decryptFile(cid, encryptionKey);
          const lspContractAddress = bytes32ToAddress(result[i]);

          const myAsset = new ERC725(
            lsp4Schema,
            lspContractAddress,
            process.env.NEXT_PUBLIC_DEVELOPMENT_ENVIRONMENT_TYPE == "1"
              ? process.env.NEXT_PUBLIC_MAINNET_URL
              : process.env.NEXT_PUBLIC_TESTNET_URL,
            {
              ipfsGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY,
            }
          );
          const tokenSymbol = await myAsset.getData("LSP4TokenSymbol");
          const tokenName = await myAsset.getData("LSP4TokenName");

          // Extracting value from DecodeDataOutput and updating state with new token data
          setTokenDataArray((prevTokenDataArray) => [
            ...prevTokenDataArray,
            {
              cid: objectURL,
              tokenSymbol: tokenSymbol.value as string,
              tokenName: tokenName.value as string,
              tokenId: result[i],
            },
          ]);
        }
      }
      setIsDownloading(true);
    }
  };

  return !isDownloading ? (
    <div className="flex space-x-2 justify-center items-center bg-gray-200 h-screen dark:invert">
      <span className="sr-only">Loading...</span>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce"></div>
    </div>
  ) : (
    <div className="px-6 bg-gray-200 pt-10 h-[800px]">
      <div className="TopPanel p-2 shadow-lg shadow-gray-500/50 rounded bg-white flex">
        <div className="w-1/2">
          <img
            className={`carousel-item w-full h-[200px]`}
            src={vaultCid}
            alt=""
          />
        </div>
        <div className="w-1/2 px-3 py-1">
          <div className="font-bold text-5xl">{vaultName}</div>
          <div className="pt-3">headline</div>
          <div className="pt-3 h-[50px]">description</div>
          <div className="flex gap-2 pt-5">
            <div className="p-1 bg-indigo-200 rounded sm">Shared</div>
            <div className="p-1 bg-gray-200 rounded sm">Personal</div>
            <div className="p-1 bg-pink-200 rounded sm">Selfie</div>
          </div>
        </div>
      </div>

      <div className="List grid grid-cols-4 gap-4 pt-5">
        {tokenDataArray.map((item, idx) => (
          <Link
            href={`/nft/` + item.tokenId}
            key={idx}
            className="w-full bg-white rounded cursor-pointer hover:opacity-75 shadow-lg shadow-gray-500/50"
          >
            <img
              className={`rounded carousel-item h-[250px] w-full`}
              src={item.cid}
              alt={item.tokenName}
            />
            <div className="flex justify-between p-2">
              <div className="bg-indigo-300 h-[30px] text-center p-1 rounded">
                {item.tokenName}
              </div>
              <div className="bg-pink-300 h-[30px] text-center p-1 rounded">
                {item.tokenSymbol}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
