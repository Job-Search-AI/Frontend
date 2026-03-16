"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Filter, LayoutPanelTop, ListFilter, PanelBottomOpen } from "lucide-react";
import { FilterSidebar } from "@/components/search/filter-sidebar";
import { JobDetailPanel } from "@/components/search/job-detail-panel";
import { JobList } from "@/components/search/job-list";
import { ResponseSummary } from "@/components/search/response-summary";
import { SearchHero } from "@/components/search/search-hero";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getJobStepLabel, isJobStep } from "@/lib/job-steps";
import { cn } from "@/lib/utils";
import type {
  AsyncJobStatus,
  FilterSlot,
  SearchApiResponse,
  SearchFilters,
  SearchJobEnvelope,
  SearchResponseViewModel,
  SearchStartResponse,
  SearchStatusResponse,
  SearchStatus,
  SlotChipGroup,
  SortOption,
  JobStep
} from "@/types/search";

const defaultFilters: SearchFilters = {
  region: "전체",
  role: "전체",
  experience: "전체",
  education: "전체",
  sort: "relevance"
};

const filterOptions: Record<FilterSlot, string[]> = {
  region: ["전체", "서울", "경기", "인천", "원격"],
  role: ["전체", "인공지능/머신러닝", "백엔드/서버개발", "데이터 엔지니어링", "MLOps"],
  experience: ["전체", "신입", "주니어", "미들", "경력무관"],
  education: ["전체", "고등학교졸업이상", "대학졸업(2,3년) 이상", "대학졸업(4년) 이상", "학력무관"]
};

const slotChips: SlotChipGroup[] = [
  {
    slot: "region",
    label: "지역",
    options: ["서울", "경기", "원격"]
  },
  {
    slot: "role",
    label: "직무",
    options: ["인공지능/머신러닝", "백엔드/서버개발", "데이터 엔지니어링"]
  },
  {
    slot: "experience",
    label: "경력",
    options: ["신입", "주니어", "경력무관"]
  },
  {
    slot: "education",
    label: "학력",
    options: ["고등학교졸업이상", "대학졸업(4년) 이상", "학력무관"]
  }
];

const QUEUED_LABEL = "대기열 처리 중";
const POLL_TIMEOUT_MS = 5 * 60 * 1000;
const POLL_INTERVAL_FAST_MS = 1_000;
const POLL_INTERVAL_SLOW_MS = 2_000;
const POLL_INTERVAL_SWITCH_MS = 30_000;
const STATUS_ERROR_RETRY_LIMIT = 3;
const DEFAULT_REQUEST_ERROR_MESSAGE = "검색 요청 처리에 실패했습니다.";
const POLL_TIMEOUT_MESSAGE = "검색 처리 시간이 5분을 초과했습니다. 잠시 후 다시 시도해 주세요.";

const ASYNC_JOB_STATUSES: AsyncJobStatus[] = ["queued", "running", "done", "failed"];

const buildUserInput = (query: string, filters: SearchFilters) => {
  let userInput = query.trim();
  const values = [filters.region, filters.role, filters.experience, filters.education];
  values.forEach((value) => {
    if (value !== "전체" && !userInput.includes(value)) {
      userInput = `${userInput} ${value}`.trim();
    }
  });
  return userInput;
};

const toResponseViewModel = (data: SearchApiResponse): SearchResponseViewModel => {
  const scores = data.retrieved_scores ?? [];
  const list = data.retrieved_job_info_list ?? [];
  return {
    status: data.status,
    query: data.query,
    message: data.message ?? "",
    missing_fields: data.missing_fields ?? [],
    normalized_entities: {
      지역: data.normalized_entities?.지역 ?? null,
      직무: data.normalized_entities?.직무 ?? null,
      경력: data.normalized_entities?.경력 ?? null,
      학력: data.normalized_entities?.학력 ?? null
    },
    retrieved_scores: scores,
    user_response: data.user_response ?? "",
    jobs: list.map((text, index) => ({
      id: `job-${index + 1}`,
      text,
      score: scores[index] ?? null
    }))
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const isAsyncJobStatus = (value: unknown): value is AsyncJobStatus =>
  typeof value === "string" && ASYNC_JOB_STATUSES.includes(value as AsyncJobStatus);

const parseJobEnvelope = (payload: unknown): SearchJobEnvelope | null => {
  if (!isRecord(payload) || typeof payload.job_id !== "string" || payload.job_id.trim() === "" || !isAsyncJobStatus(payload.status)) {
    return null;
  }

  return {
    job_id: payload.job_id,
    status: payload.status,
    step: typeof payload.step === "string" && isJobStep(payload.step) ? payload.step : null,
    step_label: typeof payload.step_label === "string" ? payload.step_label : null,
    message: typeof payload.message === "string" ? payload.message : null,
    result: isRecord(payload.result) ? (payload.result as unknown as SearchApiResponse) : null
  };
};

const parseErrorMessage = async (response: Response, fallbackMessage: string) => {
  const contentType = response.headers.get("content-type") ?? "";
  let rawBody = "";

  try {
    rawBody = await response.text();
  } catch {
    return fallbackMessage;
  }

  if (!rawBody.trim()) {
    return fallbackMessage;
  }

  if (contentType.includes("application/json")) {
    try {
      const payload = JSON.parse(rawBody) as { message?: string };
      if (typeof payload.message === "string" && payload.message.trim()) {
        return payload.message.trim();
      }
    } catch {
      // ignore and fallback
    }
  }

  return rawBody.trim() || fallbackMessage;
};

const waitForNextPoll = (durationMs: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const onAbort = () => {
      clearTimeout(timeoutId);
      signal.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };

    const timeoutId = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, durationMs);

    signal.addEventListener("abort", onAbort, { once: true });
  });

export default function HomePage() {
  const [query, setQuery] = useState("서울 AI 엔지니어 신입 대졸 채용공고 찾아줘");
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [response, setResponse] = useState<SearchResponseViewModel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<JobStep | null>(null);
  const [currentStepLabel, setCurrentStepLabel] = useState<string | null>(null);
  const [stepHistory, setStepHistory] = useState<JobStep[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const resultsRef = useRef<HTMLElement | null>(null);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const jobs = response?.jobs ?? [];
  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) ?? jobs[0] ?? null,
    [jobs, selectedJobId]
  );
  const isError = status === "error";

  const executeSearch = async () => {
    if (!query.trim()) {
      return;
    }

    abortControllerRef.current?.abort();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const isActiveRequest = () => requestIdRef.current === requestId && !abortController.signal.aborted;

    setHasSearched(true);
    setStatus("loading");
    setResponse(null);
    setErrorMessage(null);
    setSelectedJobId(null);
    setCurrentStep(null);
    setCurrentStepLabel(QUEUED_LABEL);
    setStepHistory([]);

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 120);

    const userInput = buildUserInput(query, filters);

    const applyFinalResponse = (data: SearchApiResponse) => {
      if (!isActiveRequest()) {
        return;
      }
      const nextResponse = toResponseViewModel(data);
      setResponse(nextResponse);
      setErrorMessage(null);
      setSelectedJobId(nextResponse.jobs[0]?.id ?? null);
      setCurrentStep(null);
      setCurrentStepLabel(null);
      setStepHistory([]);
      if (nextResponse.status === "incomplete") {
        setStatus("incomplete");
        return;
      }
      setStatus(nextResponse.jobs.length > 0 ? "complete" : "empty");
    };

    const applyFailedResponse = (message: string) => {
      if (!isActiveRequest()) {
        return;
      }
      setResponse(null);
      setErrorMessage(message);
      setSelectedJobId(null);
      setCurrentStep(null);
      setCurrentStepLabel(null);
      setStepHistory([]);
      setStatus("error");
    };

    const applyQueuedState = (message?: string | null) => {
      if (!isActiveRequest()) {
        return;
      }
      setCurrentStep(null);
      setCurrentStepLabel(message?.trim() ? message.trim() : QUEUED_LABEL);
    };

    const applyRunningState = (payload: SearchJobEnvelope) => {
      if (!isActiveRequest()) {
        return;
      }

      const step = payload.step;
      if (step) {
        const label = payload.step_label?.trim() ? payload.step_label.trim() : getJobStepLabel(step);
        setCurrentStep(step);
        setCurrentStepLabel(label);
        setStepHistory((prev) => (prev.includes(step) ? prev : [...prev, step]));
        return;
      }

      setCurrentStep(null);
      setCurrentStepLabel(payload.step_label?.trim() ? payload.step_label.trim() : "검색 진행 중");
    };

    const fetchJobStart = async (): Promise<SearchStartResponse> => {
      const result = await fetch("/api/query/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_input: userInput
        }),
        signal: abortController.signal
      });

      if (!result.ok) {
        throw new Error(await parseErrorMessage(result, DEFAULT_REQUEST_ERROR_MESSAGE));
      }

      const payload = parseJobEnvelope(await result.json());
      if (!payload) {
        throw new Error("검색 시작 응답 형식이 올바르지 않습니다.");
      }

      return payload;
    };

    const fetchJobStatus = async (jobId: string): Promise<SearchStatusResponse> => {
      const result = await fetch(`/api/query/status?job_id=${encodeURIComponent(jobId)}`, {
        method: "GET",
        signal: abortController.signal
      });

      if (!result.ok) {
        throw new Error(await parseErrorMessage(result, DEFAULT_REQUEST_ERROR_MESSAGE));
      }

      const payload = parseJobEnvelope(await result.json());
      if (!payload) {
        throw new Error("상태 조회 응답 형식이 올바르지 않습니다.");
      }

      return payload;
    };

    try {
      const startData = await fetchJobStart();

      if (abortController.signal.aborted || !isActiveRequest()) {
        return;
      }

      if (startData.status === "done") {
        if (startData.result) {
          applyFinalResponse(startData.result);
          return;
        }

        applyFailedResponse("완료된 작업의 최종 결과가 비어 있습니다.");
        return;
      }

      if (startData.status === "failed") {
        applyFailedResponse(startData.message?.trim() || DEFAULT_REQUEST_ERROR_MESSAGE);
        return;
      }

      if (startData.status === "queued") {
        applyQueuedState(startData.message);
      } else {
        applyRunningState(startData);
      }

      const pollStartAt = Date.now();
      let consecutiveStatusErrors = 0;

      while (isActiveRequest()) {
        const elapsed = Date.now() - pollStartAt;
        if (elapsed >= POLL_TIMEOUT_MS) {
          throw new Error(POLL_TIMEOUT_MESSAGE);
        }

        const intervalMs = elapsed < POLL_INTERVAL_SWITCH_MS ? POLL_INTERVAL_FAST_MS : POLL_INTERVAL_SLOW_MS;
        await waitForNextPoll(intervalMs, abortController.signal);

        if (abortController.signal.aborted || !isActiveRequest()) {
          return;
        }

        let statusData: SearchStatusResponse;
        try {
          statusData = await fetchJobStatus(startData.job_id);
          consecutiveStatusErrors = 0;
        } catch (error) {
          if (abortController.signal.aborted || !isActiveRequest()) {
            return;
          }

          consecutiveStatusErrors += 1;
          if (consecutiveStatusErrors < STATUS_ERROR_RETRY_LIMIT) {
            continue;
          }
          throw error;
        }

        if (statusData.status === "done") {
          if (statusData.result) {
            applyFinalResponse(statusData.result);
            return;
          }

          applyFailedResponse("완료된 작업의 최종 결과가 비어 있습니다.");
          return;
        }

        if (statusData.status === "failed") {
          applyFailedResponse(statusData.message?.trim() || DEFAULT_REQUEST_ERROR_MESSAGE);
          return;
        }

        if (statusData.status === "queued") {
          applyQueuedState(statusData.message);
          continue;
        }

        applyRunningState(statusData);
      }
    } catch (error) {
      if (abortController.signal.aborted || !isActiveRequest()) {
        return;
      }

      const message = error instanceof Error ? error.message : DEFAULT_REQUEST_ERROR_MESSAGE;
      applyFailedResponse(message);
    } finally {
      if (requestIdRef.current === requestId) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleChipSelect = (slot: FilterSlot, value: string) => {
    const shouldToggleOff = filters[slot] === value;

    setFilters((prev) => ({
      ...prev,
      [slot]: shouldToggleOff ? "전체" : value
    }));

    setQuery((prev) => {
      const slotOptions = slotChips.find((group) => group.slot === slot)?.options ?? [];
      let next = prev.trim();

      slotOptions.forEach((option) => {
        const escaped = option.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const pattern = new RegExp(`(^|\\s)${escaped}(?=\\s|$)`, "g");
        next = next.replace(pattern, " ");
      });

      next = next.replace(/\s+/g, " ").trim();

      if (!shouldToggleOff) {
        next = `${next} ${value}`.trim();
      }

      return next;
    });
  };

  const handleFilterChange = (slot: FilterSlot, value: string) => {
    setFilters((prev) => ({ ...prev, [slot]: value }));
  };

  const handleSortChange = (sort: SortOption) => {
    setFilters((prev) => ({ ...prev, sort }));
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  useEffect(() => {
    if (!selectedJob && detailSheetOpen) {
      setDetailSheetOpen(false);
    }
  }, [detailSheetOpen, selectedJob]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return (
    <main className="pb-14 pt-6 sm:pt-8">
      <div className="container space-y-8">
        <SearchHero
          query={query}
          filters={filters}
          isLoading={status === "loading"}
          loadingLabel={currentStepLabel}
          chips={slotChips}
          onQueryChange={setQuery}
          onSubmit={executeSearch}
          onChipSelect={handleChipSelect}
        />

        <section
          ref={resultsRef}
          className={cn(
            "transition-all duration-700 ease-standard",
            hasSearched ? "animate-fade-up opacity-100" : "pointer-events-none h-0 overflow-hidden opacity-0"
          )}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Result Workspace</p>
              <h2 className="mt-1 text-lg font-bold text-foreground">AI 응답 결과 섹션</h2>
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white">
                    <Filter className="mr-1.5 h-3.5 w-3.5" />
                    필터
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[88%] max-w-[360px] overflow-y-auto bg-[#f6fbff] px-4">
                  <SheetHeader>
                    <SheetTitle>필터 사이드바</SheetTitle>
                    <SheetDescription>지역, 직무, 경력, 학력 조건과 정렬 옵션을 조정하세요.</SheetDescription>
                  </SheetHeader>
                  <FilterSidebar
                    filters={filters}
                    options={filterOptions}
                    onFilterChange={handleFilterChange}
                    onSortChange={handleSortChange}
                    onReset={handleResetFilters}
                  />
                </SheetContent>
              </Sheet>

              <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white" disabled={!selectedJob}>
                    <PanelBottomOpen className="mr-1.5 h-3.5 w-3.5" />
                    상세 패널
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto bg-[#f6fbff] px-4">
                  <SheetHeader>
                    <SheetTitle>공고 상세 패널</SheetTitle>
                    <SheetDescription>선택한 채용공고의 상세 정보를 확인하세요.</SheetDescription>
                  </SheetHeader>
                  <JobDetailPanel job={selectedJob} />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[280px,minmax(0,1fr)] xl:grid-cols-[280px,minmax(0,1fr),360px]">
            <aside className="hidden lg:block">
              <FilterSidebar
                filters={filters}
                options={filterOptions}
                onFilterChange={handleFilterChange}
                onSortChange={handleSortChange}
                onReset={handleResetFilters}
              />
            </aside>

            <div className="min-w-0">
              <ResponseSummary
                status={status}
                response={response}
                errorMessage={errorMessage ?? undefined}
                onRetry={executeSearch}
                currentStep={currentStep}
                currentStepLabel={currentStepLabel}
                stepHistory={stepHistory}
              />

              {!isError && (
                <>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 bg-white/70 px-4 py-2.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <ListFilter className="h-3.5 w-3.5 text-primary" />
                      쿼리: {response?.query ?? query}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <LayoutPanelTop className="h-3.5 w-3.5 text-primary" />
                      공고 {jobs.length}건
                    </span>
                  </div>

                  <JobList jobs={jobs} selectedJobId={selectedJobId} onSelectJob={setSelectedJobId} isLoading={status === "loading"} />

                  <div className="mt-4 hidden xl:hidden lg:block">
                    <JobDetailPanel job={selectedJob} />
                  </div>
                </>
              )}
            </div>

            {!isError && (
              <aside className="hidden xl:block">
                <JobDetailPanel job={selectedJob} />
              </aside>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
