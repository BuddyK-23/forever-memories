import { NextResponse, NextRequest } from "next/server";
import { encryptWithPublicKey } from "@/utils/encryption";

async function uploadToPinata(data: Uint8Array): Promise<string> {
  const formData = new FormData();
  formData.append("file", new Blob([data], { type: "application/json" })); // MIME type for JSON

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PINATA_JWT_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    console.error("Pinata upload failed:", await response.text());
    throw new Error("Failed to upload to Pinata");
  }

  const responseData = await response.json();
  return responseData.IpfsHash;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await request.text(); // Retrieve metadata JSON as a string
    const collectionPublicKey = request.headers.get("x-collection-public-key");

    if (!collectionPublicKey) {
      throw new Error("Collection public key is required.");
    }

    // Encrypt metadata JSON with the collection's public key
    let encryptedMetadata: Uint8Array;
    try {
      encryptedMetadata = encryptWithPublicKey(
        collectionPublicKey,
        new TextEncoder().encode(data) // Convert string to Uint8Array
      );
    } catch (encryptionError) {
      console.error("Metadata encryption failed:", encryptionError);
      throw new Error("Failed to encrypt metadata.");
    }

    // Upload encrypted metadata to Pinata
    let metadataHash: string;
    try {
      metadataHash = await uploadToPinata(encryptedMetadata);
    } catch (uploadError) {
      console.error("Metadata upload failed:", uploadError);
      throw new Error("Failed to upload metadata to IPFS.");
    }

    return NextResponse.json({ metadataHash }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unknown error occurred during metadata upload.";

    console.error("Metadata Upload Error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
