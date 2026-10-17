import { apiInstance } from "@/common/lib/apiInstance";
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams";
import type {
  ExceptionListParams,
  ExceptionPage,
  ExceptionSummary,
} from "@/features/exception/types";

const BASE = "/admin/order-exceptions";

/** 어드민 예외 관리 API — 백엔드 `AdminOrderExceptionController`와 1:1(조회 전용) */
export const exceptionService = {
  /**
   * GET /admin/order-exceptions?tab&kind&keyword&page&size — 정렬은 서버 고정(경과 오래된순).
   * 탭에 속하지 않는 kind는 400이라 화면이 탭을 바꿀 때 kind를 비운다.
   */
  getList: async (params: ExceptionListParams) => {
    const { data } = await apiInstance.get<ExceptionPage>(BASE, {
      params: paramsToSearchParams(params),
    });
    return data;
  },

  /** GET /admin/order-exceptions/summary — 탭 · 유형 건수 · 대행 가능 · 사이드바 배지 */
  getSummary: async () => {
    const { data } = await apiInstance.get<ExceptionSummary>(`${BASE}/summary`);
    return data;
  },
};
