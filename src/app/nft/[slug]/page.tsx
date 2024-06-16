"use client";

import React, { useState, useEffect } from "react";
import { FaHeart } from "react-icons/fa6";
import { BsChatLeftTextFill, BsFillShareFill } from "react-icons/bs";
import ForeverMemoryCollection from "@/artifacts/ForeverMemoryCollection.json";
import FMT from "@/artifacts/FMT.json";
import { useConnectWallet } from "@web3-onboard/react";
import { ethers } from "ethers";
import { ERC725 } from "@erc725/erc725.js";
import lsp4Schema from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
import { generateEncryptionKey, decryptFile } from "@/utils/upload";
import {
  convertUnixTimestampToCustomDate,
  hexToDecimal,
  bytes32ToAddress,
} from "@/utils/format";

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
  const [{ wallet }] = useConnectWallet();
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
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    fetchNFT();
  }, [wallet]);

  const fetchNFT = async () => {
    if (wallet) {
      const ethersProvider = new ethers.providers.Web3Provider(
        wallet.provider,
        "any"
      );
      const owner = wallet.accounts[0].address;
      const signer = ethersProvider.getSigner(owner);

      const lsp7Contract = new ethers.Contract(
        bytes32ToAddress(tokenId),
        ForeverMemoryCollection.abi,
        signer
      );

      const _balance = await lsp7Contract.balanceOf(owner);
      setMyBalance(hexToDecimal(_balance._hex));
      const _totalSuppy = await lsp7Contract.totalSupply();
      setTotalSupply(hexToDecimal(_totalSuppy._hex));
      const nftAsset = new ERC725(
        lsp4Schema,
        bytes32ToAddress(tokenId),
        process.env.NEXT_PUBLIC_DEVELOPMENT_ENVIRONMENT_TYPE == "1"
          ? process.env.NEXT_PUBLIC_MAINNET_URL
          : process.env.NEXT_PUBLIC_TESTNET_URL,
        {
          ipfsGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY,
        }
      );

      const _vaultName = await nftAsset.getData("LSP4TokenName");
      setNftName(_vaultName.value as string);
      const _vaultSymbol = await nftAsset.getData("LSP4TokenSymbol");
      setNftSymbol(_vaultSymbol.value as string);
      const nft = await nftAsset.getData("LSP4Metadata");
      let ipfsHash;
      if (hasUrlProperty(nft?.value)) {
        ipfsHash = nft.value.url;
      } else {
        // Handle the case where vault?.value does not have a 'url' property
        console.log("The value does not have a 'url' property.");
      }
      const encryptionKey = await generateEncryptionKey(
        process.env.NEXT_PUBLIC_ENCRYPTION_KEY!
      );
      const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
      if (!response.ok) {
        throw new Error("Failed to fetch image from IPFS");
      }
      const encryptedData = await response.arrayBuffer();
      const decryptedData = await decryptFile(
        new Uint8Array(encryptedData),
        encryptionKey
      );
      const blob = new Blob([decryptedData]); // Creating a blob from decrypted data
      const objectURL = URL.createObjectURL(blob);
      setCid(objectURL);

      const creator = await lsp7Contract.owner();
      setVaultAddress(creator);

      setNftAddress(bytes32ToAddress(tokenId));

      const VaultContract = new ethers.Contract(
        creator,
        ForeverMemoryCollection.abi,
        signer
      );
      const unixMintedDates = await VaultContract.mintingDates(
        bytes32ToAddress(tokenId)
      );
      const md = convertUnixTimestampToCustomDate(
        unixMintedDates,
        "yyyy-MM-dd HH:mm"
      );
      setMintedDate(md);

      const likes = await VaultContract.getLikes(tokenId);
      setNftLike(likes.length);

      setIsDownloading(true);
    }
  };

  const handleLike = async () => {
    if (wallet) {
      const ethersProvider = new ethers.providers.Web3Provider(
        wallet.provider,
        "any"
      );
      const owner = wallet.accounts[0].address;
      const signer = ethersProvider.getSigner(owner);

      const lsp7Contract = new ethers.Contract(
        bytes32ToAddress(tokenId),
        ForeverMemoryCollection.abi,
        signer
      );
      const creator = await lsp7Contract.owner();

      const VaultContract = new ethers.Contract(
        creator,
        ForeverMemoryCollection.abi,
        signer
      );

      const likesA = await VaultContract.getLikes(tokenId);
      if (likesA.includes(owner)) {
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
    if (wallet) {
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
        wallet.provider,
        "any"
      );
      const owner = wallet.accounts[0].address;
      const signer = ethersProvider.getSigner(owner);

      const lsp7Contract = new ethers.Contract(
        bytes32ToAddress(tokenId),
        ForeverMemoryCollection.abi,
        signer
      );

      const tokenOwner = await lsp7Contract.owner();
      const tokenIds = await lsp7Contract.tokenIdsOf(tokenOwner);
      console.log("tokenIds", tokenIds);

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
      <div className="w-3/4 mx-auto">
        <div className="flex gap-4">
          <div className="w-2/3 h-[600px] rounded border-8 border-indigo-100 shadow-lg shadow-gray-500/50">
            <img
              className={`carousel-item w-full h-[584px]`}
              src={cid}
              alt=""
            />
          </div>
          <div className="w-1/3">
            <div className="datePanel rounded flex bg-gray-300 p-3 mb-6 flex justify-between shadow-lg shadow-gray-500/50">
              <div className="font-bold text-xl">Memory Upload</div>
              <div className="w-[150px] h-[30px] flex items-center justify-end">
                {mintedDate}
              </div>
            </div>
            <div className="p-3 rounded bg-white shadow-lg shadow-gray-500/50 rounded">
              <div className="flex gap-4">
                <div className="p-1 bg-indigo-500 rounded sm text-white justify-center flex w-[55px] h-[30px]">
                  <button
                    onClick={handleLike}
                    className="flex items-center justify-center h-full gap-1"
                  >
                    <FaHeart />
                    {nftLike}
                  </button>
                </div>
                <div className="p-1 bg-indigo-500 rounded sm text-white justify-center flex w-[55px] h-[30px]">
                  <div className="flex items-center justify-center h-full gap-1">
                    <BsChatLeftTextFill />
                    25
                  </div>
                </div>
                <div className="p-1 bg-emerald-500 rounded sm text-white font-normal">
                  $FMT 245
                </div>
              </div>
              <div className="pt-6 text-xl font-normal">Section Title</div>
              <div className="pt-2 pb-6 h-[100px]">some text here</div>
              <div className="btnGroup flex justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowModal(true)}
                    className="p-1 bg-blue-500 text-white text-center w-[100px] shadow-lg shadow-gray-500/50 rounded"
                  >
                    Send Asset
                  </button>
                  <button className="border-2 border-blue-500 text-center text-blue-500 p-1 w-[100px] shadow-lg shadow-gray-500/50 rounded">
                    Auction
                  </button>
                </div>

                <div className="border-gray-200 border-2 h-[40px] w-[40px] rounded-full cursor-pointer hover:bg-gray-200">
                  <div className="flex items-center justify-center h-full">
                    <BsFillShareFill />
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded shadow-lg shadow-gray-500/50 rounded mt-10 p-3">
              <div className="flex justify-between">
                <div className="text-xl font-bold">Blockchain Secured</div>
                <div className="bg-pink-500 w-[50px] h-[30px] rounded text-white">
                  <div className="flex items-center justify-center h-full">
                    LSP7
                  </div>
                </div>
              </div>
              <div className="py-1">
                <span className="font-bold">{myBalance}</span> Collection of{" "}
                <span className="font-bold">{totalSupply}</span>
              </div>
              <div className="py-1">
                <div>Contract Address</div>
                <div className="text-sm">{nftAddress}</div>
              </div>
              <div className="py-1">
                <div>Creator</div>
                <div className="text-sm">{vaultAddress}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded bg-white mt-10 p-3 rounded shadow-lg shadow-gray-500/50">
          <div className="text-3xl font-bold">
            Headline description Day 1 Selfie
          </div>
          <div className="">
            My first selfie on the blockchain, time to log my journey for
            asdflsadkjflk
          </div>
          <div className="flex gap-2 pt-5">
            <div className="p-1 bg-indigo-200 rounded sm">Shared</div>
            <div className="p-1 bg-gray-200 rounded sm">Personal</div>
            <div className="p-1 bg-pink-200 rounded sm">Selfie</div>
          </div>
        </div>

        <div className="comments rounded bg-white h-[400px] mt-10 rounded shadow-lg shadow-gray-500/50 mb-6 p-3">
          <div className="text-3xl font-bold">Comments</div>
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
