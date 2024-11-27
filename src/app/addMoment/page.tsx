"use client";

import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  FormEvent,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Select, { MultiValue } from "react-select";
import { generateEncryptionKey, decryptFile } from "@/utils/upload";
import { detectFileType } from "@/utils/detectFileType";
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
import VaultAssistABI from "@/artifacts/VaultAssist.json";
import {
  hexToDecimal,
  hexStringToUint8Array,
  bytes32ToAddress,
  decimalToBytes32,
} from "@/utils/format";
import {
  generateAESKey,
  decryptEncryptedEncryptionKey,
} from "@/utils/encryptKey";
import toast, { Toaster } from "react-hot-toast";

import "./index.css";
import { ERC725YDataKeys } from "@lukso/lsp-smart-contracts";
// Define MIME type limits
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB

interface TagOption {
  value: number;
  label: string;
}

const Tags: TagOption[] = [
  { value: 1, label: "Shared" },
  { value: 2, label: "Personal" },
  { value: 3, label: "Selfie" },
];

const FileTypes = ["image", "video"] as const;

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

// Function to detect file type and check size limits
const getFileTypeAndCheckSize = (
  file: File
): { type: number; isValid: boolean } => {
  if (!file) {
    return { type: 0, isValid: false };
  }

  const mimeType = file.type;
  let fileType = 0;
  let isValid = true;

  // Check file type and size
  if (mimeType === "image/jpeg" || mimeType === "image/png") {
    fileType = 1; // Image type
    if (file.size > MAX_IMAGE_SIZE) {
      isValid = false;
      toast.error("Image file size exceeds the 10MB limit.");
    }
  } else if (mimeType === "video/mp4" || mimeType === "video/avi") {
    fileType = 2; // Video type
    if (file.size > MAX_VIDEO_SIZE) {
      isValid = false;
      toast.error("Video file size exceeds the 20MB limit.");
    }
  } else {
    isValid = false;
    toast.error("Unsupported file type.");
  }

  return { type: fileType, isValid };
};

export default function AddMoment({ params }: { params: { slug: string } }) {
  const vaultAddress = params.slug;
  const router = useRouter();
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [selectedTags, setSelectedTags] = useState<MultiValue<TagOption>>([]);
  const [headline, setHeadline] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [copies, setCopies] = useState<number>(3); // Default to 3 copies
  const [vault, setVault] = useState<Vault>();
  const [file, setFile] = useState<File | null>(null);
  const [cid, setCid] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [vaultData, setVaultData] = useState<Vault[]>([]);
  const [fileType, setFileType] = useState<number>(1); // 1 for image, 2 for video

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
        const nonOwnedPublicVaultList =
          await VaultFactoryContract.getVaultsByUser(address, true);
        const nonOwnedPrivateVaultList =
          await VaultFactoryContract.getVaultsByUser(address, false);
        const ownedPublicVaultList =
          await VaultFactoryContract.getVaultsOwnedByUser(address, true);
        const ownedPrivateVaultList =
          await VaultFactoryContract.getVaultsOwnedByUser(address, false);
        // // get all vault list
        // const ownedPrivateVaultList =
        //   await VaultFactoryContract.getPrivateVaultsOwnedByUser(address);
        // const nonOwnedPrivateVaultList =
        //   await VaultFactoryContract.getPrivateVaultsByUser(address);
        // const ownedPublicVaultList =
        //   await VaultFactoryContract.getPublicVaultsOwnedByUser(address);
        // const nonOwnedPublicVaultList =
        //   await VaultFactoryContract.getPublicVaultsByUser(address);
        const vaultList = [
          ...ownedPrivateVaultList,
          ...nonOwnedPrivateVaultList,
          ...ownedPublicVaultList,
          ...nonOwnedPublicVaultList,
        ];

        const vaults: Vault[] = [];
        for (let i = 0; i < vaultList.length; i++) {
          const data = await VaultFactoryContract.getVaultMetadata(
            vaultList[i]
          );

          const momentCount = await VaultContract.getNFTcounts(vaultList[i]);
          console.log("data.vaultMode", data.vaultMode);
          const _vault = {
            name: data.title,
            description: data.description,
            cid: data.imageURI,
            moments: hexToDecimal(momentCount._hex),
            members: hexToDecimal(data.memberCount._hex),
            owner: data.vaultOwner,
            vaultAddress: vaultList[i],
            vaultMode: data.vaultMode,
          };
          vaults.push(_vault);

          if (i == 0) {
            setVault(_vault);
          }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    // Detect file type
    const { type, error } = detectFileType(file);
    console.log("type", type);
    if (error) {
      toast.error(error);
      setFile(null);
      setImagePreview(null);
      setVideoPreview(null);
      return;
    }

    // Set the file state
    setFile(file);

    // Generate preview based on file type
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 0) {
        // Image preview
        setImagePreview(reader.result as string);
        setVideoPreview(null);
      } else if (type === 1) {
        // Video preview
        setVideoPreview(reader.result as string);
        setImagePreview(null);
      }
    };

    reader.readAsDataURL(file);
  };

  // Update the setter to set the entire object
  const handleVaultChange = (selectedOption: Vault) => {
    setVault(selectedOption);
  };

  const handleMintMoment = async (e: FormEvent) => {
    e.preventDefault();
    setIsDownloading(false);
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
        console.log("file", file);
        const { type, error } = detectFileType(file as File);
        console.log("handleMintMoment type", type);
        formData.append(
          "lsp7CollectionMetadata",
          vault?.vaultAddress + headline
        );
        const resAssetData_ = await fetch("/api/uploadAssetsToIPFS", {
          method: "POST",
          body: formData,
        });

        const resAssetData = await resAssetData_.json();
        const ipfsHash = resAssetData.ipfsHash;
        const combinedEncryptedData = resAssetData.combinedEncryptedData;

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

        const momentMetadata = {
          LSP4Metadata: {
            name: process.env.NEXT_PUBLIC_LSP8COLLECTION_NAME,
            headline,
            ipfsHash,
            description,
            links: [{ title: "Twitter", url: "https://twitter.com/" }],
            tags: [],
            icons: [
              {
                width: 256,
                height: 256,
                url: "ipfs://" + process.env.NEXT_PUBLIC_MOMENT_DEFAULT_IMAGE,
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
                  url: "ipfs://" + process.env.NEXT_PUBLIC_MOMENT_DEFAULT_IMAGE,
                  verification: {
                    method: "keccak256(bytes)",
                    data: "0x951bf983a4b7bcebc5c0b00a5e783630dcb788e95ee9e44b0b7d4bde4a0b4d81",
                  },
                },
              ],
            ],
            assets: [],
            // fileType, // 1: image, 2: video
            attributes: [
              { key: "FileType", value: FileTypes[type], type: "string" },
            ],
          },
        };
        console.log("momentMetadata", momentMetadata);

        const resMetadata_ = await fetch("/api/uploadMetadataToIPFS", {
          method: "POST",
          body: JSON.stringify(momentMetadata),
        });

        const resMetadata = await resMetadata_.json();
        console.log("resMetadata", resMetadata);

        const momentCID = ipfsHash;
        console.log("momentCID", momentCID);
        // const erc725 = new ERC725(schema);
        const erc725 = new ERC725(LSP4DigitalAsset, "", "", {});
        const encodedMetadataURI = erc725.encodeData([
          {
            keyName: "LSP4Metadata",
            value: {
              json: momentMetadata,
              url: resMetadata.metadataHash,
            },
          },
        ]);

        console.log("encodeLSP7Metadata", encodedMetadataURI);

        const LSP4MetadataKey = ERC725YDataKeys.LSP4["LSP4Metadata"];
        console.log("LSP4MetadataKey", LSP4MetadataKey);

        const vaultTx = await VaultContract.mintMoment(
          vaultAddress,
          LSP4MetadataKey,
          encodedMetadataURI.values[0],
          combinedEncryptedData,
          notes
        );

        console.log("vaultTx", vaultTx);

        //**************************** */
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

        setUploading(false);
        toast.success("You minted one memory successfully!");
        router.push("/myVaults/vault/" + vault?.vaultAddress);
      } catch (e) {
        console.log(e);
        setUploading(false);
        toast.error("Trouble uploading file");
      }
    } else {
      toast.error("Connect your wallet");
    }
    setIsDownloading(true);
  };

  return !isDownloading ? (
    <div className="flex space-x-2 justify-center items-center bg-white h-[600px] dark:invert">
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

                  {videoPreview && (
                    <video
                      src={videoPreview}
                      controls
                      className="w-full h-[500px] rounded-lg"
                    />
                  )}

                  {!videoPreview && !imagePreview && (
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
                        Max. File Size: 20MB
                      </p>
                    </div>
                  )}

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
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white flex justify-between"
              >
                <div>Select a vault</div>
                <div>
                  {vault?.vaultMode === 0 ? (
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

            <div className="mb-4">
              <label
                htmlFor="notes"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Notes
              </label>
              <textarea
                id="notes"
                className="resize-y rounded-md w-full h-20 p-2"
                placeholder="Input the notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
