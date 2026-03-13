import { NextRequest, NextResponse } from "next/server";

const buildUpstreamUrl = (baseUrl: string, jobId: string) => {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBaseUrl}/query/jobs/${encodeURIComponent(jobId)}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const parseJsonSafely = (text: string): unknown | null => {
  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const extractErrorMessage = (payload: unknown): string | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const keys = ["message", "error", "detail"] as const;
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

export async function GET(_request: NextRequest, { params }: { params: { jobId: string } }) {
  const jobId = params.jobId?.trim();
  if (!jobId) {
    return NextResponse.json({ message: "jobId is required." }, { status: 400 });
  }

  const backendApiUrl = process.env.BACKEND_API_URL;
  if (!backendApiUrl) {
    return NextResponse.json({ message: "BACKEND_API_URL is not configured." }, { status: 500 });
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(buildUpstreamUrl(backendApiUrl, jobId), {
      method: "GET",
      cache: "no-store"
    });
  } catch {
    return NextResponse.json({ message: "Failed to connect to backend API." }, { status: 502 });
  }

  const rawBody = await upstreamResponse.text();
  const parsedBody = parseJsonSafely(rawBody);
  const message = extractErrorMessage(parsedBody) ?? (rawBody.trim() || null);

  if (!upstreamResponse.ok) {
    return NextResponse.json(
      {
        message: message ?? `Upstream API request failed. (HTTP ${upstreamResponse.status})`,
        upstreamStatus: upstreamResponse.status
      },
      { status: upstreamResponse.status }
    );
  }

  if (isRecord(parsedBody)) {
    return NextResponse.json(parsedBody, { status: upstreamResponse.status });
  }

  return NextResponse.json(
    {
      message: message ?? "Unexpected upstream response format.",
      upstreamStatus: upstreamResponse.status
    },
    { status: 502 }
  );
}
