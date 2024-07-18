"use client";

import React, { useState, useEffect } from "react";
// import { FaHeart } from "react-icons/fa6";
// import { BsChatLeftTextFill, BsFillShareFill } from "react-icons/bs";
// import ForeverMemoryCollection from "@/artifacts/ForeverMemoryCollection.json";
// import FMT from "@/artifacts/FMT.json";
// import { useConnectWallet } from "@web3-onboard/react";
// import { ethers } from "ethers";
// import { ERC725 } from "@erc725/erc725.js";
// import lsp4Schema from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
// import { generateEncryptionKey, decryptFile } from "@/utils/upload";
// import {
//   convertUnixTimestampToCustomDate,
//   hexToDecimal,
//   bytes32ToAddress,
// } from "@/utils/format";

export default function Home() {
  // const [{ wallet }] = useConnectWallet();

  // useEffect(() => {
  //   fetchNFT();
  // }, [wallet]);

  // const fetchNFT = async () => {
  //   if (wallet) {
  //     const ethersProvider = new ethers.providers.Web3Provider(
  //       wallet.provider,
  //       "any"
  //     );
  //     const owner = wallet.accounts[0].address;
  //     const signer = ethersProvider.getSigner(owner);

  //     const vaultAddress = "0x8ad9c817a5a4e63f5b3254479594c24d16a0e4e7";
  //     const VaultContract = new ethers.Contract(
  //       vaultAddress,
  //       ForeverMemoryCollection.abi,
  //       signer
  //     );
      
  //     // Example value for allowNonOwner, you may adjust it based on your requirements
  //     const allowNonOwner = true;
  //     // Example empty data, you may replace it with actual data if needed
  //     const data = "0x";
  //     const gasLimit = 6000000;
  //     const amount = 6;
  //     const to = "0xa46f37632a0b08fb019C101CFE434483f27CD956";
  //     const tokenId = "0x000000000000000000000000b335a358cc5958ac2396bbdd586768c1e8db0b86";
  //     const formattedTokenId = ethers.utils.hexZeroPad(tokenId, 32);
  //     const tx = await VaultContract.transferNFT(
  //       tokenId,
  //       to,
  //       amount,
  //       data, {gasLimit: gasLimit}
  //     );
  //     await tx.wait();
  //     console.log("tx", tx);
  //   }
  // };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      Home Page
    </main>
  );
}
