"use client";

import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  FormEvent,
} from "react";
import Image from "next/image";
import Select, { MultiValue } from "react-select";
import { generateEncryptionKey, decryptFile } from "@/utils/upload";
import { ethers } from "ethers";
import { ERC725 } from "@erc725/erc725.js";
import LSP4DigitalAsset from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
import VaultABI from "@/artifacts/Vault.json";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers5/react";
// import { FMTContract } from "@/components/MasterWalletProvider";
import VaultFactoryABI from "@/artifacts/VaultFactory.json";
import { hexToDecimal, hexStringToUint8Array } from "@/utils/format";
import {
  generateAESKey,
  decryptEncryptedEncryptionKey,
} from "@/utils/encryptKey";
import toast, { Toaster } from "react-hot-toast";

import "./index.css";

interface TagOption {
  value: number;
  label: string;
}

const Tags: TagOption[] = [
  { value: 1, label: "Shared" },
  { value: 2, label: "Personal" },
  { value: 3, label: "Selfie" },
];

interface Vault {
  name: string;
  description: string;
  cid: string;
  moments: number;
  members: number;
  owner: string;
  vaultAddress: string;
  vaultMode: number;
}

export default function AddMoment({ params }: { params: { slug: string } }) {
  const vaultAddress = params.slug;
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [selectedTags, setSelectedTags] = useState<MultiValue<TagOption>>([]);
  const [headline, setHeadline] = useState<string>("");
  const [tokenName, setTokenName] = useState<string>("");
  const [tokenSymbol, setTokenSymbol] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [copies, setCopies] = useState<number>(3); // Default to 3 copies
  const [vault, setVault] = useState<Vault>();
  const [file, setFile] = useState<File | null>(null);
  const [cid, setCid] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [vaultData, setVaultData] = useState<Vault[]>([]);

  useEffect(() => {
    const init = async () => {
      if (walletProvider && address) {
        // Ensuring both are available
        const ethersProvider = new ethers.providers.Web3Provider(
          walletProvider,
          "any"
        );
        const signer = ethersProvider.getSigner(address);

        const VaultContract = new ethers.Contract(
          process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as string,
          VaultABI.abi,
          signer
        );

        const VaultFactoryContract = new ethers.Contract(
          process.env.NEXT_PUBLIC_VAULT_FACTORY_CONTRACT_ADDRESS as string,
          VaultFactoryABI.abi,
          signer
        );
        const publicVaults = await VaultFactoryContract.getPublicVaultsByUser(
          address
        );

        console.log("publicVaults", publicVaults);

        const vaults: Vault[] = [];
        for (let i = 0; i < publicVaults.length; i++) {
          const data = await VaultFactoryContract.getVaultMetadata(
            publicVaults[i]
          );

          const momentCount = await VaultContract.getNFTcounts(publicVaults[i]);

          vaults.push({
            name: data.title,
            description: data.description,
            cid: data.imageURI,
            moments: hexToDecimal(momentCount._hex),
            members: hexToDecimal(data.memberCount._hex),
            owner: data.vaultOwner,
            vaultAddress: publicVaults[i],
            vaultMode: data.vaultMode,
          });
        }

        const privateVaults = await VaultFactoryContract.getPrivateVaultsByUser(
          address
        );
        console.log("privateVaults", privateVaults);

        for (let i = 0; i < privateVaults.length; i++) {
          const data = await VaultFactoryContract.getVaultMetadata(
            privateVaults[i]
          );

          const momentCount = await VaultContract.getNFTcounts(privateVaults[i]);
          vaults.push({
            name: data.title,
            description: data.description,
            cid: data.imageURI,
            moments: hexToDecimal(momentCount._hex),
            members: hexToDecimal(data.memberCount._hex),
            owner: data.vaultOwner,
            vaultAddress: privateVaults[i],
            vaultMode: data.vaultMode,
          });
        }

        setVaultData(vaults);
        setIsDownloading(true);
      }
    };

    init();
  }, [isConnected, address, walletProvider]); // Added address and walletProvider to dependencies

  const handleTagChange = (selectedOptions: MultiValue<TagOption>) => {
    setSelectedTags(selectedOptions);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (e.target.files) {
      setFile(e.target.files[0]);
    }

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // Update the setter to set the entire object
  const handleVaultChange = (selectedOption: Vault) => {
    setVault(selectedOption);
  };

  const handleMintMoment = async (e: FormEvent) => {
    e.preventDefault();

    /////////////////////////////////////////////////////////
    if (address && walletProvider && vaultData.length) {
      try {
        let vaultAddress: string = "";
        if (!vault?.vaultAddress) {
          vaultAddress = vaultData[0].vaultAddress;
        } else {
          vaultAddress = vault.vaultAddress;
        }
        setUploading(true);
        const formData = new FormData();
        !file ? "" : formData.append("file", file); // FormData keys are called fields
        formData.append(
          "lsp7CollectionMetadata",
          vault?.vaultAddress + tokenName + tokenSymbol + headline
        );
        const res = await fetch("/api/uploadAssetsToIPFS", {
          method: "POST",
          body: formData,
        });

        const resData = await res.json();
        const ipfsHash = resData.ipfsHash;
        const combinedEncryptedData = resData.combinedEncryptedData;

        setCid(ipfsHash);

        const ethersProvider = new ethers.providers.Web3Provider(
          walletProvider,
          "any"
        );
        const signer = await ethersProvider.getSigner(address);

        const VaultContract = new ethers.Contract(
          process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as string,
          VaultABI.abi,
          signer
        );

        const _lastClaimed = await VaultContract.lastClaimed(address);
        const lastClaimed = hexToDecimal(_lastClaimed._hex);
        const timestamp: number = Date.now();
        // first mint or over 24 hours
        // if (lastClaimed == 0 || timestamp / 1000 - lastClaimed > 86400) {
        ///////////// mint function logic
        const lsp7SubCollectionMetadata = {
          LSP4Metadata: {
            // name: 'Daily Selfie',
            headline,
            description,
            links: [],
            tags: [],
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
                url: "ifps://" + ipfsHash,
                fileType: "jpg",
              },
            ],
            attributes: [],
          },
        };
        const lsp7SubCollectionMetadataCID = ipfsHash;
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

        // const encryptionKey = decryptEncryptedEncryptionKey(aesKey, iv, encryptedKey);
        // console.log("encryptionKey+++", encryptionKey);

        const tx = await VaultContract.mint(
          tokenName, // tokenName
          tokenSymbol, //tokenSymbol
          true, // isNonDivisible
          copies, // totalSupplyofLSP7
          address, //receiverOfInitialTokens_
          encodeLSP7Metadata.values[0],
          combinedEncryptedData,
          vaultAddress
        );

        console.log("tx", tx);

        //////////// send reward token logic
        // const gasLimit = 100000;
        // const rewardAmount = await ForeverMemoryContract.rewardAmount();
        // const mWalletOwner = await FMTContract.owner();
        // console.log("mWalletOwner:", mWalletOwner);
        // const decimals = await FMTContract.balanceOf(mWalletOwner);
        // console.log("decimals:", decimals);
        // const amount = ethers.utils.parseUnits(rewardAmount, 18);
        // console.log("amount:", amount);
        // const txt = await FMTContract.transfer(
        //   mWalletOwner,
        //   owner,
        //   amount,
        //   false,
        //   "0x",
        //   { gasLimit: gasLimit }
        // );
        // console.log("tx:", txt);
        setUploading(false);
        toast.success("You minted one memory successfully!");
      } catch (e) {
        console.log(e);
        setUploading(false);
        toast.error("Trouble uploading file");
      }
    } else {
      toast.error("Connect your wallet");
    }
  };

  return !isDownloading ? (
    <div className="flex space-x-2 justify-center items-center bg-white h-screen dark:invert">
      <span className="sr-only">Loading...</span>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce"></div>
    </div>
  ) : (
    <div className="flex justify-center bg-gray-200 w-full">
      <div className="flex justify-center main-content gap-x-1 mt-4 mb-20 w-full">
        <div className="rounded-lg border p-5 bg-white ml-4 mr-2 shadow-lg shadow-gray-500/50 w-1/2">
          <h4 className="text-xl mb-2 font-bold">Mint Moment</h4>
          <div>
            <div className="mb-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-[500px] border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 shadow-lg shadow-gray-500/50"
                >
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-[500px] rounded-lg"
                    />
                  )}

                  {!imagePreview && (
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
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Max. File Size: 30MB
                      </p>
                    </div>
                  )}

                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>
            <div className="mb-4">
              <label
                htmlFor="vault"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white flex justify-between"
              >
                <div>Select a vault</div>
                <div>
                  {!vault?.vaultMode ? (
                    <span className="text-blue-500 font-bold">Public</span>
                  ) : (
                    <span className="text-red-500 font-bold">Private</span>
                  )}
                </div>
              </label>
              <select
                id="vault"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                value={vault?.name} // Set the value to vault.label
                onChange={(e) => {
                  const selectedOption = vaultData.find(
                    (option) => option.name === e.target.value
                  );
                  if (selectedOption) {
                    handleVaultChange(selectedOption); // Call the handler with the selected option
                  }
                }}
              >
                {vaultData.map((option, index) => (
                  <option key={index} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label
                htmlFor="headline"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Token Name
              </label>
              <input
                id="headline"
                type="text"
                className="rounded p-2 w-full border-solid border-black-500"
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
                Token Symbol
              </label>
              <input
                id="headline"
                type="text"
                className="rounded p-2 w-full border-solid border-black-500"
                placeholder="Input the Token Symbol"
                value={tokenSymbol}
                onChange={(e) => setTokenSymbol(e.target.value)}
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
                className="rounded p-2 w-full border-solid border-black-500"
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
                onClick={handleMintMoment}
                className="mt-4 bg-blue-500 text-white py-2 px-4 rounded shadow-lg shadow-gray-500/50"
              >
                {uploading ? "Minting..." : "Mint Moment"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
