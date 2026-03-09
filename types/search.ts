export type SortOption = "relevance" | "latest" | "deadline";
export type SearchStatus = "idle" | "loading" | "complete" | "incomplete" | "empty";
export type FilterSlot = "region" | "role" | "experience" | "education";

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
  title: string;
  company: string;
  location: string;
  experience: string;
  education: string;
  employmentType: string;
  score: number;
  summary: string;
  highlights: string[];
  tags: string[];
  benefits: string[];
  deadline: string;
  applicants: string;
  companyInfo: string;
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
}
