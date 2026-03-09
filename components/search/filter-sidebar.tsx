import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { FilterSidebarProps, FilterSlot } from "@/types/search";

const LABELS: Record<FilterSlot, string> = {
  region: "지역",
  role: "직무",
  experience: "경력",
  education: "학력"
};

export function FilterSidebar({ filters, options, onFilterChange, onSortChange, onReset }: FilterSidebarProps) {
  return (
    <Card className="glass-panel rounded-[1rem] border-white/80 shadow-panel">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">필터</CardTitle>
          </div>
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={onReset}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            초기화
          </Button>
        </div>
        <Separator />
      </CardHeader>
      <CardContent className="space-y-5">
        {Object.entries(options).map(([slot, slotOptions]) => (
          <div key={slot} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{LABELS[slot as FilterSlot]}</p>
            <div className="flex flex-wrap gap-2">
              {slotOptions.map((option) => {
                const isActive = filters[slot as keyof typeof filters] === option;
                return (
                  <button
                    type="button"
                    key={`${slot}-${option}`}
                    onClick={() => onFilterChange(slot as FilterSlot, option)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      isActive
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-white text-foreground hover:border-primary/30 hover:bg-muted"
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">정렬</p>
          <Tabs
            value={filters.sort}
            onValueChange={(nextSort) => {
              if (nextSort === "relevance" || nextSort === "latest" || nextSort === "deadline") {
                onSortChange(nextSort);
              }
            }}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="relevance">정확도</TabsTrigger>
              <TabsTrigger value="latest">최신순</TabsTrigger>
              <TabsTrigger value="deadline">마감임박</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="rounded-lg border border-primary/15 bg-primary/5 p-3">
          <Badge className="mb-2 w-fit bg-white/80 text-primary">AI 검색 가이드</Badge>
          <p className="text-xs leading-relaxed text-muted-foreground">
            슬롯 정보가 부족하면 결과 생성 전 `incomplete` 상태로 종료됩니다. 필수 슬롯을 채우면 검색 정확도가 높아집니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
