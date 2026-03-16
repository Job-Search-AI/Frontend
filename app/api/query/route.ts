import { NextRequest, NextResponse } from "next/server";
import { getLocalQueryFinalResponse, getLocalQueryMockScenario, shouldUseLocalQueryMock } from "@/lib/local-query-mock";

interface QueryPayload {
  user_input: string;
}

const buildUpstreamUrl = (baseUrl: string) => {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBaseUrl}/query`;
};

export async function POST(request: NextRequest) {
  let payload: QueryPayload;

  try {
    payload = (await request.json()) as QueryPayload;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof payload.user_input !== "string" || payload.user_input.trim() === "") {
    return NextResponse.json({ message: "user_input is required." }, { status: 400 });
  }

  const userInput = payload.user_input.trim();
  const backendApiUrl = process.env.BACKEND_API_URL;

  if (shouldUseLocalQueryMock(backendApiUrl)) {
    const scenario = getLocalQueryMockScenario();
    return NextResponse.json(getLocalQueryFinalResponse(userInput, scenario));
  }

  if (!backendApiUrl) {
    return NextResponse.json({ message: "BACKEND_API_URL is not configured." }, { status: 500 });
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(buildUpstreamUrl(backendApiUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_input: userInput
      }),
      cache: "no-store"
    });
  } catch {
    return NextResponse.json({ message: "Failed to connect to backend API." }, { status: 502 });
  }

  const contentType = upstreamResponse.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = await upstreamResponse.json();
    return NextResponse.json(data, { status: upstreamResponse.status });
  }

  const text = await upstreamResponse.text();
  return NextResponse.json({ message: text || "Unexpected upstream response." }, { status: upstreamResponse.status });
}
