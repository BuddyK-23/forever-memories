import { NextResponse, NextRequest } from "next/server";
import { encryptWithPublicKey } from "@/utils/encryption";
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
    const collectionPublicKey = data.get("collectionPublicKey") as string;

    if (!file) {
      throw new Error("No file found in request");
    }

    if (!collectionPublicKey) {
      throw new Error("Collection public key is required");
    }

    // Encrypt the file with the collection's public key
    const fileArrayBuffer = await file.arrayBuffer();
    const encryptedData = encryptWithPublicKey(
      collectionPublicKey,
      new Uint8Array(fileArrayBuffer)
    );

    // Upload the encrypted file to Pinata
    const ipfsHash = await uploadToPinata(encryptedData);

    return new NextResponse(
      JSON.stringify({ ipfsHash }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
