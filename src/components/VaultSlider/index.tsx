"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaAngleLeft, FaAngleRight, FaRegCircleCheck } from "react-icons/fa6";
import ForeverMemoryCollection from "@/artifacts/ForeverMemoryCollection.json";
import { ethers } from "ethers";
import { useConnectWallet } from "@web3-onboard/react";
import { ERC725 } from "@erc725/erc725.js";
import lsp4Schema from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
import { hexToDecimal } from "@/utils/format";
import { generateEncryptionKey, decryptFile } from "@/utils/upload";

const vaults = [
  {
    label: "Daily Selfie",
    contract: "0x8e0c1b47a9216e34267e3b2a3142057456e23a56",
  },
  {
    label: "Dear Diary",
    contract: "0x7c56cf6d4bfd8bc6557cdef93b61899d33636e36",
  },
  {
    label: "Kids Drawings",
    contract: "0xdd9e19712fc69d0c455dee0876a2649941af50d0",
  },
  {
    label: "Life Capsule",
    contract: "0xbfb655cb56617aeb962e2dd154e561b4a0787955",
  },
  {
    label: "Legacy Safe",
    contract: "0x793861c934eb4e3e280d63683ea1b47e35d61d9e",
  },
  {
    label: "Time Capsule",
    contract: "0xfa5fd6e8b51cb732d67c1a79456901f8d1d39786",
  },
  {
    label: "Digital Legacy",
    contract: "0x28c7f1b2bd487be7a5f0dbff2c857b218cd32316",
  },
];

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

interface VaultsData {
  name: string;
  mintedCount: number;
  cid: string;
  headline: string;
  description: string;
  contractAddress: string;
}

const VaultSlider = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [{ wallet }] = useConnectWallet();
  const [vaultsDataArray, setVaultsDataArray] = useState<VaultsData[]>([]);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, [wallet]);

  const fetchData = async () => {
    if (wallet) {
      const ethersProvider = new ethers.providers.Web3Provider(
        wallet.provider,
        "any"
      );
      const owner = wallet.accounts[0].address;
      const signer = ethersProvider.getSigner(owner);
      const newVaultsDataArray: VaultsData[] = [];

      for (let i = 0; i < vaults.length; i++) {
        const VaultContract = new ethers.Contract(
          vaults[i].contract,
          ForeverMemoryCollection.abi,
          signer
        );

        const vaultAssets = new ERC725(
          lsp4Schema,
          vaults[i].contract,
          process.env.NEXT_PUBLIC_DEVELOPMENT_ENVIRONMENT_TYPE == "1"
            ? process.env.NEXT_PUBLIC_MAINNET_URL
            : process.env.NEXT_PUBLIC_TESTNET_URL,
          {
            ipfsGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY,
          }
        );

        const vault = await vaultAssets.getData("LSP4Metadata");
        let ipfsHash;
        if (hasUrlProperty(vault?.value)) {
          ipfsHash = vault.value.url;
        } else {
          // Handle the case where vault?.value does not have a 'url' property
          console.log("The value does not have a 'url' property.");
        }
        const encryptionKey = await generateEncryptionKey(
          process.env.NEXT_PUBLIC_ENCRYPTION_KEY!
        );
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
        const _cid = URL.createObjectURL(blob);
        const _headline: string = "headline";
        const _description: string = "description";
        const _vaultName = await vaultAssets.getData("LSP4TokenName");
        const _mintedCount = await VaultContract.balanceOf(vaults[i].contract);

        newVaultsDataArray.push({
          name: _vaultName.value as string,
          mintedCount: hexToDecimal(_mintedCount._hex),
          cid: _cid,
          headline: _headline,
          description: _description,
          contractAddress: vaults[i].contract,
        });
      }
      setVaultsDataArray(newVaultsDataArray);
      setIsDownloading(true);
    }
  };

  const changeItem = (step: number) => {
    let newIdx = (currentIdx + step) % vaultsDataArray.length;
    if (newIdx < 0) newIdx = vaultsDataArray.length - 1;
    setCurrentIdx(newIdx);
  };

  return !isDownloading ? (
    <div className="flex space-x-2 justify-center items-center bg-gray-200 h-screen dark:invert">
      <span className="sr-only">Loading...</span>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce"></div>
    </div>
  ) : (
    <div className="carousel-container h-[400px] relative">
      <div className="carousel mx-auto pt-20 grid grid-cols-3 relative">
        <div>
          <div className="text-6xl text-bold">Memory Vaults</div>
          <div className="pt-4 pl-1">Memory Idea</div>
        </div>

        <div className="right absolute right-10 top-2/3">
          <span
            className="right absolute top-1 right-10 cursor-pointer bg-gray-400 p-2"
            onClick={() => changeItem(1)}
          >
            <FaAngleLeft />
          </span>
          <span
            className="right absolute top-1 right-1 cursor-pointer bg-gray-400 p-2"
            onClick={() => changeItem(-1)}
          >
            <FaAngleRight />
          </span>
        </div>
      </div>

      <div className="carousel mx-auto mt-1 grid grid-cols-3 relative">
        <div className="carousel-left scale-y-[0.8] h-[200px] rounded-xl border-gray-400 border-solid flex mt-2 bg-white shadow-lg shadow-gray-500/50">
          {vaultsDataArray.map((item, idx) => (
            <div
              key={`left-left-` + idx}
              className={`w-1/2 ${
                idx !==
                (currentIdx + vaultsDataArray.length - 1) %
                  vaultsDataArray.length
                  ? "hidden"
                  : ""
              }`}
            >
              <img
                className={`rounded-l-xl carousel-item h-[200px]`}
                src={item.cid}
                alt=""
              />
            </div>
          ))}
          {vaultsDataArray.map((item, idx) => (
            <div
              key={`left-right-` + idx}
              className={`w-1/2 p-3 ${
                idx !==
                (currentIdx + vaultsDataArray.length - 1) %
                  vaultsDataArray.length
                  ? "hidden"
                  : ""
              }`}
            >
              <div className="title font-bold text-xl">{item.name}</div>
              <div className="headline text-sm h-[30px]">{item.headline}</div>
              <div className="infoPanel pt-8 flex gap-1">
                <div className="bg-gray-200 h-[25px] w-[50px] rounded-md flex justify-center item-center gap-1">
                  <div className="flex items-center justify-center h-full">
                    <FaRegCircleCheck size={12} />
                  </div>
                  <div className="flex items-center justify-center h-full">
                    {item.mintedCount}
                  </div>
                </div>
                <div className="bg-gray-200 h-[25px] w-[100px] rounded-md flex justify-center item-center">
                  Earn $FMT
                </div>
              </div>
              <div className="buttonGroup mt-4 flex gap-2">
                <button className="bg-sky-700 p-1 text-sm rounded text-white shadow-lg shadow-gray-500/50">
                  Deploy vault
                </button>
                <button className="border-2 border-sky-700 p-1 text-sm rounded text-sky-700 shadow-lg shadow-gray-500/50">
                  More details
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="carousel-center scale-x-[1.7] z-10 translate-y-1 h-[220px] rounded-xl border-gray-400 border-solid flex bg-white shadow-lg shadow-gray-500/50">
          {vaultsDataArray.map((item, idx) => (
            <div
              key={`center-left-` + idx}
              className={`w-1/2 ${idx !== currentIdx ? "hidden" : ""}`}
            >
              <img
                className={`rounded-l-xl carousel-item h-[220px]`}
                src={item.cid}
                alt=""
              />
            </div>
          ))}
          {vaultsDataArray.map((item, idx) => (
            <div
              key={`center-right-` + idx}
              className={`w-1/2 p-3 ${idx !== currentIdx ? "hidden" : ""}`}
            >
              <div className="title font-bold text-2xl">{item.name}</div>
              <div className="headline text-sm h-[50px]">{item.headline}</div>
              <div className="infoPanel pt-8 flex gap-1">
                <div className="bg-gray-200 h-[25px] w-[50px] rounded-md flex justify-center item-center gap-1">
                  <div className="flex items-center justify-center h-full">
                    <FaRegCircleCheck size={12} />
                  </div>
                  <div className="flex items-center justify-center h-full">
                    {item.mintedCount}
                  </div>
                </div>
                <div className="bg-gray-200 h-[25px] w-[100px] rounded-md flex justify-center item-center">
                  Earn $FMT
                </div>
              </div>
              <div className="buttonGroup mt-4 flex gap-2">
                <button className="bg-sky-700 p-1 text-sm rounded text-white shadow-lg shadow-gray-500/50">
                  Deploy vault
                </button>
                <Link
                  href={`/vault/` + item.contractAddress}
                  // onClick={handleGoToVault}
                  className="border-2 border-sky-700 p-1 text-sm rounded text-sky-700 shadow-lg shadow-gray-500/50 cursor-pointer"
                >
                  More details
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="carousel-right scale-y-[0.8] h-[200px] rounded-xl border-gray-400 border-solid mt-2 flex bg-white shadow-lg shadow-gray-500/50">
          {vaultsDataArray.map((item, idx) => (
            <div
              key={`right-left-` + idx}
              className={`w-1/2 ${
                idx !==
                (currentIdx + vaultsDataArray.length + 1) %
                  vaultsDataArray.length
                  ? "hidden"
                  : ""
              }`}
            >
              <img
                className={`rounded-l-xl carousel-item h-[200px]`}
                src={item.cid}
                alt=""
              />
            </div>
          ))}
          {vaultsDataArray.map((item, idx) => (
            <div
              key={`right-right-` + idx}
              className={`w-1/2 p-3 ${
                idx !==
                (currentIdx + vaultsDataArray.length + 1) %
                  vaultsDataArray.length
                  ? "hidden"
                  : ""
              }`}
            >
              <div className="title font-bold text-xl">{item.name}</div>
              <div className="headline text-sm h-[30px]">{item.headline}</div>
              <div className="infoPanel pt-8 flex gap-1">
                <div className="bg-gray-200 h-[25px] w-[50px] rounded-md flex justify-center item-center gap-1">
                  <div className="flex items-center justify-center h-full">
                    <FaRegCircleCheck size={12} />
                  </div>
                  <div className="flex items-center justify-center h-full">
                    {item.mintedCount}
                  </div>
                </div>
                <div className="bg-gray-200 h-[25px] w-[100px] rounded-md flex justify-center item-center">
                  Earn $FMT
                </div>
              </div>
              <div className="buttonGroup mt-4 flex gap-2">
                <button className="bg-sky-700 p-1 text-sm rounded text-white shadow-lg shadow-gray-500/50">
                  Deploy vault
                </button>
                <button className="border-2 border-sky-700 p-1 text-sm rounded text-sky-700 shadow-lg shadow-gray-500/50">
                  More details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VaultSlider;
