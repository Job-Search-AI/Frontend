import { NextRequest, NextResponse } from "next/server";

interface QueryPayload {
  user_input: string;
}

const DEFAULT_REQUEST_TIMEOUT_MS = 25_000;
const MIN_REQUEST_TIMEOUT_MS = 3_000;
const MAX_REQUEST_TIMEOUT_MS = 25_000;

const buildUpstreamUrl = (baseUrl: string) => {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBaseUrl}/query`;
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

const resolveRequestTimeoutMs = () => {
  const raw = process.env.BACKEND_API_TIMEOUT_MS;
  if (!raw) {
    return DEFAULT_REQUEST_TIMEOUT_MS;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_REQUEST_TIMEOUT_MS;
  }

  const rounded = Math.floor(parsed);
  return Math.min(MAX_REQUEST_TIMEOUT_MS, Math.max(MIN_REQUEST_TIMEOUT_MS, rounded));
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

  const backendApiUrl = process.env.BACKEND_API_URL;
  if (!backendApiUrl) {
    return NextResponse.json({ message: "BACKEND_API_URL is not configured." }, { status: 500 });
  }

  const requestTimeoutMs = resolveRequestTimeoutMs();
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), requestTimeoutMs);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(buildUpstreamUrl(backendApiUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_input: payload.user_input.trim()
      }),
      cache: "no-store",
      signal: abortController.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        {
          message: `Backend API response exceeded ${requestTimeoutMs / 1000}s. Please retry shortly.`,
          code: "BACKEND_TIMEOUT"
        },
        {
          status: 503,
          headers: {
            "Retry-After": "5"
          }
        }
      );
    }

    return NextResponse.json({ message: "Failed to connect to backend API." }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
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
