"use client";
import React, { useEffect, useState, useContext, useCallback } from "react";
import { ethers } from "ethers";
import { ERC725 } from "@erc725/erc725.js";
import LSP4DigitalAssetSchema from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
import LSP3ProfileSchema from "@erc725/erc725.js/schemas/LSP3ProfileMetadata.json";
import { MomentFactory__factory } from "@/typechain-types";
import { UPConnectionContext } from "@/contexts/UPConnectionContext";
import CollectionSchema from "@/schemas/CollectionSchema.json";
import CollectionCard from "@/components/CollectionCard";
import axios from "axios";

interface Collection {
  title: string;
  description: string;
  image: string;
  owner: string;
  collectionUP: string;
}

export default function Collections() {
  const { provider, account } = useContext(UPConnectionContext);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const momentFactoryAddress = "0x5B1c49c322B45637765D2389D6704B5cDfc92345";

  // Fetch collections metadata
  const fetchCollections = useCallback(async () => {
    if (!provider || !momentFactoryAddress) {
      console.error("Provider or contract address is not available.");
      setIsLoading(false);
      return;
    }
  
    try {
      // Connect to the MomentFactory contract
      const momentFactory = MomentFactory__factory.connect(momentFactoryAddress, provider);

      // Get all collection addresses
      const collectionAddresses = await momentFactory.getAllCollections();
      console.log("All collections:", collectionAddresses);
  
      //Fetch total number of collections
      const totalCollections = await momentFactory.getTotalCollections();
      console.log(`Total collections: ${totalCollections}`);

      const fetchedCollections: Collection[] = [];
  
      for (const collectionAddress of collectionAddresses) {
        console.log(`Fetching metadata for collection: ${collectionAddress}`);
  
        // Initialize ERC725.js for the current collection
        const erc725js = new ERC725(
          [...CollectionSchema, ...LSP3ProfileSchema],
          collectionAddress,
          "https://rpc.testnet.lukso.network/",
          { ipfsGateway: "https://api.universalprofile.cloud/ipfs" }
        );
  
        try {
          // Fetch metadata for the collection
          // const metadata = await erc725js.fetchData();
          // console.log(`Metadata for collection ${collectionAddress}:`, metadata);
  
          const collectionMetadata = await erc725js.fetchData('CollectionMetadata');
          console.log(`Collection Metadata for ${collectionAddress}:`, collectionMetadata);

          const collectionData = collectionMetadata?.value;

          if (!collectionData) {
            console.warn(`No valid Collection Metadata for collection ${collectionAddress}`);
            continue; // Skip this collection if no valid data is found
          }

          // Build the collection card data
          fetchedCollections.push({
            title: collectionData?.CollectionMetadata?.title || "Untitled Collection",
            description: collectionData?.CollectionMetadata?.description || "No description available.",
            image: collectionData?.CollectionMetadata?.images ? collectionData.CollectionMetadata?.images[0]?.url : "",
            owner: account || "Unknown Owner",
            collectionUP: collectionAddress,
          });

        } catch (error) {
          console.error(`Error fetching metadata for collection ${collectionAddress}:`, error);
        }
      }
      setCollections(fetchedCollections);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching collections:", error);
      setIsLoading(false);
    }
  }, [provider, momentFactoryAddress, account]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  if (isLoading) {
    return <div>Loading collections...</div>;
  }

  if (collections.length === 0) {
    return <div>No collections found.</div>;
  }

  return (
    <main 
      className="flex flex-col justify-center items-center bg-black h-screen text-gray-200"
      style={{
        background: "radial-gradient(circle at top left, #041420, #000000)",
      }}
    >

      <div className="container mx-auto max-w-6xl py-24 lg:py-32 px-4 lg:px-0 flex flex-col lg:gap-6">
        <h1 className="text-2xl font-bold mb-4">Collections</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection, index) => (
            <CollectionCard
              key={index}
              title={collection.title}
              description={collection.description}
              image={collection.image}
              owner={collection.owner}
              link={`/collections/${collection.collectionUP}`} // Navigate to collection details
            />
          ))}
        </div>    
      </div>      
    </main>
  );
}
