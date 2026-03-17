import { BriefcaseBusiness, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { JobListProps } from "@/types/search";

export function JobList({ jobs, selectedJobId, isLoading, onSelectJob }: JobListProps) {
  if (isLoading) {
    return (
      <Card className="rounded-[1rem] border-white/70 bg-white/85">
        <CardContent className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-border/60 bg-white p-4">
              <div className="mb-3 h-5 w-2/3 animate-pulse rounded bg-muted" />
              <div className="mb-2 h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (jobs.length === 0) {
    return (
        <Card className="rounded-[1rem] border-dashed border-border bg-white/80">
          <CardContent className="flex min-h-[280px] flex-col items-center justify-center gap-2 p-6 text-center">
            <BriefcaseBusiness className="h-9 w-9 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">아직 표시할 공고가 없습니다</p>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              검색을 시작하면 조건에 맞는 공고가 여기에 표시됩니다. 결과가 없으면 검색어 또는 필터를 조정해 다시 시도해 주세요.
            </p>
          </CardContent>
        </Card>
      );
  }

  return (
    <Card className="rounded-[1rem] border-white/70 bg-white/90">
      <CardContent className="p-0">
        <ScrollArea className="h-auto lg:h-[580px]">
          <div className="space-y-3 p-4">
            {jobs.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => onSelectJob(job.id)}
                className={cn(
                  "w-full rounded-xl border border-border bg-white p-4 text-left transition hover:border-primary/30 hover:shadow-panel",
                  selectedJobId === job.id && "border-primary/40 bg-primary/5"
                )}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="line-clamp-1 text-sm font-bold text-foreground">검색 결과 {job.id.replace("job-", "")}</h3>
                  </div>
                  {job.score !== null && (
                    <Badge variant="success" className="bg-success/12 text-success">
                      {(job.score * 100).toFixed(0)}점
                    </Badge>
                  )}
                </div>

                <p className="line-clamp-4 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{job.text}</p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">상세 보기</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
