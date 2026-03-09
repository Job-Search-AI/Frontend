import type { JobPosting, SearchFilters, SearchResponseViewModel, SlotChipGroup } from "@/types/search";

export const defaultFilters: SearchFilters = {
  region: "전체",
  role: "전체",
  experience: "전체",
  education: "전체",
  sort: "relevance"
};

export const filterOptions: Record<"region" | "role" | "experience" | "education", string[]> = {
  region: ["전체", "서울", "경기", "인천", "원격"],
  role: ["전체", "인공지능/머신러닝", "백엔드/서버개발", "데이터 엔지니어링", "MLOps"],
  experience: ["전체", "신입", "주니어", "미들", "경력무관"],
  education: ["전체", "고등학교졸업이상", "대학졸업(2,3년) 이상", "대학졸업(4년) 이상", "학력무관"]
};

export const slotChips: SlotChipGroup[] = [
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

const baseJobs: JobPosting[] = [
  {
    id: "job-01",
    title: "AI Engineer (신입/주니어)",
    company: "네오탤런트랩",
    location: "서울 강남구",
    experience: "신입",
    education: "대학졸업(4년) 이상",
    employmentType: "정규직",
    score: 0.93,
    summary:
      "LLM 기반 채용 매칭 엔진 고도화를 담당합니다. 파이썬 백엔드와 검색 파이프라인 개선 경험자를 우대합니다.",
    highlights: [
      "RAG/검색 파이프라인 운영",
      "Python/FastAPI 서비스 개발",
      "A/B 테스트 기반 추천 품질 개선"
    ],
    tags: ["Python", "LLM", "FastAPI", "Retrieval"],
    benefits: ["하이브리드 근무", "교육비 지원", "장비 지원"],
    deadline: "D-9",
    applicants: "지원자 62명",
    companyInfo: "AI 채용 SaaS를 운영하는 B2B 스타트업 (Series B)"
  },
  {
    id: "job-02",
    title: "백엔드 개발자 (채용도메인)",
    company: "워크매치",
    location: "서울 성동구",
    experience: "신입",
    education: "대학졸업(2,3년) 이상",
    employmentType: "정규직",
    score: 0.89,
    summary:
      "검색/추천 API의 성능 최적화와 데이터 파이프라인 품질 관리 업무를 수행합니다.",
    highlights: ["Node.js/TypeScript 기반 API", "Redis 캐시 전략 설계", "서비스 모니터링"],
    tags: ["TypeScript", "Node.js", "Redis", "AWS"],
    benefits: ["선택적 재택", "점심 지원", "연 2회 인센티브"],
    deadline: "D-6",
    applicants: "지원자 48명",
    companyInfo: "HR Tech 플랫폼 운영 기업, 월간 사용자 100만+"
  },
  {
    id: "job-03",
    title: "MLOps Engineer",
    company: "리쿠르트AI",
    location: "경기 성남시",
    experience: "주니어",
    education: "학력무관",
    employmentType: "정규직",
    score: 0.86,
    summary:
      "모델 배포 자동화, 벡터 인덱스 운영, 관측성 개선을 통해 검색 품질의 안정적 운영을 담당합니다.",
    highlights: ["Kubernetes 기반 배포", "모델 서빙 최적화", "로그/메트릭 파이프라인 구축"],
    tags: ["Kubernetes", "MLOps", "PyTorch", "Vector DB"],
    benefits: ["원격 근무 가능", "자율 출퇴근", "스톡옵션"],
    deadline: "D-12",
    applicants: "지원자 27명",
    companyInfo: "글로벌 채용 데이터 플랫폼과 협업하는 AI 솔루션 기업"
  },
  {
    id: "job-04",
    title: "데이터 엔지니어 (검색 인프라)",
    company: "잡인사이트",
    location: "원격",
    experience: "경력무관",
    education: "고등학교졸업이상",
    employmentType: "계약직(전환형)",
    score: 0.81,
    summary:
      "채용공고 수집/정규화 ETL 파이프라인을 운영하며 검색 인덱스 정확도를 높입니다.",
    highlights: ["크롤링 데이터 정제", "ETL 배치 최적화", "검색 품질 지표 관리"],
    tags: ["ETL", "Airflow", "PostgreSQL", "Crawler"],
    benefits: ["전원 원격", "월 1회 오프사이트", "야근 없음"],
    deadline: "D-3",
    applicants: "지원자 35명",
    companyInfo: "공고 데이터 분석 SaaS 전문 기업"
  }
];

const parseDeadline = (deadline: string) => {
  const matched = deadline.match(/D-(\d+)/);
  return matched ? Number(matched[1]) : Number.MAX_SAFE_INTEGER;
};

const applySort = (jobs: JobPosting[], sort: SearchFilters["sort"]) => {
  if (sort === "latest") {
    return [...jobs].sort((a, b) => b.id.localeCompare(a.id));
  }
  if (sort === "deadline") {
    return [...jobs].sort((a, b) => parseDeadline(a.deadline) - parseDeadline(b.deadline));
  }
  return [...jobs].sort((a, b) => b.score - a.score);
};

const includesAny = (value: string, patterns: string[]) =>
  patterns.some((pattern) => value.includes(pattern));

export function getMockSearchResponse(query: string, filters: SearchFilters): SearchResponseViewModel {
  const normalizedQuery = query.trim();
  const isMissingRegion = filters.region === "전체" && !includesAny(normalizedQuery, ["서울", "경기", "인천", "원격"]);
  const isMissingEducation =
    filters.education === "전체" &&
    !includesAny(normalizedQuery, ["학력무관", "고졸", "대졸", "대학졸업", "고등학교졸업"]);

  if (isMissingRegion || isMissingEducation) {
    return {
      status: "incomplete",
      query: normalizedQuery,
      message: `${[isMissingRegion ? "지역" : null, isMissingEducation ? "학력" : null]
        .filter(Boolean)
        .join(", ")} 정보를 알려주세요.`,
      missing_fields: [isMissingRegion ? "지역" : "", isMissingEducation ? "학력" : ""].filter(Boolean),
      normalized_entities: {
        지역: isMissingRegion ? null : filters.region,
        직무: filters.role === "전체" ? "백엔드/서버개발" : filters.role,
        경력: filters.experience === "전체" ? "신입" : filters.experience,
        학력: isMissingEducation ? null : filters.education
      },
      retrieved_scores: [],
      user_response:
        "검색을 계속하려면 부족한 조건을 추가해 주세요. 슬롯 기반 검색이라 필수 조건이 있어야 정확한 매칭이 가능합니다.",
      jobs: []
    };
  }

  if (includesAny(normalizedQuery, ["인턴만", "해외", "없어", "없나요"])) {
    return {
      status: "complete",
      query: normalizedQuery,
      message: "조건에 맞는 공고를 찾지 못했습니다.",
      missing_fields: [],
      normalized_entities: {
        지역: filters.region === "전체" ? "서울" : filters.region,
        직무: filters.role === "전체" ? "인공지능/머신러닝" : filters.role,
        경력: filters.experience === "전체" ? "신입" : filters.experience,
        학력: filters.education === "전체" ? "대학졸업(4년) 이상" : filters.education
      },
      retrieved_scores: [],
      user_response:
        "현재 조건으로는 검색 결과가 없습니다. 지역 또는 경력 조건을 완화하거나 직무를 확장해 다시 검색해 보세요.",
      jobs: []
    };
  }

  const filtered = baseJobs.filter((job) => {
    const regionMatch = filters.region === "전체" || job.location.includes(filters.region);
    const roleMatch =
      filters.role === "전체" ||
      (filters.role === "인공지능/머신러닝" && job.tags.some((tag) => ["LLM", "MLOps", "PyTorch"].includes(tag))) ||
      (filters.role === "백엔드/서버개발" && job.tags.some((tag) => ["Python", "Node.js", "Redis"].includes(tag))) ||
      (filters.role === "데이터 엔지니어링" && job.tags.some((tag) => ["ETL", "PostgreSQL", "Airflow"].includes(tag))) ||
      (filters.role === "MLOps" && job.tags.some((tag) => ["MLOps", "Kubernetes", "Vector DB"].includes(tag)));
    const experienceMatch = filters.experience === "전체" || job.experience === filters.experience || job.experience === "경력무관";
    const educationMatch = filters.education === "전체" || job.education === filters.education || job.education === "학력무관";

    return regionMatch && roleMatch && experienceMatch && educationMatch;
  });

  const sortedJobs = applySort(filtered, filters.sort);

  return {
    status: "complete",
    query: normalizedQuery,
    message: "AI 검색이 완료되었습니다.",
    missing_fields: [],
    normalized_entities: {
      지역: filters.region === "전체" ? "서울" : filters.region,
      직무: filters.role === "전체" ? "백엔드/서버개발" : filters.role,
      경력: filters.experience === "전체" ? "신입" : filters.experience,
      학력: filters.education === "전체" ? "대학졸업(4년) 이상" : filters.education
    },
    retrieved_scores: sortedJobs.map((job) => job.score),
    user_response:
      "요청 조건을 기준으로 검색 점수와 직무 적합도를 결합해 우선순위를 정리했습니다. 상위 공고는 기술 스택 적합성과 근무 조건 일치도가 높습니다.",
    jobs: sortedJobs
  };
}
