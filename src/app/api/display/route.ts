import { NextResponse } from "next/server";
import { getDisplayData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getDisplayData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Display data error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
