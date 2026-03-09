import { Building2, CalendarClock, CircleCheckBig, Users2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
        <Badge className="w-fit bg-primary/12 text-primary">공고 상세</Badge>
        <CardTitle className="text-base leading-snug">{job.title}</CardTitle>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          {job.company}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 text-sm">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-muted/60 px-3 py-2">
            <p className="text-muted-foreground">근무지</p>
            <p className="mt-1 font-medium text-foreground">{job.location}</p>
          </div>
          <div className="rounded-md bg-muted/60 px-3 py-2">
            <p className="text-muted-foreground">고용형태</p>
            <p className="mt-1 font-medium text-foreground">{job.employmentType}</p>
          </div>
        </div>

        <Separator />

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">핵심 업무</p>
          <ul className="space-y-1.5 text-xs leading-relaxed text-foreground">
            {job.highlights.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CircleCheckBig className="mt-0.5 h-3.5 w-3.5 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">복리후생</p>
          <div className="flex flex-wrap gap-1.5">
            {job.benefits.map((benefit) => (
              <Badge key={benefit} variant="secondary" className="bg-secondary/60 text-secondary-foreground">
                {benefit}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-1.5 rounded-md bg-muted/50 p-3 text-xs">
          <p className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            마감: {job.deadline}
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <Users2 className="h-3.5 w-3.5" />
            {job.applicants}
          </p>
        </div>

        <p className="rounded-md border border-border/70 bg-white px-3 py-2 text-xs leading-relaxed text-muted-foreground">{job.companyInfo}</p>
      </CardContent>
    </Card>
  );
}
