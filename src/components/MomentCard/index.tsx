"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import {
  getUniversalProfileCustomName,
  convertIpfsUriToUrl,
} from "@/utils/format";

interface Moment {
  headline: string;
  description: string;
  fileType: string;
  cid: string;
  likes: number;
  // dislikes: number;
  comments: number;
  owner: string;
  momentAddress: string;
}

interface MomentCardProps {
  moment: Moment;
}

const MomentCard: React.FC<MomentCardProps> = ({ moment }) => {
  const [profileName, setProfileName] = useState<string>("");
  const [profileCid, setProfileCid] = useState<string>("");

  useEffect(() => {
    const fetchProfileName = async () => {
      try {
        const profile = await getUniversalProfileCustomName(moment.owner);
        setProfileName(profile.profileName || "Unknown");
        setProfileCid(convertIpfsUriToUrl(profile.cid));
      } catch (error) {
        console.error("Error fetching owner profile:", error);
        setProfileName("Unknown");
      }
    };

    fetchProfileName();
  }, []);

  return (
    <Link 
      className="block relative group rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-gray-900" 
      href={`/nft/${moment.momentAddress}`}
    >
      {/* Moment Image */}

      <div className="relative w-full h-[300px]">
        {moment.fileType == "image" && (
          <img
            src={moment.cid}
            alt={moment.headline}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
          />
        )}

        {moment.fileType == "video" && (
          <video
            src={moment.cid}
            controls
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
          />
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Moment Details */}
      <div className="absolute bottom-0 p-4 w-full text-white group-hover:bg-black/70 transition-all duration-300">
        <h3 className="font-bold text-lg truncate">{moment.headline}</h3>
        <p className="text-sm truncate overflow-hidden whitespace-nowrap">{moment.description}</p>

        <div className="flex justify-between items-center mt-2 text-sm">
          {/* Owner Info */}
          <div className="relative">
            <img
              className="rounded-full h-8 w-8 object-cover"
              src={profileCid || "/default-avatar.png"}
              alt="Owner Profile"
            />
            <span className="text-xs ml-2">{profileName || "Loading..."}</span>
          </div>

          {/* Likes, Dislikes, and Comments */}
          <div className="flex space-x-4">
            <div className="flex items-center space-x-1">
              <span>👍</span>
              <span>{moment.likes}</span>
            </div>
            {/* <div className="flex items-center space-x-1">
              <span>👎</span>
              <span>{moment.dislikes}</span>
            </div> */}
            <div className="flex items-center space-x-1">
              <span>💬</span>
              <span>{moment.comments}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default MomentCard;
