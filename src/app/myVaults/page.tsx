"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button, Modal } from "flowbite-react";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { AiOutlinePlusCircle } from "react-icons/ai";
import { ethers } from "ethers";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers5/react";
import VaultCard from "@/components/VaultCard";
import VaultFactoryABI from "@/artifacts/VaultFactory.json";
import VaultABI from "@/artifacts/Vault.json";
import { hexToDecimal, getCategoryOptions } from "@/utils/format";
import toast, { Toaster } from "react-hot-toast";

import { Swiper, SwiperSlide } from "swiper/react";

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

const permissionStyle =
  "flex justify-center gap-1 hover:text-primary-300 cursor-pointer text-base py-2 hover:border-primary-300";

export default function Profile() {
  const [isDownloading, setIsDownloading] = useState<boolean>(true);
  const [openModal, setOpenModal] = useState(false);
  const [vaultData, setVaultData] = useState<Vault[]>([]);
  const [ownerFlag, setOwnerFlag] = useState<boolean>(false);
  const [publicVaultCount, setPublicVaultCount] = useState<number>(0);
  const [privateVaultCount, setPrivateVaultCount] = useState<number>(0);
  const [permissionFlag, setPermissionFlag] = useState<boolean>(false);
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [categoryIndex, setCategoryIndex] = useState<number>(0);
  const [categoryVaultList, setCategoryVaultList] = useState<string[]>([]);
  const [permissionVaultList, setPermissionVaultList] = useState<string[]>([]);

  const categories = getCategoryOptions();

  const selectedCategoryButtonStyle =
    "px-4 py-2 rounded-md cursor-pointer flex items-center justify-center bg-blue-500 hover:bg-blue-500 text-white hover:text-white";
  const categoryButtonStyle =
    "px-4 py-2 rounded-md cursor-pointer flex items-center justify-center bg-gray-200 hover:bg-blue-500 text-black hover:text-white";

  useEffect(() => {
    fetchVaultsByPermissionAndOwner(permissionFlag, ownerFlag);
  }, [isConnected, address, walletProvider]);

  const handleCategory = async (index: number, permissionflag: boolean) => {
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

      let categoryVaults: string[] = [];
      let nonOwnedVaults: string[] = [];
      if (index === 0) {
        if (!ownerFlag) {
          nonOwnedVaults = await VaultFactoryContract.getVaultsByCategory(
            0,
            address,
            permissionflag ? 1 : 0,
            true
          );
        }
        const ownedVaults = await VaultFactoryContract.getVaultsOwnedByUser(
          address,
          permissionflag ? 1 : 0
        );
        categoryVaults = [...nonOwnedVaults, ...ownedVaults];
      } else {
        if (!ownerFlag) {
          nonOwnedVaults = await VaultFactoryContract.getVaultsByCategory(
            index,
            address,
            permissionflag ? 1 : 0,
            true
          );
        }
        const ownedVaults = await VaultFactoryContract.getVaultsOwnedByUser(
          address,
          permissionflag ? 1 : 0
        );
        categoryVaults = [...nonOwnedVaults, ...ownedVaults];
      }
      fetchData(permissionVaultList, categoryVaults, permissionflag);
      setCategoryVaultList(categoryVaults);
    }
  };

  const fetchData = async (
    pVaultList: string[],
    cVaultList: string[],
    permissionflag: boolean
  ) => {
    if (walletProvider) {
      setVaultData([]);
      const ethersProvider = new ethers.providers.Web3Provider(
        walletProvider,
        "any"
      );
      const signer = ethersProvider.getSigner(address);

      const VaultContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as string,
        VaultABI.abi,
        signer
      );

      const VaultFactoryContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_VAULT_FACTORY_CONTRACT_ADDRESS as string,
        VaultFactoryABI.abi,
        signer
      );

      // const vaultList = pVaultList;
      // Use Set for efficient lookup
      const pset = new Set(pVaultList);
      // Filter blist to find common values
      const vaultList = cVaultList.filter((item) => pset.has(item));

      permissionflag
        ? setPrivateVaultCount(vaultList.length)
        : setPublicVaultCount(vaultList.length);

      // Fetch vault metadata
      const vaults: Vault[] = [];
      for (let i = 0; i < vaultList.length; i++) {
        const data = await VaultFactoryContract.getVaultMetadata(vaultList[i]);
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
    }
  };

  const fetchVaultsByPermissionAndOwner = async (
    permissionflag: boolean,
    ownerflag: boolean
  ) => {
    if (walletProvider) {
      setIsDownloading(false);
      const ethersProvider = new ethers.providers.Web3Provider(
        walletProvider,
        "any"
      );
      const signer = ethersProvider.getSigner(address);

      const VaultContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as string,
        VaultABI.abi,
        signer
      );

      const VaultFactoryContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_VAULT_FACTORY_CONTRACT_ADDRESS as string,
        VaultFactoryABI.abi,
        signer
      );

      let vaultList: string[] = []; // Initialize with an empty array

      // Determine which vaults to fetch based on permissionFlag and ownerFlag
      // Private, owner
      if (permissionflag && ownerflag) {
        // Private vaults owned by the user
        vaultList = await VaultFactoryContract.getVaultsOwnedByUser(
          address,
          false // `false` indicates private vaults
        );
      } else if (permissionflag && !ownerflag) {
        // Private vaults the user has access to but does not own
        const nonOwnedVaultList = await VaultFactoryContract.getVaultsByUser(
          address,
          false // `false` indicates private vaults
        );
        const ownedVaultList = await VaultFactoryContract.getVaultsOwnedByUser(
          address,
          false
        );
        vaultList = [...nonOwnedVaultList, ...ownedVaultList];
      } else if (!permissionflag && ownerflag) {
        // Public vaults owned by the user
        vaultList = await VaultFactoryContract.getVaultsOwnedByUser(
          address,
          true // `true` indicates public vaults
        );
      } else if (!permissionflag && !ownerflag) {
        // Public vaults the user has access to but does not own
        const nonOwnedVaultList = await VaultFactoryContract.getVaultsByUser(
          address,
          true // `true` indicates public vaults
        );
        const ownedVaultList = await VaultFactoryContract.getVaultsOwnedByUser(
          address,
          true
        );
        vaultList = [...nonOwnedVaultList, ...ownedVaultList];
      }
      
      // Update vault counts
      const prJoinedVaultList = await VaultFactoryContract.getVaultsByCategory(
        0,
        address,
        1, // `1` for private
        true
      );
      const puJoinedVaultList = await VaultFactoryContract.getVaultsByCategory(
        0,
        address,
        0, // `0` for public
        true
      );

      let nonOwnedVaults: string[] = [];
      if (!ownerFlag) {
        nonOwnedVaults = await VaultFactoryContract.getVaultsByCategory(
          0,
          address,
          permissionflag ? 1 : 0,
          true
        );
      }
      const ownedVaults = await VaultFactoryContract.getVaultsOwnedByUser(
        address,
        permissionflag ? 1 : 0
      );
      const categoryVaults_ = [...nonOwnedVaults, ...ownedVaults];

      setPrivateVaultCount(prJoinedVaultList.length);
      setPublicVaultCount(puJoinedVaultList.length);

      console.log("categoryVaults_", categoryVaults_);
      console.log("vaultList", vaultList);

      fetchData(vaultList, categoryVaults_, permissionflag);
      setPermissionVaultList(vaultList);
      setIsDownloading(true);
    }
  };

  // public and private 0/1 false:  public, true:  private
  const handleGetVaultsByPermissionFlag = async (index: number) => {
    // public
    if (index === 0) {
      setPermissionFlag(false);
      await fetchVaultsByPermissionAndOwner(false, ownerFlag);
    // private
    } else {
      setPermissionFlag(true);
      await fetchVaultsByPermissionAndOwner(true, ownerFlag);
    }
  };

  // onwer true: owner
  const handleGetVaultsByOwnerFlag = () => {
    if (ownerFlag) {
      setOwnerFlag(false);
      fetchVaultsByPermissionAndOwner(permissionFlag, false);
    } else {
      setOwnerFlag(true);
      fetchVaultsByPermissionAndOwner(permissionFlag, true);
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
        background: "radial-gradient(circle at top left, #041420, #000000)",
      }}
    >
      <div className="container mx-auto max-w-6xl pt-32">
        <div className="font-medium text-gray-200 text-3xl">Your collections</div>
        
        <div className="flex items-center justify-between pt-4">
        {/* Tabs Section */}
          <div className="flex gap-4">
            <div
              onClick={() => handleGetVaultsByPermissionFlag(1)}
              className={
                permissionFlag
                  ? `${permissionStyle} text-primary-600 border-b-2 border-primary-600`
                  : `${permissionStyle} text-gray-200`
              }
            >
              <div className="text-base">Private collections</div>
              <div className="ml-2 bg-gray-600 text-gray-200 text-sm font-medium rounded-full w-6 h-6 flex items-center justify-center">
                {privateVaultCount}
              </div>
            </div>
            <div
              onClick={() => handleGetVaultsByPermissionFlag(0)}
              className={
                !permissionFlag
                  ? `${permissionStyle} text-primary-600 border-b-2 border-primary-600`
                  : `${permissionStyle} text-gray-200`
              }
            >
              <div className="text-base">Public collections</div>
              <div className="ml-2 bg-gray-600 text-gray-200 text-sm font-medium rounded-full w-6 h-6 flex items-center justify-center">
                {publicVaultCount}
              </div>
            </div>
          </div>

          {/* Toggle and CTA Section */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value=""
                  checked={ownerFlag}
                  onChange={handleGetVaultsByOwnerFlag}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-gray-200 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                <span className="ms-3 text-base text-gray-200">
                  Show owned only
                </span>
              </label>
            </div>
            <Link href={"/createVault"}>
              <button
                type="button"
                className="px-4 py-2 bg-primary-600 text-gray-200 rounded-lg shadow-md hover:bg-primary-500"
              >
                <div className="flex items-center gap-2 cursor-pointer">
                  <div>
                    <AiOutlinePlusCircle className="text-xl" />
                  </div>
                  <div>New collection</div>
                </div>
              </button>
            </Link>
          </div>
        </div>

        
        
        
        {/* <div className="flex gap-4 pt-4">
          <div
            onClick={() => handleGetVaultsByPermissionFlag(0)}
            className={
              permissionFlag
                ? permissionStyle + " text-primary-600 border-b-2 border-primary-600"
                : permissionStyle + " text-gray-200"
            }
          >
            <div className="text-base">Private collections</div>
            <div className="ml-2 bg-gray-600 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">{privateVaultCount}</div>
          </div>
          <div
            onClick={() => handleGetVaultsByPermissionFlag(1)}
            className={
              !permissionFlag
                ? permissionStyle + " text-primary-600 border-b-2 border-primary-600"
                : permissionStyle + " text-gray-200"
            }
          >
            <div className="text-base">Public collections</div>
            <div className="ml-2 bg-gray-600 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">{publicVaultCount}</div>
          </div>
        </div> */}

        {/* <div className="flex justify-between pt-4">
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
                  className="bg-gray-400 border border-gray-500 text-gray-800 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  placeholder="Search"
                  required
                />
              </div>
              <button
                type="submit"
                className="p-2.5 ms-2 text-sm font-medium text-white bg-primary-700 rounded-lg border border-primary-700 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
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
          </div>
        </div> */}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-8">
          {vaultData.map((vault, index) => (
            <div key={index}>
              <VaultCard vault={vault} href="myVaults" />
            </div>
          ))}
        </div>
      </div>
      <Toaster />
    </main>
  );
}
