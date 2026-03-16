export type SortOption = "relevance" | "latest" | "deadline";
export type SearchStatus = "idle" | "loading" | "complete" | "incomplete" | "empty" | "error";
export type FilterSlot = "region" | "role" | "experience" | "education";
export type StreamStep = "analyzing" | "need_more_info" | "collecting" | "parsing" | "ranking" | "writing";

export interface SearchFilters {
  region: string;
  role: string;
  experience: string;
  education: string;
  sort: SortOption;
}

export interface SlotChipGroup {
  slot: FilterSlot;
  label: string;
  options: string[];
}

export interface JobPosting {
  id: string;
  text: string;
  score: number | null;
}

export interface SearchApiResponse {
  user_input: string;
  query: string;
  status: "complete" | "incomplete";
  message: string | null;
  entities: {
    지역: string;
    직무: string;
    경력: string;
    학력: string;
  } | null;
  지역: string | null;
  직무: string | null;
  경력: string | null;
  학력: string | null;
  missing_fields: string[] | null;
  normalized_entities: {
    지역: string | null;
    직무: string | null;
    경력: string | null;
    학력: string | null;
  } | null;
  url: string | null;
  crawled_count: number | null;
  job_info_list: string[] | null;
  retrieved_job_info_list: string[] | null;
  retrieved_scores: number[] | null;
  user_response: string | null;
}

export interface SearchResponseViewModel {
  status: Extract<SearchStatus, "complete" | "incomplete">;
  query: string;
  message: string;
  missing_fields: string[];
  normalized_entities: {
    지역: string | null;
    직무: string | null;
    경력: string | null;
    학력: string | null;
  };
  retrieved_scores: number[];
  user_response: string;
  jobs: JobPosting[];
}

export interface SearchHeroProps {
  query: string;
  filters: SearchFilters;
  isLoading: boolean;
  loadingLabel: string | null;
  chips: SlotChipGroup[];
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  onChipSelect: (slot: FilterSlot, value: string) => void;
}

export interface FilterSidebarProps {
  filters: SearchFilters;
  options: Record<FilterSlot, string[]>;
  onFilterChange: (slot: FilterSlot, value: string) => void;
  onSortChange: (sort: SortOption) => void;
  onReset: () => void;
}

export interface JobListProps {
  jobs: JobPosting[];
  selectedJobId: string | null;
  isLoading: boolean;
  onSelectJob: (jobId: string) => void;
}

export interface JobDetailPanelProps {
  job: JobPosting | null;
}

export interface ResponseSummaryProps {
  status: SearchStatus;
  response: SearchResponseViewModel | null;
  errorMessage?: string;
  onRetry?: () => void;
  currentStep: StreamStep | null;
  currentStepLabel: string | null;
  stepHistory: StreamStep[];
}
