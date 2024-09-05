"use client";

import React from "react";
import Link from "next/link";

interface Vault {
  name: string;
  mements: number;
  memebers: number;
  owner: string;
}

interface VaultCardProps {
  vault: Vault;
}

const VaultCard: React.FC<VaultCardProps> = ({ vault }) => {
  return (
    <div className="w-full">
      <div className="w-full h-auto">
        <img
          className="rounded-lg"
          src="https://img-cdn.pixlr.com/image-generator/history/65bb506dcb310754719cf81f/ede935de-1138-4f66-8ed7-44bd16efc709/medium.webp"
        />
      </div>
      <div className="font-bold pt-2">{vault.name}</div>
      <div className="flex gap-2 text-xs">
        <div>Mements: {vault.mements}</div>
        <div>Members: {vault.memebers}</div>
      </div>
      <div className="flex gap-2 pt-1">
        <img
          className="rounded-lg h-[25px] w-[25px]"
          src="https://img-cdn.pixlr.com/image-generator/history/65bb506dcb310754719cf81f/ede935de-1138-4f66-8ed7-44bd16efc709/medium.webp"
        />
        {vault.owner}
      </div>
    </div>
  );
};

export default VaultCard;
