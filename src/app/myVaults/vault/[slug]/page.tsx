"use client";

import { Button, Modal, TextInput } from "flowbite-react";
import Link from "next/link";
import React, { useState, useEffect } from "react";
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
  const [vaultDescription, setVaultDescription] = useState<string>();
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
      toast.error("Cannot invite yourself!");
      return;
    }
    if (vaultOwner !== address) {
      toast.error("Only Vault Owner can invite!");
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
      toast.success("Invited to vault successfully.");
      setOpenInvitationModal(false);
    } else {
      toast.error("Please connect the wallet.");
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
      toast.success("Left to vault successfully!");
      setOpenModal(false);
    } else {
      toast.error("Please connect the wallet.");
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
      toast.success("Removed the vault successfully!");
      setIsDownloading(true);
      router.push("/myVaults");
    } else {
      toast.error("Please connect the wallet.");
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
        toast.error("The vault owner cannot be removed");
        return;
      }
      const tx = await VaultFactoryContract.removeMember(
        vaultAddress,
        memberAddress
      );
      toast.success("Member is removed successfully!");
      init();
    } else {
      toast.error("Connect the wallet");
    }
  };

  return !isDownloading ? (
    <div className="flex space-x-2 justify-center items-center bg-black h-screen dark:invert">
      <span className="sr-only">Loading...</span>
      <div className="h-8 w-8 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-8 w-8 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-8 w-8 bg-white rounded-full animate-bounce"></div>
    </div>
  ) : (
    <main
      className="relative min-h-screen overflow-hidden bg-black"
      style={{
        background: "radial-gradient(circle at top left, #121212, #000000)",
      }}
    >
      <div className="container mx-auto max-w-6xl pt-32">
        <div className="font-medium text-gray-200 text-3xl">{vaultTitle}</div>
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

          {/* Vault Description */}
          <div className="pt-2 text-gray-200">{vaultDescription}</div>

          {/* Vault Owner, Members, and Moments */}
          <div className="flex items-center gap-4 pt-4">
            <div className="flex items-center gap-2">
              <img
                className="rounded-full object-cover w-8 h-8"
                src={vaultProfileCid}
                alt="Profile"
              />
              <div className="text-sm text-gray-200">
                {vaultProfileName || "Loading..."}
              </div>
            </div>
            <div className="flex gap-2 text-gray-400 hover:text-gray-300">
              <div
                className="hover:cursor-pointer"
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
              <div className="text-center text-gray-200 mt-2 space-y-6">
                <div>
                  <img
                    // src="https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif"
                    src="https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExazJkdG1uOHR0cTI5ZWltY3YzdTc0anVsMmluMGpybTJmajdtMzc1ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/ISOckXUybVfQ4/giphy.gif"
                    alt="Oh no Spongbob gif"
                    className="mx-auto w-96 h-auto"
                  />
                </div>
                <div className="text-xl font-bold">
                  There are no moments in this collection yet!
                </div>
                <div className="text-base">
                  Add a moment to get the collection started
                </div>
                <div className="pt-6 flex justify-center items-center">
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
                    className={
                      invitationAddress ? "bg-blue-600" : "bg-blue-400"
                    }
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

          {openMembersModal ? (
            <>
              <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
                <div className="relative w-auto my-6 mx-auto max-w-3xl">
                  {/*content*/}
                  <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                    {/*header*/}
                    <div className="flex items-start justify-between p-5 border-b border-solid border-blueGray-200 rounded-t">
                      <h3 className="text-3xl font-semibold">Members</h3>
                      <button
                        className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                        onClick={() => setOpenMembersModal(false)}
                      >
                        <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                          ×
                        </span>
                      </button>
                    </div>
                    {/*body*/}
                    <div className="relative p-6 flex-auto max-h-[400px] w-[400px] overflow-y-auto ">
                      {vaultMembers &&
                        vaultOwner == address &&
                        vaultMembers.map((member, index) => (
                          <div
                            className="p-1 flex items-center space-x-3"
                            key={index}
                          >
                            <img
                              src={member.cid}
                              alt={member.name}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <h3 className="text-sm font-medium">
                                {member.generatedName}
                              </h3>
                            </div>
                            {vaultOwner == address ? (
                              <div className="flex justify-center gap-4">
                                <Button
                                  className="bg-red-400 text-white"
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
                    {/*footer*/}
                    <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                      <button
                        className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                        type="button"
                        onClick={() => setOpenMembersModal(false)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
