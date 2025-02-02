"use client";

import { useState, useEffect, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import { UPConnectionContext } from "@/contexts/UPConnectionContext";
import { ERC725 } from "@erc725/erc725.js";
import LSP3ProfileSchema from "@erc725/erc725.js/schemas/LSP3ProfileMetadata.json";
import CollectionSchema from "@/schemas/CollectionSchema.json";
import MomentMetadataSchema from "@/schemas/MomentMetadataSchema.json";
import MomentFactoryABI from "@/artifacts/MomentFactory.json";
import MomentCard from "@/components/MomentCard";
import Link from "next/link";
import Image from "next/image";

interface Moment {
  title: string;
  description: string;
  image: string;
  owner: string;
  address: string;
}

const MOMENT_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_MOMENT_FACTORY_ADDRESS_TESTNET!;

export default function CollectionPage({ params }: { params: { slug: string } }) {
  const { slug } = useParams();
  const { provider, account } = useContext(UPConnectionContext);
  const collectionUP = slug as string;
  const router = useRouter();
  
  // Collection State
  const [collection, setCollection] = useState({
    title: "",
    description: "",
    tags: [] as string[],
    imageUrl: "",
    owner: "",
  });

  // Moments in the Collection
  const [moments, setMoments] = useState<Moment[]>([]);
  

  // Convert the IPFS URL to an HTTP-accessible URL
  const convertIpfsToGatewayUrl = (ipfsUrl: string): string => {
    if (!ipfsUrl) return "/fallback-image.jpg";
    return ipfsUrl.replace("ipfs://", "https://api.universalprofile.cloud/ipfs/");
  };

  // useEffect(() => {
  //   if (provider) {
  //     fetchCollectionData();
  //   }
  // }, [provider, fetchCollectionData]);

  //const fetchCollectionData = async () => {
  const fetchCollectionData = useCallback(async () => {
    try {
      if (!provider) {
        console.error("No provider available");
        return;
      }

      console.log("Fetching data for collection:", collectionUP);
      
      // Load Collection Factory Contract
      const momentFactory = new ethers.Contract(
        MOMENT_FACTORY_ADDRESS,
        MomentFactoryABI.abi,
        provider
      );

      // Fetch Collection Owner
      const owner = account;
      console.log("Collection Owner:", owner);

      // Initialize ERC725.js for the current collection
      const erc725js = new ERC725(
        [...CollectionSchema, ...LSP3ProfileSchema],
        collectionUP,
        "https://rpc.testnet.lukso.network/",
        { ipfsGateway: "https://api.universalprofile.cloud/ipfs" }
      );

      // Fetch data for 'CollectionMetadata' key
      const collectionMetadata = await erc725js.fetchData("CollectionMetadata");
      console.log(`Collection Metadata for ${collectionUP}:`, collectionMetadata);

      const collectionData = collectionMetadata?.value;

      if (!collectionData) {
        console.warn(`No valid collection data for collection ${collectionUP}`);
      }

      const title = collectionData?.CollectionMetadata?.title || "Untitled Collection";
      const description = collectionData?.CollectionMetadata?.description || "No description provided.";
      const tags = collectionData?.CollectionMetadata?.tags || [];
      const image = collectionData?.CollectionMetadata?.images ? collectionData.CollectionMetadata?.images[0]?.url : null; 

      // Convert the image IPFS URI
      const imageUrl = image ? convertIpfsToGatewayUrl(image) : "/logo-icon-400.svg";

      setCollection({ title, description, tags, imageUrl, owner });

      const momentAddressesRaw = await momentFactory.getMomentsInCollection(collectionUP);
      const momentAddresses = Array.isArray(momentAddressesRaw) ? [...momentAddressesRaw] : [];
      console.log("Moment Addresses:", momentAddresses);

      const fetchedMoments: Moment[] = [];

      for (const momentAddressRaw of momentAddresses) {
        const momentAddress = "0x" + momentAddressRaw.slice(-40); // Trim leading zeros

        if (!ethers.isAddress(momentAddress)) {
          console.warn(`Skipping invalid moment address: ${momentAddress}`);
          continue;
        }

        console.log(`Fetching metadata for moment: ${momentAddress}`);
  
        // Initialize ERC725.js for the current moment
        const erc725js = new ERC725(
          MomentMetadataSchema,
          momentAddress,
          "https://rpc.testnet.lukso.network/",
          { ipfsGateway: "https://api.universalprofile.cloud/ipfs" }
        );
  
        try {
          // Fetch metadata for the moment
          const momentMetadata = await erc725js.fetchData('MomentMetadata');
          console.log(`Moment Metadata for ${momentAddress}:`, momentMetadata);

          const momentData = momentMetadata?.value;

          if (!momentData) {
            console.warn(`No valid MomentMetadata data for moment ${momentAddress}`);
            continue; // Skip this collection if no valid data is found
          }

          // Build the Moment card data
          fetchedMoments.push({
            title: momentData?.MomentMetadata?.title || "Untitled Collection",
            description: momentData?.MomentMetadata?.description || "No description available.",
            image: momentData?.MomentMetadata?.images ? momentData.MomentMetadata?.images[0]?.url : null,
            owner: account || "Unknown Owner",
            address: momentAddress,
            link: `/moments/${momentAddress}`,
          });
        } catch (error) {
          console.error(`Error fetching metadata for moment ${momentAddress}:`, error);
        }
      }
      setMoments(fetchedMoments);
    } catch (error) {
      console.error("Error loading collection:", error);
    }
  }, [provider, collectionUP, account]); // ✅ Dependencies added

  const fetchUserCollections = useCallback(() => {
    fetchCollectionData();
  }, [fetchCollectionData]);

  useEffect(() => {
    fetchUserCollections();
  }, [fetchUserCollections]);

  return (
    <main 
      className="flex flex-col justify-center items-center bg-black h-screen text-gray-200"
      style={{
        background: "radial-gradient(circle at top left, #041420, #000000)",
      }}
    >
      

      {/* Animated Balls */}
      {/* <div className="animated-balls">
        <div className="ball ball1"></div>
        <div className="ball ball2"></div>
        <div className="ball ball3"></div>
      </div> */}

      {/* Collection Header */}
      <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center gap-4">
          {/* Image Section */}
            <Image
              src={collection.imageUrl}
              alt={collection.title || "Untitled Collection"} // Provide a fallback title
              width={300}
              height={200}
              className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity duration-300"
            />
          {/* {collection.image && <img src={collection.image} className="w-16 h-16 rounded-full" alt="Collection Cover" />} */}
          <div>
            <h1 className="text-3xl font-bold">{collection.title}</h1>
            <p className="text-gray-400">{collection.description}</p>
            <p className="text-gray-500 text-sm">Owner: {collection.owner}</p>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="mt-4 flex gap-2">
        {collection.tags.map((tag, index) => (
          <span key={index} className="bg-blue-600 text-white text-xs px-3 py-1 rounded-lg">
            {tag}
          </span>
        ))}
      </div>

      {/* Moments in Collection */}
      <section className="mt-6">
        <h2 className="text-2xl font-semibold mb-4">Moments</h2>
        {moments.length === 0 ? (
          <div className="text-gray-400">No moments in this collection yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {moments.map((moment, index) => (
            <MomentCard
              key={index}
              title={moment.title}
              description={moment.description}
              image={moment.image}
              owner={moment.owner}
              address={moment.address}
              link={`/moments/${moment.address}`} // Navigate to moment details
            />
          ))}
          </div>
        )}
      </section>

      {/* Add Moment Button */}
      <div className="mt-6">
        <Link href={`/addMoment?collection=${collectionUP}`}>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg">
            Add a Moment
          </button>
        </Link>
      </div>
    </main>
  );
}
