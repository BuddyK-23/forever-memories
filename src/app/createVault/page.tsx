"use client";

import { useState, FormEvent } from "react";
import { ethers } from "ethers";
import { ERC725 } from "@erc725/erc725.js";
import LSP4DigitalAsset from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";

interface FormValues {
  vaultName: string;
  vaultSymbol: string;
  vaultOwner: string;
  metadataUriImage: File | null;
  metadataUriHeadline: string;
  metadataUriDescription: string;
  rewardAmount: number;
}

export default function CreateVault() {
  const [formValues, setFormValues] = useState<FormValues>({
    vaultName: "",
    vaultSymbol: "",
    vaultOwner: "",
    metadataUriImage: null,
    metadataUriHeadline: "",
    metadataUriDescription: "",
    rewardAmount: 0,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
    // Here you can add the logic to handle form submission
    try {
      const formData = new FormData();

      if (formValues.metadataUriImage) {
        formData.append("file", formValues.metadataUriImage);
        const res = await fetch("/api/uploadAssetsToIPFS", {
          method: "POST",
          body: formData,
        });

        const resData = await res.json();
        // setCid(resData.ipfsHash);
        console.log("resData.ipfsHash", resData.ipfsHash);

        const erc725 = new ERC725(LSP4DigitalAsset, "", "", {});
        const lsp8CollectionMetadata = {
          LSP4Metadata: {
            name: formValues.vaultName,
            headline: formValues.metadataUriHeadline,
            description: formValues.metadataUriDescription,
            links: [],
            icons: [],
            images: [],
            assets: [],
            attributes: [],
          },
        };
        const lsp8CollectionMetadataCID = resData.ipfsHash;
        const encodeLSP8Metadata = erc725.encodeData([
          {
            keyName: "LSP4Metadata",
            value: {
              json: lsp8CollectionMetadata,
              url: lsp8CollectionMetadataCID,
            },
          },
        ]);
        console.log("encodeLSP8Metadata", encodeLSP8Metadata.values[0]);
      }

      formData.append("vaultName", formValues.vaultName);
      formData.append("vaultSymbol", formValues.vaultSymbol);
      formData.append("vaultOwner", formValues.vaultOwner);
      formData.append("rewardAmount", formValues.rewardAmount.toString());

      // Placeholder for form submission logic

      console.log("Form submitted:", formValues);
      // Reset form values after submission
      // setFormValues({
      //   vaultName: '',
      //   vaultSymbol: '',
      //   vaultOwner: '',
      //   metadataUriImage: null,
      //   metadataUriHeadline: '',
      //   metadataUriDescription: '',
      //   rewardAmount: 0,
      // });
      // setImagePreview(null);
    } catch (err) {
      setError("An error occurred while creating the vault.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-2xl font-bold mb-6">Create Vault</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-lg">
        {error && <p className="text-red-500 mb-4">{error}</p>}
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
          <label className="block text-gray-700">Vault Symbol</label>
          <input
            type="text"
            name="vaultSymbol"
            value={formValues.vaultSymbol}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Vault Owner</label>
          <input
            type="text"
            name="vaultOwner"
            value={formValues.vaultOwner}
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
          <label className="block text-gray-700">Metadata</label>
          <div className="p-4 border border-gray-300 rounded-md">
            <div className="mb-4">
              <label className="block text-gray-700">Image</label>
              <input
                type="file"
                name="metadataUriImage"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="mt-4 w-full h-auto"
                />
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700">Headline</label>
              <input
                type="text"
                name="metadataUriHeadline"
                value={formValues.metadataUriHeadline}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Description</label>
              <textarea
                name="metadataUriDescription"
                value={formValues.metadataUriDescription}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-500 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Create Vault
        </button>
      </form>
    </main>
  );
}
