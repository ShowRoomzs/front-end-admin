import { apiInstance } from "@/common/lib/apiInstance";
import {
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock";
import type {
  AdminMetrics,
  MetricsPeriodParams,
  MetricsQueryParams,
  MetricsTabBadge,
} from "@/features/metrics/types";

/*
  어드민 운영 지표 API — 백엔드 `AdminMetricsController`(origin/main · 1017 설계서 7절)와 1:1.

  ⚠️ main에는 있지만 개발 서버(api.showroomz.shop)에 아직 배포되지 않았다.
  로컬 화면 확인용으로 **개발 서버(`pnpm dev`)에서만** 목업 어댑터를 쓴다 — 배포본은 항상 실호출이다.
  백엔드 배포 후 `mockEnabled` 분기와 `mocks/metricsMock.ts`를 지운다.

  DEV 목업 시나리오(`?mock=<값>`) — 탭 · 기간은 화면에서 고른다(K1~K5 = 한 달 + 각 탭, K6 = 직접 선택):
  - (없음)  → 시안 값(한 달 = 10.01 ~ 10.16 · 직접 선택 = 09.01 ~ 09.30 기본)
  - `flat`  → 나빠진 지표 0(탭 옆 빨간 숫자 숨김 확인)
  - `live`  → 목업을 끄고 개발 서버를 실호출(배포 확인용)
*/
function mockEnabled() {
  return DEV_MOCK_ENABLED && mockScenario() !== "live";
}

/** CUSTOM이 아니면 from · to를 보내지 않는다(서버가 기간을 확정한다) */
function periodQuery(params: MetricsPeriodParams) {
  return params.preset === "CUSTOM"
    ? { preset: params.preset, from: params.from, to: params.to }
    : { preset: params.preset };
}

export const adminMetricsService = {
  /** GET /v1/admin/metrics?preset&from&to&tab */
  getMetrics: async (params: MetricsQueryParams) => {
    if (mockEnabled()) {
      const { mockMetrics } = await import("../mocks/metricsMock");
      return mockDelay(mockMetrics(params, mockScenario()));
    }
    const { data } = await apiInstance.get<AdminMetrics>("/admin/metrics", {
      params: { ...periodQuery(params), tab: params.tab },
    });
    return data;
  },

  /** GET /v1/admin/metrics/tabs?preset&from&to — 탭 옆 「나빠진 지표 수」 */
  getTabs: async (params: MetricsPeriodParams) => {
    if (mockEnabled()) {
      const { mockMetricsTabs } = await import("../mocks/metricsMock");
      return mockDelay(mockMetricsTabs(params, mockScenario()));
    }
    const { data } = await apiInstance.get<Array<MetricsTabBadge>>(
      "/admin/metrics/tabs",
      {
        params: periodQuery(params),
        // 배지만 못 그릴 뿐 화면은 쓸 수 있다 — 본문 조회 실패 토스트와 겹치지 않게
        suppressErrorToast: true,
      }
    );
    return data;
  },
};
