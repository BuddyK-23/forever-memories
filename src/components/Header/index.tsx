"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { useWeb3ModalAccount } from "@web3modal/ethers5/react";
import { walletConnectInstance } from "@/components/WalletContext";
import { getUniversalProfileCustomName } from "@/utils/format";
import { convertIpfsUriToUrl } from "@/utils/format";
import "./index.css";

const Navbar = () => {
  const { address, isConnected } = useWeb3ModalAccount();
  const [nav, setNav] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("/default-avatar.png");
  const [profileName, setProfileName] = useState("Unknown");
  const [bannerUrl, setBannerUrl] = useState("/default-banner.png");
  const [lyxBalance, setLyxBalance] = useState("0.00");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleConnect = async () => {
    await walletConnectInstance.open();
  };

  const handleDisconnect = async () => {
    await walletConnectInstance.disconnect();
    localStorage.removeItem("connectedAddress");
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  useEffect(() => {
    const fetchProfileDetails = async () => {
      try {
        if (isConnected && address) {
          const profile = await getUniversalProfileCustomName(address);
          setProfileName(profile.profileName || "Unknown");
          // setBannerUrl(
          //   profile.backgroundImage ? convertIpfsUriToUrl(profile.backgroundImage) : "/default-banner.png"
          // );
          setBannerUrl("/default-banner.png");
          setAvatarUrl(
            profile.cid ? convertIpfsUriToUrl(profile.cid) : "/default-avatar.png"
          );
          setLyxBalance("122.42"); // Replace with actual balance logic
        } else {
          setAvatarUrl("/default-avatar.png");
          setBannerUrl("/default-banner.png");
          setProfileName("Unknown");
          setLyxBalance("0.00");
        }
      } catch (error) {
        console.error("Error fetching profile details:", error);
        setAvatarUrl("/default-avatar.png");
        setBannerUrl("/default-banner.png");
        setProfileName("Unknown");
        setLyxBalance("0.00");
      }
    };

    fetchProfileDetails();
  }, [address, isConnected]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const links = [
    { id: 1, title: "Explore Collections", link: "/explore" },
    { id: 2, title: "Your Collections", link: "/myVaults" },
    { id: 3, title: "Add Moment", link: "/addMoment" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full h-16 px-6 flex items-center justify-center text-white z-50">
      <div className="container mx-auto max-w-6xl flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center z-50">
          <img
            src="/logo_icon_foreverMoments.svg"
            alt="Forever Moments"
            className="w-[50px] h-[37px] object-contain"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8 z-50">
          {links.map(({ id, title, link }) => (
            <Link
              key={id}
              href={link}
              className="hover:text-primary-100 transition-colors duration-200"
            >
              {title}
            </Link>
          ))}
          {!isConnected ? (
            <button
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
              onClick={handleConnect}
            >
              Connect
            </button>
          ) : (
            <div className="relative" ref={dropdownRef}>
              {/* Avatar */}
              <img
                src={avatarUrl}
                alt="User Avatar"
                className="w-10 h-10 rounded-full cursor-pointer object-cover"
                onClick={toggleDropdown}
              />

              {/* Popover Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl text-black overflow-hidden backdrop-blur-md z-50">
                  {/* Banner */}
                  <div
                    className="h-24 bg-cover bg-center"
                    style={{ backgroundImage: `url(${bannerUrl})` }}
                  ></div>

                  {/* Profile Info */}
                  <div className="p-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={avatarUrl}
                        alt="User Avatar"
                        className="w-16 h-16 rounded-full border-2 border-gray-200 object-cover"
                      />
                      <div>
                        <div className="text-lg font-bold">{profileName}</div>
                        <div className="text-sm text-gray-500">
                          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}
                        </div>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="mt-4 text-sm">
                      <span className="font-semibold">Balance:</span>{" "}
                      <span className="text-lg font-bold">{lyxBalance} LYX</span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col space-y-2 p-4 border-t border-gray-200">
                    <Link
                      href="/profile"
                      className="w-full text-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={handleDisconnect}
                      className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-md"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div
          onClick={() => setNav(!nav)}
          className="md:hidden cursor-pointer text-white z-50"
        >
          {nav ? <FaTimes size={24} /> : <FaBars size={24} />}
        </div>

        {/* Mobile Navigation */}
        {nav && (
          <ul className="absolute top-16 left-0 w-full bg-black text-white flex flex-col items-center space-y-4 py-4 z-50">
            {links.map(({ id, title, link }) => (
              <li key={id}>
                <Link href={link} onClick={() => setNav(false)}>
                  {title}
                </Link>
              </li>
            ))}
            {!isConnected ? (
              <li>
                <button
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded"
                  onClick={() => {
                    setNav(false);
                    handleConnect();
                  }}
                >
                  Connect
                </button>
              </li>
            ) : (
              <li>
                <button
                  onClick={handleDisconnect}
                  className="text-left px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded"
                >
                  Disconnect
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </header>
  );
};

export default Navbar;
