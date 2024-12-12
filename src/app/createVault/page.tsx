"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { AiOutlinePlusCircle } from "react-icons/ai";
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
          background: "radial-gradient(circle at top left, #041420, #000000)",
        }}
      >
      <div className="container mx-auto max-w-2xl pt-32 pb-[500px]">
        <div className="flex justify-center items-center">
          <div className="w-full">
            <h2 className="text-3xl font-medium mb-6">
              Create a new collection
            </h2>
            <label className="block mb-2">Choose type:</label>
            <div className="grid grid-cols-2 gap-4 w-full mb-4">
              <button
                onClick={() => handleVaultModeChange(1)}
                className={`relative flex flex-col items-start p-4 rounded-lg shadow-md overflow-hidden ${
                  formValues.vaultMode === 1
                    ? "border-4 border-primary-500"
                    : "border-4 border-transparent hover:border-primary-400"
                }`}
                style={{
                  height: "160px",
                  // backgroundImage: "url('/private_collection_header.jpg')",
                  opacity: 1.0,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundColor: "#111827",
                }}
              >
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
              <span className="absolute text-gray-200 font-bold text-xl text-left bottom-3">
                Private Collection
              </span>
            </button>
            <button
              onClick={() => handleVaultModeChange(0)}
              className={`relative flex flex-col items-start p-4 rounded-lg shadow-md overflow-hidden ${
                formValues.vaultMode === 0
                  ? "border-4 border-primary-500"
                  : "border-4 border-transparent hover:border-primary-400"
              }`}
              style={{
                height: "160px",
                // backgroundImage: "url('/public_collection_header.jpg')",
                opacity: 1.0,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundColor: "#111827",
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
              className="text-primary-600 underline hover:text-primary-500 text-base mb-4"
            >
              How do collections work?
            </button>

            {isAccordionOpen && (
              <div className="container flex flex-col pb-10 text-gray-200">
                {/* Main Title */}
                <div className="flex text-base mb-4 text-left max-w-[800px] mx-auto">Collections are at the heart of the Forever Moments ecosystem. Simply put, they group Moments together. Collections can be private, for you or a group; or public, where anyone can join and contribute.</div>
                    
                {/* Two Columns for Private and Public Collections */}
                <div className="flex flex-col gap-4">
                  {/* Private Collections */}
                  <div className="p-6 bg-gray-900/80 rounded-lg shadow-sm-light border border-gray-800/70">
                    <h2 className="text-xl font-medium mb-2">Private Collections</h2>
                    <p className="text-base mb-4">Totally private, just for you or invite a select group of members.</p>
                    <div className="mb-4">
                      <h3 className="text-base pb-2 font-medium">Best for:</h3>
                      <ul className="list-disc pl-4 space-y-2 text-base">
                        <li>Family photo albums shared securely among loved ones</li>
                        <li>Collaborative workspaces for community or team projects and milestones</li>
                        <li>Personal journals or time capsules to pass down legacies</li>
                      </ul>
                    </div>
                  </div>
              
                  {/* Public Collections */}
                  <div className="p-6 bg-gray-900/80 rounded-lg shadow-sm-light border border-gray-800/70">
                    <h2 className="text-xl font-medium mb-2">Public Collections</h2>
                    <p className="text-base mb-4">Open to everyone, anyone can join and contribute.</p>
                    <div className="mb-4">
                      <h3 className="text-base pb-2 font-medium">Some ideas:</h3>
                      <ul className="list-disc pl-4 space-y-2 text-base">
                        <li>Digital time capsules that anyone can view and contribute to</li>
                        <li>Community collaboration hubs</li>
                        <li>Crowdsourced legacy projects for public causes or shared history logging</li>
                      </ul>
                    </div>
                    
                  </div>
                </div>
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
              <div className="flex flex-col mx-auto max-w-[500px] text-center">
                <p className="text-sm text-gray-500 mt-8">Please check all details carefully before proceeding. By creating this collection, you agree to our terms and conditions.</p>
                {/* <p className="text-sm text-gray-500 mt-2">Legal text here, Link to privacy policy. This app is in beta.</p> */}
              </div>
            </form>
          </div>
        </div>
      <Toaster />
      </div>
    </main>
  );
}
