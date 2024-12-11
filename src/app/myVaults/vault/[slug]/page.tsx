"use client";

import { Button, Modal, TextInput } from "flowbite-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { ethers } from "ethers";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers5/react";
import { useRouter } from "next/navigation";
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

interface VaultMember {
  name: string;
  cid: string;
  generatedName: string;
}

interface VaultMoment {
  name: string;
  tokenId: string;
  timestamp: Date;
}

export default function Page({ params }: { params: { slug: string } }) {
  const vaultAddress = params.slug;
  const router = useRouter();

  const [vaultTitle, setVaultTitle] = useState<string>();
  const [vaultDescription, setVaultDescription] = useState<string>("");
  const [vaultMembers, setVaultMembers] = useState<VaultMember[]>();
  const [vaultMoments, setVaultMoments] = useState<VaultMoment[]>([]);
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

  const [isExpanded, setIsExpanded] = useState(false);
  const toggleDescription = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    init();
  }, [isConnected, address, walletProvider]);

  const fetchProfileName = async (owner: string) => {
    const profile = await getUniversalProfileCustomName(owner);
    return {
      generatedName: profile.profileName as string,
      cid: convertIpfsUriToUrl(profile.cid),
    };
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

  const init = async () => {
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

      const VaultAssistContract = new ethers.Contract(
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
      setVaultMoments(allMoments);

      const ownerData = await fetchProfileName(data.vaultOwner);
      setVaultProfileName(ownerData.generatedName);
      setVaultProfileCid(ownerData.cid);

      const memberList = await VaultFactoryContract.getVaultMembers(
        vaultAddress
      );
      let vaultMembers_: VaultMember[] = [];
      if (memberList.length > 0)
        for (let i = 0; i < memberList.length; i++) {
          const generatedVaultMember = await fetchProfileName(memberList[i]);
          vaultMembers_.push({
            name: memberList[i],
            generatedName: generatedVaultMember.generatedName,
            cid: generatedVaultMember.cid,
          });
        }

      setVaultMembers(vaultMembers_);

      let moments_: Moment[] = [];
      // NFT info
      if (allMoments.length > 0) {
        for (let i = 0; i < allMoments.length; i++) {
          // Get the total number of comments
          const _commentCnt = await VaultAssistContract.getCommentCount(
            allMoments[i].tokenId
          );
          const commentCnt = parseInt(_commentCnt.toString(), 10); // Convert BigNumber to number
          // get the encryption key from encryptedEncryptionKey of Vault Contract
          const combinedEncryptedData_ = await VaultContract.getEncryptedKey(
            bytes32ToAddress(allMoments[i].tokenId)
          );
          const combinedEncryptedData = hexStringToUint8Array(
            combinedEncryptedData_
          );
          const creator = await VaultContract.momentOwners(
            allMoments[i].tokenId
          );

          const decryptedKey_ = await fetchDecryptedKey(combinedEncryptedData);
          const decryptedKey = Buffer.from(decryptedKey_);

          // if (hexToDecimal(balance._hex) == 0) continue;
          const tokenIdMetadata = await VaultContract.getDataForTokenId(
            allMoments[i].tokenId,
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
          const likes_ = await await VaultAssistContract.getLikes(
            allMoments[i].tokenId
          );
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
            momentAddress: allMoments[i].tokenId,
          });
        }
      }
      setMoments(moments_);
      setIsDownloading(true);
    }
  };

  const handleInvitationMember = async () => {
    if (invitationAddress == address) {
      toast.error("You cannot invite yourself!");
      return;
    }
    if (vaultOwner !== address) {
      toast.error("Only the collection owner can invite!");
      return;
    }
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
      init();
      toast.success("Added to collection successfully.");
      setOpenInvitationModal(false);
    } else {
      toast.error("Please connect your wallet.");
      setIsDownloading(false);
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
      toast.success("You have now left this collection!");
      setOpenModal(false);
    } else {
      toast.error("Please connect your wallet.");
    }
  };

  const handleRemoveVault = async () => {
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

      const tx = await VaultFactoryContract.burnVault(vaultAddress);
      console.log("tx", tx);
      toast.success("Collection removed successfully!");
      setIsDownloading(true);
      router.push("/myVaults");
    } else {
      toast.error("Please connect your wallet.");
    }
  };

  const handleRemoveMember = async (memberAddress: string) => {
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
      if (vaultOwner === memberAddress) {
        toast.error("The collection owner cannot be removed");
        return;
      }
      const tx = await VaultFactoryContract.removeMember(
        vaultAddress,
        memberAddress
      );
      toast.success("Member has been removed successfully!");
      init();
    } else {
      toast.error("Connect your wallet");
    }
  };

  return !isDownloading ? (
    <div className="flex flex-col justify-center items-center bg-black min-h-screen text-gray-200"> 
      <div className="flex space-x-2 justify-center items-center">
        <div
          className="h-8 w-8 rounded-full animate-bounce [animation-delay:-0.3s]"
          style={{
            backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
          }}
        ></div>
        <div
          className="h-8 w-8 rounded-full animate-bounce [animation-delay:-0.15s]"
          style={{
            backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
          }}
        ></div>
        <div
          className="h-8 w-8 rounded-full animate-bounce"
          style={{
            backgroundImage: "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
          }}
        ></div>
      </div>
      <div className="flex flex-col items-center text-center max-w-[360px] mx-auto">
        <p className="text-lg mt-8">Loading collection</p>
        <p className="text-base mt-2 italic">&quot;Each moment tells a story; together, they create a legacy.&quot;</p>
      </div>
    </div>
  ) : (
    <main
      className="relative min-h-screen overflow-hidden bg-black"
      style={{
        background: "radial-gradient(circle at top left, #041420, #000000)",
      }}
    >
      <div className="container mx-auto max-w-6xl pt-32 pb-32">
        {/* Vault Name and Join Button */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 pl-2 pr-3 border border-gray-900/80 py-1 bg-gray-900/80 rounded-full shadow-sm">
            <img
              className="rounded-full object-cover w-8 h-8"
              src={vaultProfileCid}
              alt="Profile"
            />
            <div className="text-base text-gray-200">
              {vaultProfileName || "Loading..."}
            </div>
          </div>
          <div className="flex space-x-2 items-center">
            {vaultMode === 1 ? (
              <button
                type="button"
                onClick={() => setOpenInvitationModal(true)}
                className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg shadow-md hover:bg-gray-600"
              >
                Invite member
              </button>
            ) : (
              ""
            )}
            <Link href={"/addMoment"}>
              <button className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg shadow-md hover:bg-gray-600">
                Add moment
              </button>
            </Link>
            {process.env.NEXT_PUBLIC_SUPER_ADMIN_ADDRESS == address ? (
              <button
                onClick={() => handleRemoveVault()}
                className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg shadow-md hover:bg-gray-600"
              >
                Remove collection
              </button>
            ) : (
              ""
            )}
            {vaultOwner !== address ? (
              <button
                onClick={() => handleLeaveVault()}
                className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg shadow-md hover:bg-gray-600"
              >
                Leave collection
              </button>
            ) : (
              ""
            )}
          </div>
        </div>

        <div className="pt-3">
          <div className="font-bold text-3xl mb-3 text-gray-200">
            {vaultTitle}
          </div>
          {/* Vault Description */}
          <div className="text-gray-200 mb-3">
            <div
              className={`overflow-hidden ${isExpanded ? '' : 'line-clamp-2'}`}
              style={{ display: '-webkit-box', WebkitLineClamp: isExpanded ? 'unset' : '2', WebkitBoxOrient: 'vertical' }}
            >
              {vaultDescription  || ''}
            </div>
            {(vaultDescription.length || 0) > 100 && (
              <button
                onClick={toggleDescription}
                className="text-gray-600 hover:text-gray-500 text-sm"
              >
                {isExpanded ? 'Hide full description' : 'Expand description'}
              </button>
            )}
          </div>
          {/* <div className="w-full text-gray-400 mb-3">{vaultDescription}</div> */}

          {/* Vault Owner, Members, and Moments */}
          <div className="flex items-center gap-4">
            <div className="flex gap-2 text-gray-200">
              <div
                className="hover:cursor-pointer hover:text-primary-300"
                onClick={() => setOpenMembersModal(true)}
              >
                {vaultMembers?.length} member
                {vaultMembers?.length !== 1 ? "s" : ""}
              </div>
              <div>|</div>
              <div>
                {moments?.length || 0} moment{moments?.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          

          {/* Moments */}

          <div className="div">
            {!moments.length ? (
              <div className="text-center text-gray-200 mt-10 space-y-4">
                <div>
                  <img
                    // src="https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif"
                    src="https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExazJkdG1uOHR0cTI5ZWltY3YzdTc0anVsMmluMGpybTJmajdtMzc1ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ISOckXUybVfQ4/giphy.gif"
                    alt="Oh no Spongbob gif"
                    className="mx-auto w-96 h-auto"
                  />
                </div>
                <div className="text-xl font-medium">
                  There are no moments in this collection yet!
                </div>
                <div className="text-base">
                  Add a moment to get the collection started
                </div>
                <div className="pt-3 flex justify-center items-center">
                  <Link href={"/addMoment"}>
                    <button className="px-6 py-3 bg-primary-600 text-white rounded-lg shadow-md hover:bg-primary-700">
                      Add moment
                    </button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-8">
                {moments &&
                  moments.map((moment, index) => (
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
                  Are you sure you want to leave this vault? You will no longer
                  have access to the moments in this vault.
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

          {openInvitationModal && (
            <>
            {/* <Modal.Header /> */}
            <div className="justify-center items-start flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 shadow-md-light"> 
              <div className="relative w-auto my-6 mx-auto max-w-4xl mt-32">
                <div className="rounded-lg shadow-md relative flex flex-col w-full bg-gray-700 border-solid border-gray-600 border-2">
                  {/* header */}
                  <div className="flex text-gray-100 items-start justify-between p-6 border-b border-solid border-gray-500 rounded-t-lg">
                    <h3 className="text-xl">Add Member</h3>
                    <button
                      className="ml-auto bg-transparent border-0 float-right leading-none outline-none focus:outline-none"
                      onClick={() => setOpenInvitationModal(false)}
                    >
                      <span className="bg-transparent h-6 w-6 text-2xl outline-none focus:outline-none">
                        ×
                      </span>
                    </button>
                  </div>

                  {/* body */}
                  <div className="relative p-6 flex-auto max-h-[600px] sm:w-[600px] w-full">
                    {/* <HiOutlineUserAdd className="mx-auto mb-4 h-10 w-10 text-gray-400 dark:text-gray-200" /> */}
                  
                    <label className="block mb-2 text-gray-200">Enter Universal Profile address</label>
                      <input
                        id="invitationAddress"
                        type="text"
                        value={invitationAddress}
                        onChange={(e) => setInvitationAddress(e.target.value)}
                        placeholder="Input address"
                        className="w-full py-2 rounded-md bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        style={{ backgroundColor: '#4B5563' }}
                        required
                      />
                    <div className="flex justify-end gap-4 mt-6">
                      <button
                        className="bg-gray-600 text-gray-200 hover:bg-gray-500 rounded-lg shadow-sm px-4 py-2"
                        onClick={() => setOpenInvitationModal(false)}
                      >
                        Cancel
                      </button>
                    

                      <button
                        className={
                          invitationAddress
                            ? "bg-primary-600 text-gray-200 hover:bg-primary-500 rounded-lg shadow-sm px-4 py-2 text-base"
                            : "bg-primary-600 text-gray-400 text-base rounded-lg px-4 py-2"
                        }
                        onClick={() => handleInvitationMember()}
                      >
                        Add member
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="opacity-80 fixed inset-0 z-40 bg-black"></div>
            </> 
          )}

          {openMembersModal ? (
            <>
              <div className="justify-center items-start flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 shadow-md-light">
                <div className="relative w-auto my-6 mx-auto max-w-4xl mt-32">
                  {/*content*/}
                  <div className="rounded-lg shadow-md relative flex flex-col w-full bg-gray-700 border-solid border-gray-600 border-2">
                    {/*header*/}
                    <div className="flex text-gray-100 items-start justify-between p-6 border-b border-solid border-gray-500 rounded-t-lg">
                      <h3 className="text-xl">
                        {vaultMembers?.length} member
                        {vaultMembers?.length !== 1 ? "s" : ""}
                      </h3>
                      <button
                        className="ml-auto bg-transparent border-0 float-right leading-none outline-none focus:outline-none"
                        onClick={() => setOpenMembersModal(false)}
                      >
                        <span className="bg-transparent h-6 w-6 text-2xl outline-none focus:outline-none">
                          ×
                        </span>
                      </button>
                    </div>
                    {/*body*/}
                    <div className="relative p-6 flex-auto max-h-[600px] sm:w-[600px] w-full overflow-y-auto ">
                      {vaultMembers &&
                        vaultOwner == address &&
                        vaultMembers.map((member, index) => (
                          <div
                            className="p-1 flex items-center justify-between  space-x-3"
                            key={index}
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={member.cid}
                                alt={member.name}
                                className="rounded-full h-8 w-8 object-cover"
                              />
                              <div>
                                <h3 className="text-base text-gray-200">
                                  {member.generatedName}
                                </h3>
                              </div>
                            </div>
                            {vaultOwner == address ? (
                              <div className="flex justify-center gap-4">
                                <Button
                                  className="bg-gray-800/50 hover:bg-gray-700/80 rounded-lg shadow-sm py-1"
                                  onClick={() =>
                                    handleRemoveMember(member.name)
                                  }
                                >
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              ""
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="opacity-80 fixed inset-0 z-40 bg-black"></div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
