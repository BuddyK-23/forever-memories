"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import Select, { MultiValue } from "react-select";
import { ethers } from "ethers";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers5/react";
import { ERC725 } from "@erc725/erc725.js";
import LSP4DigitalAsset from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
import VaultFactoryABI from "@/artifacts/VaultFactory.json";

interface FormValues {
  vaultName: string;
  metadataUriImage: File | null;
  metadataUriDescription: string;
  rewardAmount: number;
  vaultMode: number; // 1 for Private, 0 for Public
  firstMemberAddress: string; // New field for the first member address
}

interface CategoryOption {
  value: number;
  label: string;
}

const Categories: CategoryOption[] = [
  { value: 1, label: "Art & Creativity" },
  { value: 2, label: "Celebrity & Influencer" },
  { value: 3, label: "Culture" },
  { value: 4, label: "Daily Selfie" },
  { value: 5, label: "Environment & Nature" },
  { value: 6, label: "Fashion" },
  { value: 7, label: "Festivals & Events" },
  { value: 8, label: "Food & Drink" },
  { value: 9, label: "Funny" },
  { value: 10, label: "Historical" },
  { value: 11, label: "Humanity" },
  { value: 12, label: "Innovation & Technology" },
  { value: 13, label: "Journalism" },
  { value: 14, label: "Lifestyle & Fitness" },
  { value: 15, label: "Memorial" },
  { value: 16, label: "Music" },
  { value: 17, label: "Pets" },
  { value: 18, label: "Photography" },
  { value: 19, label: "Politics" },
  { value: 20, label: "Science" },
  { value: 21, label: "Sport" },
  { value: 22, label: "Time Capsule" },
  { value: 23, label: "Travel & Adventure" },
  { value: 24, label: "2024" },
  { value: 25, label: "2025" },
];

export default function CreateVault() {
  const [selectedCategories, setSelectedCategories] = useState<MultiValue<CategoryOption>>([]);
  const { walletProvider } = useWeb3ModalProvider();
  const [formValues, setFormValues] = useState<FormValues>({
    vaultName: "",
    metadataUriImage: null,
    metadataUriDescription: "",
    rewardAmount: 0,
    vaultMode: 1, // Default to Private
    firstMemberAddress: "",
  });

  const handleCategoryChange = (selectedOptions: MultiValue<CategoryOption>) => {
    setSelectedCategories(selectedOptions);
  };

  const { address, isConnected } = useWeb3ModalAccount();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [cid, setCid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    try {
      const formData = new FormData();

      if (formValues.metadataUriImage && walletProvider) {
        formData.append("file", formValues.metadataUriImage);
        const res = await fetch("/api/vaultImageToIPFS", {
          method: "POST",
          body: formData,
        });

        const resData = await res.json();
        const categories = selectedCategories.map(category => category.value);

        const ethersProvider = new ethers.providers.Web3Provider(
          walletProvider,
          "any"
        );
        const signer = ethersProvider.getSigner(address);

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
          formValues.vaultMode == 1 ? formValues.firstMemberAddress : address,
          categories
        );

        console.log("tx", tx);
      }

      alert("Vault is created successfully!");
      setImagePreview(null);
    } catch (err) {
      setError("An error occurred while creating the vault.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-2xl font-bold mb-6">Create the Vault</h1>
      {!cid ? (
        ""
      ) : (
        <img className={`carousel-item w-full h-[584px]`} src={cid} alt="" />
      )}

      <div className="w-full max-w-lg">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <div className="mb-4">
          <label className="block text-gray-700">Metadata URI Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Image preview"
              className="mt-2 h-40 w-full object-cover rounded-md"
            />
          )}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Vault Name</label>
          <input
            type="text"
            name="vaultName"
            value={formValues.vaultName}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Reward Amount</label>
          <input
            type="number"
            name="rewardAmount"
            value={formValues.rewardAmount}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div className="mb-4">
          <div className="flex w-full text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <div className="w-full border-b border-gray-200 rounded-t-lg dark:border-gray-600">
              <div className="flex items-center ps-3">
                <input
                  id="list-radio-private"
                  type="radio"
                  value={1}
                  name="vaultMode"
                  checked={formValues.vaultMode === 1}
                  onChange={() => handleVaultModeChange(1)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                />
                <label
                  htmlFor="list-radio-private"
                  className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                  Private
                </label>
              </div>
            </div>
            <div className="w-full border-b border-gray-200 rounded-t-lg dark:border-gray-600">
              <div className="flex items-center ps-3">
                <input
                  id="list-radio-public"
                  type="radio"
                  value={0}
                  name="vaultMode"
                  checked={formValues.vaultMode === 0}
                  onChange={() => handleVaultModeChange(0)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                />
                <label
                  htmlFor="list-radio-public"
                  className="w-full py-3 ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
                >
                  Public
                </label>
              </div>
            </div>
          </div>
        </div>

        {formValues.vaultMode === 1 && (
          <div className="mb-4">
            <label className="block text-gray-700">First Member Address</label>
            <input
              type="text"
              name="firstMemberAddress"
              value={formValues.firstMemberAddress}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
        )}



        <div className="mb-4">
          <label className="block text-gray-700">
            Metadata URI Description
          </label>
          <textarea
            name="metadataUriDescription"
            value={formValues.metadataUriDescription}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Select Categories
          </label>
          <Select
            options={Categories}
            onChange={handleCategoryChange}
            isMulti
            value={selectedCategories}
          />
        </div>

        <button
          type="submit"
          onClick={handleSubmit}
          className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700"
        >
          Create Vault
        </button>
      </div>
    </main>
  );
}
