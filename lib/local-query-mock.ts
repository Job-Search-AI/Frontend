import { JOB_STEP_LABELS } from "@/lib/job-steps";
import type {
  AsyncJobStatus,
  SearchApiResponse,
  SearchStatusResponse,
  SearchStartResponse,
  JobStep
} from "@/types/search";

export type LocalQueryMockScenario = "complete" | "incomplete" | "failed" | "slow";

interface LocalQueryJobState {
  job_id: string;
  user_input: string;
  scenario: LocalQueryMockScenario;
  status_checks: number;
  created_at: number;
}

type LocalQueryJobStore = Map<string, LocalQueryJobState>;

const LOCAL_QUERY_MOCK_SCENARIOS = new Set<LocalQueryMockScenario>(["complete", "incomplete", "failed", "slow"]);

const FAST_FLOW_STEPS: JobStep[] = ["collecting", "parsing", "ranking", "writing"];
const SLOW_FLOW_STEPS: JobStep[] = ["analyzing", "collecting", "parsing", "ranking", "writing"];
const SLOW_SCENARIO_DONE_AFTER_CHECKS = 75;
const QUEUED_CHECKS_FOR_SLOW_SCENARIO = 3;
const LOCAL_JOB_STORE_TTL_MS = 10 * 60 * 1000;
const LOCAL_JOB_STORE_MAX_ENTRIES = 200;

const isEnabledFlag = (value?: string | null) => /^(1|true|yes|on)$/i.test(value?.trim() ?? "");

const parseScenario = (value?: string | null): LocalQueryMockScenario => {
  if (!value) {
    return "complete";
  }

  const normalized = value.trim();
  return LOCAL_QUERY_MOCK_SCENARIOS.has(normalized as LocalQueryMockScenario) ? (normalized as LocalQueryMockScenario) : "complete";
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
    `[A사] 서울 강남 | AI 백엔드 엔지니어(신입) | 정규직
주요업무:
- FastAPI 기반 채용 매칭 API 설계 및 운영
- 검색 품질 개선을 위한 하이브리드 랭킹(BM25 + 벡터 검색) 파이프라인 고도화
- Redis, PostgreSQL, OpenSearch 기반 성능 튜닝 및 장애 대응
- 사내 LLM 서비스와 연동되는 프롬프트/후처리 로직 개발

자격요건:
- Python 백엔드 개발 경험 또는 이에 준하는 프로젝트 경험
- REST API 설계, 예외 처리, 로깅, 모니터링에 대한 이해
- Git 기반 협업 및 코드 리뷰 경험

우대사항:
- 벡터DB, 임베딩 검색, RAG 서비스 구축 경험
- Docker, CI/CD, 클라우드 인프라(AWS/GCP) 운영 경험

근무조건:
- 주 5일(월-금), 선택적 출근 시간제
- 수습 3개월(급여 100%), 장비 및 교육비 지원`,
    `[B사] 판교 | ML 플랫폼 엔지니어(주니어) | 하이브리드 근무
주요업무:
- 데이터 수집/정제/학습/배포 전 과정을 자동화하는 ML 파이프라인 관리
- 모델 성능 모니터링 대시보드 구축 및 배포 품질 기준 수립
- 내부 추천/검색 모델의 배치 및 실시간 추론 환경 최적화

자격요건:
- Python 또는 TypeScript 기반 서비스 개발 경험
- ETL, 배치 작업, 메시지 큐 등 데이터 파이프라인 이해
- 문제 원인 분석 및 재현 가능한 디버깅 역량

우대사항:
- Airflow, Prefect, Argo Workflows 등 워크플로 오케스트레이션 경험
- 실험 추적(MLflow/W&B)과 모델 버전 관리 경험

근무조건:
- 주 2회 오피스 출근, 나머지 재택
- 직무 관련 컨퍼런스/강의/도서 비용 지원`,
    `[C사] 서울 마포 | 추천 시스템 백엔드 개발자(신입/주니어) | 정규직
주요업무:
- 개인화 추천 API 개발 및 트래픽 증가 구간 성능 안정화
- 채용공고 메타데이터 파싱, 정규화, 색인 파이프라인 유지보수
- A/B 테스트 결과 분석을 통한 추천 로직 개선

자격요건:
- 백엔드 웹 프레임워크 기반 개발 경험
- SQL 작성 능력 및 데이터 모델링 기초 이해
- 서비스 운영 환경에서의 장애 대응 프로세스 이해

우대사항:
- 검색/추천 도메인 경험, 랭킹 지표(NDCG, MRR) 이해
- 대규모 로그 분석 및 성능 개선 경험

근무조건:
- 수평적인 코드 리뷰 문화
- 야근 최소화 원칙, 탄력 근무제 운영`
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

const getFlowStep = (statusChecks: number, steps: JobStep[]): JobStep => {
  const index = Math.min(Math.max(statusChecks - 1, 0), steps.length - 1);
  return steps[index];
};

const toStepLabel = (step: JobStep): string => JOB_STEP_LABELS[step];

declare global {
  // eslint-disable-next-line no-var
  var __LOCAL_QUERY_JOB_STORE__: LocalQueryJobStore | undefined;
}

const getLocalJobStore = (): LocalQueryJobStore => {
  if (!globalThis.__LOCAL_QUERY_JOB_STORE__) {
    globalThis.__LOCAL_QUERY_JOB_STORE__ = new Map<string, LocalQueryJobState>();
  }
  return globalThis.__LOCAL_QUERY_JOB_STORE__;
};

const pruneLocalJobStore = () => {
  const store = getLocalJobStore();
  const now = Date.now();

  store.forEach((job, jobId) => {
    if (now - job.created_at > LOCAL_JOB_STORE_TTL_MS) {
      store.delete(jobId);
    }
  });

  if (store.size <= LOCAL_JOB_STORE_MAX_ENTRIES) {
    return;
  }

  const entries = Array.from(store.entries()).sort((a, b) => a[1].created_at - b[1].created_at);
  const overflow = entries.length - LOCAL_JOB_STORE_MAX_ENTRIES;
  for (let index = 0; index < overflow; index += 1) {
    const [jobId] = entries[index];
    store.delete(jobId);
  }
};

const createLocalJobId = () => {
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `local-job-${Date.now()}-${randomPart}`;
};

const toRunningEnvelope = (jobId: string, step: JobStep): SearchStatusResponse => {
  return {
    job_id: jobId,
    status: "running",
    step,
    step_label: toStepLabel(step)
  };
};

const toDoneEnvelope = (jobId: string, response: SearchApiResponse): SearchStatusResponse => {
  return {
    job_id: jobId,
    status: "done",
    step: "writing",
    step_label: toStepLabel("writing"),
    result: response
  };
};

const toQueuedEnvelope = (jobId: string): SearchStatusResponse => {
  return {
    job_id: jobId,
    status: "queued",
    message: "작업 대기열 처리 중입니다."
  };
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

export const createLocalQueryJobStartResponse = (userInput: string, scenario: LocalQueryMockScenario): SearchStartResponse => {
  pruneLocalJobStore();

  const jobId = createLocalJobId();
  const jobState: LocalQueryJobState = {
    job_id: jobId,
    user_input: userInput,
    scenario,
    status_checks: 0,
    created_at: Date.now()
  };
  getLocalJobStore().set(jobId, jobState);

  if (scenario === "slow") {
    return toQueuedEnvelope(jobId);
  }

  return {
    job_id: jobId,
    status: "running",
    step: "analyzing",
    step_label: toStepLabel("analyzing")
  };
};

export const getLocalQueryJobStatusResponse = (jobId: string): SearchStatusResponse | null => {
  pruneLocalJobStore();

  const store = getLocalJobStore();
  const job = store.get(jobId);
  if (!job) {
    return null;
  }

  job.status_checks += 1;

  if (job.scenario === "failed") {
    if (job.status_checks >= 4) {
      store.delete(jobId);
      return {
        job_id: jobId,
        status: "failed",
        message: "로컬 mock: 백엔드 작업이 실패했습니다."
      };
    }

    return toRunningEnvelope(jobId, getFlowStep(job.status_checks, FAST_FLOW_STEPS));
  }

  if (job.scenario === "incomplete") {
    if (job.status_checks >= 3) {
      store.delete(jobId);
      return toDoneEnvelope(jobId, buildIncompleteResponse(job.user_input));
    }

    return toRunningEnvelope(jobId, getFlowStep(job.status_checks, FAST_FLOW_STEPS));
  }

  if (job.scenario === "slow") {
    if (job.status_checks <= QUEUED_CHECKS_FOR_SLOW_SCENARIO) {
      return toQueuedEnvelope(jobId);
    }

    const runningChecks = job.status_checks - QUEUED_CHECKS_FOR_SLOW_SCENARIO;
    if (runningChecks >= SLOW_SCENARIO_DONE_AFTER_CHECKS) {
      store.delete(jobId);
      return toDoneEnvelope(jobId, buildCompleteResponse(job.user_input));
    }

    const stepIndex = Math.min(Math.floor((runningChecks - 1) / 18), SLOW_FLOW_STEPS.length - 1);
    const step = SLOW_FLOW_STEPS[stepIndex];
    return toRunningEnvelope(jobId, step);
  }

  if (job.status_checks >= 5) {
    store.delete(jobId);
    return toDoneEnvelope(jobId, buildCompleteResponse(job.user_input));
  }

  return toRunningEnvelope(jobId, getFlowStep(job.status_checks, FAST_FLOW_STEPS));
};
