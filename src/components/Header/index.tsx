"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef, useContext } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { UPConnectionContext } from "@/contexts/UPConnectionContext";
import { getUniversalProfileCustomName } from "@/utils/format";
import { convertIpfsUriToUrl } from "@/utils/format";
import { useRouter } from "next/router";
import "./index.css";

const Navbar = () => {
  const { provider, account, connectUP, disconnectUP } = useContext(UPConnectionContext);
  const [nav, setNav] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("/default-avatar.png");
  const [profileName, setProfileName] = useState("Unknown");
  const [bannerUrl, setBannerUrl] = useState("/default-banner.png");
  const [lyxBalance, setLyxBalance] = useState("0.00");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Set state based on scroll position
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const fetchProfileDetails = async () => {
      try {
        if (account && provider) {
          const profile = await getUniversalProfileCustomName(account, provider);
          setProfileName(profile.profileName || "Unknown");
          setAvatarUrl(profile.cid ? convertIpfsUriToUrl(profile.cid) : "/default-avatar.png");
          setBannerUrl("/default-banner.png");
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
  }, [account, provider]);

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

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
    { id: 1, title: "Collections", link: "/collections" },
    { id: 2, title: "Create Collection", link: "/create-collection" },
    { id: 3, title: "Create Moment", link: "/create-moment" },
  ];

  return (
    <header className={`fixed top-0 left-0 w-full h-16 px-4 lg:px-0 flex items-center justify-center text-white z-50 transition-colors duration-300 ${
      isScrolled ? "bg-black/90" : "bg-transparent"
    }`}>
      <div className="container mx-auto max-w-6xl flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center pl-0 z-50">
          <img
            src="/logo-forevermoments.svg"
            alt="Forever Moments"
            className="object-contain sm:w-[160px] sm:h-[26px] w-[120px] h-[20px]"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8 z-50">
          {links.map(({ id, title, link }) => (
            <Link
              key={id}
              href={link}
              className="hover:text-pink-200 text-gray-200 transition-colors duration-200"
              // className={`transition-colors duration-200 ${
              //   currentPath === link
              //     ? "text-primary-700"
              //     : "hover:text-primary-100 text-gray-200"
              // }`}
            >
              {title}
            </Link>
          ))}

          {!account ? (
            <button
              onClick={connectUP}
              className="bg-pink-100 hover:bg-pink-200 text-gray-800 px-4 py-2 rounded-xl"
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
                <div className="absolute right-0 mt-2 w-80 bg-gray-700 border-gray-600 border rounded-lg shadow-xl text-gray-200 overflow-hidden backdrop-blur-md z-50">
                  {/* Banner */}
                  <div
                    className="h-24 bg-cover bg-center relative"
                    style={{ backgroundImage: `url(${bannerUrl})` }}
                  ></div>

                  {/* Profile Info */}
                  <div className="p-4">
                    <div className="flex items-center space-x-4">
                      <img
                        src={avatarUrl}
                        alt="User Avatar"
                        className="w-16 h-16 rounded-full border border-gray-600 object-cover"
                      />
                      <div>
                        <div className="text-base font-medium">{profileName}</div>
                        {/* <div className="text-sm text-gray-400">
                          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}
                        </div> */}
                      </div>
                    </div>

                    {/* Balance */}
                    {/* <div className="mt-4 text-gray-200">
                      <span className="">Balance:</span>{" "}
                      <span className="text-base">{lyxBalance} LYX</span>
                    </div> */}
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col space-y-2 pl-4 pr-4 pb-4">
                    <Link
                      href="/profile"
                      className="w-full bg-pink-100 text-gray-800 hover:bg-pink-200 rounded-xl shadow-sm px-4 py-2 text-base text-center"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={disconnectUP}
                      className="w-full bg-gray-600 text-gray-200 hover:bg-gray-500 rounded-xl shadow-sm px-4 py-2 text-center"
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
                <Link 
                  href={link} 
                  onClick={() => setNav(false)}
                  // className={`transition-colors duration-200 ${
                  //   currentPath === link
                  //     ? "text-primary-700"
                  //     : "hover:text-primary-100 text-gray-200"
                  // }`}
                >
                  {title}
                </Link>
              </li>
            ))}

            {!account ? (
              <li>
                <button
                  className="bg-pink-100 hover:bg-pink-200 text-gray-800 px-4 py-2 rounded-xl"
                  onClick={connectUP}
                >
                  Connect
                </button>
              </li>
            ) : (
              <li>
                <button
                  onClick={disconnectUP}
                  className="text-left px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-xl"
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
