"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import {
  getUniversalProfileCustomName,
  convertIpfsUriToUrl,
} from "@/utils/format";

interface IpfsHash {
  url: string;
  width: number;
  height: number;
}

interface TokenMetadata {
  name: string;
  symbol: string;
  type: number;
  creator: string;
  contractAddress: string;
  ipfsHash: IpfsHash;
}

interface TokenMetadataProps {
  tokenMetadata: TokenMetadata;
}

const TokenCard: React.FC<TokenMetadataProps> = ({ tokenMetadata }) => {
  const [profileName, setProfileName] = useState<string>("");
  const [profileCid, setProfileCid] = useState<string>("");

  return (
    <Link className="w-full h-[300px]" href={`/`}>
      <div className="w-full">
        <img
          className="w-full rounded-lg h-[300px]"
          src={tokenMetadata.ipfsHash.url}
          alt="Token Image"
        />
      </div>
      <div>Name:{tokenMetadata.name}</div>
      <div>Symbol:{tokenMetadata.symbol}</div>
    </Link>
  );
};

export default TokenCard;
