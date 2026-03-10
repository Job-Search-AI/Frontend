import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { JobDetailPanelProps } from "@/types/search";

export function JobDetailPanel({ job }: JobDetailPanelProps) {
  if (!job) {
    return (
      <Card className="rounded-[1rem] border-dashed border-border bg-white/75">
        <CardContent className="flex min-h-[420px] items-center justify-center p-6 text-center">
          <p className="text-sm text-muted-foreground">공고를 선택하면 상세 정보가 표시됩니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[1rem] border-white/70 bg-white/90">
      <CardHeader className="space-y-3 pb-4">
        <Badge className="w-fit bg-primary/12 text-primary">결과 상세</Badge>
        <CardTitle className="text-base leading-snug">검색 결과 {job.id.replace("job-", "")}</CardTitle>
        {job.score !== null && <p className="text-xs text-muted-foreground">점수: {(job.score * 100).toFixed(0)}점</p>}
      </CardHeader>
      <CardContent className="space-y-4 pt-0 text-sm">
        <div className="rounded-md border border-border/70 bg-white px-3 py-3 text-xs leading-relaxed text-muted-foreground">
          <p className="mb-2 flex items-center gap-1.5 text-foreground">
            <FileText className="h-3.5 w-3.5 text-primary" />
            공고 텍스트
          </p>
          <p className="whitespace-pre-wrap">{job.text}</p>
        </div>
      </CardContent>
    </Card>
  );
}
