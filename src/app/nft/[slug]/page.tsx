"use client";

import { Button } from "flowbite-react";
import React, { useState, useEffect } from "react";
import { FaHeart, FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import { BsChatLeftTextFill, BsFillShareFill, BsChatLeftText } from "react-icons/bs";
import { AiOutlineLike, AiOutlineDislike, AiOutlineComment } from "react-icons/ai";
import { BsChatRightTextFill } from "react-icons/bs";
import { MdClose, MdFullscreen, MdDownload, MdInsertComment } from "react-icons/md";
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
import "./index.css"; 

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
  const [isMember, setIsMember] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);


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
      const memberList = await VaultFactoryContract.getVaultMembers(
        _vaultAddress
      );

      const _isMember = memberList.includes(address) ? true : false;
      setIsMember(_isMember);

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
      setMintedDate(md);

      const likes = await VaultAssistContract.getLikes(tokenId);
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

      const disikes = await VaultAssistContract.getDislikes(tokenId);
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
    if (!isMember) {
      toast.error("Please join this vault!");
      return;
    }
    if (walletProvider) {
      const ethersProvider = new ethers.providers.Web3Provider(
        walletProvider,
        "any"
      );
      const signer = ethersProvider.getSigner(address);

      const VaultAssistContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_VAULT_ASSIST_CONTRACT_ADDRESS as string,
        VaultAssistABI.abi,
        signer
      );
      const likes_ = await VaultAssistContract.getLikes(tokenId);
      if (likes_.includes(address)) {
        toast.success("Already liked!");
      } else {
        setIsDownloading(false);
        await VaultAssistContract.like(tokenId);
        const likes = await VaultAssistContract.getLikes(tokenId);
        init();
        setShowLikeModal(false);
        toast.success("Like added to Moment");
      }
    } else {
      toast.error("Connect the wallet");
      setIsDownloading(true);
    }
  };

  const handleDislike = async () => {
    if (!isMember) {
      toast.error("Please join this vault!");
      return;
    }
    if (walletProvider) {
      const ethersProvider = new ethers.providers.Web3Provider(
        walletProvider,
        "any"
      );
      const signer = ethersProvider.getSigner(address);

      const VaultAssistContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_VAULT_ASSIST_CONTRACT_ADDRESS as string,
        VaultAssistABI.abi,
        signer
      );

      const dislikes_ = await VaultAssistContract.getDislikes(tokenId);
      if (dislikes_.includes(address)) {
        toast.success("Already disliked!");
      } else {
        setIsDownloading(false);
        console.log(1);
        const dislikes = await VaultAssistContract.dislike(tokenId);
        init();
        setShowDislikeModal(false);
        toast.success("Dislike added to Moment");
      }
    } else {
      toast.error("Connect the wallet");
      setIsDownloading(true);
    }
  };

  const handleDownload = () => {
    if (!cid) {
      console.error("CID is undefined, cannot download.");
      return;
    }
    
    const link = document.createElement("a");
    link.href = cid;
    link.download = "moment.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
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
        <p className="text-lg mt-8">Taking you to the moment</p>
        <p className="text-base mt-2 italic">&quot;Every moment is a memory in the making&quot;</p>
      </div>
    </div>
  ) : (
    <main
      className="relative min-h-screen overflow-hidden bg-black"
      style={{
        background: "radial-gradient(circle at top left, #041420, #000000)",
      }}
    >
      {/* Animated Balls */}
      <div className="animated-balls">
        <div className="ball ball1"></div>
        <div className="ball ball2"></div>
        <div className="ball ball3"></div>
      </div>

      <div className="container mx-auto max-w-6xl py-24 lg:py-32 px-4 lg:px-0 flex flex-col lg:flex-row lg:gap-6">
      
      
        
        {/* Left Section: Main Image */}
        <div
          className={`relative ${
            isFullScreen ? "w-full h-screen bg-black" : "flex-grow basis-2/3"
          }`}
        >
          
          <div
            className={`relative ${
              isFullScreen ? "w-full h-full bg-gray-900/60" : "w-full h-[640px] bg-black/80"
            } rounded-lg overflow-hidden`}
          >
            {fileType === "image" && (
              <img
                src={cid}
                alt="Moment"
                className={`w-full ${
                  isFullScreen ? "h-full object-contain" : "h-[640px] object-contain"
                }`}
              />
            )}
            {fileType === "video" && (
              <video
                src={cid}
                controls
                className={`w-full ${
                  isFullScreen ? "h-full object-contain" : "h-[640px] object-contain"
                }`}
              />
            )}
          </div>

          {/* Navigation, Expand, Download, and Close */}
          <div className={`absolute top-4 flex items-center space-x-2 ${isFullScreen ? "left-4" : "left-4"}`}>
            <Link href={"/myVaults"}>
              <Button className="bg-gray-800/50 hover:bg-gray-700/80 rounded-full py-2">
                <MdClose size={20} />
              </Button>
            </Link>
            {/* <Button className="bg-gray-800/50 hover:bg-gray-700/50 rounded-full py-2">
              <FaChevronLeft size={20} />
            </Button>
            <Button className="bg-gray-800/50 hover:bg-gray-700/50 rounded-full py-2">
              <FaChevronRight size={20} />
            </Button> */}
          </div>
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            {/* <Button onClick={toggleFullScreen} className="bg-gray-800/50 hover:bg-gray-700/80 rounded-full py-2">
              <MdFullscreen size={20} />
            </Button> */}
            <Button onClick={handleDownload} className="bg-gray-800/50 hover:bg-gray-700/80 rounded-full py-2">
              <MdDownload size={20} />
            </Button>
          </div>
        </div>

        {/* Right Section: Details */}
        <div className="flex-grow basis-1/3 flex flex-col justify-between space-y-6 text-gray-200 p-4 bg-gray-900 rounded-lg md:min-h-[640px]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col space-y-2 gap-2 ">
              {/* Tags */}
              <div className="flex space-x-2 justify-between">
                <div className="flex space-x-2">
                  <span className="flex px-3 py-1 bg-gray-800 text-sm items-center rounded-md">{!vaultMode ? "Public" : "Private"}</span>
                  <span className="flex px-3 py-1 bg-gray-800 text-sm rounded-md items-center truncate">{vaultName}</span>
                </div>
                <div className="flex gap-2 items-center">
                  <img
                    className="rounded-full h-8 w-8 object-cover"
                    src={profileCid}
                    alt="Profile"
                  />
                  {/* <div className=" text-gray-200 text-base">
                    {profileName || "Loading..."}
                  </div> */}
                </div>
              </div>
              {/* Headline, Description and Owner */}
              
              
              <div className="gap-1">
                <h1 className="text-3xl text-balance font-bold">{momentHeadline}</h1>
                <p className="text-sm text-gray-400 mb-4">Added on {mintedDate}</p>
                <p className="text-wrap text-gray-200 whitespace-pre-wrap">{momentDescription}</p>
                
              </div>
            </div>

            {/* Likes, Dislikes, Comments */}
            <div className="flex space-x-2 items-center border-t pt-5">
              <div 
                onClick={() => setShowLikeModal(true)}
                className="flex items-center space-x-2 bg-gray-700 py-2 px-4 rounded-lg hover:cursor-pointer hover:bg-gray-600 z-50"
              >
                <AiOutlineLike />
                <span>{momentLikes.length}</span>
              </div>
              <div 
                className="flex items-center space-x-2 bg-gray-700 py-2 px-4 rounded-lg hover:cursor-pointer hover:bg-gray-600 z-50"
                onClick={() => setShowDislikeModal(true)}
              >
                <AiOutlineDislike />
                <span>{momentDislikes.length}</span>
              </div>
              <div className="flex items-center space-x-2 bg-gray-700 py-2 px-4 rounded-lg">
                <AiOutlineComment />
                <span>{commentCnt}</span>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="w-full">
            <div className="z-50">
              {/* <h2 className="text-xl font-bold mb-3">Comments</h2> */}
              <CommentComponent 
                tokenId={tokenId}
                isMember={isMember}
                onMessageToParent={handleChildAction}
              />
            </div>
          </div>

          {/* <div>{momentNotes}</div> */}

          {showLikeModal ? (
            <>
              <div className="justify-center items-start flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 shadow-md-light">
                <div className="relative w-auto my-6 mx-auto max-w-4xl mt-32">
                  {/*content*/}
                  <div className="rounded-lg shadow-md relative flex flex-col w-full bg-gray-700 border-solid border-gray-600 border-2">
                    {/*header*/}
                    <div className="flex text-gray-100 items-start items-center justify-between p-6 border-b border-solid border-gray-500 rounded-t-lg">
                      <h3 className="text-xl">Likes</h3>
                      <button
                        className="ml-auto bg-transparent border-0 float-right leading-none outline-none focus:outline-none"
                        onClick={() => setShowLikeModal(false)}
                      >
                        <span className="bg-transparent h-6 w-6 text-2xl outline-none focus:outline-none">
                          ×
                        </span>
                      </button>
                    </div>
                    {/*body*/}
                    <div className="relative p-6 flex-auto max-h-[600px] sm:w-[600px] w-full overflow-y-auto">
                      {momentLikes.length
                        ? momentLikes.map((mlike, index) => (
                            <div key={index} className="commentPanelItem my-2">
                              <div className="p-1 flex items-center justify-start  space-x-3">
                                <img
                                  src={mlike.cid}
                                  alt="Universal Profile"
                                  className="w-10 h-10 object-cover rounded-full"
                                />
                                <div>
                                  <h3 className="text-base text-gray-200">
                                    {mlike.generatedName}
                                  </h3>
                                </div>
                              </div>
                            </div>
                          ))
                        : "No likes yet"}
                    </div>
                    {/*footer*/}
                    <div className="flex items-center justify-end p-6 border-t border-solid border-gray-500 rounded-b-lg">
                      <button
                        className="bg-primary-600 text-gray-200 hover:bg-primary-500 px-6 py-3 rounded-lg shadow-md"
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
              <div className="opacity-80 fixed inset-0 z-60 bg-black"></div>
            </>
          ) : null}

          {showDislikeModal ? (
            <>
              <div className="justify-center items-start flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 shadow-md-light">
                <div className="relative w-auto my-6 mx-auto max-w-4xl mt-32">
                  {/*content*/}
                  <div className="rounded-lg shadow-md relative flex flex-col w-full bg-gray-700 border-solid border-gray-600 border-2">
                    {/*header*/}
                    <div className="flex text-gray-100 items-start items-center justify-between p-6 border-b border-solid border-gray-500 rounded-t-lg">
                      <h3 className="text-xl">Dislikes</h3>
                      <button
                        className="ml-auto bg-transparent border-0 float-right leading-none outline-none focus:outline-none"
                        onClick={() => setShowDislikeModal(false)}
                      >
                        <span className="bg-transparent h-6 w-6 text-2xl outline-none focus:outline-none">
                          ×
                        </span>
                      </button>
                    </div>
                    {/*body*/}
                    <div className="relative p-6 flex-auto max-h-[600px] sm:w-[600px] w-full overflow-y-auto">
                      {momentDislikes.length
                        ? momentDislikes.map((mdlike, index) => (
                            <div key={index} className="commentPanelItem my-2">
                              <div className="p-1 flex items-center justify-start  space-x-3">
                                <img
                                  src={mdlike.cid}
                                  alt="Universal Profile"
                                  className="w-10 h-10 object-cover rounded-full"
                                />
                                <div>
                                  <h3 className="text-base text-gray-200">
                                    {mdlike.generatedName}
                                  </h3>
                                </div>
                              </div>
                            </div>
                          ))
                        : "No dislikes yet"}
                    </div>
                    {/*footer*/}
                    <div className="flex items-center justify-end p-6 border-t border-solid border-gray-500 rounded-b-lg">
                      <button
                        className="bg-primary-600 text-gray-200 hover:bg-primary-500 px-6 py-3 rounded-lg shadow-md"
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
              <div className="opacity-80 fixed inset-0 z-60 bg-black"></div>
            </>
          ) : null}
        </div>
        <Toaster />
      </div>
    </main>
  );
}
