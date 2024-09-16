"use client";

import Image from "next/image";
import { Button } from "flowbite-react";
import React, { useState, useEffect } from "react";
import { FaHeart } from "react-icons/fa6";
import { BsChatLeftTextFill, BsFillShareFill } from "react-icons/bs";
import { AiOutlineLike } from "react-icons/ai";
import { BsChatRightTextFill } from "react-icons/bs";
import { MdInsertComment } from "react-icons/md";
import { MdClose } from "react-icons/md";
import VaultContractABI from "@/artifacts/Vault.json";
import FMT from "@/artifacts/FMT.json";
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
  bytes32ToAddress,
  getUniversalProfileCustomName,
  convertIpfsUriToUrl,
} from "@/utils/format";
import CommentComponent from "@/components/CommentComponent";

const addr: string = "0xDCAaff67152D85BFbC8ABD1e649f9C515a417398";
// Define the types you expect
type URLDataWithHash = {
  url: string;
  hash: string;
};

type Data = string | number | boolean | URLDataWithHash | Data[];

// Type guard to check if the value has a 'url' property
function hasUrlProperty(value: any): value is URLDataWithHash {
  return value && typeof value === "object" && "url" in value;
}

export default function Page({ params }: { params: { slug: string } }) {
  const tokenId = params.slug;
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [showModal, setShowModal] = useState(false);
  const [cid, setCid] = useState<string>();
  const [mintedDate, setMintedDate] = useState<string>();
  const [totalSupply, setTotalSupply] = useState<number>();
  const [myBalance, setMyBalance] = useState<number>();
  const [nftName, setNftName] = useState<string>();
  const [vaultAddress, setVaultAddress] = useState<string>();
  const [nftAddress, setNftAddress] = useState<string>();
  const [nftSymbol, setNftSymbol] = useState<string>();
  const [nftLike, setNftLike] = useState<string>("0");
  const [isDownloading, setIsDownloading] = useState<boolean>(true);
  const [profileName, setProfileName] = useState<string>("");
  const [profileCid, setProfileCid] = useState<string>("");

  useEffect(() => {
    const fetchProfileName = async () => {
      try {
        const profile = await getUniversalProfileCustomName(addr);
        setProfileName(profile.profileName);
        setProfileCid(convertIpfsUriToUrl(profile.cid));
      } catch (error) {
        console.error("Error fetching profile name:", error);
        setProfileName("Unknown");
      }
    };

    fetchProfileName();
  }, []);

  // useEffect(() => {
  //   const fetchNFT = async () => {
  //     if (walletProvider) {
  //       const ethersProvider = new ethers.providers.Web3Provider(
  //         walletProvider,
  //         "any"
  //       );
  //       const signer = ethersProvider.getSigner(address);

  //       const lsp7Contract = new ethers.Contract(
  //         bytes32ToAddress(tokenId),
  //         VaultContractABI.abi,
  //         signer
  //       );

  //       const _balance = await lsp7Contract.balanceOf(address);
  //       setMyBalance(hexToDecimal(_balance._hex));
  //       const _totalSuppy = await lsp7Contract.totalSupply();
  //       setTotalSupply(hexToDecimal(_totalSuppy._hex));
  //       const nftAsset = new ERC725(
  //         lsp4Schema,
  //         bytes32ToAddress(tokenId),
  //         process.env.NEXT_PUBLIC_MAINNET_URL,
  //         {
  //           ipfsGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY,
  //         }
  //       );

  //       const _vaultName = await nftAsset.getData("LSP4TokenName");
  //       setNftName(_vaultName.value as string);
  //       const _vaultSymbol = await nftAsset.getData("LSP4TokenSymbol");
  //       setNftSymbol(_vaultSymbol.value as string);
  //       const nft = await nftAsset.getData("LSP4Metadata");
  //       let ipfsHash;
  //       if (hasUrlProperty(nft?.value)) {
  //         ipfsHash = nft.value.url;
  //       } else {
  //         // Handle the case where vault?.value does not have a 'url' property
  //         console.log("The value does not have a 'url' property.");
  //       }
  //       const encryptionKey = await generateEncryptionKey(
  //         process.env.NEXT_PUBLIC_ENCRYPTION_KEY!
  //       );
  //       const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
  //       if (!response.ok) {
  //         throw new Error("Failed to fetch image from IPFS");
  //       }
  //       const encryptedData = await response.arrayBuffer();
  //       const decryptedData = await decryptFile(
  //         new Uint8Array(encryptedData),
  //         encryptionKey
  //       );
  //       const blob = new Blob([decryptedData]); // Creating a blob from decrypted data
  //       const objectURL = URL.createObjectURL(blob);
  //       setCid(objectURL);

  //       const creator = await lsp7Contract.owner();
  //       setVaultAddress(creator);

  //       setNftAddress(bytes32ToAddress(tokenId));

  //       const VaultContract = new ethers.Contract(
  //         creator,
  //         VaultContractABI.abi,
  //         signer
  //       );
  //       const unixMintedDates = await VaultContract.mintingDates(
  //         bytes32ToAddress(tokenId)
  //       );
  //       const md = convertUnixTimestampToCustomDate(
  //         unixMintedDates,
  //         "yyyy-MM-dd HH:mm"
  //       );
  //       setMintedDate(md);

  //       const likes = await VaultContract.getLikes(tokenId);
  //       setNftLike(likes.length);

  //       setIsDownloading(true);
  //     }
  //   };
  //   fetchNFT();
  // }, [isConnected, address, walletProvider]);

  const handleLike = async () => {
    if (walletProvider) {
      const ethersProvider = new ethers.providers.Web3Provider(
        walletProvider,
        "any"
      );
      const signer = ethersProvider.getSigner(address);

      const lsp7Contract = new ethers.Contract(
        bytes32ToAddress(tokenId),
        VaultContractABI.abi,
        signer
      );
      const creator = await lsp7Contract.owner();

      const VaultContract = new ethers.Contract(
        creator,
        VaultContractABI.abi,
        signer
      );

      const likesA = await VaultContract.getLikes(tokenId);
      if (likesA.includes(address)) {
        alert("Already liked");
      } else {
        await VaultContract.like(tokenId);
        const likesB = await VaultContract.getLikes(tokenId);
        setNftLike(likesB.length);
        alert("Like Success");
      }
    } else {
      alert("Connect the wallet");
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
        VaultContractABI.abi,
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

  return !isDownloading ? (
    <div className="flex space-x-2 justify-center items-center bg-white h-screen dark:invert">
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
              <Button color="gray" className="text-blue-500">
                <MdClose />
              </Button>
            </div>
            <div className="text-sm">
              <div className="font-bold">Moment Title</div>
              <div>02 July 2024 -21:32:15 GMT</div>
            </div>
          </div>
          <div className="flex gap-2">
            <div>
              <Button color="gray" className="text-blue-500">
                Mint Moment
              </Button>
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
            <div className="w-full h-[600px] rounded border-8 border-indigo-100 shadow-lg shadow-gray-500/50">
              <img
                className="carousel-item w-full h-[584px]"
                // src={cid}
                src={
                  "https://ipfs.io/ipfs/QmUFdzhf91QBpkwksC1eZA3WF9PaL1dPhZ5morxq11B9c3"
                }
                alt="moment image"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              <div className="flex items-center gap-2  py-1  px-2 rounded-lg bg-pink-200 text-pink-400 font-semibold">
                <div>
                  <AiOutlineLike />
                </div>
                <div className="">Public</div>
              </div>
              <div className="flex items-center gap-2 bg-gray-300  py-1  px-2 rounded-lg font-semibold">
                Daily Selfie
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-gray-300  py-1  px-2 rounded-lg">
                <div>
                  <AiOutlineLike />
                </div>
                <div>8</div>
              </div>
              <div className="flex items-center gap-2 bg-gray-300 py-1  px-2 rounded-lg">
                <div>
                  <BsChatRightTextFill />
                </div>
                <div>123</div>
              </div>
            </div>
          </div>

          <div className="mt-10 p-3">
            <div className="text-3xl font-bold">Daddy day care!</div>
            <div className="">
              My first selfie on the blockchain, time to log my journey for
              asdflsadkjflk
            </div>
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
            <div className="flex gap-2 pt-5">
              <div className="px-2 py-1 bg-gray-200 rounded sm">Selfie</div>
              <div className="px-2 py-1 bg-gray-200 rounded sm">Daily Log</div>
              <div className="px-2 py-1 bg-gray-200 rounded sm">Baby</div>
            </div>
          </div>

          <div className="comments h-[auto] p-3">
            <div>
              <div className="text-xl font-bold">Notepad</div>
              <div>
                LUKSO is a new layer-1 EVM blockchain built for social, culture
                and creators. It is the foundation to unify your digital life
                through a smart profile and is an open, permissionless
                playground for decentralized applications to flourish. LUKSO
                offers an innovative approach to form the basis for managing
                your online presence while enabling unexplored ways to connect
                and co-create the next era of the internet.
              </div>
            </div>
            <div>
              <CommentComponent />
            </div>
          </div>
        </div>

        {showModal ? (
          <>
            <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
              <div className="relative w-auto my-6 mx-auto max-w-3xl">
                {/*content*/}
                <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
                  {/*header*/}
                  <div className="flex items-start justify-between p-5 border-b border-solid border-blueGray-200 rounded-t">
                    <h3 className="text-3xl font-semibold">Send Asset</h3>
                    <button
                      className="p-1 ml-auto bg-transparent border-0 text-black opacity-5 float-right text-3xl leading-none font-semibold outline-none focus:outline-none"
                      onClick={() => setShowModal(false)}
                    >
                      <span className="bg-transparent text-black opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                        ×
                      </span>
                    </button>
                  </div>
                  {/*body*/}
                  <div className="relative p-6 flex-auto">
                    <div>
                      <div className="text-xl">Address:</div>
                      <div>
                        <input
                          className="border-2 w-full p-1"
                          placeholder="0x12345..."
                          type="text"
                        />
                      </div>
                    </div>
                    <div className="pt-6 text-xl">
                      <div>Amount:</div>
                      <div>
                        <input
                          className="border-2 w-full p-1"
                          placeholder="2"
                          type="text"
                        />
                      </div>
                    </div>
                  </div>
                  {/*footer*/}
                  <div className="flex items-center justify-end p-6 border-t border-solid border-blueGray-200 rounded-b">
                    <button
                      className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                      type="button"
                      onClick={() => setShowModal(false)}
                    >
                      Close
                    </button>
                    <button
                      className="bg-emerald-500 text-white active:bg-emerald-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                      type="button"
                      onClick={() => handleSend()}
                    >
                      Send
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
  );
}
