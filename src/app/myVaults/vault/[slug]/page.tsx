"use client";

import { Button, Modal, TextInput } from "flowbite-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers5/react";
import {
  bytes32ToAddress,
  hexToDecimal,
  hexStringToUint8Array,
  getValueByKey,
  convertIpfsUriToUrl,
  getUniversalProfileCustomName,
} from "@/utils/format"; // Adjust the import path as necessary
import { ERC725 } from "@erc725/erc725.js";
import lsp4Schema from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
import { ERC725YDataKeys } from "@lukso/lsp-smart-contracts";
import { generateEncryptionKey, decryptFile } from "@/utils/upload";
import VaultFactoryABI from "@/artifacts/VaultFactory.json";
import VaultABI from "@/artifacts/Vault.json";
import VaultAssistABI from "@/artifacts/VaultAssist.json";
import MomentCard from "@/components/MomentCard";
import toast, { Toaster } from "react-hot-toast";
import { HiOutlineExclamationCircle, HiOutlineUserAdd } from "react-icons/hi";
import {
  generateAESKey,
  decryptEncryptedEncryptionKey,
} from "@/utils/encryptKey";

interface Moment {
  headline: string;
  description: string;
  fileType: string;
  cid: string;
  likes: number;
  comments: number;
  owner: string;
  momentAddress: string;
}

export default function Page({ params }: { params: { slug: string } }) {
  const vaultAddress = params.slug;

  const [vaultTitle, setVaultTitle] = useState<string>();
  const [vaultDescription, setVaultDescription] = useState<string>();
  const [vaultMembers, setVaultMembers] = useState<number>();
  const [vaultMoments, setVaultMoments] = useState<number>();
  const [vaultMode, setVaultMode] = useState<number>(0);
  const [vaultOwner, setVaultOwner] = useState<string>();
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [moments, setMoments] = useState<Moment[]>([]);
  const [invitationAddress, setInvitationAddress] = useState<string>("");

  const [openModal, setOpenModal] = useState(false);
  const [openInvitationModal, setOpenInvitationModal] = useState(false);
  const [openMembersModal, setOpenMembersModal] = useState(false);
  // const [openInvitationModal, setInvitationModal] = useState(false);
  const [vaultProfileName, setVaultProfileName] = useState<string>("");
  const [vaultProfileCid, setVaultProfileCid] = useState<string>("");

  useEffect(() => {
    fetchData();
  }, [isConnected, address, walletProvider]);

  const fetchProfileName = async (owner: string) => {
    try {
      const profile = await getUniversalProfileCustomName(owner);
      setVaultProfileName(profile.profileName);
      setVaultProfileCid(convertIpfsUriToUrl(profile.cid));
    } catch (error) {
      console.error("Error fetching profile name:", error);
      setVaultProfileName("Unknown");
    }
  };

  // Arrow function to call the API route and get the decrypted key
  const fetchDecryptedKey = async (
    combinedData: Uint8Array
  ): Promise<Uint8Array> => {
    try {
      const response = await fetch("/api/decryptKey", {
        method: "POST",
        body: JSON.stringify(combinedData), // Send as JSON
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const { decryptedKey } = await response.json();

      return new Uint8Array(decryptedKey); // Convert back to Uint8Array
    } catch (error) {
      console.error("Error fetching decrypted key:", error);
      throw error;
    }
  };

  const fetchData = async () => {
    if (walletProvider) {
      setIsDownloading(false);
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

      const VaultContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as string,
        VaultABI.abi,
        signer
      );

      const VaultAssist = new ethers.Contract(
        process.env.NEXT_PUBLIC_VAULT_ASSIST_CONTRACT_ADDRESS as string,
        VaultAssistABI.abi,
        signer
      );

      const data = await VaultFactoryContract.getVaultMetadata(vaultAddress);
      setVaultMode(data.vaultMode);
      if (data.vaultOwner) await fetchProfileName(data.vaultOwner);
      setVaultOwner(data.vaultOwner);
      const allMoments = await VaultContract.getAllMoments(vaultAddress);
      setVaultTitle(data.title as string);
      setVaultDescription(data.description as string);
      setVaultMoments(allMoments.length);
      setVaultMembers(hexToDecimal(data.memberCount));

      let moments_: Moment[] = [];

      // NFT info
      if (allMoments.length > 0) {
        for (let i = 0; i < allMoments.length; i++) {
          // Get the total number of comments
          const _commentCnt = await VaultAssist.getCommentCount(allMoments[i]);
          const commentCnt = parseInt(_commentCnt.toString(), 10); // Convert BigNumber to number
          // get the encryption key from encryptedEncryptionKey of Vault Contract
          const combinedEncryptedData_ = await VaultContract.getEncryptedKey(
            bytes32ToAddress(allMoments[i])
          );
          const combinedEncryptedData = hexStringToUint8Array(
            combinedEncryptedData_
          );
          const creator = await VaultContract.momentOwners(allMoments[i]);

          const decryptedKey_ = await fetchDecryptedKey(combinedEncryptedData);
          const decryptedKey = Buffer.from(decryptedKey_);

          // if (hexToDecimal(balance._hex) == 0) continue;
          const tokenIdMetadata = await VaultContract.getDataForTokenId(
            allMoments[i],
            ERC725YDataKeys.LSP4["LSP4Metadata"]
          );
          const erc725js = new ERC725(lsp4Schema);
          const decodedMetadata = erc725js.decodeData([
            {
              keyName: "LSP4Metadata",
              value: tokenIdMetadata,
            },
          ]);
          const metadataHash = decodedMetadata[0].value.url;

          const metadataJsonLink =
            process.env.NEXT_PUBLIC_IPFS_GATEWAY + "/" + metadataHash;

          const resMetadata = await fetch(metadataJsonLink);
          const jsonMetadata = await resMetadata.json();
          const ipfsHash = jsonMetadata.LSP4Metadata.ipfsHash;
          const metadata = jsonMetadata.LSP4Metadata;

          if (ipfsHash == "") continue;
          const fetchUrl = process.env.NEXT_PUBLIC_FETCH_URL + ipfsHash;
          const response = await fetch(fetchUrl);
          if (!response.ok) {
            throw new Error("Failed to fetch image from IPFS");
          }
          const encryptedData = await response.arrayBuffer();
          const decryptedData = await decryptFile(
            new Uint8Array(encryptedData),
            decryptedKey
          );

          const blob = new Blob([decryptedData]); // Creating a blob from decrypted data
          const objectURL = URL.createObjectURL(blob);
          const likes_ = await await VaultContract.getLikes(allMoments[i]);
          const attributes = metadata.attributes;
          let fileType: string = "image";
          if (attributes.length > 0) {
            fileType = getValueByKey(attributes, "FileType") as string;
          }

          moments_.push({
            headline: metadata.headline, //tokenSymbol.value as string,
            description: metadata.description,
            fileType: fileType,
            cid: objectURL,
            likes: likes_.length,
            comments: commentCnt,
            owner: creator,
            momentAddress: allMoments[i],
          });
        }
      }
      setMoments(moments_);
      setIsDownloading(true);
    }
  };

  const handleInvitationMember = async () => {
    if (walletProvider) {
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
      setIsDownloading(false);
      const tx = await VaultFactoryContract.inviteMember(
        vaultAddress,
        invitationAddress
      );
      console.log("tx", tx);
      setIsDownloading(true);
      fetchData();
      toast.success("Invited to vault successfully.");
      setOpenInvitationModal(false);
    } else {
      toast.error("Please connect the wallet.");
      setIsDownloading(false);
    }
  };

  const handleMembers = async () => {
    if (walletProvider) {
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
      const tx = await VaultFactoryContract.inviteMember(
        vaultAddress,
        invitationAddress
      );
      toast.success("Invited to vault successfully.");
      setOpenMembersModal(false);
    } else {
      toast.error("Please connect the wallet.");
    }
  };

  const handleLeaveVault = async () => {
    if (walletProvider) {
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

      const tx = await VaultFactoryContract.leaveVault(vaultAddress);
      console.log("tx", tx);
      toast.success("Left to vault successfully!");
      setOpenModal(false);
    } else {
      toast.error("Please connect the wallet.");
    }
  };

  const handleRemoveMember = async (memberAddress: string) => {
    if (walletProvider) {
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
      if (vaultOwner === memberAddress) {
        toast.error("The vault owner cannot be removed");
        return;
      }
      const tx = VaultFactoryContract.removeMember(vaultAddress, memberAddress);
      toast.success("Member is removed successfully!");
    } else {
      toast.error("Connect the wallet");
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
    <div className="px-6 bg-white pt-10 h-[800px]">
      <div className="font-bold text-3xl">{vaultTitle}</div>
      <div className="pt-1">
        <div className="flex gap-2 pt-1 items-center">
          <img
            className="rounded-lg h-[25px] w-[25px]"
            src={vaultProfileCid}
            alt="Profile"
          />
          <div className="text-sm justify-center item-center">
            {vaultProfileName || "Loading..."}
          </div>
        </div>
      </div>
      <div className="pt-1 mb-4">{vaultDescription}</div>
      <div className="flex justify-between">
        <div className="flex justify-between gap-4 items-center">
          <div className="flex items-center max-w-sm mx-auto">
            <label htmlFor="simple-search" className="sr-only">
              Search
            </label>
            <div className="relative w-full">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                  />
                </svg>
              </div>
              <input
                type="text"
                id="simple-search"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder={`Search ` + vaultMoments + ` moments`}
                required
              />
            </div>
            <button
              type="submit"
              className="p-2.5 ms-2 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              <svg
                className="w-4 h-4"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
              <span className="sr-only">Search</span>
            </button>
          </div>

          <div
            className="max-w-md hover:cursor-pointer"
            onClick={() => setOpenMembersModal(true)}
          >
            {vaultMembers} member{!vaultMembers ? "" : "s"}
          </div>
        </div>
        <div>
          {vaultMode === 1 ? (
            <button
              type="button"
              onClick={() => setOpenInvitationModal(true)}
              className="py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
            >
              Invite member
            </button>
          ) : (
            ""
          )}
          <Link href={"/addMoment"}>
            <button className="py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">
              Create Moment
            </button>
          </Link>
          {vaultOwner !== address ? (
            <button
              onClick={() => handleLeaveVault()}
              className="py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
            >
              Leave vault
            </button>
          ) : (
            ""
          )}
        </div>
      </div>

      <div className="div">
        {!moments.length ? (
          <div className="pt-4 text-xl">
            There are no moments in this vault yet. Please add a moment!
          </div>
        ) : (
          <div className="py-10 grid grid-cols-5 gap-4">
            {moments.map((moment, index) => (
              <div key={index}>
                <MomentCard moment={moment} />
              </div>
            ))}
          </div>
        )}
      </div>
      <Toaster />
      <Modal
        show={openModal}
        size="md"
        onClose={() => setOpenModal(false)}
        popup
      >
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to leave this vault? You will no longer have
              access to the moments in this vault.
            </h3>
            <div className="flex justify-center gap-4">
              <Button
                className="bg-red-500"
                onClick={() => setOpenModal(false)}
              >
                Yes, I&#39;m sure
              </Button>
              <Button
                className="bg-white text-black"
                onClick={() => setOpenModal(false)}
              >
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      <Modal
        show={openInvitationModal}
        size="md"
        onClose={() => setOpenInvitationModal(false)}
        popup
      >
        {/* <Modal.Header /> */}
        <Modal.Body>
          <div className="text-center">
            <HiOutlineUserAdd className="mx-auto mt-8 mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <TextInput
              id="invitationAddress"
              type="text"
              value={invitationAddress}
              onChange={(e) => setInvitationAddress(e.target.value)}
              placeholder="Input the address"
              className="pt-2 pb-8"
              required
            />
            <div className="flex justify-center gap-4">
              <Button
                className={invitationAddress ? "bg-blue-600" : "bg-blue-400"}
                onClick={() => handleInvitationMember()}
              >
                Invite
              </Button>
              <Button
                className="bg-red-400 text-white"
                onClick={() => setOpenInvitationModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      <Modal
        show={openMembersModal}
        size="md"
        onClose={() => setOpenMembersModal(false)}
        popup
      >
        <Modal.Header>
          <div className="w-full flex justify-center text-4xl">Members</div>
        </Modal.Header>
        <Modal.Body>
          <div className="p-4 w-full">
            <div className="w-64 rounded-lg overflow-y-auto max-h-[300px]">
              <div className="p-1 flex items-center space-x-3">
                <img
                  src={vaultProfileCid}
                  alt="Andrew Alfred"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="text-sm font-medium">{vaultProfileName}</h3>
                </div>
                <div className="flex justify-center gap-4">
                  <Button
                    className="bg-red-400 text-white"
                    onClick={() => handleRemoveMember("0xasldkfjwlkejglwkejg")}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <div className="p-1 flex items-center space-x-3">
                <img
                  src={vaultProfileCid}
                  alt="Andrew Alfred"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="text-sm font-medium">{vaultProfileName}</h3>
                </div>
                <div className="flex justify-center gap-4">
                  <Button
                    className="bg-red-400 text-white"
                    onClick={() => setOpenMembersModal(false)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <div className="p-1 flex items-center space-x-3">
                <img
                  src={vaultProfileCid}
                  alt="Andrew Alfred"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="text-sm font-medium">{vaultProfileName}</h3>
                </div>
                <div className="flex justify-center gap-4">
                  <Button
                    className="bg-red-400 text-white"
                    onClick={() => setOpenMembersModal(false)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              <div className="p-1 flex items-center space-x-3">
                <img
                  src={vaultProfileCid}
                  alt="Andrew Alfred"
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="text-sm font-medium">{vaultProfileName}</h3>
                </div>
                <div className="flex justify-center gap-4">
                  <Button
                    className="bg-red-400 text-white"
                    onClick={() => setOpenMembersModal(false)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="w-full flex justify-center">
            <Button
              className="bg-red-400 text-white"
              onClick={() => setOpenMembersModal(false)}
            >
              Close
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
