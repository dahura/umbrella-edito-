import { NextResponse } from "next/server";
import { guardAgent } from "@/app/agent/text-guard-agent";

export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text?: string };
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing required field 'text' (string)." },
        { status: 400 }
      );
    }

    const result = await guardAgent(text);
    return NextResponse.json(result);
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { error: "Internal error", details: (err as Error).message },
      { status: 500 }
    );
  }
}
