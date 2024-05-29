"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { ethers } from "ethers";
import { useConnectWallet } from "@web3-onboard/react";

import "./index.css";

const Navbar = () => {
  const [nav, setNav] = useState(false);
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet();

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

  return (
    <div className="flex justify-between items-center w-full h-20 px-4 text-white bg-black nav">
      <div>
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
        className="walletStyle"
        disabled={connecting}
        onClick={() => (wallet ? disconnect(wallet) : connect())}
      >
        {connecting ? "Connecting" : wallet ? "Disconnect" : "Connect"}
      </button>
    </div>
  );
};

export default Navbar;
