import Image from "next/image";

export function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[540px]">
      <div className="gradient-stroke rounded-[1.2rem] p-[1px]">
        <div className="relative overflow-hidden rounded-[1.2rem] bg-gradient-to-br from-[#f7fbff] via-white to-[#eff6ff]">
          <Image
            src="/images/hero-job-search-visual.svg"
            alt="AI 채용 검색 대시보드 비주얼"
            width={1536}
            height={1024}
            priority
            className="h-auto w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/55 to-transparent" />
        </div>
      </div>
    </div>
  );
}
