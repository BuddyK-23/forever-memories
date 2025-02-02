"use client";

import { useState, FormEvent, useContext } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { UPConnectionContext } from "@/contexts/UPConnectionContext";
import MomentFactoryABI from "@/artifacts/MomentFactory.json";
import { pinata } from "@/utils/config";
import CollectionSchema from "@/schemas/CollectionSchema.json";

// libs
import { AbiCoder, Contract, ethers, keccak256 } from 'ethers';
import { ERC725 } from '@erc725/erc725.js';

// LSPs Smart Contracts artifacts
import LSP23FactoryArtifact from '@lukso/lsp-smart-contracts/artifacts/LSP23LinkedContractsFactory.json';
import UniversalProfileInitArtifact from '@lukso/lsp-smart-contracts/artifacts/UniversalProfileInit.json';

// ERC725.js schemas
import LSP1UniversalReceiverDelegateSchemas from '@erc725/erc725.js/schemas/LSP1UniversalReceiverDelegate.json';
import LSP3ProfileMetadataSchemas from '@erc725/erc725.js/schemas/LSP3ProfileMetadata.json';
import LSP6KeyManagerSchemas from '@erc725/erc725.js/schemas/LSP6KeyManager.json';

const LSP23_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_LSP23_FACTORY_ADDRESS_TESTNET!;
const MOMENT_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_MOMENT_FACTORY_ADDRESS_TESTNET!;
const UNIVERSAL_PROFILE_IMPLEMENTATION_ADDRESS = process.env.NEXT_PUBLIC_UP_IMPLEMENTATION_ADDRESS_TESTNET!;
const LSP23_POST_DEPLOYMENT_MODULE_ADDRESS = process.env.NEXT_PUBLIC_LSP23_POST_DEPLOYMENT_MODULE_ADDRESS_TESTNET!;
const LSP6_KEY_MANAGER_IMPLEMENTATION_ADDRESS = process.env.NEXT_PUBLIC_LSP6_IMPLEMENTATION_ADDRESS_TESTNET!;
const LSP1_UNIVERSAL_RECEIVER_ADDRESS = process.env.NEXT_PUBLIC_LSP1_UNIVERSAL_RECEIVER_ADDRESS_TESTNET!;

export default function CreateCollection() {
  const { provider, account } = useContext(UPConnectionContext);
  const router = useRouter();
  const [collectionMetadata, setCollectionMetadata] = useState({
    title: "", // Used for LSP3 `name`
    description: "", // Used for LSP3 `description`
    categories: "", // Used for both CollectionMetadata & LSP3 `tags`
    tags: "", // Used for both CollectionMetadata & LSP3 `tags`
    website: "", // Used for LSP3 `links`
    visibility: "public", // Collection-specific
    incentiveAmount: 10, // Collection-specific
    incentiveCurrency: "LXY", // Collection-specific
    ownerTakeRate: 10, // Collection-specific
    userJoinCost: 5, // Collection-specific
    image: null as File | null, // Used for LSP3 `profileImage` & `backgroundImage`
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateSalt = (userAddress: string) => {
    const timestamp = Date.now().toString();
    return keccak256(new TextEncoder().encode(userAddress + timestamp));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      console.error("❌ No file selected.");
      return;
    }

    console.log("✅ File selected:", file.name);
    setImage(file);
    setCollectionMetadata((prev) => ({ ...prev, image: file }));

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCollectionMetadata((prev) => ({ ...prev, [name]: value }));
  };

  const uploadToPinata = async (file: File): Promise<string> => {
    try {
      console.log("📤 Attempting to upload to Pinata...");

      const keyRequest = await fetch("/api/key");
      console.log("🔑 JWT Request Sent...");

      if (!keyRequest.ok) {
        throw new Error(`❌ Failed to fetch JWT. Status: ${keyRequest.status}`);
      }

      const { JWT } = await keyRequest.json();
      console.log("✅ JWT Received:", JWT);

      const upload = await pinata.upload.file(file).key(JWT);
      console.log("✅ Pinata Upload Response:", upload);

      return upload.IpfsHash;
    } catch (error) {
      console.error("❌ Pinata Upload Error:", error);
      throw new Error("Failed to upload file to Pinata");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("🚀 handleSubmit triggered!"); // ✅ Debugging output

    // Debugging provider and account
    console.log("provider:", provider);
    console.log("account:", account);
    if (!provider || !account) {
      toast.error("Please connect your wallet.");
      return;
    }
    console.log("Provider check done");

    if (!collectionMetadata.image) {
      toast.error("Please upload an image.");
      console.error("❌ No image selected!");
      return;
    }
    console.log("✅ Image is selected:", collectionMetadata.image.name);

    // setIsSubmitting(true);
    // console.log("⏳ Form is submitting...");

    try {
      console.log("🔹 Getting signer from provider...");
      const signer = await provider.getSigner(account);
      const controllerAddress = await signer.getAddress();
      console.log("✅ Signer retrieved:", signer);
      console.log("✅ Controller address:", controllerAddress);



      // Upload Image to Pinata
      console.log("📤 Uploading image to Pinata...");
      const imageHash = await uploadToPinata(collectionMetadata.image!);
      const imageIpfsUrl = `ipfs://${imageHash}`;
      const imageKeccakHash = keccak256(new TextEncoder().encode(imageIpfsUrl));
      console.log("✅ Image uploaded:", imageIpfsUrl);

      // Build LSP3 Metadata JSON
      const metadataJson = {
        LSP3Profile: {
          name: collectionMetadata.title,
          description: collectionMetadata.description,
          links: [
            {
              title: "Website",
              url: collectionMetadata.website || "",
            },
          ].filter((link) => link.url !== ""), // ✅ Remove empty links
          tags: collectionMetadata.tags.split(",").map((t) => t.trim()),
          profileImage: [
            {
              width: 640,
              height: 480,
              hashFunction: "keccak256(bytes)",
              hash: imageKeccakHash,
              url: imageIpfsUrl,
            },
          ], 
          backgroundImage: [
            {
              width: 1280,
              height: 720,
              hashFunction: "keccak256(bytes)",
              hash: imageKeccakHash,
              url: imageIpfsUrl,
            },
          ],
        },
      };

      // Upload LSP3 Metadata to Pinata
      //const metadataBlob = new Blob([JSON.stringify(metadataJson)], { type: "application/json" });
      const metadataFile = new File([JSON.stringify(metadataJson)], "metadata.json", { type: "application/json" });
      const metadataHash = await uploadToPinata(metadataFile);
      const metadataUrl = `ipfs://${metadataHash}`;

      // Build Collection Metadata JSON
      const collectionMetadataJson = {
        CollectionMetadata: {
          title: collectionMetadata.title,
          description: collectionMetadata.description,
          images: [{ width: 640, height: 480, hashFunction: "keccak256(bytes)", hash: imageKeccakHash, url: imageIpfsUrl }],
          categories: collectionMetadata.categories.split(",").map((c) => c.trim()),
          tags: collectionMetadata.tags.split(",").map((t) => t.trim()),
          visibility: collectionMetadata.visibility,
          collectionType: 2,
          status: "active",
          incentive: { amount: collectionMetadata.incentiveAmount, currency: collectionMetadata.incentiveCurrency },
          ownerTakeRate: { percentage: collectionMetadata.ownerTakeRate, currency: collectionMetadata.incentiveCurrency },
          userJoinCost: { amount: collectionMetadata.userJoinCost, currency: collectionMetadata.incentiveCurrency },
          isVerified: true,
          featuredMoments: [],
          extraFields: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        },
      };

      // Step 3: Upload Metadata to Pinata
      //const collectionMetadataBlob = new Blob([JSON.stringify(collectionMetadataJson)], { type: "application/json" });
      const collectionMetadataFile = new File([JSON.stringify(collectionMetadataJson)], "collectionMetadata.json", { type: "application/json" });
      const collectionMetadataHash = await uploadToPinata(collectionMetadataFile);
      const collectionMetadataUrl = `ipfs://${collectionMetadataHash}`;


      // Interacting with the LSP23Factory contract
      const lsp23FactoryContract = new ethers.Contract(
        LSP23_FACTORY_ADDRESS,
        LSP23FactoryArtifact.abi,
        signer
      );

      const universalProfileImplementationContract = new ethers.Contract(
        UNIVERSAL_PROFILE_IMPLEMENTATION_ADDRESS,
        UniversalProfileInitArtifact.abi,
        signer
      );

      console.log("🔍 Checking variables before encoding function data...");
      console.log("UNIVERSAL_PROFILE_IMPLEMENTATION_ADDRESS:", UNIVERSAL_PROFILE_IMPLEMENTATION_ADDRESS);
      console.log("LSP23_POST_DEPLOYMENT_MODULE_ADDRESS:", LSP23_POST_DEPLOYMENT_MODULE_ADDRESS);

      // create the init structs of LSP23 Linked Contracts Factory
      const universalProfileInitStruct = {
        salt: generateSalt(account),
        fundingAmount: 0,
        implementationContract: UNIVERSAL_PROFILE_IMPLEMENTATION_ADDRESS,
        initializationCalldata: universalProfileImplementationContract.interface.encodeFunctionData(
          "initialize",
          [LSP23_POST_DEPLOYMENT_MODULE_ADDRESS],
        ),
      };

      const keyManagerInitStruct = {
        fundingAmount: 0,
        implementationContract: LSP6_KEY_MANAGER_IMPLEMENTATION_ADDRESS,
        addPrimaryContractAddress: true, // this will append the primary contract address to the init calldata
        initializationCalldata: '0xc4d66de8', // `initialize(address)` function selector
        extraInitializationParams: '0x',
      };


      // Step 4: Encode ERC725 Data
      const erc725 = new ERC725([
        ...CollectionSchema,
        ...LSP6KeyManagerSchemas, 
        ...LSP3ProfileMetadataSchemas, 
        ...LSP1UniversalReceiverDelegateSchemas
      ]);

      // create the permissions data keys - value pairs to be set
      const setDataKeysAndValues = erc725.encodeData([
        {
          keyName: "CollectionMetadata",
          value: {
            json: collectionMetadataJson,
            url: collectionMetadataUrl,
          },
        },
        { 
          keyName: 'LSP3Profile', 
          value: {
              //hashFunction: "keccak256(utf8)",
              //hash: metadataHash,
              url: metadataUrl,
              json: metadataJson,
          }
        },
        {
          keyName: 'LSP1UniversalReceiverDelegate',
          value: LSP1_UNIVERSAL_RECEIVER_ADDRESS,
        }, // Universal Receiver data key and value
        {
          keyName: 'AddressPermissions:Permissions:<address>',
          dynamicKeyParts: [LSP1_UNIVERSAL_RECEIVER_ADDRESS],
          value: erc725.encodePermissions({
            REENTRANCY: true,
            SUPER_SETDATA: true,
          }),
        }, // Universal Receiver Delegate permissions data key and value
        {
          keyName: 'AddressPermissions:Permissions:<address>',
          dynamicKeyParts: [controllerAddress],
          value: erc725.encodePermissions({
            CHANGEOWNER: true,
            ADDCONTROLLER: true,
            EDITPERMISSIONS: true,
            ADDEXTENSIONS: true,
            CHANGEEXTENSIONS: true,
            ADDUNIVERSALRECEIVERDELEGATE: true,
            CHANGEUNIVERSALRECEIVERDELEGATE: true,
            REENTRANCY: false,
            SUPER_TRANSFERVALUE: true,
            TRANSFERVALUE: true,
            SUPER_CALL: true,
            CALL: true,
            SUPER_STATICCALL: true,
            STATICCALL: true,
            SUPER_DELEGATECALL: false,
            DELEGATECALL: false,
            DEPLOY: true,
            SUPER_SETDATA: true,
            SETDATA: true,
            ENCRYPT: true,
            DECRYPT: true,
            SIGN: true,
            EXECUTE_RELAY_CALL: true,
          }), // Main Controller permissions data key and value
        },
        // length of the Address Permissions array and their respective indexed keys and values
        {
          keyName: 'AddressPermissions[]',
          value: [LSP1_UNIVERSAL_RECEIVER_ADDRESS, controllerAddress],
        },
      ]);

      const abiCoder = new ethers.AbiCoder();
      const initializeEncodedBytes = abiCoder.encode(
        ["bytes32[]", "bytes[]"],
        [setDataKeysAndValues.keys, setDataKeysAndValues.values]
      );

      // deploy the Universal Profile and its Key Manager
      const [upAddress, keyManagerAddress] = await lsp23FactoryContract.deployERC1167Proxies.staticCall(
        universalProfileInitStruct,
        keyManagerInitStruct,
        LSP23_POST_DEPLOYMENT_MODULE_ADDRESS,
        initializeEncodedBytes,
      );
      console.log('Universal Profile address:', upAddress);
      console.log('Key Manager address:', keyManagerAddress);

      const tx = await lsp23FactoryContract.deployERC1167Proxies(
        universalProfileInitStruct,
        keyManagerInitStruct,
        LSP23_POST_DEPLOYMENT_MODULE_ADDRESS,
        initializeEncodedBytes,
      );
      await tx.wait();
      console.log('Collection created:', tx);
      
      // Store collection in MomentFactory Contract
      const momentFactory = new ethers.Contract(
        MOMENT_FACTORY_ADDRESS,
        MomentFactoryABI.abi,
        signer
      );
      const storeTx = await momentFactory.storeCollection(upAddress, controllerAddress, account);
      await storeTx.wait();
      console.log('Collection added to MomentFactory:', storeTx);

      toast.success("Collection created successfully!");
      router.push("/collections");
    } catch (error) {
      console.error("❌ Error in handleSubmit:", error);
      toast.error("Failed to create collection.");
    } finally {
      console.log("✅ Resetting form state.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="container mx-auto max-w-2xl px-6 py-12 bg-gray-900 text-white rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-6">Create a New Collection</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Collection Details */}
        <div className="p-6 bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Collection Details</h3>

          <label className="block mb-2 font-medium">Title</label>
          <input
            type="text"
            name="title"
            value={collectionMetadata.title}
            onChange={handleMetadataChange}
            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring focus:ring-blue-500"
            required
          />

          <label className="block mt-4 mb-2 font-medium">Description</label>
          <textarea
            name="description"
            value={collectionMetadata.description}
            onChange={handleMetadataChange}
            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring focus:ring-blue-500"
            required
          ></textarea>
        </div>

        {/* Categories & Tags */}
        <div className="p-6 bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Categories & Tags</h3>

          <label className="block mb-2 font-medium">Categories (comma-separated)</label>
          <input
            type="text"
            name="categories"
            value={collectionMetadata.categories}
            onChange={handleMetadataChange}
            placeholder="e.g. Photography, Travel, Nature"
            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring focus:ring-blue-500"
          />

          <label className="block mt-4 mb-2 font-medium">Tags (comma-separated)</label>
          <input
            type="text"
            name="tags"
            value={collectionMetadata.tags}
            onChange={handleMetadataChange}
            placeholder="e.g. Beach, Ocean, Sunset"
            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring focus:ring-blue-500"
          />
        </div>

        {/* Incentives & Costs */}
        <div className="p-6 bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Incentives & Costs</h3>

          <label className="block mb-2 font-medium">Incentive Amount</label>
          <input
            type="number"
            name="incentiveAmount"
            value={collectionMetadata.incentiveAmount}
            onChange={handleMetadataChange}
            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring focus:ring-blue-500"
            required
          />

          <label className="block mt-4 mb-2 font-medium">Owner Take Rate (%)</label>
          <input
            type="number"
            name="ownerTakeRate"
            value={collectionMetadata.ownerTakeRate}
            onChange={handleMetadataChange}
            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring focus:ring-blue-500"
            required
          />

          <label className="block mt-4 mb-2 font-medium">User Join Cost</label>
          <input
            type="number"
            name="userJoinCost"
            value={collectionMetadata.userJoinCost}
            onChange={handleMetadataChange}
            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring focus:ring-blue-500"
            required
          />
        </div>

        {/* Cover Image */}
        <div className="p-6 bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Cover Image</h3>
          
          <label className="block mb-2 font-medium">Upload Cover Image</label>
          <input
            type="file"
            onChange={handleImageChange}
            className="w-full px-4 py-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:ring focus:ring-blue-500"
            accept="image/*"
            required
          />
          
          {imagePreview && (
            <div className="mt-4">
              <p className="text-sm text-gray-400">Image Preview:</p>
              <img src={imagePreview} alt="Preview" className="mt-2 rounded-md shadow-md w-full max-h-40 object-cover" />
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 rounded-lg text-white font-semibold transition ${
            isSubmitting ? "bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500"
          }`}
        >
          {isSubmitting ? "Creating..." : "Create Collection"}
        </button>

      </form>
    </main>
  );
}
