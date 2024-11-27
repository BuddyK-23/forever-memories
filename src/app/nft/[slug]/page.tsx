"use client";

import { Button } from "flowbite-react";
import React, { useState, useEffect } from "react";
import { FaHeart } from "react-icons/fa6";
import { BsChatLeftTextFill, BsFillShareFill } from "react-icons/bs";
import { AiOutlineLike, AiOutlineDislike } from "react-icons/ai";
import { BsChatRightTextFill } from "react-icons/bs";
import { MdInsertComment } from "react-icons/md";
import { MdClose } from "react-icons/md";
import VaultFactoryABI from "@/artifacts/VaultFactory.json";
import VaultAssistABI from "@/artifacts/VaultAssist.json";
import VaultABI from "@/artifacts/Vault.json";
import FMT from "@/artifacts/FMT.json";
import Link from "next/link";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers5/react";
import { ethers } from "ethers";
import { ERC725 } from "@erc725/erc725.js";
import lsp4Schema from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
import { generateEncryptionKey, decryptFile } from "@/utils/upload";
import {
  convertUnixTimestampToCustomDate,
  hexToDecimal,
  hexStringToUint8Array,
  bytes32ToAddress,
  getUniversalProfileCustomName,
  convertIpfsUriToUrl,
  getValueByKey,
} from "@/utils/format";
import CommentComponent from "@/components/CommentComponent";
import toast, { Toaster } from "react-hot-toast";
import { ERC725YDataKeys } from "@lukso/lsp-smart-contracts";

// Define the types you expect
type URLDataWithHash = {
  url: string;
  hash: string;
};

type LikeMemberType = {
  name: string;
  generatedName: string;
  cid: string;
};

// Type guard to check if the value has a 'url' property
function hasUrlProperty(value: any): value is URLDataWithHash {
  return value && typeof value === "object" && "url" in value;
}

export default function Page({ params }: { params: { slug: string } }) {
  const tokenId = params.slug;
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [showLikeModal, setShowLikeModal] = useState(false);
  const [showDislikeModal, setShowDislikeModal] = useState(false);
  const [cid, setCid] = useState<string>();
  const [mintedDate, setMintedDate] = useState<string>();
  const [totalSupply, setTotalSupply] = useState<number>();
  const [myBalance, setMyBalance] = useState<number>();
  const [commentCnt, setCommentCnt] = useState<number>(0);
  const [momentHeadline, setMomentHeadline] = useState<string>();
  const [momentDescription, setMomentDescription] = useState<string>();
  const [momentNotes, setMomentNotes] = useState<string>();
  const [vaultMode, setVaultMode] = useState<string>();
  const [vaultName, setVaultName] = useState<string>();
  const [momentOwner, setMomentOwner] = useState<string>();
  const [vaultAddress, setVaultAddress] = useState<string>();
  const [nftAddress, setNftAddress] = useState<string>();
  const [nftSymbol, setNftSymbol] = useState<string>();
  const [momentLikes, setMomentLikes] = useState<LikeMemberType[]>([]);
  const [momentDislikes, setMomentDislikes] = useState<LikeMemberType[]>([]);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [profileName, setProfileName] = useState<string>("");
  const [profileCid, setProfileCid] = useState<string>("");
  const [fileType, setFileType] = useState<string>("");

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

  useEffect(() => {
    init();
  }, []);

  const fetchProfileName = async (mmtOwner: string) => {
    try {
      const profile = await getUniversalProfileCustomName(mmtOwner);
      setProfileName(profile.profileName);
      setProfileCid(convertIpfsUriToUrl(profile.cid));
    } catch (error) {
      console.error("Error fetching profile name:", error);
      setProfileName("Unknown");
    }
  };

  const fetchLikeMemberProfile = async (pname: string) => {
    try {
      const profile = await getUniversalProfileCustomName(pname);
      return {
        generatedName: profile.profileName,
        cid: convertIpfsUriToUrl(profile.cid),
      };
    } catch (error) {
      console.error("Error fetching profile name:", error);
      return {
        name: "",
        cid: "",
      };
    }
  };

  const checkMemberOfVaultByAddress = async (vaultAddress: string) => {
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

      // const members: string[] = await getVaultMembers(vaultAddress);
      // if (members.includes(address))
    }
  };

  const init = async () => {
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

      // Get the total number of comments
      const _commentCnt = await VaultAssistContract.getCommentCount(tokenId);
      setCommentCnt(parseInt(_commentCnt.toString(), 10)); // Convert BigNumber to number

      const combinedEncryptedData_ = await VaultContract.getEncryptedKey(
        bytes32ToAddress(tokenId)
      );
      const combinedEncryptedData = hexStringToUint8Array(
        combinedEncryptedData_
      );
      const creator = await VaultContract.momentOwners(tokenId);
      setMomentOwner(creator);
      fetchProfileName(creator);

      const decryptedKey_ = await fetchDecryptedKey(combinedEncryptedData);
      const decryptedKey = Buffer.from(decryptedKey_);

      // const lsp7Contract = new ethers.Contract(
      //   bytes32ToAddress(tokenId),
      //   VaultABI.abi,
      //   signer
      // );

      const tokenIdMetadata = await VaultContract.getDataForTokenId(
        tokenId,
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
      const attributes = metadata.attributes;
      let fileType_: string = "image";
      if (attributes.length > 0) {
        fileType_ = getValueByKey(attributes, "FileType") as string;
      }
      setMomentHeadline(metadata.headline);
      setMomentDescription(metadata.description);
      setFileType(fileType_);
      const notes = await VaultAssistContract.getLongDescription(tokenId);
      setMomentNotes(notes);

      const _vaultAddress = await VaultContract.tokenOwnerOf(tokenId);
      setVaultAddress(_vaultAddress);

      const vaultData = await VaultFactoryContract.getVaultMetadata(
        _vaultAddress
      );

      setVaultMode(vaultData.vaultMode);
      setVaultName(vaultData.title);

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
      setCid(objectURL);

      const unixMintedDates = await VaultContract.mintingDates(
        bytes32ToAddress(tokenId)
      );
      const md = convertUnixTimestampToCustomDate(
        unixMintedDates,
        "dd MMM yyyy-HH:mm:ss"
      );
      console.log("md", md);
      setMintedDate(md);

      const likes = await VaultContract.getLikes(tokenId);
      let likesTemp: LikeMemberType[] = [];
      for (let i = 0; i < likes.length; i++) {
        const { generatedName, cid } = await fetchLikeMemberProfile(likes[i]);
        const likes_: LikeMemberType = {
          name: likes[i],
          generatedName: generatedName as string,
          cid: cid,
        };
        likesTemp.push(likes_);
      }
      setMomentLikes(likesTemp);

      const disikes = await VaultContract.getLikes(tokenId);
      let dislikesTemp: LikeMemberType[] = [];
      for (let i = 0; i < disikes.length; i++) {
        const { generatedName, cid } = await fetchLikeMemberProfile(disikes[i]);
        const disikes_: LikeMemberType = {
          name: likes[i],
          generatedName: generatedName as string,
          cid: cid,
        };
        dislikesTemp.push(disikes_);
      }
      setMomentDislikes(dislikesTemp);
      setIsDownloading(true);
    }
  };

  const handleLike = async () => {
    setIsDownloading(false);
    if (walletProvider) {
      const ethersProvider = new ethers.providers.Web3Provider(
        walletProvider,
        "any"
      );
      const signer = ethersProvider.getSigner(address);

      const VaultAssistContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as string,
        VaultAssistABI.abi,
        signer
      );

      const likes_ = await VaultAssistContract.getLikes(tokenId);
      if (likes_.includes(address)) {
        toast.success("Already liked!");
      } else {
        await VaultAssistContract.like(tokenId);
        const likes = await VaultAssistContract.getLikes(tokenId);
        const dislikes_ = await VaultAssistContract.getDislike(tokenId);

        let likesTemp: LikeMemberType[] = [];
        for (let i = 0; i < likes.length; i++) {
          const { generatedName, cid } = await fetchLikeMemberProfile(likes[i]);
          const likes_: LikeMemberType = {
            name: likes[i],
            generatedName: generatedName as string,
            cid: cid,
          };
          likesTemp.push(likes_);
        }
        setMomentLikes(likesTemp);

        const disikes = await VaultAssistContract.getLikes(tokenId);
        let dislikesTemp: LikeMemberType[] = [];
        for (let i = 0; i < disikes.length; i++) {
          const { generatedName, cid } = await fetchLikeMemberProfile(
            disikes[i]
          );
          const disikes_: LikeMemberType = {
            name: likes[i],
            generatedName: generatedName as string,
            cid: cid,
          };
          dislikesTemp.push(disikes_);
        }
        setMomentDislikes(dislikesTemp);
        toast.success("Like Success");

        setIsDownloading(true);
      }
    } else {
      toast.error("Connect the wallet");
      setIsDownloading(true);
    }
  };

  const handleDislike = async () => {
    setIsDownloading(false);
    if (walletProvider) {
      const ethersProvider = new ethers.providers.Web3Provider(
        walletProvider,
        "any"
      );
      const signer = ethersProvider.getSigner(address);

      const VaultAssistContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as string,
        VaultAssistABI.abi,
        signer
      );

      const dislikes_ = await VaultAssistContract.getDislikes(tokenId);
      if (dislikes_.includes(address)) {
        toast.success("Already liked!");
      } else {
        await VaultAssistContract.dislike(tokenId);
        const likes = await VaultAssistContract.getLikes(tokenId);
        const dislikes_ = await VaultAssistContract.getDislike(tokenId);

        let likesTemp: LikeMemberType[] = [];
        for (let i = 0; i < likes.length; i++) {
          const { generatedName, cid } = await fetchLikeMemberProfile(likes[i]);
          const likes_: LikeMemberType = {
            name: likes[i],
            generatedName: generatedName as string,
            cid: cid,
          };
          likesTemp.push(likes_);
        }
        setMomentLikes(likesTemp);

        const disikes = await VaultAssistContract.getLikes(tokenId);
        let dislikesTemp: LikeMemberType[] = [];
        for (let i = 0; i < disikes.length; i++) {
          const { generatedName, cid } = await fetchLikeMemberProfile(
            disikes[i]
          );
          const disikes_: LikeMemberType = {
            name: likes[i],
            generatedName: generatedName as string,
            cid: cid,
          };
          dislikesTemp.push(disikes_);
        }
        setMomentDislikes(dislikesTemp);
        toast.success("Dislike Success");
        setIsDownloading(true);
      }
    } else {
      toast.error("Connect the wallet");
      setIsDownloading(true);
    }
  };

  const handleSend = async () => {
    if (walletProvider) {
      // Define the provider (e.g., Infura, Alchemy, or a local node)
      // const providerUrl = "https://4201.rpc.thirdweb.com/";
      // const provider = new ethers.providers.JsonRpcProvider(providerUrl);

      // // Define the sender's wallet private key (you should handle private keys securely)
      // const senderPrivateKey: string =
      //   "0x402fde8f699d25643f6e7f258cc152b61702653ae48869d40aada732dfdea248";
      // const wallet = new ethers.Wallet(senderPrivateKey, provider);

      // // Define the contract address and ABI
      // const contractAddress = "0x0a21fe68f7b08023d9D5E3eBc46ABE9B2E487C67";
      // // Create a contract instance
      // const contract = new ethers.Contract(contractAddress, FMT.abi, wallet);

      // // Define the receiver address and amount to send
      // const receiverAddress = "0xa46f37632a0b08fb019C101CFE434483f27CD956";
      // const amount = ethers.utils.parseUnits("10", 18);

      // const tx = await contract.transfer(receiverAddress, amount, true, "0x");
      // console.log("Transaction hash:", tx.hash);

      // // Wait for the transaction to be mined
      // const receipt = await tx.wait();
      // console.log("Transaction was mined in block:", receipt.blockNumber);
      // console.log("Transaction successful with receipt:", receipt);

      const ethersProvider = new ethers.providers.Web3Provider(
        walletProvider,
        "any"
      );
      const signer = ethersProvider.getSigner(address);

      const lsp7Contract = new ethers.Contract(
        bytes32ToAddress(tokenId),
        VaultABI.abi,
        signer
      );

      const tokenOwner = await lsp7Contract.owner();
      const tokenIds = await lsp7Contract.tokenIdsOf(tokenOwner);
      // const tx = await lsp7Contract
      //   .transfer(
      //     owner, // sender address
      //     "0x0051507f422b0Ca092ae038A0887AfE96A31585f", // receiving address
      //     1, // token amount
      //     false, // force parameter
      //     "0x" // additional data
      //   )
      //   .send({ from: owner });
      // console.log("tx", tx);
    }

    // setShowModal(false);
  };

  const handleChildAction = (data: string) => {
    console.log("child component handleer", data);
    setCommentCnt((prevCommentCnt) => prevCommentCnt + 1);
  };

  return !isDownloading ? (
    <div className="flex space-x-2 justify-center items-center bg-white h-[600px] dark:invert">
      <span className="sr-only">Loading...</span>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce"></div>
    </div>
  ) : (
    <div className="w-full bg-gray-200 py-10">
      <div className="w-3/4 mx-auto bg-white">
        <div className="px-2 flex justify-between py-4">
          <div className="flex gap-2">
            <div>
              <Link href={"/myVaults/vault/" + vaultAddress}>
                <Button color="gray" className="text-blue-500">
                  <MdClose />
                </Button>{" "}
              </Link>
            </div>
            <div className="text-sm">
              <div className="font-bold">{momentHeadline}</div>
              <div>{mintedDate} GMT</div>
            </div>
          </div>
          <div className="flex gap-2">
            <div>
              <Link href={"/addMoment"}>
                <Button color="gray" className="text-blue-500">
                  Mint Moment
                </Button>
              </Link>
            </div>
            <div>
              <Button color="gray" className="text-blue-500">
                ...
              </Button>
            </div>
          </div>
        </div>
        <div className="px-10 pb-4">
          <div className="flex gap-4">
            {fileType == "image" && (
              <img
                src={cid}
                alt="Preview"
                className="carousel-item w-full h-[584px]"
              />
            )}

            {fileType == "video" && (
              <video
                src={cid}
                controls
                className="carousel-item w-full h-[584px]"
              />
            )}
          </div>

          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              <div className="flex items-center gap-2  py-1  px-2 rounded-lg bg-pink-200 text-pink-400 font-semibold">
                <div>
                  <AiOutlineLike />
                </div>
                <div className="">{!vaultMode ? "Public" : "Private"}</div>
              </div>
              <div className="flex items-center gap-2 bg-gray-300  py-1  px-2 rounded-lg font-semibold">
                {vaultName}
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-gray-300 py-1  px-2 rounded-lg">
                <div>
                  <BsChatRightTextFill />
                </div>
                <div>{commentCnt}</div>
              </div>
              <div
                onClick={() => setShowLikeModal(true)}
                className="flex items-center gap-2 bg-gray-300  py-1  px-2 rounded-lg cursor-pointer"
              >
                <div>
                  <AiOutlineLike />
                </div>
                <div>{momentLikes.length}</div>
              </div>
              <div
                onClick={() => setShowDislikeModal(true)}
                className="flex items-center gap-2 bg-gray-300  py-1  px-2 rounded-lg cursor-pointer"
              >
                <div>
                  <AiOutlineDislike />
                </div>
                <div>{momentDislikes.length}</div>
              </div>
            </div>
          </div>

          <div className="mt-10 p-3">
            <div className="text-3xl font-bold">{momentHeadline}</div>
            <div className="">{momentDescription}</div>
            <div className="flex gap-2 pt-1 items-center">
              <img
                className="rounded-lg h-[25px] w-[25px]"
                src={profileCid}
                alt="Profile"
              />
              <div className="text-sm justify-center item-center">
                {profileName || "Loading..."}
              </div>
            </div>
            {/* <div className="flex gap-2 pt-5">
              <div className="px-2 py-1 bg-gray-200 rounded sm">Selfie</div>
              <div className="px-2 py-1 bg-gray-200 rounded sm">Daily Log</div>
              <div className="px-2 py-1 bg-gray-200 rounded sm">Baby</div>
            </div> */}
          </div>

          <div className="comments h-[auto] p-3">
            <div>
              <div className="text-xl font-bold">Notepad</div>
              <div>{momentNotes}</div>
            </div>
            <div>
              <CommentComponent
                tokenId={tokenId}
                onMessageToParent={handleChildAction}
              />
            </div>
          </div>
        </div>

        {showLikeModal ? (
          <>
            <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
              <div className="relative w-auto my-6 mx-auto max-w-3xl">
                {/*content*/}
                <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                  {/*header*/}
                  <div className="flex items-start justify-between p-5 border-b border-solid border-blueGray-200 rounded-t">
                    <h3 className="text-3xl font-semibold">Liked Members</h3>
                    <button
                      className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                      onClick={() => setShowLikeModal(false)}
                    >
                      <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                        ×
                      </span>
                    </button>
                  </div>
                  {/*body*/}
                  <div className="relative p-6 flex-auto max-h-[600px] w-[400px]">
                    {momentLikes.map((mlike, index) => (
                      <div key={index} className="commentPanelItem my-2">
                        <div className="p-1 flex items-center space-x-3 hover:cursor-pointer">
                          <img
                            src={mlike.cid}
                            alt="Andrew Alfred"
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <h3 className="text-sm font-medium">
                              {mlike.generatedName}
                            </h3>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/*footer*/}
                  <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                    <button
                      className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                      type="button"
                      onClick={() => setShowLikeModal(false)}
                    >
                      Close
                    </button>
                    <button
                      className="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                      type="button"
                      onClick={() => handleLike()}
                    >
                      <div className="flex items-center gap-2 cursor-pointer">
                        <div>
                          <AiOutlineLike />
                        </div>
                        <div>Like</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
          </>
        ) : null}

        {showDislikeModal ? (
          <>
            <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
              <div className="relative w-auto my-6 mx-auto max-w-3xl">
                {/*content*/}
                <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                  {/*header*/}
                  <div className="flex items-start justify-between p-5 border-b border-solid border-blueGray-200 rounded-t">
                    <h3 className="text-3xl font-semibold">Disliked Members</h3>
                    <button
                      className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                      onClick={() => setShowDislikeModal(false)}
                    >
                      <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                        ×
                      </span>
                    </button>
                  </div>
                  {/*body*/}
                  <div className="relative p-6 flex-auto max-h-[600px] w-[400px]">
                    {momentLikes.map((mlike, index) => (
                      <div key={index} className="commentPanelItem my-2">
                        <div className="p-1 flex items-center space-x-3 hover:cursor-pointer">
                          <img
                            src={mlike.cid}
                            alt="Andrew Alfred"
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <h3 className="text-sm font-medium">
                              {mlike.generatedName}
                            </h3>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/*footer*/}
                  <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                    <button
                      className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                      type="button"
                      onClick={() => setShowDislikeModal(false)}
                    >
                      Close
                    </button>
                    <button
                      className="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                      type="button"
                      onClick={() => handleDislike()}
                    >
                      <div className="flex items-center gap-2 cursor-pointer">
                        <div>
                          <AiOutlineDislike />
                        </div>
                        <div>Dislike</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
          </>
        ) : null}
      </div>
      <Toaster />
    </div>
  );
}
