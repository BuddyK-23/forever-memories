"use client";

import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import Link from "next/link";
import VaultCard from "@/components/VaultCard";
import { ethers } from "ethers";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers5/react";
import VaultFactoryABI from "@/artifacts/VaultFactory.json";
import { hexToDecimal } from "@/utils/format";

import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import "./index.css";

interface CategoryOption {
  value: number;
  label: string;
}

const Categories: CategoryOption[] = [
  { value: 0, label: "All" },
  { value: 1, label: "Art & Creativity" },
  { value: 2, label: "Celebrity & Influencer" },
  { value: 3, label: "Culture" },
  { value: 4, label: "Daily Selfie" },
  { value: 5, label: "Environment & Nature" },
  { value: 6, label: "Fashion" },
  { value: 7, label: "Festivals & Events" },
  { value: 8, label: "Food & Drink" },
  { value: 9, label: "Funny" },
  { value: 10, label: "Historical" },
  { value: 11, label: "Humanity" },
  { value: 12, label: "Innovation & Technology" },
  { value: 13, label: "Journalism" },
  { value: 14, label: "Lifestyle & Fitness" },
  { value: 15, label: "Memorial" },
  { value: 16, label: "Music" },
  { value: 17, label: "Pets" },
  { value: 18, label: "Photography" },
  { value: 19, label: "Politics" },
  { value: 20, label: "Science" },
  { value: 21, label: "Sport" },
  { value: 22, label: "Time Capsule" },
  { value: 23, label: "Travel & Adventure" },
  { value: 24, label: "2024" },
  { value: 25, label: "2025" },
];

interface Vault {
  name: string;
  description: string;
  cid: string;
  moments: number;
  members: number;
  owner: string;
  vaultAddress: string;
  vaultMode: number;
}

export default function Explore() {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [categoryIndex, setCategoryIndex] = useState<number>(0);
  const { address, isConnected } = useWeb3ModalAccount();
  const [vaultData, setVaultData] = useState<Vault[]>([]);
  const { walletProvider } = useWeb3ModalProvider();

  const selectedCategoryButtonStyle =
    "px-4 py-2 rounded-md cursor-pointer flex items-center justify-center bg-blue-500 hover:bg-blue-500 text-white hover:text-white";
  const categoryButtonStyle =
    "px-4 py-2 rounded-md cursor-pointer flex items-center justify-center bg-gray-200 hover:bg-blue-500 text-black hover:text-white";

  useEffect(() => {
    fetchNFT();
  }, [isConnected]);

  const fetchNFT = async () => {
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
      const unJoinedVaults = await VaultFactoryContract.getUnjoinedPublicVaults(
        address
      );
      console.log("unJoinedVaults", unJoinedVaults);
      console.log("length", unJoinedVaults.length);
      const vaults: Vault[] = [];
      for (let i = 0; i < unJoinedVaults.length; i++) {
        const data = await VaultFactoryContract.getVaultMetadata(
          unJoinedVaults[i]
        );

        vaults.push({
          name: data.title,
          description: data.description,
          cid: data.imageURI,
          moments: hexToDecimal(data.memberCount._hex),
          members: 78,
          owner: data.vaultOwner,
          vaultAddress: unJoinedVaults[i],
          vaultMode: data.vaultMode,
        });

        console.log(i, " =>", data.title);
      }

      setVaultData(vaults);
      setIsDownloading(true);
    }
  };

  const handleCategory = async (index: number) => {
    setCategoryIndex(index);

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

      let categoryVaults;
      if (index === 0) {
        categoryVaults = await VaultFactoryContract.getUnjoinedPublicVaults(
          address
        );
      } else {
        categoryVaults = await VaultFactoryContract.getVaultsByCategory(
          index,
          address
        );
      }

      const vaults: Vault[] = [];
      for (let i = 0; i < categoryVaults.length; i++) {
        const data = await VaultFactoryContract.getVaultMetadata(
          categoryVaults[i]
        );
        vaults.push({
          name: data.title,
          description: data.description,
          cid: data.imageURI,
          moments: hexToDecimal(data.memberCount._hex),
          members: 78,
          owner: data.vaultOwner,
          vaultAddress: data[i],
          vaultMode: data.vaultMode,
        });
      }

      setVaultData(vaults);
    }
  };

  return !isDownloading ? (
    <div className="flex space-x-2 justify-center items-center bg-white h-screen dark:invert">
      <span className="sr-only">Loading...</span>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce"></div>
    </div>
  ) : (
    <div className="px-6 min-h-screen">
      <div className="pt-10">
        <div className="h-[40px] w-[80px] shadow-lg shadow-gray-500/50 rounded-md cursor-pointer flex items-center justify-center  bg-blue-500 hover:bg-blue-500 text-white">
          <Link href={"/createVault"}>
            <div className="flex items-center justify-center gap-2">New</div>
          </Link>
        </div>
      </div>

      <div className="pt-6 flex gap-2">
        <Swiper
          slidesPerView={"auto"}
          spaceBetween={10}
          navigation={true}
          modules={[Navigation]}
          className="mySwiper"
        >
          {Categories.map((category, index) => (
            <SwiperSlide
              key={index}
              onClick={() => handleCategory(index)}
              className={
                categoryIndex === index
                  ? selectedCategoryButtonStyle
                  : categoryButtonStyle
              }
            >
              {category.label}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="py-10 grid grid-cols-5 gap-4">
        {vaultData.map((vault, index) => (
          <div key={index}>
            <VaultCard vault={vault} href="explore" />
          </div>
        ))}
      </div>
    </div>
  );
}
