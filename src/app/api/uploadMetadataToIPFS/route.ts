import { NextResponse, NextRequest } from "next/server";

async function uploadToPinata(data: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", data, "metadata.json");

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PINATA_JWT_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload to Pinata");
  }

  const responseData = await response.json();
  return responseData.IpfsHash;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const metadata_json = await request.text();

    // Convert the metadata JSON string to a Blob
    const metadataBlob = new Blob([metadata_json], { type: "application/json" });

    // Upload the Blob to Pinata
    const metadataHash = await uploadToPinata(metadataBlob);

    return NextResponse.json({ metadataHash }, { status: 200 });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
