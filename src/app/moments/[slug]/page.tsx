"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import { useParams } from "next/navigation";
import { UPConnectionContext } from "@/contexts/UPConnectionContext";
import { ethers } from "ethers";
import { ERC725 } from "@erc725/erc725.js";
import MomentMetadataSchema from "@/schemas/MomentMetadataSchema.json";
import Image from "next/image";

interface MomentData {
  title: string;
  description: string;
  image: string;
  tags: string[];
  //owner: string;
}

export default function MomentPage() {
  const { slug } = useParams() as { slug: string };
  const { provider } = useContext(UPConnectionContext);
  const [moment, setMoment] = useState<MomentData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Convert IPFS URL to HTTP Gateway
  const convertIpfsToGatewayUrl = (ipfsUrl: string): string => {
    if (!ipfsUrl) return "/fallback-image.jpg";
    return ipfsUrl.replace("ipfs://", "https://api.universalprofile.cloud/ipfs/");
  };

  // Fetch Moment Data
  const fetchMomentData = useCallback(async () => {
    try {
      if (!provider) {
        console.error("No provider available");
        return;
      }

      console.log("Fetching data for moment:", slug);

      // Initialize ERC725.js for the moment
      const erc725js = new ERC725(
        MomentMetadataSchema,
        slug,
        "https://rpc.testnet.lukso.network/",
        { ipfsGateway: "https://api.universalprofile.cloud/ipfs" }
      );

      // Fetch moment metadata
      const momentMetadata = await erc725js.fetchData("MomentMetadata");
      console.log(`Moment Metadata for ${slug}:`, momentMetadata);

      // Extract metadata
      const momentDataValue = momentMetadata?.value;

      if (
        typeof momentDataValue !== "object" ||
        momentDataValue === null ||
        Array.isArray(momentDataValue)
      ) {
        console.warn("Unexpected metadata format:", momentDataValue);
        return;
      }

      // If MomentMetadata exists and is an object, use it
      const momentData =
      momentDataValue &&
      typeof momentDataValue === "object" &&
      "MomentMetadata" in momentDataValue &&
      typeof momentDataValue.MomentMetadata === "object"
        ? momentDataValue.MomentMetadata
        : {}; // Fallback to an empty object

      console.log("Extracted MomentMetadata:", momentData);

      const title = momentData.title || "Untitled Moment";
      const description = momentData.description || "No description available.";
      const tags = momentData.tags || [];
      const image = momentData.images?.[0]?.url || null;

      // Convert IPFS URL
      const imageUrl = image ? convertIpfsToGatewayUrl(image) : "/logo-icon-400.svg";

      setMoment({
        title,
        description,
        tags,
        image: imageUrl,
        //owner: momentMetadata?.owner || "Unknown Owner",
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading moment:", error);
      setIsLoading(false);
    }
  }, [provider, slug]);

  useEffect(() => {
    fetchMomentData();
  }, [fetchMomentData]);

  if (isLoading) {
    return <div className="text-gray-300 text-center mt-10">Loading moment...</div>;
  }

  if (!moment) {
    return <div className="text-gray-300 text-center mt-10">Moment not found.</div>;
  }

  return (
    <main 
      className="flex flex-col items-center justify-center min-h-screen bg-black text-gray-200"
      style={{ background: "radial-gradient(circle at top left, #041420, #000000)" }}
    >
      {/* Moment Details */}
      <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg w-full max-w-3xl">
        {/* Image */}
        <div className="mb-4">
          <Image
            src={moment.image}
            alt={moment.title}
            width={600}
            height={400}
            className="w-full h-96 object-cover rounded-md"
          />
        </div>

        {/* Title & Description */}
        <h1 className="text-3xl font-bold">{moment.title}</h1>
        <p className="text-gray-400 mt-2">{moment.description}</p>

        {/* Owner Info */}
        <p className="text-gray-500 text-sm mt-4">Owner: {moment.owner}</p>

        {/* Tags */}
        <div className="mt-4 flex gap-2">
          {moment.tags.map((tag, index) => (
            <span key={index} className="bg-blue-600 text-white text-xs px-3 py-1 rounded-lg">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
