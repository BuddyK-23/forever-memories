import { NextResponse, NextRequest } from "next/server";

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

    const arrayBuffer = await file.arrayBuffer();
    const ipfsHash = await uploadToPinata(arrayBuffer);
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
