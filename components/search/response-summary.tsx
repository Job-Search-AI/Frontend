import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Sparkles, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ResponseSummaryProps } from "@/types/search";

const SLOT_LABELS: Record<"지역" | "직무" | "경력" | "학력", string> = {
  지역: "지역",
  직무: "직무",
  경력: "경력",
  학력: "학력"
};

export function ResponseSummary({ status, response, errorMessage, onRetry }: ResponseSummaryProps) {
  const isLoading = status === "loading";
  const isIncomplete = status === "incomplete";
  const isError = status === "error";
  const text = response ? response.user_response || response.message : "";

  return (
    <Card
      className={cn(
        "mb-4 rounded-[1rem] border-white/70 bg-white/85 shadow-panel",
        isError ? "border-warning/40" : isIncomplete ? "border-warning/30" : isLoading ? "border-primary/25" : "border-success/20"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={isError || isIncomplete || isLoading ? "secondary" : "success"}
            className={cn(isError && "bg-warning/20 text-foreground", isLoading && "bg-primary/10 text-primary")}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                검색 중
              </>
            ) : isError ? (
              <>
                <TriangleAlert className="mr-1.5 h-3.5 w-3.5" />
                검색 실패
              </>
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
          <div className="space-y-2">
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-5/6 rounded bg-muted" />
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
