import type { StreamStep } from "@/types/search";

export const STREAM_STEP_ORDER: StreamStep[] = [
  "analyzing",
  "need_more_info",
  "collecting",
  "parsing",
  "ranking",
  "writing"
];

export const STREAM_STEP_LABELS: Record<StreamStep, string> = {
  analyzing: "질문 분석 중",
  need_more_info: "추가 정보 확인 중",
  collecting: "공고 수집 중",
  parsing: "공고 분석 중",
  ranking: "맞춤 공고 선별 중",
  writing: "답변 작성 중"
};

export const isStreamStep = (value: string): value is StreamStep => {
  return STREAM_STEP_ORDER.includes(value as StreamStep);
};

export const getStreamStepLabel = (step: StreamStep): string => {
  return STREAM_STEP_LABELS[step];
};
