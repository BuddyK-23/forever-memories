import { NextResponse, NextRequest } from "next/server";
import { generateEncryptionKey, encryptFile } from "@/utils/upload";
import { generateEncryptedEncryptionKey, generateAESKey } from "@/utils/encryptKey";
import { hexToDecimal, uint8ArrayToHexString } from "@/utils/format";

export const dynamic = "auto";
export const dynamicParams = true;
export const revalidate = false;
export const fetchCache = "auto";
export const runtime = "nodejs";
export const preferredRegion = "auto";
export const maxDuration = 5;

async function uploadToPinata(data: ArrayBuffer): Promise<string> {
  const formData = new FormData();
  formData.append("file", new Blob([data]));
  const response = await fetch(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT_KEY}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to upload to Pinata");
  }

  const responseData = await response.json();
  return responseData.IpfsHash;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as File | null;

    if (!file) {
      throw new Error("No file found in request");
    }

    const encryptionKey = await generateEncryptionKey(
      data.get("lsp7CollectionMetadata") as string
    ); // Ensure 256-bit key
    console.log("encryptionKey", encryptionKey);
    const encryptedData = await encryptFile(file, encryptionKey);
    console.log("Image encrypted successfully.");
    const ipfsHash = await uploadToPinata(encryptedData);
    console.log("Uploaded encrypted data to Pinata. IPFS Hash:", ipfsHash);

    // Encrypt the encryption key using a secret
    const aesKey = await generateAESKey();
    console.log("aesKey", aesKey);

    const { iv, encryptedKey } = await generateEncryptedEncryptionKey(aesKey, encryptionKey);

    // Combine iv and encrypted key into one Uint8Array
    const ivAndEncryptedKey = new Uint8Array(iv.length + encryptedKey.length);
    ivAndEncryptedKey.set(iv, 0);
    ivAndEncryptedKey.set(encryptedKey, iv.length);
    const ivAndEncryptedKeyArr = uint8ArrayToHexString(ivAndEncryptedKey);

    return new NextResponse(JSON.stringify({ ipfsHash, ivAndEncryptedKeyArr }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
