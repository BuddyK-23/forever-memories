"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  getUniversalProfileCustomName,
  convertIpfsUriToUrl,
} from "@/utils/format";

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

  useEffect(() => {
    console.log("vault.owner", vault.owner);
    const fetchProfileName = async () => {
      try {
        const profile = await getUniversalProfileCustomName(vault.owner);
        console.log("profile.cid", profile.cid);
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
    <Link className="w-full" href={`/` + href + `/vault/` + vault.vaultAddress}>
      <div className="w-full h-auto">
        <img
          className="rounded-lg h-[300px] w-full"
          src={"https://ipfs.io/ipfs/" + vault.cid}
          onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
          alt={vault.name}
        />
      </div>
      <div className="font-bold pt-2">{vault.name}</div>
      <div className="flex gap-2 text-xs">
        <div>Moments: {vault.moments.toString()}</div>
        <div>Members: {vault.members}</div>
      </div>
      <div className="flex gap-2 pt-1 items-center">
        <img
          className="rounded-lg h-[25px] w-[25px]"
          src={profileCid}
          alt="Profile"
        />
        <div className="text-sm justify-center item-center">
          {profileName || "Loading..."}
        </div>
      </div>
    </Link>
  );
};

export default VaultCard;
