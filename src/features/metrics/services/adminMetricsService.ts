import { apiInstance } from "@/common/lib/apiInstance";
import type {
  AdminMetrics,
  MetricsPeriodParams,
  MetricsQueryParams,
  MetricsTabBadge,
} from "@/features/metrics/types";

/*
  어드민 운영 지표 API — 백엔드 `AdminMetricsController`(origin/main · 1017 설계서 7절)와 1:1.
  개발 서버에 배포돼 있어 DEV에서도 실호출만 한다(58 반영 · DEV 목업 삭제).
*/

/** CUSTOM이 아니면 from · to를 보내지 않는다(서버가 기간을 확정한다) */
function periodQuery(params: MetricsPeriodParams) {
  return params.preset === "CUSTOM"
    ? { preset: params.preset, from: params.from, to: params.to }
    : { preset: params.preset };
}

export const adminMetricsService = {
  /** GET /v1/admin/metrics?preset&from&to&tab */
  getMetrics: async (params: MetricsQueryParams) => {
    const { data } = await apiInstance.get<AdminMetrics>("/admin/metrics", {
      params: { ...periodQuery(params), tab: params.tab },
      // 실패는 본문 자리가 그린다(METRICS_BUSY면 서버 문구 + [다시 시도])
      suppressErrorToast: true,
    });
    return data;
  },

  /** GET /v1/admin/metrics/tabs?preset&from&to — 탭 옆 「나빠진 지표 수」 */
  getTabs: async (params: MetricsPeriodParams) => {
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
