import { apiInstance } from "@/common/lib/apiInstance";
import {
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock";
import type { AdminBadges, AdminHome } from "@/features/home/types";

/*
  어드민 홈 API — 백엔드 `AdminHomeController`(origin/main · 1017 설계서 6절)와 1:1.

  ⚠️ 두 엔드포인트 모두 main에는 있지만 개발 서버(api.showroomz.shop)에 아직 배포되지 않았다.
  로컬 화면 확인용으로 **개발 서버(`pnpm dev`)에서만** 목업 어댑터를 쓴다 — 배포본은 항상 실호출이다.
  백엔드 배포 후 `mockEnabled` 분기와 `mocks/homeMock.ts`를 지운다.

  DEV 목업 시나리오(`?mock=<값>`):
  - (없음) · `home`  → H1 기본(할 일 + 오늘 일정 + 지표 · 연동 정상)
  - `empty`          → H2 할 일 0건(오늘 처리 건수만)
  - `degraded`       → H3 배송 추적 응답 지연(헤더 배지 위험 · 배너)
  - `live`           → 목업을 끄고 개발 서버를 실호출(배포 확인용)
*/
function mockEnabled() {
  return DEV_MOCK_ENABLED && mockScenario() !== "live";
}

export const adminHomeService = {
  /** GET /v1/admin/home — 홈 한 화면(연동 · 할 일 · 오늘 일정 · 오늘 지표) */
  getHome: async () => {
    if (mockEnabled()) {
      const { mockAdminHome } = await import("../mocks/homeMock");
      return mockDelay(mockAdminHome(mockScenario()));
    }
    const { data } = await apiInstance.get<AdminHome>("/admin/home", {
      // 화면이 실패 상태를 직접 그린다 — 5분 폴링마다 토스트가 쌓이지 않게
      suppressErrorToast: true,
    });
    return data;
  },

  /** GET /v1/admin/badges — 사이드바 배지(홈 할 일과 같은 큐 계산) */
  getBadges: async () => {
    if (mockEnabled()) {
      const { mockAdminBadges } = await import("../mocks/homeMock");
      return mockDelay(mockAdminBadges(mockScenario()));
    }
    const { data } = await apiInstance.get<AdminBadges>("/admin/badges", {
      // 셸이 폴링하는 배경 요청이다 — 실패해도 운영자가 할 일이 없다
      suppressErrorToast: true,
    });
    return data;
  },
};
