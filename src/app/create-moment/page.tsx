"use client";

import { useState, useEffect, FormEvent, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { UPConnectionContext } from "@/contexts/UPConnectionContext";
import MomentFactoryABI from "@/artifacts/MomentFactory.json";
import { ERC725 } from "@erc725/erc725.js";
import MomentMetadataSchema from "@/schemas/MomentMetadataSchema.json";
import CollectionSchema from "@/schemas/CollectionSchema.json";
import LSP4DigitalAssetSchema from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
import { ethers } from "ethers";
import { pinata } from "@/utils/config";

// Constants
const MOMENT_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_MOMENT_FACTORY_ADDRESS_TESTNET!;

export default function CreateMoment() {
  const { provider, account } = useContext(UPConnectionContext);
  const router = useRouter();

  // Form State
  const [momentMetadata, setMomentMetadata] = useState({
    title: "",
    description: "",
    collection: "",
    media: null as File | null,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collections, setCollections] = useState<{ address: string; name: string }[]>([]);

  // useEffect(() => {
  //   if (provider && account) {
  //     fetchUserCollections();
  //   }
  // }, [provider, account]);

  // 🔹 Fetch Collections the User Owns
  const fetchUserCollections = useCallback(async () => {
    try {
      if (!provider || !account) return;

      const momentFactory = new ethers.Contract(
        MOMENT_FACTORY_ADDRESS,
        MomentFactoryABI.abi,
        provider
      );

      // Get collection addresses owned by user
      const collectionAddresses = await momentFactory.getCollectionsByOwner(account);
      console.log("User's Collections:", collectionAddresses);

      // Fetch metadata (title) for each collection
      const fetchedCollections = await Promise.all(
        collectionAddresses.map(async (address: string) => {
          try {
            const erc725 = new ERC725(
              CollectionSchema,
              address,
              "https://rpc.testnet.lukso.network/",
              { ipfsGateway: "https://api.universalprofile.cloud/ipfs" }
            );

            const metadata = await erc725.fetchData("CollectionMetadata");
            console.log(`Collection Metadata for ${address}:`, metadata);

            const metadataValue = metadata?.value;

            // Ensure it's an object and not an array or string
            if (
              typeof metadataValue !== "object" ||
              metadataValue === null ||
              Array.isArray(metadataValue)
            ) {
              console.warn("Unexpected metadata format:", metadataValue);
            }

            // If CollectionMetadata exists and is an object, use it
            const collectionData =
              metadataValue &&
              typeof metadataValue === "object" &&
              "CollectionMetadata" in metadataValue &&
              typeof metadataValue.CollectionMetadata === "object"
                ? metadataValue.CollectionMetadata
                : {}; // Fallback to an empty object

            console.log("Extracted CollectionMetadata:", collectionData);

            const title = collectionData.title || "Untitled Collection";
            return { address, name: title };
          } catch (error) {
            console.error(`Error fetching metadata for ${address}:`, error);
            return { address, name: "Unknown Collection" }; // Fallback
          }
        })
      );
      setCollections(fetchedCollections);
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  }, [provider, account]);

  useEffect(() => {
    fetchUserCollections();
  }, [fetchUserCollections]);

  // 🔹 Handle File Upload
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    setMomentMetadata((prev) => ({ ...prev, media: file }));

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // 🔹 Handle Input Changes
  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMomentMetadata((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Upload to Pinata (IPFS)
  const uploadToPinata = async (file: File): Promise<string> => {
    try {
      console.log("📤 Uploading file to Pinata...");

      const keyRequest = await fetch("/api/key");
      if (!keyRequest.ok) throw new Error("Failed to fetch JWT");
      const { JWT } = await keyRequest.json();

      const upload = await pinata.upload.file(file).key(JWT);
      console.log("✅ File uploaded to IPFS:", upload.IpfsHash);

      return `ipfs://${upload.IpfsHash}`;
    } catch (error) {
      console.error("❌ Pinata Upload Error:", error);
      throw new Error("Failed to upload to Pinata");
    }
  };

  // 🔹 Handle Form Submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!provider || !account) {
      toast.error("Please connect your wallet.");
      return;
    }

    if (!momentMetadata.media) {
      toast.error("Please upload an image or video.");
      return;
    }

    if (!momentMetadata.collection) {
      toast.error("Please select a collection.");
      return;
    }

    setIsSubmitting(true);

    try {
      const signer = await provider.getSigner(account);
      const recipient = account;
      const collectionUP = momentMetadata.collection;

      // 📤 Upload media to Pinata
      const mediaIpfsUrl = await uploadToPinata(momentMetadata.media);

      // 📜 Build Moment Metadata JSON
      const metadataJson = {
        MomentMetadata: {
          title: momentMetadata.title,
          description: momentMetadata.description,
          media: [
            {
              url: mediaIpfsUrl,
              type: momentMetadata.media.type,
            },
          ],
        },
      };

      // 📜 Build LSP4 Metadata JSON
      const metadataJson_LSP4 = {
        LSP4Metadata: {
          description: momentMetadata.description,
          assets: [
            {
              url: mediaIpfsUrl,
              type: momentMetadata.media.type,
            },
          ],
        },
      };

      // 📤 Upload metadata JSONs to Pinata
      const metadataBlob = new Blob([JSON.stringify(metadataJson)], { type: "application/json" });
      const metadataFile = new File([metadataBlob], "momentMetadata.json", { type: "application/json" });
      const metadataIpfsUrl = await uploadToPinata(metadataFile);

      const metadataBlob_LSP4 = new Blob([JSON.stringify(metadataJson_LSP4)], { type: "application/json" });
      const metadataFile_LSP4 = new File([metadataBlob_LSP4], "LSP4Metadata.json", { type: "application/json" });
      const metadataIpfsUrl_LSP4 = await uploadToPinata(metadataFile_LSP4);

      // 🔹 Encode Metadata using ERC725.js
      const erc725 = new ERC725([...MomentMetadataSchema, ...LSP4DigitalAssetSchema]);
      const encodedKeysAndValues = erc725.encodeData([
        {
          keyName: "MomentMetadata",
          value: {
            json: metadataJson,
            url: metadataIpfsUrl,
          },
        },
        {
          keyName: "LSP4Metadata",
          value: {
            json: metadataJson_LSP4,
            url: metadataIpfsUrl_LSP4,
          },
        },
      ]);

      console.log("Encoded keys and values:", encodedKeysAndValues);

      // 🎉 Mint Moment on Blockchain
      const momentFactory = new ethers.Contract(MOMENT_FACTORY_ADDRESS, MomentFactoryABI.abi, signer);
      const tx = await momentFactory.mintMoment(
        recipient,
        encodedKeysAndValues.values[0], // Moment metadata
        encodedKeysAndValues.values[1], // LSP4 metadata
        collectionUP // Collection address
      );

      console.log("Minting Transaction Sent:", tx.hash);
      await tx.wait();
      toast.success("Moment created successfully!");
      router.push(`/collections/${collectionUP}`);
    } catch (error) {
      console.error("❌ Error minting moment:", error);
      toast.error("Failed to create moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto max-w-2xl px-6 py-12 bg-gray-900 text-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-6">Create a New Moment</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Collection Selection */}
        <div>
          <label className="block mb-2 font-medium">Select Collection</label>
          <select
            name="collection"
            value={momentMetadata.collection}
            onChange={handleMetadataChange}
            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring focus:ring-blue-500"
            required
          >
            <option value="">-- Select a Collection --</option>
            {collections.map((collection) => (
              <option key={collection.address} value={collection.address}>
                {collection.name} {/* Show Collection Name */}
              </option>
            ))}
          </select>
        </div>

        {/* Moment Details */}
        <div>
          <label className="block mb-2 font-medium">Title</label>
          <input
            type="text"
            name="title"
            value={momentMetadata.title}
            onChange={handleMetadataChange}
            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">Description</label>
          <textarea
            name="description"
            value={momentMetadata.description}
            onChange={handleMetadataChange}
            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring focus:ring-blue-500"
            required
          ></textarea>
        </div>

        {/* File Upload */}
        <div>
          <label className="block mb-2 font-medium">Upload Media (Image/Video)</label>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleMediaChange}
            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring focus:ring-blue-500"
            required
          />
          {imagePreview && <img src={imagePreview} alt="Preview" className="mt-4 w-full rounded-md" />}
        </div>
        
        {/* Submit Button */}
        <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-500">
          {isSubmitting ? "Creating..." : "Create Moment"}
        </button>
      </form>
    </main>
  );
}
