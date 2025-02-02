// app/api/key/route.ts
import { NextResponse } from "next/server";
import { pinata } from "@/utils/config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const uuid = crypto.randomUUID();
    const keyData = await pinata.keys.create({
      keyName: uuid.toString(),
      permissions: {
        endpoints: {
          pinning: {
            pinFileToIPFS: true,
          },
        },
      },
      maxUses: 1, // Temporary key valid for one use
    });
    return NextResponse.json(keyData, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error creating API Key" }, { status: 500 });
  }
}
