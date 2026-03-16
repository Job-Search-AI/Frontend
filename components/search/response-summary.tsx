import { AlertCircle, CheckCircle2, RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { STREAM_STEP_ORDER, getStreamStepLabel } from "@/lib/stream-steps";
import { cn } from "@/lib/utils";
import type { ResponseSummaryProps } from "@/types/search";

const SLOT_LABELS: Record<"지역" | "직무" | "경력" | "학력", string> = {
  지역: "지역",
  직무: "직무",
  경력: "경력",
  학력: "학력"
};

export function ResponseSummary({
  status,
  response,
  errorMessage,
  onRetry,
  currentStep,
  currentStepLabel,
  stepHistory
}: ResponseSummaryProps) {
  const isLoading = status === "loading";
  const isIncomplete = status === "incomplete";
  const isError = status === "error";
  const text = response ? response.user_response || response.message : "";
  const activeLabel = currentStep ? getStreamStepLabel(currentStep) : "처리 중";
  const resolvedLabel = currentStepLabel ?? activeLabel;
  const currentStepOrder = currentStep ? STREAM_STEP_ORDER.indexOf(currentStep) + 1 : 0;

  return (
    <Card
      className={cn(
        "mb-4 rounded-[1rem] border-white/70 bg-white/85 shadow-panel",
        isError ? "border-warning/40" : isLoading ? "border-primary/20" : isIncomplete ? "border-warning/30" : "border-success/20"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isError || isLoading || isIncomplete ? "secondary" : "success"} className={cn(isError && "bg-warning/20 text-foreground")}>
            {isError ? (
              <>
                <TriangleAlert className="mr-1.5 h-3.5 w-3.5" />
                검색 실패
              </>
            ) : isLoading ? (
              "검색 진행 중"
            ) : isIncomplete ? (
              <>
                <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                정보 보완 필요
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                검색 완료
              </>
            )}
          </Badge>
          <CardTitle className="text-base">AI 응답 결과</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {status === "loading" && (
          <div className="space-y-3">
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">현재 단계: {resolvedLabel}</p>
                <Badge variant="secondary" className="bg-white/80 text-primary">
                  {currentStepOrder} / {STREAM_STEP_ORDER.length}
                </Badge>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {STREAM_STEP_ORDER.map((step) => {
                  const isDone = step !== currentStep && stepHistory.includes(step);
                  const isActive = step === currentStep;

                  return (
                    <div
                      key={step}
                      className={cn(
                        "rounded-md border px-2.5 py-2 transition",
                        isActive
                          ? "border-primary/40 bg-white shadow-panel"
                          : isDone
                            ? "border-success/25 bg-success/10"
                            : "border-border/70 bg-white/70"
                      )}
                    >
                      <p
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[11px] font-medium",
                          isActive ? "text-primary" : isDone ? "text-success" : "text-muted-foreground"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            isActive ? "bg-primary animate-pulse" : isDone ? "bg-success" : "bg-muted-foreground/50"
                          )}
                        />
                        {getStreamStepLabel(step)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="h-4 w-2/3 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
              <div className="h-4 w-5/6 rounded bg-muted" />
            </div>
          </div>
        )}

        {isError && (
          <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-3">
            <p className="text-sm font-semibold text-foreground">검색 요청을 처리하지 못했습니다.</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {errorMessage ?? "잠시 후 다시 시도하거나 검색어를 조정해 주세요."}
            </p>
            {onRetry && (
              <Button type="button" variant="outline" size="sm" className="mt-3 bg-white" onClick={onRetry}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                재시도
              </Button>
            )}
          </div>
        )}

        {status !== "loading" && !isError && response && (
          <>
            <p className="leading-relaxed text-muted-foreground">{text || "응답이 없습니다."}</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(response.normalized_entities) as Array<[keyof typeof SLOT_LABELS, string | null]>).map(([slot, value]) => (
                <Badge key={slot} variant={value ? "default" : "secondary"} className="bg-secondary/50 text-secondary-foreground">
                  {SLOT_LABELS[slot]}: {value ?? "미입력"}
                </Badge>
              ))}
            </div>
            {response.missing_fields.length > 0 && (
              <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-foreground">
                부족 슬롯: {response.missing_fields.join(", ")}
              </div>
            )}
            {response.retrieved_scores.length > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                상위 점수: {response.retrieved_scores.slice(0, 3).map((score) => score.toFixed(2)).join(" · ")}
              </p>
            )}
          </>
        )}

        {status === "idle" && (
          <p className="text-sm text-muted-foreground">
            검색을 실행하면 슬롯 정규화 결과와 AI 요약이 여기에 표시됩니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
