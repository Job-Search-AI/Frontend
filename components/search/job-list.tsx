import { BriefcaseBusiness, Building2, ChevronRight, MapPin } from "lucide-react";
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
          <p className="text-sm font-semibold text-foreground">표시할 공고가 없습니다</p>
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
            지역·경력·학력 조건을 완화하거나 검색어를 조정해 다시 시도해 보세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[1rem] border-white/70 bg-white/90">
      <CardContent className="p-0">
        <ScrollArea className="h-[580px]">
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
                    <h3 className="line-clamp-1 text-sm font-bold text-foreground">{job.title}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" />
                      {job.company}
                    </p>
                  </div>
                  <Badge variant="success" className="bg-success/12 text-success">
                    {(job.score * 100).toFixed(0)}점
                  </Badge>
                </div>

                <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.location}
                  </span>
                  <span>{job.experience}</span>
                  <span>{job.education}</span>
                </div>

                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{job.summary}</p>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {job.tags.slice(0, 3).map((tag) => (
                      <Badge key={`${job.id}-${tag}`} variant="secondary" className="bg-secondary/55 text-secondary-foreground">
                        {tag}
                      </Badge>
                    ))}
                  </div>
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
