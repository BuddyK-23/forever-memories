import { ethers } from "ethers";
import { ERC725 } from "@erc725/erc725.js";
import LSP3Schema from "@erc725/erc725.js/schemas/LSP3ProfileMetadata.json";
import { format } from "date-fns";

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

interface CategoryOption {
  value: number;
  label: string;
}

const Categories: CategoryOption[] = [
  { value: 0, label: "All" },
  { value: 1, label: "Animals" },
  { value: 2, label: "Art" },
  { value: 3, label: "Beauty" },
  { value: 4, label: "Best of" },
  { value: 5, label: "Cars" },
  { value: 6, label: "Comedy" },
  { value: 7, label: "Culture" },
  { value: 8, label: "Daily life" },
  { value: 9, label: "Drama" },
  { value: 10, label: "Earth" },
  { value: 11, label: "Education" },
  { value: 12, label: "Events" },
  { value: 13, label: "Family" },
  { value: 14, label: "Famous" },
  { value: 15, label: "Fashion" },
  { value: 16, label: "Food & Drink" },
  { value: 17, label: "Fitness" },
  { value: 18, label: "Games" },
  { value: 19, label: "Good times" },
  { value: 20, label: "Health" },
  { value: 21, label: "History" },
  { value: 22, label: "Humanity" },
  { value: 23, label: "Innovation" },
  { value: 24, label: "Journalism" },
  { value: 25, label: "Love" },
  { value: 26, label: "Music" },
  { value: 27, label: "Nature" },
  { value: 28, label: "Party" },
  { value: 29, label: "Personal" },
  { value: 30, label: "Photography" },
  { value: 31, label: "Random" },
  { value: 32, label: "Science" },
  { value: 33, label: "Society" },
  { value: 34, label: "Sport" },
  { value: 35, label: "Technology" },
  { value: 36, label: "Time capsule" },
  { value: 37, label: "Travel & Adventure" },
];

/**
 * Retrieves the list of category options.
 * @returns {CategoryOption[]} The list of category options.
 */
export function getCategoryOptions(): CategoryOption[] {
  return Categories;
}

export function anonymousAddress(address: string): string {
  // Ensure the address has a valid length and starts with "0x"
  if (!address.startsWith("0x") || address.length < 10) {
    throw new Error("Invalid address format");
  }
  // Return the formatted string
  return `${address.slice(0, 10)}...${address.slice(-8)}`;
}

export function checkCID(ipfsString: string): boolean {
  const ipfsPrefix = "ipfs://";
  // Check if the string starts with the IPFS prefix
  if (!ipfsString.startsWith(ipfsPrefix)) return false;
  else return true;
}

export async function getUniversalProfileCustomName(
  address: string
): Promise<{ profileName: string; cid: string; description: string }> {
  const erc725js = new ERC725(
    LSP3Schema,
    address,
    process.env.NEXT_PUBLIC_MAINNET_URL,
    {
      ipfsGateway: process.env.NEXT_PUBLIC_IPFS_GATEWAY,
    }
  );
  // Fetch the LSP3 profile metadata
  const profileData = await erc725js.fetchData("LSP3Profile");
  const decodedProfileMetadata =
    profileData as unknown as DecodedProfileMetadata;
  const profile: LSP3Profile = decodedProfileMetadata.value.LSP3Profile;
  const addressPrefix = address.slice(2, 6);
  const description = profile.description;
  let profileName;
  if (!profile.name) profileName = anonymousAddress(address);
  else profileName = `@${profile.name}#${addressPrefix}`;
  const cid = profile?.profileImage ? profile.profileImage[0]?.url : "";

  // Return the Universal Profile name
  return { profileName, cid, description };
}

export function generateProfileName(name: string, address: string): string {
  // Extract the first 4 characters of the address
  const addressPrefix = address.slice(0, 4);

  // Generate the formatted string
  return `@${name}#${addressPrefix}`;
}

export function bytes32ToAddress(bytes32: string): string {
  // Ensure the input is a valid bytes32 string
  if (!ethers.utils.isHexString(bytes32) || bytes32.length !== 66) {
    throw new Error("Invalid bytes32 string");
  }

  // Extract the last 40 characters (20 bytes) and prepend '0x'
  const address = "0x" + bytes32.slice(-40);
  return address;
}

export function decimalToBytes32(decimal: number | string): string {
  // Convert the decimal to a BigNumber
  const bigNumber = ethers.BigNumber.from(decimal);

  // Ensure the BigNumber fits within 32 bytes
  if (
    bigNumber.gt(
      ethers.BigNumber.from(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
      )
    )
  ) {
    throw new Error("Decimal value is too large to fit in 32 bytes");
  }

  // Convert to 32-byte hex string
  return ethers.utils.hexZeroPad(bigNumber.toHexString(), 32);
}

/**
 * Convert a Unix timestamp to a custom formatted date string.
 * @param unixTimestamp - The Unix timestamp to convert.
 * @param dateFormat - The format string for the date.
 * @returns A formatted date string.
 */
export function convertUnixTimestampToCustomDate(
  unixTimestamp: number,
  dateFormat: string
): string {
  const date = new Date(unixTimestamp * 1000);
  return format(date, dateFormat);
}

/**
 * Convert a hexadecimal string to a decimal number.
 * @param hexString - The hexadecimal string to convert.
 * @returns The decimal number.
 */
export function hexToDecimal(hexString: string): number {
  // Use parseInt with base 16 to convert hex to decimal
  return parseInt(hexString, 16);
}

/**
 * Converts an IPFS URI to a URL using a specified gateway.
 *
 * @param {string} ipfsUri - The IPFS URI, e.g., "ipfs://Qm...".
 * @param {string} gateway - The gateway URL to use, e.g., "https://ipfs.io/ipfs/".
 * @returns {string} - The full URL to access the resource.
 */
export function convertIpfsUriToUrl(
  ipfsUri: string,
  gateway: string = "https://ipfs.io/ipfs/"
): string {
  // Validate that ipfsUri is provided and is a string
  if (typeof ipfsUri !== "string") {
    return process.env.NEXT_PUBLIC_DEFAULT_UP_ICON as string;
  }

  // Check if the IPFS URI starts with "ipfs://"
  if (ipfsUri.startsWith("ipfs://")) {
    // Remove the "ipfs://" prefix and append the hash to the gateway URL
    const ipfsHash = ipfsUri.substring(7); // "ipfs://" is 7 characters long
    return `${gateway}${ipfsHash}`;
  }

  // If the IPFS URI doesn't have the "ipfs://" prefix, throw an error
  throw new Error("Invalid IPFS URI: It must start with 'ipfs://'.");
}

// Convert Uint8Array to bytes
export function uint8ArrayToHexString(array: Uint8Array): string {
  return (
    "0x" +
    Array.from(array)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  );
}

// Retrieving and Converting Back to Uint8Array
export function hexStringToUint8Array(hexString: string): Uint8Array {
  hexString = hexString.replace(/^0x/, "");
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function jsonToUint8Array(json: { [key: string]: number }): Uint8Array {
  const keys = Object.keys(json); // Get keys as strings
  const length = keys.length; // Determine the length of the array
  const arr = new Uint8Array(length); // Create a new Uint8Array of that length

  for (let i = 0; i < length; i++) {
    arr[i] = json[i]; // Assign each value from the JSON object
  }

  return arr; // Return the constructed Uint8Array
}

export function getValueByKey(
  attributes: { key: string; value: string; type: string }[],
  key: string
): string | undefined {
  const attribute = attributes.find((attr) => attr.key === key);
  return attribute?.value;
}
