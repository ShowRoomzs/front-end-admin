import { apiInstance } from "@/common/lib/apiInstance";
import {
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock";
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams";
import type {
  ExceptionListParams,
  ExceptionPage,
  ExceptionSummary,
} from "@/features/exception/types";

const BASE = "/admin/order-exceptions";

/*
  DEV 목업 시나리오(`?mock=stall` · 개발 서버 전용 · 배포본은 항상 실호출):
  배송 예외 탭 = 06d A2 추적 정지 2건 + 경과 열 보조줄 「선택 개방까지 N일 [정책값 미정]」.
  `stallChoice`는 서버에 없다(백엔드 요청) — 서버가 생기면 이 분기와 `mocks/exceptionMock.ts`를 지운다.
*/
function stallScenario() {
  return DEV_MOCK_ENABLED && mockScenario() === "stall";
}

/** 어드민 예외 관리 API — 백엔드 `AdminOrderExceptionController`와 1:1(조회 전용) */
export const exceptionService = {
  /**
   * GET /admin/order-exceptions?tab&kind&keyword&page&size — 정렬은 서버 고정(경과 오래된순).
   * 탭에 속하지 않는 kind는 400이라 화면이 탭을 바꿀 때 kind를 비운다.
   */
  getList: async (params: ExceptionListParams) => {
    if (stallScenario()) {
      const { mockExceptionPage } = await import("../mocks/exceptionMock");
      return mockDelay(mockExceptionPage(params));
    }
    const { data } = await apiInstance.get<ExceptionPage>(BASE, {
      params: paramsToSearchParams(params),
    });
    return data;
  },

  /** GET /admin/order-exceptions/summary — 탭 · 유형 건수 · 대행 가능 · 사이드바 배지 */
  getSummary: async () => {
    if (stallScenario()) {
      const { mockExceptionSummary } = await import("../mocks/exceptionMock");
      return mockDelay(mockExceptionSummary());
    }
    const { data } = await apiInstance.get<ExceptionSummary>(`${BASE}/summary`);
    return data;
  },
};
