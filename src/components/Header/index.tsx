"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { useSyncProviders } from "@/hooks/useSyncProviders";
import { ethers } from "ethers";
import "./index.css";

const Navbar = () => {
  const [nav, setNav] = useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const providers = useSyncProviders();
  const [selectedWallet, setSelectedWallet] = useState<EIP6963ProviderDetail>();
  const [userAccount, setUserAccount] = useState<string>("");

  const links = [
    {
      id: 1,
      title: "Home",
      link: "/",
    },
    {
      id: 2,
      title: "Memory vaults",
      link: "memoryVaults",
    },
    {
      id: 3,
      title: "Feed",
      link: "feed",
    },
    {
      id: 4,
      title: "Marketplace",
      link: "marketplace",
    },
    {
      id: 5,
      title: "Add memory",
      link: "addMemory",
    },
  ];

  const handleWalletButton = async () => {
    if (userAccount) {
      handleDisconnect();
    } else {
      setShowModal(true);
    }
  };

  const handleDisconnect = async () => {
    localStorage.removeItem("userAccount");
    localStorage.removeItem("walletType");
    setUserAccount("");
  };

  useEffect(() => {
    setUserAccount(localStorage.getItem("userAccount") || "");
  }, []);

  const handleConnect = async (providerWithInfo: EIP6963ProviderDetail) => {
    let provider;
    if (providerWithInfo.info.name == "MetaMask") {
      provider = new ethers.BrowserProvider(window.ethereum);
      localStorage.setItem("walletType", "MetaMask");
    } else if (providerWithInfo.info.name == "Universal Profile") {
      provider = new ethers.BrowserProvider(window.lukso);
      localStorage.setItem("walletType", "UP");
    } else if (providerWithInfo.info.name == "Trust Wallet") {
      provider = new ethers.BrowserProvider(window.TrustBinanceChain);
      localStorage.setItem("walletType", "TrustBinanceChain");
    } else {
      console.log("Unknown provider");
      return;
    }
    const accounts = await provider.send("eth_requestAccounts", []);
    localStorage.setItem("userAccount", accounts[0]);

    setUserAccount(accounts[0]);
    setShowModal(false);
  };

  return (
    <div className="flex justify-between items-center w-full h-20 px-4 text-white bg-black nav">
      <div>
        {/* <h1 className="text-5xl font-signature ml-2"><a className="link-underline hover:transition ease-in-out delay-150 hover:underline hover:decoration-solid" href="">Logo</a></h1> */}
        <h1 className="text-3xl font-signature ml-2">
          <Link href={"/"}>Forever Memories</Link>
        </h1>
      </div>

      <ul className="hidden md:flex">
        {links.map(({ id, link, title }) => (
          <li
            key={id}
            className="nav-links px-4 cursor-pointer capitalize font-medium text-gray-500 hover:scale-105 hover:text-white duration-200 link-underline"
          >
            <Link href={link}>{title}</Link>
          </li>
        ))}
      </ul>

      <div
        onClick={() => setNav(!nav)}
        className="cursor-pointer pr-4 z-10 text-gray-500 md:hidden"
      >
        {nav ? <FaTimes size={30} /> : <FaBars size={30} />}
      </div>

      {nav && (
        <ul className="flex flex-col justify-center items-center absolute top-0 left-0 w-full h-screen bg-gradient-to-b from-black to-gray-800 text-gray-500">
          {links.map(({ id, link }) => (
            <li
              key={id}
              className="px-4 cursor-pointer capitalize py-6 text-4xl"
            >
              <Link onClick={() => setNav(!nav)} href={link}>
                {link}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={handleWalletButton}
        type="button"
        className="px-6 pb-2 pt-2.5 text-xs bg-red-500 font-medium uppercase leading-normal text-white rounded-md"
      >
        {userAccount ? "Disconnect" : "Connect"}
      </button>

      {showModal ? (
        <>
          <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="w-auto my-6 mx-auto max-w-3xl flex justify-center items-center relative">
              {/*content*/}
              <div className="text-red-500 border-0 rounded-lg shadow-lg  relative w-full bg-white outline-none focus:outline-none">
                {/*body*/}
                <div className="relative p-6 flex-auto text-center">
                  <h2 className="pb-6">Wallets Detected:</h2>
                  <div>
                    {providers.length > 0 ? (
                      providers?.map((provider: EIP6963ProviderDetail) => (
                        <button
                          key={provider.info.uuid}
                          onClick={() => handleConnect(provider)}
                        >
                          <img
                            className="walletStyle"
                            src={provider.info.icon}
                            alt={provider.info.name}
                          />
                          <div>{provider.info.name}</div>
                        </button>
                      ))
                    ) : (
                      <div>No Announced Wallet Providers</div>
                    )}
                  </div>
                  <button
                    className="px-3 pb-2 pt-2.5 text-xs bg-red-400 font-medium uppercase leading-normal text-white rounded-md mt-4"
                    onClick={() => setShowModal(false)}
                  >
                    close
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
        </>
      ) : null}
    </div>
  );
};

export default Navbar;
