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
  cid: string;
  likes: number;
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
        setProfileName(profile.profileName);
        console.log("profileCid", convertIpfsUriToUrl(profile.cid));
        setProfileCid(convertIpfsUriToUrl(profile.cid));
      } catch (error) {
        console.error("Error fetching profile name:", error);
        setProfileName("Unknown");
      }
    };

    fetchProfileName();
  }, []);

  return (
    <Link className="w-full h-[300px]" href={`/nft/` + moment.momentAddress}>
      <div className="w-full">
        <img
          className="w-full rounded-lg h-[300px]"
          src={moment.cid}
          alt="Moment Image"
        />
      </div>
      <div className="flex gap-2 text-xs pt-2">
        <div>Likes: {moment.likes}</div>
        <div>Comments: {moment.comments}</div>
      </div>
      <div className="font-bold">{moment.headline}</div>
      <div className="">{moment.description}</div>

      <div className="flex gap-2 pt-1 items-center">
        <img
          className="rounded-lg h-[25px] w-[25px]"
          src={profileCid}
          alt="moment.name"
        />
        <div className="text-sm justify-center item-center">{profileName}</div>
      </div>
    </Link>
  );
};

export default MomentCard;
