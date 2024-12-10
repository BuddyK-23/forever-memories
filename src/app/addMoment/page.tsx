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
const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

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
      toast.error("Image file size exceeds the 8MB limit.");
    }
  } else if (mimeType === "video/mp4" || mimeType === "video/avi") {
    fileType = 2; // Video type
    if (file.size > MAX_VIDEO_SIZE) {
      isValid = false;
      toast.error("Video file size exceeds the 50MB limit.");
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
  const [vault, setVault] = useState<Vault | undefined>(undefined);
  const [file, setFile] = useState<File | null>(null);
  const [cid, setCid] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState(''); // Tracks which stage is currently active
  const [isDownloading, setIsDownloading] = useState<boolean>(true);
  const [vaultData, setVaultData] = useState<Vault[]>([]);
  const [fileType, setFileType] = useState<number>(1); // 1 for image, 2 for video

  useEffect(() => {
    const init = async () => {
      if (walletProvider && address) {
        try {
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

          //Fetch all vaults
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
            //console.log("data.vaultMode", data.vaultMode);
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
          //setVault(vaults[0] || undefined); // Default to the first vault
        } catch (e) {
          console.log("Initialisation error:", e);
          toast.error("Error fetching collection data");
        } finally {
          setIsDownloading(false); // Ensure this is always called
        }
      } else {
        setIsDownloading(false); // Handles case where walletProvider or address is undefined
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
    
    if (!address || !walletProvider || !vaultData.length) {
      toast.error("Connect your wallet");
      return;
    }
    
    try {
      // Ensure vaultAddress is correctly set
      let vaultAddress: string = "";
      if (!vault?.vaultAddress) {
        vaultAddress = vaultData[0].vaultAddress;
      } else {
        vaultAddress = vault.vaultAddress;
      }

      // Start the uploading process
      setUploading(true);

      // Stage 1: Connecting to the UP browser extension
      setLoadingStage('connecting');
      const ethersProvider = new ethers.providers.Web3Provider(walletProvider, 'any');
      const signer = await ethersProvider.getSigner(address);

      // Simulate connecting to the UP browser extension
      await new Promise(resolve => setTimeout(resolve, 8000));
      setLoadingStage('connected'); // User confirmed connection

      // Stage 2: Preparing data
      const formData = new FormData();
      !file ? "" : formData.append("file", file); // FormData keys are called fields
      const { type, error } = detectFileType(file as File);
      
      const currentTimestamp = Date.now();
      formData.append(
        'momentMetadata',
        vault?.vaultAddress + headline + address + currentTimestamp
      );

      // Upload assets to IPFS
      const resAssetData_ = await fetch('/api/uploadAssetsToIPFS', {
        method: 'POST',
        body: formData,
      });
      const resAssetData = await resAssetData_.json();
      const ipfsHash = resAssetData.ipfsHash;
      const combinedEncryptedData = resAssetData.combinedEncryptedData;
      setCid(ipfsHash);

      setLoadingStage('confirmingTransaction'); // Awaiting transaction confirmation

      // Stage 3: Minting moment on chain
      const VaultContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as string,
        VaultABI.abi,
        signer
      );

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

      const resMetadata_ = await fetch("/api/uploadMetadataToIPFS", {
        method: "POST",
        body: JSON.stringify(momentMetadata),
      });
      const resMetadata = await resMetadata_.json();

      const momentCID = ipfsHash;
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

      //console.log("vaultAddress", vaultAddress);

      const LSP4MetadataKey = ERC725YDataKeys.LSP4["LSP4Metadata"];
      const vaultTx = await VaultContract.mintMoment(
        vaultAddress,
        LSP4MetadataKey,
        encodedMetadataURI.values[0],
        combinedEncryptedData,
        notes
      );

      //console.log("vaultTx", vaultTx);
      console.log("Transaction sent! Waiting for confirmation...");
      setLoadingStage('storingOnBlockchain'); // Inform user the data is being stored on the blockchain
      const receipt = await vaultTx.wait(); // Wait for the transaction to be mined
      const tokenId = receipt.events[2].args[0];

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

      // Stage 4: Success
      setUploading(false);
      router.push("/nft/" + tokenId);
    } catch (e) {
      console.log("Error", e);
      setUploading(false);
      setLoadingStage('');
      toast.error("Trouble uploading file");
    }
  };

  return uploading ? (
    // Loading screens during the minting process
    <div className="flex flex-col justify-center items-center bg-black min-h-screen text-white">
      {loadingStage === 'connecting' && (
        <div>
          <div className="flex space-x-2 justify-center items-center">
            <div
              className="h-8 w-8 rounded-full animate-bounce [animation-delay:-0.3s]"
              style={{
                backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
              }}
            ></div>
            <div
              className="h-8 w-8 rounded-full animate-bounce [animation-delay:-0.15s]"
              style={{
                backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
              }}
            ></div>
            <div
              className="h-8 w-8 rounded-full animate-bounce"
              style={{
                backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
              }}
            ></div>
          </div>
          <div className="flex flex-col items-center text-center max-w-[360px] mx-auto">
            <p className="text-lg mt-8">We're encrypting your Moment</p>
            <p className="text-base text-gray-400 mt-2">This can take a few seconds</p>
          </div>
        </div>
      )}
      {loadingStage === 'connected' && (
        <div>
          <div className="flex space-x-2 justify-center items-center">
            <div
              className="h-8 w-8 rounded-full animate-bounce [animation-delay:-0.3s]"
              style={{
                backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
              }}
            ></div>
            <div
              className="h-8 w-8 rounded-full animate-bounce [animation-delay:-0.15s]"
              style={{
                backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
              }}
            ></div>
            <div
              className="h-8 w-8 rounded-full animate-bounce"
              style={{
                backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
              }}
            ></div>
          </div>
          <div className="flex flex-col items-center text-center max-w-[360px] mx-auto">
            <p className="text-lg mt-8">We're encrypting your Moment</p>
            <p className="text-base text-gray-400 mt-2">Almost done! ...</p>
          </div>
        </div>
      )}
      {loadingStage === 'confirmingTransaction' && (
        <div>
          <div className="flex space-x-2 justify-center items-center">
            <div
              className="h-8 w-8 rounded-full animate-bounce [animation-delay:-0.3s]"
              style={{
                backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
              }}
            ></div>
            <div
              className="h-8 w-8 rounded-full animate-bounce [animation-delay:-0.15s]"
              style={{
                backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
              }}
            ></div>
            <div
              className="h-8 w-8 rounded-full animate-bounce"
              style={{
                backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
              }}
            ></div>
          </div>
          <div className="flex flex-col items-center text-center max-w-[360px] mx-auto">
            <p className="text-lg mt-8">Done. Let's store your Moment!</p>
            <p className="text-base text-gray-400 mt-2">Confirm the transaction in your Universal Profile to proceed. It should pop up automatically.</p>
            <p className="text-base text-gray-400 mt-2"></p>
          </div>
        </div>
      )}
      {loadingStage === 'storingOnBlockchain' && (
        <div>
          <div className="flex space-x-2 justify-center items-center">
            <div
              className="h-8 w-8 rounded-full animate-bounce [animation-delay:-0.3s]"
              style={{
                backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
              }}
            ></div>
            <div
              className="h-8 w-8 rounded-full animate-bounce [animation-delay:-0.15s]"
              style={{
                backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
              }}
            ></div>
            <div
              className="h-8 w-8 rounded-full animate-bounce"
              style={{
                backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
              }}
            ></div>
          </div>
          <div className="flex flex-col items-center text-center max-w-[360px] mx-auto">
            <p className="text-lg font-semibold mt-8">Storing your Moment to last forever</p>
            <p className="text-base mt-2">Great things take time. Your Forever Moment token will be ready soon.</p>
          </div>
        </div>
      )}
    </div>
  ) : isDownloading ? (
    // Initial loading screen when user enters the page
    <div className="flex flex-col justify-center items-center bg-black min-h-screen text-gray-200">
      <div className="flex space-x-2">
        <div
          className="h-8 w-8 rounded-full animate-bounce [animation-delay:-0.3s]"
          style={{
            backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
          }}
        ></div>
        <div
          className="h-8 w-8 rounded-full animate-bounce [animation-delay:-0.15s]"
          style={{
            backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
          }}
        ></div>
        <div
          className="h-8 w-8 rounded-full animate-bounce"
          style={{
            backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
          }}
        ></div>
      </div>
      <p className="text-lg mt-8">Loading</p>
    </div>

  ) : (
    // Main content (moment creation form)
    <main
      className="relative min-h-screen overflow-hidden bg-black"
      style={{
        background: "radial-gradient(circle at top left, #041420, #000000)",
      }}
    >
    <div className="container mx-auto max-w-2xl pt-32 pb-32">
      <div className="flex justify-center main-content gap-x-1 mb-20 w-full">
        <div className="w-full">
          <h4 className="text-3xl text-gray-200 font-medium mb-6">Create a Moment</h4>
          <div>
            <div className="mb-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-[300px] md:h-[500px] border-2 border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-700  hover:bg-gray-700/90"
                >
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  )}

                  {videoPreview && (
                    <video
                      src={videoPreview}
                      controls
                      className="w-full h-full object-contain rounded-xl"
                    />
                  )}

                  {!videoPreview && !imagePreview && (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg
                        className="w-8 h-8 mb-4 text-gray-200"
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
                      <p className="mb-2 text-base text-gray-200">
                        <span className="font-medium">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-sm text-gray-400 ">
                        JPG, PNG or GIF up to 8MB
                      </p>
                      <p className="text-sm text-gray-400 ">
                        MP4 up to 50MB
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
                className="block mb-2 text-gray-200 flex justify-between"
              >
                <div>Select a collection</div>
              </label>
              <div className="relative">
                <select
                  id="vault"
                  className="w-full px-3 py-2 rounded-md bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none"
                  value={vault?.name || ''} // show placeholder if vault is undefined
                  onChange={(e) => {
                    const selectedOption = vaultData.find(
                      (option) => option.name === e.target.value
                    );
                    setVault(selectedOption || undefined); // Update vault state
                  }}
                >
                  <option value="" disabled>
                    Select a collection
                  </option>
                  {vaultData.map((option, index) => (
                    <option key={index} value={option.name}>
                      {option.name}
                    </option>
                  ))}
                </select>
                {vault?.vaultMode !== undefined && (
                  <span
                    className={`absolute top-1/2 right-9 transform -translate-y-1/2 px-2 py-1 text-sm rounded-md ${
                      vault.vaultMode === 0
                        ? 'bg-gray-600 text-gray-200'
                        : 'bg-gray-800 text-gray-200'
                    }`}
                  >
                    {vault.vaultMode === 0 ? 'Public collection' : 'Private collection'}
                  </span>
                )}
              </div>
            </div>


            <div className="mb-4">
              <label
                htmlFor="headline"
                className="block mb-2 text-gray-200"
              >
                Moment title
              </label>
              <input
                id="headline"
                type="text"
                className="w-full px-3 py-2 rounded-md bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-200"
                placeholder="Enter moment title"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="description"
                className="block mb-2 text-gray-200"
              >
                Moment description
              </label>
              <textarea
                id="description"
                className="w-full px-3 py-2 min-h-[160px] rounded-md bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-200"
                placeholder="Enter description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* <div className="mb-4">
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
            </div> */}

            <div className="w-full flex justify-center">
              <button
                type="submit"
                disabled={uploading} // Disable button during submission
                onClick={handleMintMoment}
                className={`w-full py-3 rounded-lg px-6 shadow-md ${
                  uploading ? "bg-gray-600" : "bg-primary-600 hover:bg-primary-500"
                } text-gray-200 text-lg font-medium flex justify-center items-center`}
              >
                {uploading ? (
                  <span className="animate-spin h-5 w-5 border-4 border-t-transparent border-gray-200 rounded-full"></span>
                ) : (
                  "Create Moment"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
    </main>
  );
}
