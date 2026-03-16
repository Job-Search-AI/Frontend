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
import { getStreamStepLabel, isStreamStep } from "@/lib/stream-steps";
import { cn } from "@/lib/utils";
import type {
  AsyncJobStatus,
  FilterSlot,
  SearchApiResponse,
  SearchFilters,
  SearchResponseViewModel,
  SearchStatus,
  StreamStep,
  SlotChipGroup,
  SortOption
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

const toFailedResponse = (userInput: string, message: string): SearchResponseViewModel => ({
  status: "complete",
  query: userInput,
  message,
  missing_fields: [],
  normalized_entities: {
    지역: null,
    직무: null,
    경력: null,
    학력: null
  },
  retrieved_scores: [],
  user_response: "",
  jobs: []
});

interface ParsedSseEvent {
  event: string;
  data: string;
}

const parseSseEventBlock = (rawBlock: string): ParsedSseEvent | null => {
  const lines = rawBlock.split(/\r?\n/);
  let event = "message";
  const dataLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, "");
    if (!line || line.startsWith(":")) {
      continue;
    }

    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  return {
    event,
    data: dataLines.join("\n")
  };
};

const createStreamError = (message: string, skipFallback: boolean) => Object.assign(new Error(message), { skipFallback });

export default function HomePage() {
  const [query, setQuery] = useState("서울 AI 엔지니어 신입 대졸 채용공고 찾아줘");
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [response, setResponse] = useState<SearchResponseViewModel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<StreamStep | null>(null);
  const [currentStepLabel, setCurrentStepLabel] = useState<string | null>(null);
  const [stepHistory, setStepHistory] = useState<StreamStep[]>([]);
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
    if (!query.trim() || status === "loading") {
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
    setCurrentStep("analyzing");
    setCurrentStepLabel(getStreamStepLabel("analyzing"));
    setStepHistory(["analyzing"]);

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

    const fetchFallbackResult = async () => {
      const result = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_input: userInput
        }),
        signal: abortController.signal
      });

      const data = (await result.json()) as SearchApiResponse | { message?: string };

      if (!result.ok) {
        const message = "message" in data && typeof data.message === "string" ? data.message : "검색 요청 처리에 실패했습니다.";
        throw new Error(message);
      }

      return data as SearchApiResponse;
    };

    const parseStepEvent = (data: string) => {
      const payload = JSON.parse(data) as { step?: string; label?: string };
      if (!payload.step || !isStreamStep(payload.step)) {
        return;
      }
      const nextStep = payload.step;

      const nextLabel = payload.label?.trim() ? payload.label.trim() : getStreamStepLabel(nextStep);
      if (!isActiveRequest()) {
        return;
      }
      setCurrentStep(nextStep);
      setCurrentStepLabel(nextLabel);
      setStepHistory((prev) => (prev.includes(nextStep) ? prev : [...prev, nextStep]));
    };

    const parseErrorEvent = (data: string) => {
      try {
        const payload = JSON.parse(data) as { message?: string };
        if (typeof payload.message === "string" && payload.message.trim()) {
          return payload.message;
        }
      } catch {
        return data || "스트리밍 처리 중 오류가 발생했습니다.";
      }
      return "스트리밍 처리 중 오류가 발생했습니다.";
    };

    const fetchStreamingResult = async () => {
      const streamResponse = await fetch("/api/query/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_input: userInput
        }),
        signal: abortController.signal
      });

      const contentType = streamResponse.headers.get("content-type") ?? "";
      const isSseResponse = contentType.includes("text/event-stream");

      if (!isSseResponse && !streamResponse.ok) {
        const fallbackMessage = "스트리밍 검색 요청 처리에 실패했습니다.";
        if (contentType.includes("application/json")) {
          const payload = (await streamResponse.json()) as { message?: string };
          throw new Error(payload.message ?? fallbackMessage);
        }

        const text = await streamResponse.text();
        throw new Error(text || fallbackMessage);
      }

      if (!isSseResponse) {
        throw new Error("스트리밍 응답 형식이 올바르지 않습니다.");
      }

      if (!streamResponse.body) {
        throw new Error("스트리밍 응답 본문이 비어 있습니다.");
      }

      const reader = streamResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          const event = parseSseEventBlock(block);
          if (!event) {
            continue;
          }

          if (event.event === "step") {
            parseStepEvent(event.data);
            continue;
          }

          if (event.event === "error") {
            throw createStreamError(parseErrorEvent(event.data), true);
          }

          if (event.event === "final") {
            return JSON.parse(event.data) as SearchApiResponse;
          }
        }
      }

      const trailing = parseSseEventBlock(buffer);
      if (trailing?.event === "final") {
        return JSON.parse(trailing.data) as SearchApiResponse;
      }

      throw new Error("스트림이 최종 결과 없이 종료되었습니다.");
    };

    try {
      const streamData = await fetchStreamingResult();
      applyFinalResponse(streamData);
    } catch (streamError) {
      if (abortController.signal.aborted || !isActiveRequest()) {
        return;
      }

      const skipFallback =
        typeof streamError === "object" &&
        streamError !== null &&
        "skipFallback" in streamError &&
        Boolean((streamError as { skipFallback?: boolean }).skipFallback);

      if (skipFallback) {
        const message = streamError instanceof Error ? streamError.message : "스트리밍 처리 중 오류가 발생했습니다.";
        applyFailedResponse(message);
        return;
      }

      try {
        const fallbackData = await fetchFallbackResult();
        applyFinalResponse(fallbackData);
      } catch (fallbackError) {
        if (abortController.signal.aborted || !isActiveRequest()) {
          return;
        }

        const message = fallbackError instanceof Error ? fallbackError.message : "검색 요청 처리에 실패했습니다.";
        applyFailedResponse(message);
      }
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
