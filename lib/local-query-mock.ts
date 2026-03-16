import { STREAM_STEP_LABELS } from "@/lib/stream-steps";
import type { SearchApiResponse, StreamStep } from "@/types/search";

export type LocalQueryMockScenario = "complete" | "incomplete" | "stream_error" | "stream_disconnect";

const LOCAL_QUERY_MOCK_SCENARIOS = new Set<LocalQueryMockScenario>([
  "complete",
  "incomplete",
  "stream_error",
  "stream_disconnect"
]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isEnabledFlag = (value?: string | null) => /^(1|true|yes|on)$/i.test(value?.trim() ?? "");

const parseScenario = (value?: string | null): LocalQueryMockScenario => {
  if (!value) {
    return "complete";
  }

  return LOCAL_QUERY_MOCK_SCENARIOS.has(value as LocalQueryMockScenario) ? (value as LocalQueryMockScenario) : "complete";
};

const guessNormalizedEntities = (userInput: string) => {
  const normalizedUserInput = userInput.toLowerCase();
  const region = normalizedUserInput.includes("서울")
    ? "서울"
    : normalizedUserInput.includes("경기")
      ? "경기"
      : normalizedUserInput.includes("인천")
        ? "인천"
        : normalizedUserInput.includes("원격")
          ? "원격"
          : null;

  const role = normalizedUserInput.includes("백엔드")
    ? "백엔드/서버개발"
    : normalizedUserInput.includes("데이터")
      ? "데이터 엔지니어링"
      : normalizedUserInput.includes("mlops")
        ? "MLOps"
        : normalizedUserInput.includes("ai") || normalizedUserInput.includes("머신러닝")
          ? "인공지능/머신러닝"
          : null;

  const experience = normalizedUserInput.includes("신입")
    ? "신입"
    : normalizedUserInput.includes("주니어")
      ? "주니어"
      : normalizedUserInput.includes("미들")
        ? "미들"
        : normalizedUserInput.includes("경력무관")
          ? "경력무관"
          : null;

  const education =
    normalizedUserInput.includes("고졸") || normalizedUserInput.includes("고등학교")
      ? "고등학교졸업이상"
      : normalizedUserInput.includes("대졸") || normalizedUserInput.includes("대학졸업")
        ? "대학졸업(4년) 이상"
        : normalizedUserInput.includes("학력무관")
          ? "학력무관"
          : null;

  return {
    지역: region,
    직무: role,
    경력: experience,
    학력: education
  };
};

const buildCompleteResponse = (userInput: string): SearchApiResponse => {
  const guessed = guessNormalizedEntities(userInput);
  const normalizedEntities = {
    지역: guessed.지역 ?? "서울",
    직무: guessed.직무 ?? "인공지능/머신러닝",
    경력: guessed.경력 ?? "신입",
    학력: guessed.학력 ?? "대학졸업(4년) 이상"
  };

  const retrievedJobInfoList = [
    "[A사] 서울 강남 | AI 백엔드 엔지니어(신입) | Python/FastAPI, 벡터DB 연동 경험 우대 | 정규직",
    "[B사] 판교 | ML 플랫폼 엔지니어(주니어) | 데이터 파이프라인·MLOps 협업 | 하이브리드 근무",
    "[C사] 서울 마포 | 추천 시스템 백엔드 개발자(신입/주니어) | 검색 랭킹 및 API 최적화"
  ];

  const retrievedScores = [0.91, 0.86, 0.79];

  return {
    user_input: userInput,
    query: userInput,
    status: "complete",
    message: null,
    entities: null,
    지역: normalizedEntities.지역,
    직무: normalizedEntities.직무,
    경력: normalizedEntities.경력,
    학력: normalizedEntities.학력,
    missing_fields: null,
    normalized_entities: normalizedEntities,
    url: "https://www.saramin.co.kr/zf_user/search?searchword=AI",
    crawled_count: 27,
    job_info_list: retrievedJobInfoList,
    retrieved_job_info_list: retrievedJobInfoList,
    retrieved_scores: retrievedScores,
    user_response:
      "요청 조건과 유사도가 높은 공고 3건을 선별했습니다. 서울권 신입 포지션이 우선 매칭되며, FastAPI·검색/랭킹·MLOps 연관 키워드를 포함한 공고가 상위에 배치되었습니다."
  };
};

const buildIncompleteResponse = (userInput: string): SearchApiResponse => {
  const guessed = guessNormalizedEntities(userInput);

  return {
    user_input: userInput,
    query: userInput,
    status: "incomplete",
    message: "정확한 추천을 위해 직무 또는 경력 정보를 더 알려주세요.",
    entities: null,
    지역: guessed.지역,
    직무: guessed.직무,
    경력: guessed.경력,
    학력: guessed.학력,
    missing_fields: ["직무", "경력"],
    normalized_entities: {
      지역: guessed.지역,
      직무: guessed.직무,
      경력: guessed.경력,
      학력: guessed.학력
    },
    url: null,
    crawled_count: null,
    job_info_list: null,
    retrieved_job_info_list: null,
    retrieved_scores: null,
    user_response: "조건이 일부 부족해 검색이 완료되지 않았습니다. 누락 슬롯을 보완해 다시 요청해주세요."
  };
};

const toFinalScenario = (scenario: LocalQueryMockScenario): "complete" | "incomplete" => {
  return scenario === "incomplete" ? "incomplete" : "complete";
};

const toSseEventLine = (event: "step" | "final" | "error", data: unknown): string => {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
};

export const getLocalQueryMockScenario = (): LocalQueryMockScenario => {
  return parseScenario(process.env.LOCAL_QUERY_MOCK_SCENARIO);
};

export const shouldUseLocalQueryMock = (backendApiUrl?: string | null): boolean => {
  const enabledByFlag = isEnabledFlag(process.env.LOCAL_QUERY_MOCK);
  const enabledByMissingBackendInDev = process.env.NODE_ENV === "development" && !backendApiUrl?.trim();
  return enabledByFlag || enabledByMissingBackendInDev;
};

export const getLocalQueryFinalResponse = (userInput: string, scenario: LocalQueryMockScenario): SearchApiResponse => {
  const finalScenario = toFinalScenario(scenario);
  if (finalScenario === "incomplete") {
    return buildIncompleteResponse(userInput);
  }
  return buildCompleteResponse(userInput);
};

export const createLocalQueryStreamResponse = (userInput: string, scenario: LocalQueryMockScenario): Response => {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const push = (event: "step" | "final" | "error", data: unknown) => {
        controller.enqueue(encoder.encode(toSseEventLine(event, data)));
      };

      const pushStep = (step: StreamStep, label?: string) => {
        push("step", {
          step,
          label: label ?? STREAM_STEP_LABELS[step]
        });
      };

      const pushError = (message: string) => {
        push("error", { message });
      };

      const run = async () => {
        pushStep("analyzing");
        await sleep(260);

        if (scenario === "stream_error") {
          pushError("로컬 mock: 스트리밍 처리 중 오류가 발생했습니다.");
          controller.close();
          return;
        }

        if (scenario === "stream_disconnect") {
          pushStep("collecting");
          await sleep(260);
          controller.close();
          return;
        }

        if (scenario === "incomplete") {
          await sleep(260);
          push("final", getLocalQueryFinalResponse(userInput, scenario));
          controller.close();
          return;
        }

        const progressiveSteps: StreamStep[] = ["collecting", "parsing", "ranking", "writing"];

        for (const step of progressiveSteps) {
          pushStep(step);
          await sleep(220);
        }

        push("final", getLocalQueryFinalResponse(userInput, scenario));
        controller.close();
      };

      run().catch((error) => {
        const message = error instanceof Error ? error.message : "로컬 mock: 예상치 못한 스트림 오류가 발생했습니다.";
        pushError(message);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
};
