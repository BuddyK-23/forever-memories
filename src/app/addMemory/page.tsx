"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import Select, { MultiValue } from "react-select";
import { generateEncryptionKey, decryptFile } from "@/utils/upload";
import { ethers } from "ethers";
import Web3 from "web3";
import { ERC725 } from "@erc725/erc725.js";
import LSP4DigitalAsset from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";

import LSP8Collection from "@/smartcontracts/artifacts/LSP8Collection.json";

interface TagOption {
  value: number;
  label: string;
}

const Tags: TagOption[] = [
  { value: 1, label: "aaa" },
  { value: 2, label: "bbb" },
  { value: 3, label: "ccc" },
  { value: 4, label: "ddd" },
  { value: 5, label: "eee" },
  { value: 6, label: "fff" },
  { value: 7, label: "ggg" },
  { value: 8, label: "hhh" },
  { value: 9, label: "jjj" },
];

const vaultOptions = [
  "Daily Selfie",
  "Dear Diary",
  "Kids Drawings",
  "Life Capsule",
  "Legacy Safe",
  "Time Capsule",
  "Digital Legacy",
] as const;

type VaultOption = (typeof vaultOptions)[number];

interface MemoryData {
  vault: VaultOption;
  copies: number;
  headline: string;
  description: string;
  tags: string[];
  file?: File;
}

export default function AddMemory() {
  const [selectedTags, setSelectedTags] = useState<MultiValue<TagOption>>([]);
  const [headline, setHeadline] = useState<string>("");
  const [tokenName, setTokenName] = useState<string>("");
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [copies, setCopies] = useState<number>(3); // Default to 3 copies
  const [vault, setVault] = useState<VaultOption>("Daily Selfie");
  const [file, setFile] = useState<File | null>(null);
  const [cid, setCid] = useState("");
  const [uploading, setUploading] = useState(false);
  const [assetsUrl, setAssetsUrl] = useState("");
  const [userAccount, setUserAccount] = useState("");
  const [walletType, setWalletType] = useState("");
  const [ownerAddress, setOwnerAddress] = useState("");

  const handleTagChange = (selectedOptions: MultiValue<TagOption>) => {
    setSelectedTags(selectedOptions);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  useEffect(() => {
    setUserAccount(localStorage.getItem("userAccount") || "");
    setWalletType(localStorage.getItem("walletType") || "");
  }, []);

  async function connectWallet() {
    let provider;
    if (walletType == "MetaMask") {
      provider = new ethers.BrowserProvider(window.ethereum);
    } else if (walletType == "UP") {
      provider = new ethers.BrowserProvider(window.lukso);
    } else {
      console.log("Unknown provider");
      return;
    }

    return provider;
  }

  const handleAddMemory = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      setUploading(true);
      const formData = new FormData();
      !file ? "" : formData.append("file", file); // FormData keys are called fields
      console.log("formData", formData);
      const res = await fetch("/api/uploadAssetsToIPFS", {
        method: "POST",
        body: formData,
      });

      const resData = await res.json();
      console.log(resData.ipfsHash);
      setCid(resData.ipfsHash);
    } catch (e) {
      console.log(e);
      //   setUploading(false);
      alert("Trouble uploading file");
    }

    const memoryData: MemoryData = {
      vault,
      copies,
      headline,
      description,
      tags: selectedTags.map((tag) => tag.label),
      file: file ?? undefined,
    };
    console.log("Form submitted:", memoryData);

    //  ------ Get LSP8 Daily Selfie Metadata ------  //
    // @param: title: "Daily Selfie"
    // @param: headline: "Document Your Journey, Day by Day"
    // @param: description: "Daily Selfie is your blockchain-based photo journal, capturing one selfie a day to create a visual timeline of your personal evolution. By securely storing your daily photos on-chain, Daily Selfie crafts a unique visual narrative of your life, reflecting the changes and growth over time. Preserve each moment as part of a timeless digital album that celebrates your journey and leaves a lasting legacy."
    // Generated Metadata: "0x00006f357c6a0020b5b7abdb1a03bad515ab58d61acb9a8c0cb5d2261746767ed87e95370659af75697066733a2f2f516d63775946684750374b426f316134457662427875764466336a513262773164664d456f764154524a5a657458"

    // Contract Address: "0x48b92ddab46ab63db20aa97952d4a3fb0769920d"
    // https://explorer.execution.testnet.lukso.network/address/0x48b92DDAb46Ab63DB20aa97952D4a3Fb0769920D?tab=txs

    // const erc725 = new ERC725(LSP4DigitalAsset, '', '', {});
    // const lsp8CollectionMetadata = {
    //   LSP4Metadata: {
    //     name: 'Daily Selfie',
    //     headline: 'Document Your Journey, Day by Day',
    //     description:
    //       'Daily Selfie is your blockchain-based photo journal, capturing one selfie a day to create a visual timeline of your personal evolution. By securely storing your daily photos on-chain, Daily Selfie crafts a unique visual narrative of your life, reflecting the changes and growth over time. Preserve each moment as part of a timeless digital album that celebrates your journey and leaves a lasting legacy.',
    //     links: [],
    //     icons: [],
    //     images: [],
    //     assets: [],
    //     attributes: [],
    //   },
    // };
    // const lsp8CollectionMetadataCID =
    //   'ipfs://QmcwYFhGP7KBo1a4EvbBxuvDf3jQ2bw1dfMEovATRJZetX';
    // const encodeLSP8Metadata = erc725.encodeData([
    //   {
    //     keyName: 'LSP4Metadata',
    //     value: {
    //       json: lsp8CollectionMetadata,
    //       url: lsp8CollectionMetadataCID,
    //     },
    //   },
    // ]);
    // console.log('encodeLSP8Metadata', encodeLSP8Metadata.values[0]);

    // ----- End Metadata ---- //

    // ----- LSP7 Collection Metadata ----- //
    const lsp7SubCollectionMetadata = {
      LSP4Metadata: {
        // name: 'Daily Selfie',
        headline,
        description,
        links: [],
        icons: [
          {
            width: 256,
            height: 256,
            url: "ipfs://" + cid,
            verification: {
              method: "keccak256(bytes)",
              data: "0xdd6b5fb6dc984fda0222fb6f6e96b471c0667b12f03b1e804f7b5e6ab62acdb0",
            },
          },
        ],
        images: [
          [
            {
              width: 1024,
              height: 974,
              url: "ipfs://" + cid,
              verification: {
                method: "keccak256(bytes)",
                data: "0x951bf983a4b7bcebc5c0b00a5e783630dcb788e95ee9e44b0b7d4bde4a0b4d81",
              },
            },
          ],
        ],
        assets: [
          {
            verification: {
              method: "keccak256(bytes)",
              data: "0x88f3d704f3d534267c564019ce2b70a5733d070e71bf2c1f85b5fc487f47a46f",
            },
            url: "ipfs://" + cid,
            fileType: "jpg",
          },
        ],
        attributes: [],
      },
    };
    const lsp7SubCollectionMetadataCID = "ipfs://" + cid;
    const erc725 = new ERC725(LSP4DigitalAsset, "", "", {});
    const encodeLSP7Metadata = erc725.encodeData([
      {
        keyName: "LSP4Metadata",
        value: {
          json: lsp7SubCollectionMetadata,
          url: lsp7SubCollectionMetadataCID,
        },
      },
    ]);
    console.log("encodeLSP7Metadata", encodeLSP7Metadata.values[0]);

    const LSP8CollectionContractAddress =
      "0x104a441ece8292f554f90b68533e94d05344faf9";
    console.log("walletType", walletType);

    const provider = await connectWallet();

    if (!provider) {
      console.error("Failed to connect to UP Wallet");
      return;
    }

    const accounts = await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner(accounts[0]);
    console.log("accounts", accounts[0]);
    console.log("signer", signer);

    const balance = await provider.getBalance(accounts[0]);
    console.log("balance", balance);

    const LSP8contract = new ethers.Contract(
      LSP8CollectionContractAddress,
      LSP8Collection.abi,
      signer
    );

    // const owner = await LSP8contract.owner();
    // console.log("owner", owner);

    // const tx = await LSP8contract.mint(
    //   "Day2DDDDD Selfie",
    //   "DS2D",
    //   1, //token type, if 1, NFT
    //   true, // isNonDivisible
    //   10, // totalSupplyofLSP7
    //   "0xeE1d780150f92967743aB4Fd9F807c486DE2E9E6", //receiverOfInitialTokens_
    //   "0x00006f357c6a002003919e2c9f21869ea7beabc3dfbef99dfefe81df93dc373288fa6730b778e22e697066733a2f2f516d63775946684750374b426f316134457662427875764466336a513262773164664d456f764154524a5a657458"
    //   // encodeLSP7Metadata.values[0]
    // );
    const tx = await LSP8contract.mint(
      tokenName, // tokenName
      tokenSymbol, //tokenSymbol
      1, //token type, if 1, NFT
      false, // isNonDivisible
      copies, // totalSupplyofLSP7
      ownerAddress, //receiverOfInitialTokens_
      encodeLSP7Metadata.values[0]
    );
    await tx.wait();
    console.log("tx", tx);

    setUploading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center main-content">
      <div className="rounded-lg border border-red-100 p-5 bg-pink-50 mt-4 w-1/2">
        <h4 className="text-xl mb-2 font-bold">Add Memory</h4>
        <form className="" onSubmit={handleAddMemory}>
          <div className="mb-4">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="dropzone-file"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 16"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    SVG, PNG, JPG or GIF (MAX. 800x400px)
                  </p>
                </div>
                <input
                  id="dropzone-file"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
          <div className="mb-4">
            <label
              htmlFor="vault"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Select a vault
            </label>
            <select
              id="vault"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={vault}
              onChange={(e) => setVault(e.target.value as VaultOption)}
            >
              {vaultOptions.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label
              htmlFor="headline"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              LSP7 Collection NFT Token Name
            </label>
            <input
              id="headline"
              type="text"
              className="rounded p-2 w-full border-solid border-2 border-black-500"
              placeholder="Input the Token Name"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="headline"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              LSP7 Collection NFT Token Symbol
            </label>
            <input
              id="headline"
              type="text"
              className="rounded p-2 w-full border-solid border-2 border-black-500"
              placeholder="Input the Token Symbol"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="headline"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Owner Address Of LSP7 NFT Token
            </label>
            <input
              id="headline"
              type="text"
              className="rounded p-2 w-full border-solid border-2 border-black-500"
              placeholder="Input the Owner Address"
              value={ownerAddress}
              onChange={(e) => setOwnerAddress(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="copies"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              How many copies?
            </label>
            <div className="flex items-center mb-4">
              <input
                id="copies-1"
                type="radio"
                value="1"
                name="copies"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                checked={copies === 1}
                onChange={() => setCopies(1)}
              />
              <label
                htmlFor="copies-1"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                1
              </label>
            </div>
            <div className="flex items-center mb-4">
              <input
                id="copies-3"
                type="radio"
                value="3"
                name="copies"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                checked={copies === 3}
                onChange={() => setCopies(3)}
              />
              <label
                htmlFor="copies-3"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                3 (recommended)
              </label>
            </div>
            <div className="flex items-center">
              <input
                id="copies-10"
                type="radio"
                value="10"
                name="copies"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                checked={copies === 10}
                onChange={() => setCopies(10)}
              />
              <label
                htmlFor="copies-10"
                className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
              >
                10
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="headline"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Headline
            </label>
            <input
              id="headline"
              type="text"
              className="rounded p-2 w-full border-solid border-2 border-black-500"
              placeholder="Input the headline"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label
              htmlFor="description"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Description
            </label>
            <textarea
              id="description"
              className="resize-y rounded-md w-full h-20 p-2"
              placeholder="Input the description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Select Tags
            </label>
            <Select
              options={Tags}
              onChange={handleTagChange}
              isMulti
              value={selectedTags}
            />
          </div>
          <div className="w-full flex justify-center">
            <button
              type="submit"
              className="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
            >
              {uploading ? "Storing..." : "Store Memory On Chain"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
