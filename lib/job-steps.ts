import type { JobStep } from "@/types/search";

export const JOB_STEP_ORDER: JobStep[] = [
  "analyzing",
  "collecting",
  "parsing",
  "ranking",
  "writing"
];

export const JOB_STEP_LABELS: Record<JobStep, string> = {
  analyzing: "질문 분석 중",
  collecting: "공고 수집 중",
  parsing: "공고 분석 중",
  ranking: "맞춤 공고 선별 중",
  writing: "답변 작성 중"
};

export const isJobStep = (value: string): value is JobStep => {
  return JOB_STEP_ORDER.includes(value as JobStep);
};

export const getJobStepLabel = (step: JobStep): string => {
  return JOB_STEP_LABELS[step];
};
