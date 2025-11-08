import { NextRequest, NextResponse } from "next/server";
import { generateStrategySuggestion } from "@/lib/ai/strategy";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { season, objective } = body;

    if (!season || !objective) {
      return NextResponse.json(
        { error: "season and objective are required" },
        { status: 400 }
      );
    }

    const suggestion = await generateStrategySuggestion(season, objective);

    return NextResponse.json(suggestion);
  } catch (error) {
    console.error("Error generating strategy:", error);
    return NextResponse.json(
      { error: "Failed to generate strategy" },
      { status: 500 }
    );
  }
}
