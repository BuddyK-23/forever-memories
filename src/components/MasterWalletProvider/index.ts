import { ethers } from "ethers";
import FMT from "@/artifacts/FMT.json";

// Test
const providerUrl = "https://4201.rpc.thirdweb.com/";
const privateKey =
  "0xed9f33686e286892181a2e05a03d52995c29605b1df17bcc184ebe50ca8aaeee";
const FMT_TOKEN_CONTRACT_ADDRESS = "0x0C5a06045b52d1Abf51e81066033DC86D6A9Cd03";
// Main
// const providerUrl = "https://42.rpc.thirdweb.com/";
// const privateKey =
//   "0x0e892ce1c5ccc316308472782fea25e8bc9332b448e25cab4a96a07f2bfa05e2";
// const FMT_TOKEN_CONTRACT_ADDRESS = "0x1AFfC5d4d2cEc67BE8b719a9Dc9993Ffe6FaF04d";

// Create a provider
const provider = new ethers.providers.JsonRpcProvider(providerUrl);
const wallet = new ethers.Wallet(privateKey, provider);

export const FMTContract = new ethers.Contract(
  FMT_TOKEN_CONTRACT_ADDRESS,
  FMT.abi,
  wallet
);
