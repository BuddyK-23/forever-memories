"use client";

import Link from "next/link";
import React from "react";

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
}

const VaultCard: React.FC<VaultCardProps> = ({ vault }) => {
  return (
    <Link className="w-full" href={`/vault/` + vault.vaultAddress}>
      <div className="w-full h-auto">
        <img className="rounded-lg" src={"https://ipfs.io/ipfs/" + vault.cid} />
      </div>
      <div className="font-bold pt-2">{vault.name}</div>
      <div className="flex gap-2 text-xs">
        <div>Moments: {vault.moments.toString()}</div>
        <div>Members: {vault.members}</div>
      </div>
      <div className="flex gap-2 pt-1">
        <img
          className="rounded-lg h-[25px] w-[25px]"
          src="https://img-cdn.pixlr.com/image-generator/history/65bb506dcb310754719cf81f/ede935de-1138-4f66-8ed7-44bd16efc709/medium.webp"
        />
        <div className="text-sm justify-center item-center">{vault.owner}</div>
      </div>
    </Link>
  );
};

export default VaultCard;
