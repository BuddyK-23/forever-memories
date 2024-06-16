"use client";

import React, { useState, useEffect } from "react";
import { FaHeart } from "react-icons/fa6";
import { BsChatLeftTextFill, BsFillShareFill } from "react-icons/bs";
import ForeverMemoryCollection from "@/artifacts/ForeverMemoryCollection.json";
import FMT from "@/artifacts/FMT.json";
import { useConnectWallet } from "@web3-onboard/react";
import { ethers } from "ethers";
import { ERC725 } from "@erc725/erc725.js";
import lsp4Schema from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
import { generateEncryptionKey, decryptFile } from "@/utils/upload";
import {
  convertUnixTimestampToCustomDate,
  hexToDecimal,
  bytes32ToAddress,
} from "@/utils/format";

export default function Home() {
  const [{ wallet }] = useConnectWallet();

  useEffect(() => {
    fetchNFT();
  }, [wallet]);

  const fetchNFT = async () => {
    if (wallet) {
      const ethersProvider = new ethers.providers.Web3Provider(
        wallet.provider,
        "any"
      );
      const owner = wallet.accounts[0].address;
      const signer = ethersProvider.getSigner(owner);

      const vaultAddress = "0xf333e75d6ae430ee0483a3c1451808fd261bb14f";
      const VaultContract = new ethers.Contract(
        vaultAddress,
        ForeverMemoryCollection.abi,
        signer
      );
      
      // Example value for allowNonOwner, you may adjust it based on your requirements
      const allowNonOwner = true;
      // Example empty data, you may replace it with actual data if needed
      const data = "0x";
      const to = "0xa46f37632a0b08fb019C101CFE434483f27CD956";
      const tokenId = "0x000000000000000000000000607f60a28dfe2335c216c614b99d69825cc3b1c9";
      const formattedTokenId = ethers.utils.hexZeroPad(tokenId, 32);
      const tx = await VaultContract.transferNFT(
        to,
        "0x0000000000000000000000001c1a67c8bfffdd4a1c69212a837ff915deb47c39",
        2,
        allowNonOwner,
        data
      );
      await tx.wait();
      console.log("tx", tx);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      Home Page
    </main>
  );
}
