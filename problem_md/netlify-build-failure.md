# 1. 문제 요약
- Netlify 프로덕션 빌드(`npx netlify build`)가 TypeScript 타입 오류로 실패했다.
- 최초 오류: `app/page.tsx`에서 import한 `AsyncJobStatus`가 `types/search.ts`에 export되지 않음.
- 후속 오류: `components/search/search-hero.tsx`에서 `isSubmitDisabled` 식별자 미선언.

# 2. 영향 범위(서비스/사용자/기능)
- 영향 서비스: Netlify 배포 파이프라인
- 사용자 영향: 신규 배포가 막혀 최신 프론트 코드 반영 불가
- 기능 영향: 전체 사이트 배포 중단(빌드 단계 실패)

# 3. 재현 조건
- 경로: `/Users/eojin-kim/dev/job_search_ai/frontend`
- 명령: `npx netlify build`
- 결과: `npm run build` 단계의 TypeScript 검사에서 실패

# 4. 가설 목록
- 가설 A: 브랜치 머지 과정에서 타입 정의 일부가 누락되었다.
- 가설 B: UI 컴포넌트 리팩터링 중 상태 변수 선언이 제거되었다.

# 5. 시도 기록(시간, 조치, 결과)
- 2026-03-16: `npx netlify status`로 Netlify 인증/사이트 링크 확인.
  - 결과: 로그인/프로젝트 연결 정상.
- 2026-03-16: `npx netlify build` 실행.
  - 결과: `AsyncJobStatus` 미export 타입 오류로 실패.
- 2026-03-16: `types/search.ts`에 `AsyncJobStatus` 타입 선언 복구, `app/page.tsx` 미사용 import 정리.
  - 결과: 다음 빌드에서 다른 오류(`isSubmitDisabled` 미선언) 확인.
- 2026-03-16: `search-hero.tsx`에 `isSubmitDisabled` 선언 추가 및 버튼 `disabled` 연결.
  - 결과: `npm run build` 성공, `npx netlify build` 성공.

# 6. 실패 원인 분석
- 직접 원인: 타입/변수 선언 누락으로 TypeScript strict 검증 실패.
- 근본 원인: 머지 후 컴파일/배포 빌드 검증이 즉시 수행되지 않아 누락이 배포 직전에 발견됨.

# 7. 의사결정 근거
- Netlify가 실제로 실행하는 빌드 경로(`npm run build`)를 로컬에서 동일하게 재현해 원인을 좁혔다.
- 최소 수정 원칙으로 누락 선언만 복구하여 기능 영향 범위를 제한했다.

# 8. 최종 결정 및 다음 액션
- 최종 결정: 누락 타입/변수를 복구해 Netlify 빌드 성공 상태로 복원.
- 다음 액션:
  - 머지 직후 `npm run build`를 필수 점검 단계로 고정.
  - 배포 전 `npx netlify build`를 로컬 게이트로 추가.
