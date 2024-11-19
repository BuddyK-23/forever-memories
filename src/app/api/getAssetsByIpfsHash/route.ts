import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const metadataUrl = await request.text();
    console.log("metadataUrl", metadataUrl);
    const response = await fetch(metadataUrl);
    const metadataJson = await response.json();
    return new NextResponse(
      JSON.stringify({ metadataJson }),
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
