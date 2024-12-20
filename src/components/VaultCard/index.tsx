"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { AiOutlineUser, AiOutlinePicture } from "react-icons/ai";
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
    <div className="flex flex-col md:flex-row bg-gray-900/50 rounded-lg shadow-lg hover:shadow-2xl transition-all overflow-hidden">
      {/* Image Section */}
      <Link 
        href={`/` + href + `/vault/` + vault.vaultAddress} 
        className="w-full md:max-w-56 md:min-h-56 flex-shrink-0"
      >
        <img
          src={"https://ipfs.io/ipfs/" + vault.cid}
          onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
          alt={vault.name}
          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity duration-300"
        />
      </Link>
      {/* Details Section */}
      <div className="flex flex-col justify-between p-4 w-full">
        {/* Top Section: Title, Description, and Stats */}
        <div>
          <Link
            href={`/` + href + `/vault/` + vault.vaultAddress}
          >
            <h3 className="text-2xl font-bold text-gray-200 line-clamp-2 hover:text-primary-500">
              {vault.name}
            </h3>
          </Link>
          <p className="text-gray-200 text-base mt-1 line-clamp-2">
            {vault.description}
          </p>

          <div className="flex items-center space-x-3 text-gray-400 mt-2">
            <div className="flex text-base items-center gap-1">
              <AiOutlineUser />
              <span>{vault.members} Members</span>
            </div>
            <div className="flex text-base items-center gap-1">
              <AiOutlinePicture />
              <span>{vault.moments} Moments</span>
            </div>
          </div>
        </div>

        {/* Bottom Section: View Collection Button and Owner */}
        <div className="flex justify-between items-center mt-4">
          <Link
            href={`/` + href + `/vault/` + vault.vaultAddress}
            className="text-base text-primary-600 hover:text-primary-500"
          >
            View collection
          </Link>

          <div className="flex items-center gap-1">
            <img
              className="rounded-full object-cover w-6 h-6"
              src={profileCid}
              alt="Owner profile"
            />
            {/* <div className="text-sm text-gray-400">
              {profileName || "Loading..."}
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultCard;



//   return (
//     <>
//       <Link
//         className="block relative group rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-gray-900"
//         href={`/` + href + `/vault/` + vault.vaultAddress}
//       >
//         {/* Vault Image */}
//         <div className="relative w-full h-[300px]">
//           <img
//             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//             src={"https://ipfs.io/ipfs/" + vault.cid}
//             onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
//             alt={vault.name}
//           />
//           {/* Overlay */}
//           <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0.9 group-hover:opacity-100 transition-opacity duration-300"></div>
//         </div>

//         {/* Details */}
//         <div className="absolute bottom-0 p-4 w-full text-white group-hover:bg-black/70 transition-all duration-300">
//           <h3 className="font-bold text-lg truncate">{vault.name}</h3>
//           {/* <p className="text-sm mt-1">{vault.description}</p> */}
          
//           <div className="flex justify-start items-center mt-2 text-sm">
//             {/* Likes, Dislikes, and Comments */}
//             <div className="flex space-x-4">
//               <div className="flex items-center space-x-1">
//                 <AiOutlineUser />
//                 <span>{vault.members}</span>
//               </div>
//               <div className="flex items-center space-x-1" >
//                 <AiOutlinePicture />
//                 <span>{vault.moments.toString()}</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Ribbon for Owned Vaults */}
//         {/* {vault.owner === address && (
//           <div className="absolute top-3 left-3 bg-pink-400 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
//             Owner
//           </div>
//         )} */}
//       </Link>
//       {/* Owner Section */}
//       <div className="pt-2">
//         <div className="inline-flex items-center gap-1 pl-1 pr-2 border border-gray-900/80 py-1 bg-gray-900/40 rounded-full ">
//           <img
//             className="rounded-full object-cover w-6 h-6"
//             src={profileCid}
//             alt="Owner profile"
//           />
//           <div className="text-sm text-gray-200">
//             {profileName || "Loading..."}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default VaultCard;
