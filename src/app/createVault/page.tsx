"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import Select, { MultiValue } from "react-select";
import { ethers } from "ethers";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers5/react";
import { getCategoryOptions } from "@/utils/format";
import { ERC725 } from "@erc725/erc725.js";
import LSP4DigitalAsset from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
import VaultFactoryABI from "@/artifacts/VaultFactory.json";
import toast, { Toaster } from "react-hot-toast";

interface FormValues {
  vaultName: string;
  metadataUriImage: File | null;
  metadataUriDescription: string;
  rewardAmount: number;
  vaultMode: number; // 1 for Private, 0 for Public
}

interface CategoryOption {
  value: number;
  label: string;
}

export default function CreateVault() {
  const [selectedCategories, setSelectedCategories] = useState<
    MultiValue<CategoryOption>
  >([]);
  const router = useRouter();
  const { walletProvider } = useWeb3ModalProvider();
  const [isDownloading, setIsDownloading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>({
    vaultName: "",
    metadataUriImage: null,
    metadataUriDescription: "",
    rewardAmount: 0,
    vaultMode: 1, // Default to Private
  });

  const categories = getCategoryOptions();
  const handleCategoryChange = (
    selectedOptions: MultiValue<CategoryOption>
  ) => {
    setSelectedCategories(selectedOptions);
  };

  const { address, isConnected } = useWeb3ModalAccount();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cid, setCid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const toggleAccordion = () => setIsAccordionOpen(!isAccordionOpen);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleVaultModeChange = (mode: number) => {
    setFormValues((prevState) => ({
      ...prevState,
      vaultMode: mode,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormValues((prevState) => ({
      ...prevState,
      metadataUriImage: file,
    }));

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true); // Start loading state

    try {
      const formData = new FormData();
      if (formValues.metadataUriImage && walletProvider) {
        formData.append("file", formValues.metadataUriImage);
        const res = await fetch("/api/vaultImageToIPFS", {
          method: "POST",
          body: formData,
        });
        const resData = await res.json();
        const categories = selectedCategories.map((category) => category.value);
        const ethersProvider = new ethers.providers.Web3Provider(
          walletProvider,
          "any"
        );
        const signer = ethersProvider.getSigner(address);
        setIsDownloading(false);
        const VaultFactoryContract = new ethers.Contract(
          process.env.NEXT_PUBLIC_VAULT_FACTORY_CONTRACT_ADDRESS as string,
          VaultFactoryABI.abi,
          signer
        );

        const tx = await VaultFactoryContract.createVault(
          formValues.vaultName,
          formValues.metadataUriDescription,
          resData.ipfsHash,
          formValues.rewardAmount,
          formValues.vaultMode,
          categories
        );
        console.log("tx", tx);
        console.log("Transaction sent:", tx.hash);

        // Wait for the transaction to be mined
        const receipt = await tx.wait();
        const vaultAddress = receipt.events[2].args[0];
        router.push("/myVaults/vault/" + vaultAddress);
        toast.success("Vault is created successfully!");
        setImagePreview(null);
        setIsDownloading(true);
      }
    } catch (err) {
      toast.error("An error occurred while creating the collection.");
      setIsDownloading(true);
    } finally {
      setIsSubmitting(false); // Stop loading state
    }
  };

  return !isDownloading ? (
    <div className="flex space-x-2 justify-center items-center h-[600px] dark:invert">
      <span className="sr-only">Loading...</span>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce"></div>
    </div>
    ) : (
      <main
        className="relative min-h-screen overflow-hidden bg-black text-gray-200"
        style={{
          background: "radial-gradient(circle at top left, #121212, #000000)",
        }}
      >
      <div className="container mx-auto max-w-2xl pt-32 pb-32">
        <div className="flex justify-center items-center">
          <div className="w-full">
            <h2 className="text-3xl font-medium mb-6">
              Select collection type
            </h2>
            <div className="grid grid-cols-2 gap-4 w-full mb-4">
              <button
                onClick={() => handleVaultModeChange(1)}
                className={`relative flex flex-col items-start p-4 rounded-lg shadow-md overflow-hidden ${
                  formValues.vaultMode === 1
                    ? "border-4 border-primary-500"
                    : "border-4 border-transparent hover:border-primary-400"
                }`}
                style={{
                  height: "240px",
                  backgroundImage: "url('/private_collection_header.jpg')",
                  opacity: 1.0,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              <span className="absolute text-gray-200 font-bold text-lg text-left bottom-3">
                Private Collection
              </span>
            </button>
            <button
              onClick={() => handleVaultModeChange(0)}
              className={`relative flex flex-col items-start p-4 rounded-lg shadow-md overflow-hidden ${
                formValues.vaultMode === 0
                  ? "border-2 border-primary-500"
                  : "border-2 border-transparent hover:border-primary-400"
              }`}
              style={{
                height: "240px",
                backgroundImage: "url('/public_collection_header.jpg')",
                opacity: 1.0,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              <span className="absolute bottom-3 text-gray-200 font-bold text-lg text-left">
                Public Collection
              </span>
            </button>
          </div>

            <button
              onClick={toggleAccordion}
              className="text-primary-500 underline hover:text-primary-400 text-base mb-4"
            >
              How do collections work?
            </button>
            {isAccordionOpen && (
              <div className="w-full text-gray-400 mb-4">
                <p className="mb-4 text-base">
                  <strong>Private Collections:</strong> Only you or authorized members
                  can view and contribute. Ideal for personal memories or close groups.
                  <br />
                  <strong>Public Collections:</strong> Open to the community for viewing
                  and contributions, great for sharing moments with a wider audience.
                </p>
                {/* <button
                  onClick={toggleAccordion}
                  className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-400"
                >
                  Got it
                </button> */}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block mb-2">Collection name</label>
                <input
                  type="text"
                  name="vaultName"
                  value={formValues.vaultName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter collection name"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Collection description</label>
                <textarea
                  name="metadataUriDescription"
                  value={formValues.metadataUriDescription}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-md bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Write a short description"
                  required
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block mb-2">Select a category</label>
                <Select
                  options={categories}
                  onChange={handleCategoryChange}
                  isMulti
                  value={selectedCategories}
                  styles={{
                    control: (base) => ({
                      ...base,
                      backgroundColor: "#374151", // Dark background
                      borderColor: "#4B5563", // Gray border
                      color: "#374151", // Gray-200
                      boxShadow: "none",
                      padding: "0.2rem", // Add padding inside the control
                      "&:hover": {
                        borderColor: "#7780FF", // Primary border on hover
                      },
                    }),
                    input: (base) => ({
                      ...base,
                      color: "#E5E7EB", // Gray-200 for input text
                    }),
                    option: (base, { isFocused, isSelected }) => ({
                      ...base,
                      backgroundColor: isSelected
                        ? "#3B82F6"
                        : isFocused
                        ? "#1f2937"
                        : "#111827", // Darker background for unselected
                      color: isSelected || isFocused ? "#E5E7EB" : "#D1D5DB",
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: "#7780FF", // Primary background for selected values
                      color: "#E5E7EB",
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: "#E5E7EB", // White text for selected labels
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: "#1f2937", // Dropdown background
                    }),
                  }}
                />
              </div>
              <div className="mb-4">
                <label className="block mb-2">Collection cover image</label>
                <input
                  type="file"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 rounded-md bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-4 rounded-md"
                  />
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting} // Disable button during submission
                className={`w-full py-3 rounded-lg px-6 shadow-md ${
                  isSubmitting ? "bg-gray-600" : "bg-primary-600 hover:bg-primary-500"
                } text-gray-200 text-lg font-medium flex justify-center items-center`}
              >
                {isSubmitting ? (
                  <span className="animate-spin h-5 w-5 border-4 border-t-transparent border-gray-200 rounded-full"></span>
                ) : (
                  "Create Collection"
                )}
              </button>
            </form>
          </div>
        </div>
      <Toaster />
      </div>
    </main>
  );
}
