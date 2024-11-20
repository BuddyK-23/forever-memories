"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ERC725 } from "@erc725/erc725.js";
import {
  useWeb3ModalAccount,
  useWeb3ModalProvider,
} from "@web3modal/ethers5/react";
import TokenCard from "@/components/TokenCard";
import {
  hexToDecimal,
  convertIpfsUriToUrl,
  getUniversalProfileCustomName,
} from "@/utils/format";
import LSP5Schema from "@erc725/erc725.js/schemas/LSP5ReceivedAssets.json";
import LSP4Schema from "@erc725/erc725.js/schemas/LSP4DigitalAsset.json";
import LSP3Schema from "@erc725/erc725.js/schemas/LSP3ProfileMetadata.json";
import VaultFactoryABI from "@/artifacts/VaultFactory.json";
import VaultABI from "@/artifacts/Vault.json";
import toast, { Toaster } from "react-hot-toast";
import FMT from "@/artifacts/FMT.json";
const RPC_MAINNET = "https://42.rpc.thirdweb.com";
const FMTContractAddress = "0x186f3468Ff169AEe9c7E72ABEF83c2c6aDB5D5cc";
const tokenAddress = "0x01e4386127a976bf65961a6a117c1a5b12703fd3";

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

interface LSP3Profile {
  name: string;
  description: string;
  profileImage?: { url: string }[];
  backgroundImage?: { url: string }[];
  tags?: string[];
  links?: string[];
}

interface DecodedProfileMetadata {
  value: {
    LSP3Profile: LSP3Profile;
  };
}

export default function Profile() {
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [ipfsHash, setIpfsHash] = useState<string>();
  const [fmtBalance, setFmtBalance] = useState<number>(0);
  const [lyxBalance, setLyxBalance] = useState<string>("");
  const [profile, setProfile] = useState<LSP3Profile | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [tokens, setTokens] = useState<TokenMetadata[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [profileName, setProfileName] = useState<string>("");
  const [profileCid, setProfileCid] = useState<string>("");
  const [totalAssetsCount, setTotalAssetsCount] = useState<number>(0);
  const [loadedAssetsCount, setLoadedAssetsCount] = useState<number>(0);

  const fetchProfileName = async (addr: string) => {
    try {
      const profile = await getUniversalProfileCustomName(addr);
      console.log("profile.cid", profile.cid);
      setProfileName(profile.profileName);
      setProfileCid(convertIpfsUriToUrl(profile.cid));
    } catch (error) {
      console.error("Error fetching profile name:", error);
      setProfileName("Unknown");
    }
  };

  const fetchMyMoments = async (): Promise<string[]> => {
    if (!walletProvider) return [];

    try {
      const ethersProvider = new ethers.providers.Web3Provider(
        walletProvider,
        "any"
      );
      const signer = ethersProvider.getSigner(address);

      // Initialize Contracts
      const VaultFactoryContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_VAULT_FACTORY_CONTRACT_ADDRESS as string,
        VaultFactoryABI.abi,
        signer
      );

      const VaultContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as string,
        VaultABI.abi,
        signer
      );

      // Fetch Vault Lists
      const [
        ownedPvVaultList,
        nonOwnedPvVaultList,
        ownedPuVaultList,
        nonOwnedPuVaultList,
      ] = await Promise.all([
        VaultFactoryContract.getPrivateVaultsOwnedByUser(address),
        VaultFactoryContract.getPrivateVaultsByUser(address),
        VaultFactoryContract.getPublicVaultsOwnedByUser(address),
        VaultFactoryContract.getPublicVaultsByUser(address),
      ]);

      // Combine all vault lists
      const vaultList = [
        ...ownedPvVaultList,
        ...nonOwnedPvVaultList,
        ...ownedPuVaultList,
        ...nonOwnedPuVaultList,
      ];

      // Fetch moments for each vault in parallel
      const momentsList: string[] = [];

      // Using Promise.all to fetch moments concurrently
      await Promise.all(
        vaultList.map(async (list) => {
          const tokenIds: string[] = await VaultContract.getAllMoments(list);
          await Promise.all(
            tokenIds.map(async (tokenId) => {
              const owner: string = await VaultContract.momentOwners(tokenId);
              if (owner === address) {
                momentsList.push(tokenId);
              }
            })
          );
        })
      );

      return momentsList;
    } catch (error) {
      console.error("Error fetching moments:", error);
      return [];
    }
  };

  const fetchMetadata = async () => {
    if (address && walletProvider) {
      const erc725js = new ERC725(
        LSP5Schema,
        "0x3c33871d7ff685433cdba55a85a5960fd9feb007",
        RPC_MAINNET
      );

      let tokenMetadata_: TokenMetadata[] = [];
      let ipfsHash_: IpfsHash[] = [];

      const moments = await fetchMyMoments();
      if (moments.length > 0) {
        setTotalAssetsCount(1);
        setLoadedAssetsCount(1);
        const defaultImage =
          "https://plum-certain-marten-441.mypinata.cloud/ipfs/QmQonbn3FnmQHQwEqTraFRM7o1ostMMh74J6ej6ApqZK5r";
        tokenMetadata_.push({
          name: "Forever Moment",
          symbol: "FMNT",
          type: 2,
          creator: "0x3c33871d7ff685433cdba55a85a5960fd9feb007",
          contractAddress: "0xf35cf5b387e2dd0d44924cf6a050eb19e5d00099",
          ipfsHash: {
            url: defaultImage,
            width: 300,
            height: 300,
          },
        });
      }

      const tokensData_ = await erc725js.getData("LSP5ReceivedAssets[]");
      const tokens = tokensData_.value as string[];
      setTotalAssetsCount((prevCount) => prevCount + tokens.length);
      const tLength = tokens.length;
      console.log("tokens", tokens);
      console.log("tokens.length", tokens.length);

      if (tokens.length > 0) {
        for (let i = 0; i < tLength; i++) {
          const erc725 = new ERC725(LSP4Schema, tokens[i], RPC_MAINNET);

          // Step 1: Fetch the LSP4Metadata key
          const metadataResult = await erc725.getData("LSP4Metadata");
          const tokenName = await erc725.getData("LSP4TokenName");
          const tokenSymbol = await erc725.getData("LSP4TokenName");
          console.log("Token Name:", tokenName.value);
          console.log("Token Symbol:", tokenSymbol.value);
          console.log("Token ID:", tokens[i]);

          let ipfsHashUrl: string = "";
          const defaultIpfsHashUrl: string =
            "https://api.universalprofile.cloud/image/QmRnodxiibv3CnEa59eiYyNyjahCVAvLUi2JE9Zsp5bZn3";

          if (metadataResult?.value) {
            // Step 2: Get the metadata URI (e.g., ipfs://QmHash)
            const metadataUri = (metadataResult.value as { url: string }).url;
            const metadataUrl = metadataUri.replace(
              "ipfs://",
              "https://ipfs.io/ipfs/"
            );

            console.log("metadataUri", metadataUri);
            console.log("metadataUrl", metadataUrl);

            const response = await fetch("/api/getAssetsByIpfsHash", {
              method: "POST",
              body: metadataUrl,
            });
            const metadataJson = await response.json();
            const data = metadataJson.metadataJson;
            console.log("data", data);

            let ipfsHashUri = "";
            if (data.LSP4Metadata?.images.length > 0) {
              ipfsHashUri = data.LSP4Metadata?.images[0][0].url;
              ipfsHashUrl = ipfsHashUri.replace(
                "ipfs://",
                "https://api.universalprofile.cloud/image/"
              );
            }
          }

          tokenMetadata_.push({
            name: tokenName.value as string,
            symbol: tokenSymbol.value as string,
            type: 2,
            creator: address,
            contractAddress: tokens[i],
            ipfsHash: {
              url: ipfsHashUrl ? ipfsHashUrl : defaultIpfsHashUrl,
              width: 300,
              height: 300,
            },
          });
          setLoadedAssetsCount((prevCount) => prevCount + 1);
        }
      }
      console.log("tokenMetadata", tokenMetadata_);
      setTokens(tokenMetadata_);
    }
  };
  const fetchProfileMetadata = async () => {
    if (address && walletProvider) {
      fetchProfileName(address);
      const ethersProvider = new ethers.providers.Web3Provider(
        walletProvider,
        "any"
      );
      const signer = ethersProvider.getSigner(address);
      const _lyxBalance = await ethersProvider.getBalance(address as string);
      const lyxBalance = ethers.utils.formatEther(_lyxBalance);
      setLyxBalance(lyxBalance);

      const erc725js = new ERC725(
        LSP3Schema,
        "0x3c33871d7ff685433cdba55a85a5960fd9feb007", //address,
        process.env.NEXT_PUBLIC_MAINNET_URL,
        {
          ipfsGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY,
        }
      );

      const result = await erc725js.fetchData("LSP3Profile");
      const decodedProfileMetadata =
        result as unknown as DecodedProfileMetadata;

      if (
        decodedProfileMetadata.value &&
        decodedProfileMetadata.value.LSP3Profile
      ) {
        setProfile(decodedProfileMetadata.value.LSP3Profile);
      }

      const FMTContract = new ethers.Contract(
        FMTContractAddress,
        FMT.abi,
        signer
      );
      const _balance = await FMTContract.balanceOf(address);
      setFmtBalance(hexToDecimal(_balance._hex));
      fetchMetadata();
      setIsDownloading(true);
    }
  };
  useEffect(() => {
    fetchProfileMetadata();
  }, [address, walletProvider]);

  const handleCopyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("You minted one memory successfully!");
    } catch (error) {
      console.error("Failed to copy address:", error);
      toast.error("Failed to copy address. Please try again.");
    }
  };

  return !isDownloading ? (
    <div className="flex space-x-2 justify-center items-center bg-gray-200 h-screen dark:invert">
      <span className="sr-only">Loading...</span>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-8 w-8 bg-black rounded-full animate-bounce"></div>
    </div>
  ) : (
    <div className="max-w-3xl mx-auto">
      {/* Header Section */}
      <div className="relative w-full h-60 bg-pink-400">
        {/* Background Image */}
        <Image
          src={
            profile?.backgroundImage && profile.backgroundImage[0]?.url
              ? convertIpfsUriToUrl(profile.backgroundImage[0].url)
              : ""
          }
          alt="Profile Background"
          fill
          className="object-cover"
        />
        {/* User Avatar */}
        <div className="absolute left-6 bottom-[-40px] w-24 h-24 rounded-full border-4 border-white overflow-hidden">
          <Image
            src={
              profile?.profileImage && profile.profileImage[0]?.url
                ? convertIpfsUriToUrl(profile.profileImage[0].url)
                : ""
            }
            alt="User Avatar"
            width={96}
            height={96}
            className="object-cover"
          />
        </div>
      </div>

      {/* User Info Section */}
      <div className="bg-white shadow-lg rounded-lg p-6 mt-16">
        <h1
          className="text-2xl font-semibold hover:cursor-pointer"
          onClick={() => handleCopyToClipboard(address ? address : "")}
        >
          {profileName}
        </h1>
        <p className="text-sm text-gray-600">{profile?.description}</p>

        {/* Tags Section */}
        <div className="flex gap-2 mt-2">
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
            product design
          </span>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
            forever moments
          </span>
        </div>

        {/* Follow Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={() => setIsFollowing(!isFollowing)}
            className={`px-4 py-2 rounded-lg font-medium ${
              isFollowing
                ? "bg-gray-200 text-gray-600"
                : "bg-blue-600 text-white"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>
      </div>
      <div className="mt-4">Total: {totalAssetsCount}</div>

      {loadedAssetsCount === totalAssetsCount ? (
        <div className="pt-10 grid grid-cols-3 gap-4">
          {tokens &&
            tokens.map((token, index) => (
              <div key={index}>
                <TokenCard tokenMetadata={token} />
              </div>
            ))}
        </div>
      ) : (
        <>
          <div>Loaded: {loadedAssetsCount}</div>
          <div className="font-bold">Assets are Loading...</div>
        </>
      )}
      <Toaster />
    </div>

    // </main>
  );
}
