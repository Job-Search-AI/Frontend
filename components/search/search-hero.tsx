import { ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SearchHeroProps } from "@/types/search";
import { HeroIllustration } from "./hero-illustration";

export function SearchHero({ query, filters, isLoading, loadingLabel, chips, onQueryChange, onSubmit, onChipSelect }: SearchHeroProps) {
  return (
    <section className="animate-fade-up">
      <div className="glass-panel relative overflow-hidden rounded-[1.5rem] p-6 sm:p-9">
        <div className="absolute right-[-90px] top-[-120px] h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[-60px] h-56 w-56 rounded-full bg-accent/60 blur-3xl" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6">
            <Badge className="w-fit bg-primary/12 text-primary">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              AI 기반 채용공고 검색 파이프라인
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
                자연어 한 줄로
                <br />
                조건 맞춤 채용공고를 찾으세요
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                지역·직무·경력·학력을 구조화해 검색하고, BM25+임베딩 하이브리드 랭킹으로 신뢰도 높은 공고를 우선 제시합니다.
              </p>
            </div>

            <div className="gradient-stroke rounded-[1rem] p-[1px]">
              <div className="rounded-[1rem] bg-white/95 p-3 sm:p-4">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                    placeholder="예: 서울 AI 엔지니어 신입 대졸 채용공고 찾아줘"
                    className="h-12 rounded-lg border-white/80 bg-[#f8fcff] text-base shadow-none sm:text-sm"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        onSubmit();
                      }
                    }}
                  />
                  <Button onClick={onSubmit} size="lg" className="h-12 rounded-lg px-5">
                    {isLoading ? loadingLabel ?? "검색 중..." : "검색 시작"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {chips.map((group) => (
                <div key={group.slot} className="flex flex-wrap items-center gap-2">
                  <span className="w-10 text-xs font-semibold text-muted-foreground">{group.label}</span>
                  {group.options.map((option) => (
                    <button
                      key={`${group.slot}-${option}`}
                      type="button"
                      onClick={() => onChipSelect(group.slot, option)}
                      className={cn(
                        "rounded-full border border-border bg-white/85 px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/50 hover:bg-primary/5",
                        filters[group.slot] === option && "border-primary/45 bg-primary/10 text-primary"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}
