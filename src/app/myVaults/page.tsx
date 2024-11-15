"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Button, Modal } from "flowbite-react";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { ethers } from "ethers";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers5/react";
import VaultCard from "@/components/VaultCard";
import VaultFactoryABI from "@/artifacts/VaultFactory.json";
import VaultABI from "@/artifacts/Vault.json";
import { hexToDecimal } from "@/utils/format";
import toast, { Toaster } from "react-hot-toast";

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
  "flex justify-center gap-2 hover:text-blue-500 cursor-pointer font-medium border-b-4 py-2 hover:border-blue-500";

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

  useEffect(() => {
    getPrivateVaultCount();
    fetchVault(permissionFlag, ownerFlag);
  }, [isConnected, address, walletProvider]);
  const getPrivateVaultCount = async () => {
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

      const privateVaultsByUser =
        await VaultFactoryContract.getPrivateVaultsByUser(address);
      const privateVaultsOwnedByUser =
        await await VaultFactoryContract.getPrivateVaultsOwnedByUser(address);
      setPrivateVaultCount(
        privateVaultsByUser.length + privateVaultsOwnedByUser.length
      );
    }
  };

  const fetchVault = async (permissionflag: boolean, ownerflag: boolean) => {
    if (walletProvider) {
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
      let ownedVaultList: string[] = [];
      let nonOwnedVaultList: string[] = [];

      // Private, owner
      if (permissionflag && ownerflag) {
        ownedVaultList = await VaultFactoryContract.getPrivateVaultsOwnedByUser(
          address
        );
        nonOwnedVaultList = await VaultFactoryContract.getPrivateVaultsByUser(
          address
        );
        vaultList = [...ownedVaultList, ...nonOwnedVaultList];
        setPrivateVaultCount(vaultList.length);

        // Private, non-owner
      } else if (permissionflag && !ownerflag) {
        ownedVaultList = await VaultFactoryContract.getPrivateVaultsOwnedByUser(
          address
        );
        nonOwnedVaultList = await VaultFactoryContract.getPrivateVaultsByUser(
          address
        );
        vaultList = [...ownedVaultList, ...nonOwnedVaultList];
        setPrivateVaultCount(vaultList.length);

        // Public, owner
      } else if (!permissionflag && ownerflag) {
        ownedVaultList = await VaultFactoryContract.getPublicVaultsOwnedByUser(
          address
        );
        nonOwnedVaultList = await VaultFactoryContract.getPublicVaultsByUser(
          address
        );
        vaultList = [...ownedVaultList, ...nonOwnedVaultList];
        setPublicVaultCount(vaultList.length);

        // Public, non-owner
      } else if (!permissionflag && !ownerflag) {
        ownedVaultList = await VaultFactoryContract.getPublicVaultsOwnedByUser(
          address
        );
        nonOwnedVaultList = await VaultFactoryContract.getPublicVaultsByUser(
          address
        );
        vaultList = [...ownedVaultList, ...nonOwnedVaultList];
        setPublicVaultCount(vaultList.length);
      }

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
      setIsDownloading(false);
    }
  };

  // public and private 0/1 false:  public, true:  private
  const handleGetVaultsByPermissionFlag = async (index: number) => {
    // public
    if (index === 0) {
      setPermissionFlag(false);
      fetchVault(false, ownerFlag);
      // private
    } else {
      setPermissionFlag(true);
      fetchVault(true, ownerFlag);
    }
  };

  // onwer true: owner
  const handleGetVaultsByOwnerFlag = () => {
    if (ownerFlag) {
      setOwnerFlag(false);
      fetchVault(permissionFlag, false);
    } else {
      setOwnerFlag(true);
      fetchVault(permissionFlag, true);
    }
  };

  return isDownloading ? (
    <div className="flex space-x-2 justify-center items-center bg-gray-200 h-screen dark:invert">
      <span className="sr-only">Loading...</span>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce"></div>
    </div>
  ) : (
    <main className="px-6 bg-white pt-10 h-[800px]">
      <div className="font-bold text-3xl">Vaults</div>
      <div className="flex gap-4 pt-4">
        <div
          onClick={() => handleGetVaultsByPermissionFlag(1)}
          className={
            permissionFlag
              ? permissionStyle + " text-blue-500 border-b-4 border-blue-500"
              : permissionStyle
          }
        >
          <div>Private vaults</div>
          <div className="bg-gray-100 rounded-lg px-2">{privateVaultCount}</div>
        </div>
        <div
          onClick={() => handleGetVaultsByPermissionFlag(0)}
          className={
            !permissionFlag
              ? permissionStyle + " text-blue-500 border-b-4 border-blue-500"
              : permissionStyle
          }
        >
          <div>Public vaults</div>
          <div className="bg-gray-100 rounded-lg px-2">{publicVaultCount}</div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
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
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Search"
                required
              />
            </div>
            <button
              type="submit"
              className="p-2.5 ms-2 text-sm font-medium text-white bg-blue-700 rounded-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
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
        <div className="flex items-center justify-center">
          <div>
            <label className="inline-flex items-center cursor-pointer pr-2">
              <input
                type="checkbox"
                value=""
                checked={ownerFlag}
                onChange={handleGetVaultsByOwnerFlag}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                Show only my vaults
              </span>
            </label>
          </div>
          <div>
            <Link href={"/createVault"}>
              <button
                type="button"
                className="py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
              >
                Create vault
              </button>
            </Link>
          </div>
          <div>
            <button
              type="button"
              className="py-2.5 px-5 me-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
            >
              ...
            </button>
          </div>
        </div>
      </div>

      <div className="py-10 grid grid-cols-5 gap-4">
        {vaultData.map((vault, index) => (
          <div key={index}>
            <VaultCard vault={vault} href="myVaults" />
          </div>
        ))}
      </div>
      <Toaster />
    </main>
  );
}
