"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  getUniversalProfileCustomName,
  convertIpfsUriToUrl,
} from "@/utils/format";
import { useWeb3ModalAccount } from "@web3modal/ethers5/react";
import "./index.css";

interface Vault {
  name: string;
  description: string;
  cid: string;
  moments: number;
  members: number;
  owner: string;
  vaultAddress: string;
}

interface VaultCardProps {
  vault: Vault;
  href: string;
}

const VaultCard: React.FC<VaultCardProps> = ({ vault, href }) => {
  const [profileName, setProfileName] = useState<string>("");
  const [profileCid, setProfileCid] = useState<string>("");
  const { address } = useWeb3ModalAccount();
  const [showName, setShowName] = useState(false); // For hover or click behavior


  useEffect(() => {
    const fetchProfileName = async () => {
      try {
        const profile = await getUniversalProfileCustomName(vault.owner);
        setProfileName(profile.profileName);
        setProfileCid(convertIpfsUriToUrl(profile.cid));
      } catch (error) {
        console.error("Error fetching profile name:", error);
        setProfileName("Unknown");
      }
    };

    fetchProfileName();
  }, []);

  return (
    <Link
      className="block relative group rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-gray-900"
      href={`/` + href + `/vault/` + vault.vaultAddress}
    >
      {/* Vault Image */}
      <div className="relative w-full h-[300px]">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          src={"https://ipfs.io/ipfs/" + vault.cid}
          onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
          alt={vault.name}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0.9 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Details */}
      <div className="absolute bottom-0 p-4 w-full text-white group-hover:bg-black/70 transition-all duration-300">
        <h3 className="font-bold text-lg truncate">{vault.name}</h3>
        <div className="flex justify-between items-center mt-2 text-sm">
          
          <div
            className="relative"
            onMouseEnter={() => setShowName(true)}
            onMouseLeave={() => setShowName(false)}
            onClick={() => setShowName((prev) => !prev)} // For mobile
          >
            <img
              className="rounded-full h-8 w-8 object-cover"
              src={profileCid}
              alt="Profile"
            />
            {showName && (
              <div className="absolute top-1/2 left-[120%] transform -translate-y-1/2 bg-gray-800 text-white text-xs px-3 py-1 rounded-lg shadow-md">
                {profileName || "Loading..."}
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <div className="flex items-center space-x-1">
            <span className="text-sm">👥</span> 
              <span>{vault.members}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-sm">🖼️</span> 
              <span>{vault.moments.toString()}</span>
            </div>
          </div>

          
          {/* <div className="flex items-center space-x-2">
            <img
              className="rounded-full h-6 w-6 object-cover"
              src={profileCid || "/default-avatar.png"}
              alt="Profile"
            />
            <span>{profileName || "Loading..."}</span>
          </div> */}
          
        </div>
      </div>

      {/* Ribbon for Owned Vaults */}
      {/* {vault.owner === address && (
        <div className="absolute top-3 left-3 bg-pink-400 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
          Owner
        </div>
      )} */}
    </Link>
  );
};

export default VaultCard;


//   return (
//     <Link className="block relative group rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-gray-900" href={`/` + href + `/vault/` + vault.vaultAddress}>
//       {/* Vault Image */}
//       <div className="relative w-full h-[300px]">
//         {vault.owner == address ? (
//           <div className="owner-ribbon">Owned</div>
//         ) : (
//           ""
//         )}
//         <img
//           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//           src={"https://ipfs.io/ipfs/" + vault.cid}
//           onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
//           alt={vault.name}
//         />
//         {/* Overlay */}
//         <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
//       </div>
//       <div className="font-bold text-lg truncate">{vault.name}</div>
//       <div className="flex gap-2 text-xs">
//         <div>Moments: {vault.moments.toString()}</div>
//         <div>Members: {vault.members}</div>
//       </div>
//       <div className="flex gap-2 pt-1 items-center">
//         <img
//           className="rounded-full h-6 w-6 object-cover"
//           src={profileCid}
//           alt="Profile"
//         />
//         <div className="text-sm justify-center item-center">
//           {profileName || "Loading..."}
//         </div>
//       </div>
//     </Link>
//   );
// };

// export default VaultCard;
