# AI 채용공고 검색 프론트엔드

자연어 질의와 슬롯 기반 필터(지역/직무/경력/학력)를 결합해 채용공고를 탐색하는 Next.js 프론트엔드입니다.

현재는 **백엔드 API 연동 전 UI 프로토타입**이며, `lib/mock-data.ts`의 모의 검색 엔진으로 상태 전이와 화면 동작을 검증합니다.

## 기술 스택

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS + CSS Variables 기반 테마
- Radix UI Primitives (Dialog/Sheet, Tabs, ScrollArea)
- shadcn/ui 패턴 기반 커스텀 UI 컴포넌트
- Lucide React 아이콘

## 시작하기

### 요구 사항

- Node.js 18.17 이상 권장
- npm

### 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

### 프로덕션 실행

```bash
npm run build
npm run start
```

## 스크립트

- `npm run dev`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드 생성
- `npm run start`: 프로덕션 서버 실행

## 프로젝트 구조

```text
.
├─ app/
│  ├─ layout.tsx               # 메타데이터/루트 레이아웃
│  ├─ page.tsx                 # 검색 화면 메인(상태/이벤트 오케스트레이션)
│  └─ globals.css              # 디자인 토큰(CSS 변수), 전역 스타일
├─ components/
│  ├─ search/
│  │  ├─ search-hero.tsx       # 검색 입력/슬롯칩/히어로 영역
│  │  ├─ filter-sidebar.tsx    # 필터/정렬 패널
│  │  ├─ response-summary.tsx  # 상태별 응답 요약 카드
│  │  ├─ job-list.tsx          # 채용공고 리스트(스켈레톤/빈상태 포함)
│  │  ├─ job-detail-panel.tsx  # 채용공고 상세 패널
│  │  └─ hero-illustration.tsx # 접근성 라벨 포함 SVG 일러스트
│  └─ ui/                      # 재사용 UI 프리미티브(Button, Sheet, Tabs 등)
├─ lib/
│  ├─ mock-data.ts             # Mock 검색 데이터 + 필터/정렬 로직
│  └─ utils.ts                 # cn(clsx + tailwind-merge) 유틸
├─ types/
│  └─ search.ts                # 도메인 타입 정의
├─ tailwind.config.ts
└─ package.json
```

## 아키텍처 개요

이 프로젝트는 **단일 페이지 중심의 프레젠테이션 아키텍처**입니다.

- `app/page.tsx`는 `use client` 컴포넌트로 동작하며 검색 상태/필터/선택 공고 상태를 소유합니다.
- `components/search/*`는 상태를 직접 소유하지 않고 props 기반으로 렌더링하는 뷰 컴포넌트 역할을 수행합니다.
- 데이터 소스는 현재 `lib/mock-data.ts` 단일 함수(`getMockSearchResponse`)로 고정되어 있으며, 실제 API 도입 시 교체 지점이 명확합니다.

## 상태 관리 상세

메인 페이지 상태는 아래와 같습니다.

| 상태 키 | 타입 | 역할 |
| --- | --- | --- |
| `query` | `string` | 자연어 검색 입력값 |
| `filters` | `SearchFilters` | 슬롯 기반 필터 값 |
| `status` | `SearchStatus` | 검색 상태 머신(`idle/loading/complete/incomplete/empty`) |
| `response` | `SearchResponseViewModel \| null` | 검색 결과 원본 뷰모델 |
| `selectedJobId` | `string \| null` | 리스트에서 선택한 공고 ID |
| `hasSearched` | `boolean` | 결과 섹션 초기 진입 애니메이션 토글 |
| `filterSheetOpen` | `boolean` | 모바일 필터 Sheet 열림 상태 |
| `detailSheetOpen` | `boolean` | 모바일 상세 Sheet 열림 상태 |

상태 전이 플로우:

```text
idle
  └─ executeSearch()
      └─ loading
          └─ mock response 수신
              ├─ incomplete (필수 슬롯 누락)
              ├─ complete   (결과 있음)
              └─ empty      (응답은 complete지만 jobs.length === 0)
```

구현 포인트:

- `timerRef`로 이전 검색 타이머를 취소해 중복 업데이트를 방지합니다.
- 검색 시작 시 `response`를 `null`로 리셋해 이전 결과 잔상 없이 로딩 상태를 노출합니다.
- 결과 수신 후 첫 공고를 자동 선택합니다.
- `selectedJob`은 `useMemo`로 계산해 불필요한 탐색을 줄입니다.
- 컴포넌트 언마운트 시 타이머를 정리합니다.

## 도메인 타입 설계

`types/search.ts`는 화면 계약(Contract)을 명시적으로 분리합니다.

- `SearchFilters`: 슬롯 필터 입력 모델 (`region/role/experience/education/sort`)
- `JobPosting`: 리스트/상세 패널이 공통으로 사용하는 공고 도메인 모델
- `SearchResponseViewModel`: 검색 응답 전체 모델
- `SearchStatus`: UI 상태 머신 enum 유사 유니온 타입
- `SortOption`: 정렬 기준 유니온 (`relevance/latest/deadline`)

특징:

- `SearchResponseViewModel.normalized_entities`는 한국어 슬롯 키(`지역/직무/경력/학력`)를 사용합니다.
- `status`는 응답 모델에서는 `complete | incomplete`로 제한하고, 화면 전용 `empty/loading/idle`는 별도 UI 상태로 분리합니다.

## Mock 검색 엔진 상세 (`lib/mock-data.ts`)

현재 검색 로직은 아래 단계를 수행합니다.

1. 입력 정규화
- `query.trim()`으로 공백 정리

2. 필수 슬롯 검증
- 지역 누락: 필터가 `전체`이면서 쿼리에 `서울/경기/인천/원격` 키워드가 없으면 누락 처리
- 학력 누락: 필터가 `전체`이면서 학력 관련 키워드가 없으면 누락 처리
- 누락 시 `incomplete` 응답 반환 + `missing_fields` 제공

3. 즉시 빈결과 시나리오
- 쿼리에 `인턴만/해외/없어/없나요`가 포함되면 결과 0건 응답 생성

4. 필터 매칭
- 지역: `job.location.includes(filters.region)`
- 직무: 태그 기반 매핑
- `인공지능/머신러닝`: `LLM/MLOps/PyTorch`
- `백엔드/서버개발`: `Python/Node.js/Redis`
- `데이터 엔지니어링`: `ETL/PostgreSQL/Airflow`
- `MLOps`: `MLOps/Kubernetes/Vector DB`
- 경력: 정확 일치 또는 공고가 `경력무관`
- 학력: 정확 일치 또는 공고가 `학력무관`

5. 정렬
- `relevance`: `score` 내림차순
- `latest`: `id` 역순 정렬
- `deadline`: `D-n` 값을 파싱해 오름차순

6. 뷰모델 생성
- `retrieved_scores`, `normalized_entities`, `user_response`를 포함한 응답 반환

## UI 컴포넌트 설계

검색 도메인 UI는 컨테이너-프리젠테이셔널 패턴으로 분리되어 있습니다.

- `SearchHero`: 검색 입력/칩 선택/Enter 제출
- `FilterSidebar`: 슬롯 필터 + 정렬 탭 + 리셋
- `ResponseSummary`: 상태 배지, 정규화 슬롯, 누락 슬롯, 점수 요약
- `JobList`: 로딩 스켈레톤/빈 상태/리스트 선택 상태
- `JobDetailPanel`: 선택 공고 상세 정보

반응형 동작:

- 데스크톱(`xl`): 필터/목록/상세 3열 레이아웃
- 태블릿(`lg`): 필터 + 목록(+하단 상세)
- 모바일: 필터/상세를 `Sheet`로 오버레이 표시

## 스타일 시스템 상세

`app/globals.css` + `tailwind.config.ts` 조합으로 디자인 토큰을 구성합니다.

- CSS 변수 기반 토큰
- 색상(`--primary`, `--muted`, `--success`, `--warning` 등)
- 라운드(`--radius-*`)
- 모션 이징(`--ease-standard`)

- Tailwind 확장
- `colors`: CSS 변수와 매핑
- `boxShadow`: `soft`, `panel`
- `keyframes`: `fade-up`, `shimmer`
- `animation`: `animate-fade-up`, `animate-shimmer`

- 커스텀 유틸리티
- `.glass-panel`: 반투명 + 블러 패널
- `.gradient-stroke`: 그라디언트 외곽선

`lib/utils.ts`의 `cn()`은 `clsx + tailwind-merge` 결합으로 조건부 클래스와 중복 클래스를 안전하게 처리합니다.

## 접근성/UX 구현 포인트

- 입력창에서 `Enter`로 검색 실행
- Sheet 닫기 버튼에 `sr-only` 텍스트(`닫기`) 제공
- 일러스트 SVG에 `role="img"`와 `aria-label` 지정
- focus-visible ring 스타일 적용으로 키보드 내비게이션 가시성 확보
- 로딩/빈 상태/정보 부족 상태를 분리해 피드백 지연을 줄임

## API 연동 가이드 (현재 코드 기준)

연동 시 변경 범위는 작게 유지할 수 있습니다.

1. `app/page.tsx`의 `getMockSearchResponse` 호출을 비동기 API 호출로 교체
2. 서버 응답을 `SearchResponseViewModel` 형태로 매핑
3. 실패 케이스를 위해 `error` 상태(또는 에러 배너) 확장
4. 필요 시 `query`와 `filters`를 URL Search Params로 동기화

예시 요청 페이로드:

```json
{
  "query": "서울 AI 엔지니어 신입 대졸 채용공고 찾아줘",
  "filters": {
    "region": "서울",
    "role": "인공지능/머신러닝",
    "experience": "신입",
    "education": "대학졸업(4년) 이상",
    "sort": "relevance"
  }
}
```

## 라이선스

내부 프로젝트 기준으로 사용 중이며 필요 시 별도 라이선스 정책을 추가하세요.
