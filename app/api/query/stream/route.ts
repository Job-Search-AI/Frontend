import { NextRequest, NextResponse } from "next/server";

interface QueryStreamPayload {
  user_input: string;
}

const buildUpstreamUrl = (baseUrl: string) => {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBaseUrl}/query/stream`;
};

export async function POST(request: NextRequest) {
  let payload: QueryStreamPayload;

  try {
    payload = (await request.json()) as QueryStreamPayload;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof payload.user_input !== "string" || payload.user_input.trim() === "") {
    return NextResponse.json({ message: "user_input is required." }, { status: 400 });
  }

  const backendApiUrl = process.env.BACKEND_API_URL;
  if (!backendApiUrl) {
    return NextResponse.json({ message: "BACKEND_API_URL is not configured." }, { status: 500 });
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(buildUpstreamUrl(backendApiUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream"
      },
      body: JSON.stringify({
        user_input: payload.user_input.trim()
      }),
      cache: "no-store"
    });
  } catch {
    return NextResponse.json({ message: "Failed to connect to backend API." }, { status: 502 });
  }

  const contentType = upstreamResponse.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    const text = await upstreamResponse.text();
    return NextResponse.json({ message: text || "Unexpected upstream response." }, { status: upstreamResponse.status });
  }

  if (!upstreamResponse.body) {
    return NextResponse.json({ message: "Upstream stream body is empty." }, { status: 502 });
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
