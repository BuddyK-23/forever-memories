"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ERC725 } from "@erc725/erc725.js";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers5/react";
import { hexToDecimal, convertIpfsUriToUrl } from "@/utils/format";
import LSP3Schema from "@erc725/erc725.js/schemas/LSP3ProfileMetadata.json";
import FMT from "@/artifacts/FMT.json";

const FMTContractAddress = "0x186f3468Ff169AEe9c7E72ABEF83c2c6aDB5D5cc";

interface LSP3Profile {
  name: string;
  description: string;
  profileImage?: { url: string }[];
  backgroundImage?: { url: string }[];
  tags?: string[];
  links?: string[];
}

interface DecodedProfileMetadata {
  value: {
    LSP3Profile: LSP3Profile;
  };
}

export default function Profile() {
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [fmtBalance, setFmtBalance] = useState<number>(0);
  const [lyxBalance, setLyxBalance] = useState<string>("");
  const [profile, setProfile] = useState<LSP3Profile | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  useEffect(() => {
    fetchNFT();
  }, [address]);

  const fetchNFT = async () => {
    if (walletProvider) {
      const ethersProvider = new ethers.providers.Web3Provider(
        walletProvider,
        "any"
      );
      const signer = ethersProvider.getSigner(address);
      const _lyxBalance = await ethersProvider.getBalance(address as string);
      const lyxBalance = ethers.utils.formatEther(_lyxBalance);
      setLyxBalance(lyxBalance);

      const erc725js = new ERC725(
        LSP3Schema,
        address,
        process.env.NEXT_PUBLIC_MAINNET_URL,
        {
          ipfsGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY,
        }
      );

      const result = await erc725js.fetchData("LSP3Profile");
      const decodedProfileMetadata =
        result as unknown as DecodedProfileMetadata;
      console.log("result", decodedProfileMetadata.value.LSP3Profile.name); 

      if (
        decodedProfileMetadata.value &&
        decodedProfileMetadata.value.LSP3Profile
      ) {
        setProfile(decodedProfileMetadata.value.LSP3Profile);
      }

      const FMTContract = new ethers.Contract(
        FMTContractAddress,
        FMT.abi,
        signer
      );
      const _balance = await FMTContract.balanceOf(address);
      setFmtBalance(hexToDecimal(_balance._hex));

      setIsDownloading(true);
    }
  };

  return !isDownloading ? (
    <div className="flex space-x-2 justify-center items-center bg-gray-200 h-screen dark:invert">
      <span className="sr-only">Loading...</span>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce"></div>
    </div>
  ) : (
    <main className="flex flex-col items-center justify-between p-24">
      <h1 className="text-2xl font-bold mb-6">{profile?.name}</h1>
      <h1 className="text-2xl font-bold mb-6">{address}</h1>
      <h1 className="text-2xl font-bold mb-6">{fmtBalance} FMT</h1>
      <h1 className="text-2xl font-bold mb-6">{lyxBalance} LYX</h1>
      <div
        className="relative bg-cover bg-center h-[400px] w-full"
        style={{
          backgroundImage:
            profile?.backgroundImage && profile.backgroundImage[0]?.url
              ? `url('` +
                convertIpfsUriToUrl(profile.backgroundImage[0].url) +
                `')`
              : undefined,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {profile?.profileImage && profile.profileImage[0]?.url ? (
              <img
                src={convertIpfsUriToUrl(profile.profileImage[0].url)}
                alt="Profile Avatar"
                width={150}
                height={150}
                className="rounded-full border-4 border-white"
              />
            ) : (
              <div className="h-[150px] w-[150px] bg-gray-200 rounded-full border-4 border-white flex items-center justify-center">
                <span className="text-gray-500">No Image</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
