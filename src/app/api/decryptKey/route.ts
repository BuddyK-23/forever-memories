import { NextRequest, NextResponse } from "next/server";
import { decryptEncryptedEncryptionKey } from "@/utils/encryptKey";
import { jsonToUint8Array } from "@/utils/format";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const jsonArrayBuffer = await request.json();
    const combinedData = jsonToUint8Array(jsonArrayBuffer);
    // Call the decryption function
    const decryptedKey = await decryptEncryptedEncryptionKey(combinedData);

    console.log(
      "Decryption successful, decrypted key length:",
      decryptedKey.length
    );

    // Respond with the decrypted key as JSON
    return NextResponse.json(
      { decryptedKey: Array.from(decryptedKey) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during decryption process:", error);
    return NextResponse.json(
      { error: "Error decrypting key" },
      { status: 500 }
    );
  }
}
