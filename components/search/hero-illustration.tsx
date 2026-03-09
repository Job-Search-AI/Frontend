export function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="gradient-stroke rounded-[1.2rem] p-[1px]">
        <svg
          viewBox="0 0 520 360"
          className="w-full rounded-[1.2rem] bg-gradient-to-br from-[#f7fbff] via-white to-[#eff6ff]"
          role="img"
          aria-label="AI 채용 검색 대시보드 일러스트"
        >
          <defs>
            <linearGradient id="hero-panel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d8ebff" />
              <stop offset="100%" stopColor="#edf5ff" />
            </linearGradient>
            <linearGradient id="hero-primary" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0ea5a5" />
            </linearGradient>
          </defs>
          <rect x="24" y="30" width="470" height="298" rx="24" fill="url(#hero-panel)" />
          <rect x="54" y="58" width="410" height="44" rx="12" fill="#fff" stroke="#d5e5f6" />
          <rect x="74" y="74" width="198" height="12" rx="6" fill="#bed7f2" />
          <circle cx="426" cy="80" r="9" fill="#0284c7" opacity="0.25" />
          <rect x="54" y="124" width="250" height="178" rx="16" fill="#fff" stroke="#d4e4f6" />
          <rect x="72" y="144" width="122" height="10" rx="5" fill="#8bbbe7" />
          <rect x="72" y="164" width="178" height="9" rx="4.5" fill="#d6e7f8" />
          <rect x="72" y="181" width="162" height="9" rx="4.5" fill="#dfeaf7" />
          <rect x="72" y="206" width="95" height="26" rx="13" fill="#e6f3ff" />
          <rect x="175" y="206" width="89" height="26" rx="13" fill="#eaf8f5" />
          <rect x="72" y="248" width="214" height="38" rx="12" fill="url(#hero-primary)" />
          <rect x="324" y="124" width="140" height="82" rx="16" fill="#fff" stroke="#d4e4f6" />
          <rect x="338" y="140" width="69" height="10" rx="5" fill="#9ec4e8" />
          <rect x="338" y="160" width="108" height="8" rx="4" fill="#d8e7f7" />
          <rect x="338" y="176" width="86" height="8" rx="4" fill="#d8e7f7" />
          <rect x="324" y="220" width="140" height="82" rx="16" fill="#fff" stroke="#d4e4f6" />
          <path d="M348 270 C358 246, 385 247, 396 270 C404 287, 424 289, 438 275" stroke="#0284c7" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="438" cy="275" r="4" fill="#0284c7" />
          <g transform="translate(18 16)">
            <circle cx="420" cy="238" r="46" fill="#fff" stroke="#d4e4f6" strokeWidth="5" />
            <circle cx="420" cy="238" r="27" fill="#edf5ff" />
            <rect x="447" y="264" width="16" height="44" rx="8" transform="rotate(-28 447 264)" fill="#0284c7" />
          </g>
        </svg>
      </div>
    </div>
  );
}
