import { NextRequest, NextResponse } from "next/server";
import { createLocalQueryJobStartResponse, getLocalQueryMockScenario, shouldUseLocalQueryMock } from "@/lib/local-query-mock";
import type { AsyncJobStatus } from "@/types/search";

interface QueryStartPayload {
  user_input: string;
}

const ASYNC_JOB_STATUSES: AsyncJobStatus[] = ["queued", "running", "done", "failed"];

const buildUpstreamUrl = (baseUrl: string) => {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBaseUrl}/query/jobs`;
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

const isAsyncJobStatus = (value: unknown): value is AsyncJobStatus =>
  typeof value === "string" && ASYNC_JOB_STATUSES.includes(value as AsyncJobStatus);

const hasValidJobEnvelope = (payload: unknown): payload is { job_id: string; status: AsyncJobStatus } => {
  if (!isRecord(payload)) {
    return false;
  }

  return typeof payload.job_id === "string" && payload.job_id.trim().length > 0 && isAsyncJobStatus(payload.status);
};

export async function POST(request: NextRequest) {
  let payload: QueryStartPayload;

  try {
    payload = (await request.json()) as QueryStartPayload;
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
    return NextResponse.json(createLocalQueryJobStartResponse(userInput, scenario));
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

  if (hasValidJobEnvelope(parsedBody)) {
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
