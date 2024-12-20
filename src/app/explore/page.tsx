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
import VaultABI from "@/artifacts/Vault.json";
import { hexToDecimal, getCategoryOptions } from "@/utils/format";

import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import "./index.css";

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
  // const [categoryCounts, setCategoryCounts] = useState<number[]>([]); // To store counts of each category
  const { walletProvider } = useWeb3ModalProvider();
  const upWalletAddress = address
    ? address
    : process.env.NEXT_PUBLIC_SUPER_ADMIN_ADDRESS;
  console.log("upWalletAddress", upWalletAddress);

  // const walletP =
  const categories = getCategoryOptions();
  const selectedCategoryButtonStyle =
    "px-4 py-2 rounded-md cursor-pointer flex items-center justify-center bg-gray-300 hover:bg-gray-200 text-gray-800 relative";
  const categoryButtonStyle =
    "px-4 py-2 rounded-md cursor-pointer flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-200 relative";

  useEffect(() => {
    const fetchVault = async () => {
      const ethersProvider = new ethers.providers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_MAINNET_URL
      );

      const VaultContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as string,
        VaultABI.abi,
        ethersProvider
      );

      const VaultFactoryContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_VAULT_FACTORY_CONTRACT_ADDRESS as string,
        VaultFactoryABI.abi,
        ethersProvider
      );

      const joinedPublicVaults = await VaultFactoryContract.getVaultsByCategory(
        0,
        upWalletAddress,
        0,
        true
      );
      const unJoinedPublicVaults =
        await VaultFactoryContract.getVaultsByCategory(
          0,
          upWalletAddress,
          0,
          false
        );

      const vaultList = [...joinedPublicVaults, ...unJoinedPublicVaults];

      const vaults: Vault[] = [];
      if (vaultList)
        for (let i = 0; i < vaultList.length; i++) {
          const data = await VaultFactoryContract.getVaultMetadata(
            vaultList[i]
          );

          const momentCount = await VaultContract.getNFTcounts(vaultList[i]);

          vaults.push({
            name: data.title,
            description: data.description,
            cid: data.imageURI,
            moments: hexToDecimal(momentCount._hex),
            members: hexToDecimal(data.memberCount._hex),
            owner: data.vaultOwner,
            vaultAddress: vaultList[i],
            vaultMode: data.vaultMode,
          });
        }

      setVaultData(vaults);
      setIsDownloading(true);
    };

    fetchVault();
  }, []); // Added address and walletProvider to dependencies

  const handleCategory = async (index: number) => {
    setCategoryIndex(index);

    const ethersProvider = new ethers.providers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_MAINNET_URL
    );

    const VaultFactoryContract = new ethers.Contract(
      process.env.NEXT_PUBLIC_VAULT_FACTORY_CONTRACT_ADDRESS as string,
      VaultFactoryABI.abi,
      ethersProvider
    );

    const VaultContract = new ethers.Contract(
      process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as string,
      VaultABI.abi,
      ethersProvider
    );

    let categoryVaults;
    if (index === 0) {
      const joinedPublicVaults = await VaultFactoryContract.getVaultsByCategory(
        0,
        upWalletAddress,
        0,
        true
      );
      const unJoinedPublicVaults =
        await VaultFactoryContract.getVaultsByCategory(
          0,
          upWalletAddress,
          0,
          false
        );

      categoryVaults = [...joinedPublicVaults, ...unJoinedPublicVaults];
    } else {
      const joinedPublicVaults = await VaultFactoryContract.getVaultsByCategory(
        index,
        upWalletAddress,
        0,
        true
      );
      const unJoinedPublicVaults =
        await VaultFactoryContract.getVaultsByCategory(
          index,
          upWalletAddress,
          0,
          false
        );

      categoryVaults = [...joinedPublicVaults, ...unJoinedPublicVaults];
    }

    const vaults: Vault[] = [];
    for (let i = 0; i < categoryVaults.length; i++) {
      const data = await VaultFactoryContract.getVaultMetadata(
        categoryVaults[i]
      );

      const momentCount = await VaultContract.getNFTcounts(categoryVaults[i]);

      vaults.push({
        name: data.title,
        description: data.description,
        cid: data.imageURI,
        moments: hexToDecimal(momentCount._hex),
        members: hexToDecimal(data.memberCount._hex),
        owner: data.vaultOwner,
        vaultAddress: categoryVaults[i],
        vaultMode: data.vaultMode,
      });
    }

    setVaultData(vaults);
  };

  return !isDownloading ? (
    <div className="flex flex-col justify-center items-center bg-black min-h-screen text-gray-200">
      <div className="flex space-x-2 justify-center items-center">
        <div
          className="h-8 w-8 rounded-full animate-bounce [animation-delay:-0.3s]"
          style={{
            backgroundImage:
              "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
          }}
        ></div>
        <div
          className="h-8 w-8 rounded-full animate-bounce [animation-delay:-0.15s]"
          style={{
            backgroundImage:
              "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
          }}
        ></div>
        <div
          className="h-8 w-8 rounded-full animate-bounce"
          style={{
            backgroundImage:
              "radial-gradient(circle at top left, #1E3A8A, #60A5FA)",
          }}
        ></div>
      </div>
      <div className="flex flex-col items-center text-center max-w-[360px] mx-auto">
        <p className="text-lg mt-8">Loading public collections</p>
        <p className="text-base mt-2">This can take a few moments</p>
      </div>
    </div>
  ) : (
    <main
      className="relative min-h-screen overflow-hidden bg-black"
      style={{
        background: "radial-gradient(circle at top left, #041420, #000000)",
      }}
    >
      <div className="container mx-auto max-w-6xl py-24 lg:py-32 px-4 lg:px-0">
        <div className="flex gap-2">
          <Swiper
            slidesPerView={"auto"}
            spaceBetween={8}
            navigation={true}
            modules={[Navigation]}
            className="mySwiper"
          >
            {categories.map((category, index) => (
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
                {/* {categoryCounts[index] !== undefined && (
                  <span className="ml-2 bg-gray-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {categoryCounts[index]}
                  </span>
                )} */}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
          {vaultData.map((vault, index) => (
            <div key={index}>
              <VaultCard vault={vault} href="explore" />
            </div>
          ))}
        </div>

        {!vaultData.length && (
          <div className="text-center text-gray-200 mt-10 space-y-4">
            <div>
              <img 
                src="https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExc2hzb2RqdmV3MnNkNzdkdmx1ZGFxZ2c2cnJuZ2ZlMTZwNnN3NnV1YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xUPJPzcdlbvaFUrF7y/giphy.gif"
                alt="Oh no Spongbob gif"
                className="mx-auto w-96 h-auto"
              />
            </div>
            <div className="text-xl font-medium">
              There are no collections here yet!
            </div>
            <div className="text-base">
              Create a new one to get the party started 🎉
            </div>
            <div className="pt-3 flex justify-center items-center">
              <Link href={"/createVault"}>
                <button className="px-6 py-3 bg-primary-600 text-white rounded-lg shadow-md hover:bg-primary-500">
                  Create new collection
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
