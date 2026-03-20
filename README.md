<p align="center">
  <img src="./public/readme/job-search-search-flow-desktop.gif" alt="데스크톱 검색 데모" width="1100" />
</p>

# AI 채용공고 검색 서비스 프론트엔드

자연어 질의와 슬롯 기반 조건(지역/직무/경력/학력)을 결합해 채용공고를 검색하고, AI 응답 결과를 구조화해서 보여주는 Next.js 프론트엔드입니다.

## 배포 링크

- 프론트엔드(Netlify): [https://job-search-ai.netlify.app/](https://job-search-ai.netlify.app/)
- 백엔드 API 주소는 보안상 문서에 노출하지 않습니다. (`BACKEND_API_URL`을 서버에서 사용)

## 서비스 목적

사용자가 한 줄 자연어로 조건을 입력하면,

- 검색 가능한 형태로 조건을 보완/정규화하고
- 백엔드 검색 API 결과를 요약해서 보여주고
- 결과 목록과 상세 텍스트를 빠르게 탐색할 수 있도록

화면을 구성하는 것이 이 프론트엔드의 핵심 목적입니다.

## 현재 구현된 핵심 기능

### 1) 자연어 검색 입력

- 기본 질의 예시가 입력창에 제공됩니다.
- `Enter` 키 또는 `검색 시작` 버튼으로 검색을 실행합니다.
- 공백 입력(`query.trim() === ""`)은 요청을 보내지 않습니다.

### 2) 슬롯 칩 기반 빠른 조건 선택

히어로 영역에서 아래 칩을 클릭해 빠르게 조건을 토글할 수 있습니다.

- 지역: `서울`, `경기`, `원격`
- 직무: `인공지능/머신러닝`, `백엔드/서버개발`, `데이터 엔지니어링`
- 경력: `신입`, `주니어`, `경력무관`
- 학력: `고등학교졸업이상`, `대학졸업(4년) 이상`, `학력무관`

동작 포인트:

- 같은 칩을 다시 누르면 해제되어 해당 슬롯이 `전체`로 돌아갑니다.
- 칩을 선택/해제할 때 검색어 문자열도 동기화됩니다.
- 같은 슬롯의 기존 키워드는 정규식으로 제거 후 새 값을 붙여 중복을 방지합니다.

### 3) 필터 사이드바 (슬롯 + 정렬 + 초기화)

`FilterSidebar`에서 아래 항목을 조정할 수 있습니다.

- 슬롯 필터: 지역/직무/경력/학력
- 정렬 탭: `정확도`, `최신순`, `마감임박`
- `초기화` 버튼으로 전체 필터 리셋

주의:

- 현재 정렬 값(`sort`)은 UI 상태로만 관리되고, API 요청 payload에는 포함되지 않습니다.
- 실제 정렬 반영은 백엔드가 `user_input` 해석 또는 별도 정렬 파라미터를 지원할 때 확장 가능합니다.

### 4) 검색 요청 조립 로직

검색 실행 시 최종 `user_input`을 아래 규칙으로 만듭니다.

- 기본은 입력창의 `query.trim()`
- 선택된 슬롯 값이 `전체`가 아니고, 검색어에 아직 없으면 뒤에 자동으로 추가
- 예: `"서울 AI 엔지니어" + "신입" + "대학졸업(4년) 이상"`

즉, 사용자 자유 입력과 구조화 필터를 함께 활용하는 방식입니다.

### 5) 백엔드 API 연동

- 기본 프론트 시작 요청 URL: `/api/query/start`
- 기본 프론트 상태 조회 URL: `/api/query/status?job_id=...`
- 서버 프록시 URL(시작): `${BACKEND_API_URL}/query/jobs`
- 서버 프록시 URL(상태 조회): `${BACKEND_API_URL}/query/jobs/{job_id}`
- 시작 요청 메서드: `POST`
- 시작 요청 헤더: `Content-Type: application/json`
- 시작 요청 Body:

```json
{
  "user_input": "서울 AI 엔지니어 신입 대졸 채용공고 찾아줘"
}
```

`/api/query/start`, `/api/query/status` 응답 형식:

- `job_id`
- `status`: `queued | running | done | failed`
- `step` (옵션)
- `step_label` (옵션)
- `message` (옵션)
- `result` (`status=done`일 때 최종 결과)

프론트는 시작 요청 후 polling으로 상태를 조회합니다.

- 시작 후 30초 미만: 1초 간격
- 30초 이후: 2초 간격
- 최대 대기: 5분

최종 응답(`status=done`의 `result`)에서 아래 필드를 사용해 화면 ViewModel로 변환합니다.

- `status`
- `query`
- `message`
- `missing_fields`
- `normalized_entities`
- `retrieved_scores`
- `user_response`
- `retrieved_job_info_list`

### 6) 검색 상태 머신

프론트 상태는 아래 5단계로 분리됩니다.

- `idle`: 초기 화면
- `loading`: API 요청 중
- `complete`: 결과 정상 표시
- `incomplete`: 필수 슬롯 부족 등으로 보완 필요
- `empty`: complete이지만 결과 목록이 비어 있음

세부 동작:

- 검색 시작 시 `response`를 `null`로 초기화
- `loading` 중에는 job 상태(`queued/running`)를 조회하며 현재 단계 라벨을 버튼/요약 카드에 표시
- 결과 수신 시 첫 공고를 자동 선택
- `incomplete`면 요약 카드에서 부족 슬롯을 강조 표시
- `status=failed` 또는 상태 조회 오류 누적 시 에러 상태 전환
- 최대 대기시간(5분) 초과 시 에러 상태 전환
- 검색 시작 후 결과 섹션으로 부드럽게 스크롤 이동

### 7) AI 응답 요약 카드

`ResponseSummary`에서 아래 정보를 한 번에 확인할 수 있습니다.

- 검색 완료/보완 필요 상태 배지
- AI 요약 문장(`user_response` 우선, 없으면 `message`)
- 정규화된 슬롯 값 배지(지역/직무/경력/학력)
- 부족 슬롯 목록(`missing_fields`)
- 상위 검색 점수 미리보기(`retrieved_scores` 상위 3개)

### 8) 결과 목록 + 점수 표시

`JobList`는 세 가지 화면 상태를 제공합니다.

- 로딩 스켈레톤
- 빈 결과 안내
- 결과 카드 목록

결과 카드 기능:

- 결과 번호(예: 검색 결과 1)
- 공고 텍스트 요약(최대 4줄 line-clamp)
- 점수 배지(있는 경우 `%`로 표시)
- 클릭 시 해당 결과를 상세 패널에 연결

### 9) 상세 패널

`JobDetailPanel`은 선택된 공고의 원문 텍스트를 표시합니다.

- 선택 전: 플레이스홀더 안내
- 선택 후: 결과 번호, 점수, 공고 텍스트
- 공고 텍스트는 `whitespace-pre-wrap`으로 줄바꿈을 유지합니다.

### 10) 반응형 UX

브레이크포인트별 레이아웃:

- `xl` 이상: `필터 | 결과목록 | 상세패널` 3열
- `lg` ~ `xl`: `필터 | 결과목록` + 하단 상세패널
- 모바일: 필터/상세를 `Sheet` 오버레이로 제공

모바일 전용 버튼:

- `필터`: 왼쪽 시트 오픈
- `상세 패널`: 하단 시트 오픈

### 11) 시각 디자인 시스템

`globals.css` + Tailwind 확장으로 아래 토큰을 사용합니다.

- 배경/텍스트/상태 색상 변수(`--primary`, `--success`, `--warning` 등)
- `glass-panel` 유틸(반투명 + blur)
- `gradient-stroke` 유틸(그라디언트 외곽선)
- `fade-up` 등 커스텀 애니메이션

폰트는 한글 가독성 중심 스택(`Manrope`, `Pretendard Variable`, `SUIT Variable`, `IBM Plex Sans KR`, `Noto Sans KR`)으로 구성되어 있습니다.

## 기술 스택

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Radix UI Primitives (Dialog/Sheet, Tabs, ScrollArea, Separator)
- shadcn/ui 패턴 기반 공통 UI
- Lucide React 아이콘

## 실행 방법

### 요구 사항

- Node.js 18.17+
- npm

### 개발 서버

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 프로덕션 빌드/실행

```bash
npm run build
npm run start
```

## 환경 변수

백엔드 URL을 변경하려면 `.env.local`에 아래를 설정합니다.

```bash
BACKEND_API_URL=https://your-api-domain.com
```

`BACKEND_API_URL`은 실백엔드 연동(프로덕션/스테이징) 시 필수입니다. 개발 환경에서는 로컬 목 모드로 대체할 수 있습니다.

백엔드 준비 전 프론트 단독 검증을 위해 개발용 로컬 목 모드도 지원합니다.

```bash
# 명시적 목 모드 활성화
LOCAL_QUERY_MOCK=true

# 시나리오 선택: complete | incomplete | failed | slow
LOCAL_QUERY_MOCK_SCENARIO=complete
```

동작 규칙:

- `LOCAL_QUERY_MOCK=true`이면 `/api/query`, `/api/query/start`, `/api/query/status`가 로컬 목 데이터를 반환합니다.
- `NODE_ENV=development`이고 `BACKEND_API_URL`이 비어 있으면 로컬 목 모드가 자동 활성화됩니다.
- `complete` 시나리오는 일반 완료 흐름(`running` → `done`)을 검증합니다.
- `incomplete` 시나리오는 보완 필요 응답(`done.result.status=incomplete`)을 검증합니다.
- `failed` 시나리오는 작업 실패 상태(`failed`)를 검증합니다.
- `slow` 시나리오는 장시간 처리(`queued`/`running` 지속 후 `done`)를 검증합니다.

## 프론트 단독 검증 절차

1. `.env.local` 없이 `npm run dev` 실행 또는 `LOCAL_QUERY_MOCK=true` 설정 후 실행
2. 브라우저에서 검색 실행
3. 로딩 중 단계 레일이 상태 조회(`queued/running`) 결과에 맞춰 업데이트되는지 확인
4. `LOCAL_QUERY_MOCK_SCENARIO=slow`로 재실행하여 장시간 polling 완료 렌더링 확인
5. `LOCAL_QUERY_MOCK_SCENARIO=incomplete`로 재실행하여 `missing_fields` 및 보완 안내 표시 확인
6. `LOCAL_QUERY_MOCK_SCENARIO=failed`로 재실행하여 실패 메시지 렌더링 확인

## API 응답 타입(프론트 사용 기준)

핵심 타입은 [`types/search.ts`](/Users/eojin-kim/.codex/worktrees/da5e/frontend/types/search.ts)에 정의되어 있습니다.

- `SearchApiResponse`: 백엔드 응답 원형
- `SearchJobEnvelope`: 비동기 job 상태/결과 응답
- `SearchResponseViewModel`: 화면 렌더링용 정규화 모델
- `SearchStatus`: `idle | loading | complete | incomplete | empty | error`
- `JobStep`: `analyzing | collecting | parsing | ranking | writing`
- `SearchFilters`: 슬롯 필터 상태

## 프로젝트 구조

```text
.
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx
│  └─ globals.css
├─ components/
│  ├─ search/
│  │  ├─ search-hero.tsx
│  │  ├─ filter-sidebar.tsx
│  │  ├─ response-summary.tsx
│  │  ├─ job-list.tsx
│  │  ├─ job-detail-panel.tsx
│  │  └─ hero-illustration.tsx
│  └─ ui/
├─ lib/
│  ├─ utils.ts
│  └─ mock-data.ts
├─ types/
│  └─ search.ts
└─ package.json
```

## 현재 코드 기준 참고 사항

- `lib/mock-data.ts`는 과거/보조용 목데이터 로직이며, 현재 메인 검색 흐름은 `app/page.tsx`의 실 API `fetch`를 사용합니다.
- 메인 검색은 `/api/query/start` + `/api/query/status` polling 오케스트레이션을 사용합니다.
- 필터 `sort` 값은 현재 요청 payload에 포함되지 않으므로, 백엔드 정렬 요구사항과 함께 추후 확장하는 것이 좋습니다.

## 주요 파일

- 메인 오케스트레이션: [`app/page.tsx`](/Users/eojin-kim/.codex/worktrees/81d6/frontend/app/page.tsx)
- 검색 히어로/입력: [`components/search/search-hero.tsx`](/Users/eojin-kim/.codex/worktrees/81d6/frontend/components/search/search-hero.tsx)
- 필터 패널: [`components/search/filter-sidebar.tsx`](/Users/eojin-kim/.codex/worktrees/81d6/frontend/components/search/filter-sidebar.tsx)
- 응답 요약: [`components/search/response-summary.tsx`](/Users/eojin-kim/.codex/worktrees/81d6/frontend/components/search/response-summary.tsx)
- 결과 목록: [`components/search/job-list.tsx`](/Users/eojin-kim/.codex/worktrees/81d6/frontend/components/search/job-list.tsx)
- 상세 패널: [`components/search/job-detail-panel.tsx`](/Users/eojin-kim/.codex/worktrees/81d6/frontend/components/search/job-detail-panel.tsx)
- 타입 정의: [`types/search.ts`](/Users/eojin-kim/.codex/worktrees/81d6/frontend/types/search.ts)
