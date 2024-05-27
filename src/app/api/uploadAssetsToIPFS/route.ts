import { NextResponse, NextRequest } from "next/server";
import { generateEncryptionKey, encryptFile } from "@/utils/upload";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function uploadToPinata(data: ArrayBuffer): Promise<string> {
  console.log("server dispatch");
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
      process.env.NEXT_PUBLIC_ENCRYPTION_KEY!
    ); // Ensure 256-bit key
    console.log("encryptionKey", encryptionKey);
    const encryptedData = await encryptFile(file, encryptionKey);
    console.log("Image encrypted successfully.");
    const ipfsHash = await uploadToPinata(encryptedData);
    console.log("Uploaded encrypted data to Pinata. IPFS Hash:", ipfsHash);
    return new NextResponse(JSON.stringify({ ipfsHash }), {
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
