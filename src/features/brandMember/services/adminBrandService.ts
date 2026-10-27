import { apiInstance } from "@/common/lib/apiInstance";
import {
  ApiNotReadyError,
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock";
import type {
  AdminBrandConnectedCreatorPage,
  AdminBrandDetail,
  AdminBrandHistoryPage,
  AdminBrandListResponse,
  AdminBrandMemoPage,
  AdminBrandRail,
  AdminBrandReasonOptions,
  BrandRecentInquiry,
} from "@/features/brandMember/types";
import type {
  MemberListParams,
  MemberMemo,
  MemberReleasePayload,
  MemberSuspendPayload,
  MemberWithdrawalRejectPayload,
} from "@/features/memberShared/types";

const BASE = "/admin/brands";

/*
  어드민 브랜드 회원 API — 백엔드 `AdminBrandController`(origin/main)와 1:1. 배포본은 항상 실호출한다.

  ⚠ 백엔드 배포 후 삭제: `/v1/admin/brands/**`는 origin/main에 있지만 개발 서버(api.showroomz.shop)에 아직 없다.
  그래서 DEV(`pnpm dev`)에서는 기본으로 목업 어댑터(`mocks/brandMock.ts`, 동적 import)를 쓴다.
  배포되면 `brandMock()` 분기와 목업 파일을 지우면 된다.

  DEV 목업 시나리오(`?mock=<값>`):
  - (없음)            C1 목록 8건(탈퇴 승인 대기 2건 상단 고정) · 행마다 상세 상태가 다르다
                       글로우랩 A1 · 무드코스메틱/퓨어랩 A2 · 벨라코스 A3(정지 · 지급 정지) · 노바랩스 A4(탈퇴 · 파기)
                       탈퇴 승인 대기 탭 = C2(최장 대기 N일)
  - `brand-no-pending` C3 승인 대기 0건(상단 고정 없음 · 「탈퇴 승인 대기 0건」)
  - `brand-empty`      목록 0건(빈 상태)
  - `brand-a1` · `brand-a2` · `brand-a3` · `brand-a4`  어떤 상세로 들어가도 그 상태를 보인다
  - `live`             DEV에서도 실서버를 부른다
  조치(정지 · 해제 · 승인 · 반려 · 메모)는 목업 안의 상태를 바꿔 다음 상태로 넘어간다(새로고침하면 처음으로).

  「최근 문의」(파트너센터 1:1 문의)는 서버에 아예 없다(§55 A-5) — DEV만 목업, 배포본은 ApiNotReadyError → 「준비 중」.
*/
function brandMock(): string | null {
  if (!DEV_MOCK_ENABLED) return null;
  const scenario = mockScenario();
  if (scenario === "live") return null;
  return scenario?.startsWith("brand") ? scenario : "default";
}

async function loadMock() {
  // 배포 빌드에서 목업 모듈이 청크로 남지 않게 상수 조건으로 막는다(번들러가 이 분기를 지운다)
  if (!import.meta.env.DEV) throw new Error("mock disabled");
  return import("../mocks/brandMock");
}

export const adminBrandService = {
  getList: async (params: MemberListParams) => {
    const scenario = brandMock();
    if (scenario) {
      const { mockBrandList } = await loadMock();
      return mockDelay(mockBrandList(scenario, params));
    }
    const { data } = await apiInstance.get<AdminBrandListResponse>(BASE, {
      params: {
        tab: params.tab,
        keyword: params.keyword || undefined,
        page: params.page,
        size: params.size,
      },
    });
    return data;
  },

  /** 정지 · 해제 · 탈퇴 반려 사유 + 정지 모달 미리보기(`suspensionTerm`) */
  getReasonOptions: async () => {
    if (brandMock()) {
      const { mockBrandReasonOptions } = await loadMock();
      return mockDelay(mockBrandReasonOptions());
    }
    const { data } = await apiInstance.get<AdminBrandReasonOptions>(
      `${BASE}/reason-options`
    );
    return data;
  },

  getDetail: async (marketId: number) => {
    const scenario = brandMock();
    if (scenario) {
      const { mockBrandDetail } = await loadMock();
      return mockDelay(mockBrandDetail(scenario, marketId));
    }
    const { data } = await apiInstance.get<AdminBrandDetail>(
      `${BASE}/${marketId}`
    );
    return data;
  },

  /** M1 — 정지 종료일 다음 날 00:00 자동 해제(기-02). 응답은 갱신된 레일 */
  suspend: async (marketId: number, payload: MemberSuspendPayload) => {
    const scenario = brandMock();
    if (scenario) {
      const { mockBrandSuspend } = await loadMock();
      return mockDelay(mockBrandSuspend(scenario, marketId, payload));
    }
    const { data } = await apiInstance.post<AdminBrandRail>(
      `${BASE}/${marketId}/suspend`,
      payload
    );
    return data;
  },

  release: async (marketId: number, payload: MemberReleasePayload) => {
    const scenario = brandMock();
    if (scenario) {
      const { mockBrandRelease } = await loadMock();
      return mockDelay(mockBrandRelease(scenario, marketId, payload));
    }
    const { data } = await apiInstance.post<AdminBrandRail>(
      `${BASE}/${marketId}/release`,
      payload
    );
    return data;
  },

  /** M2 — 되돌릴 수 없다. 서버가 조건 4종을 다시 판정한다(남으면 409) */
  approveWithdrawal: async (marketId: number, requestId: number) => {
    const scenario = brandMock();
    if (scenario) {
      const { mockBrandApprove } = await loadMock();
      return mockDelay(mockBrandApprove(scenario, marketId));
    }
    const { data } = await apiInstance.post<AdminBrandRail>(
      `${BASE}/${marketId}/withdrawal-requests/${requestId}/approve`
    );
    return data;
  },

  rejectWithdrawal: async (
    marketId: number,
    requestId: number,
    payload: MemberWithdrawalRejectPayload
  ) => {
    const scenario = brandMock();
    if (scenario) {
      const { mockBrandReject } = await loadMock();
      return mockDelay(mockBrandReject(scenario, marketId, payload));
    }
    const { data } = await apiInstance.post<AdminBrandRail>(
      `${BASE}/${marketId}/withdrawal-requests/${requestId}/reject`,
      payload
    );
    return data;
  },

  getHistories: async (marketId: number, page: number, size: number) => {
    const scenario = brandMock();
    if (scenario) {
      const { mockBrandHistories } = await loadMock();
      return mockDelay(mockBrandHistories(scenario, marketId, page, size));
    }
    const { data } = await apiInstance.get<AdminBrandHistoryPage>(
      `${BASE}/${marketId}/histories`,
      { params: { page, size } }
    );
    return data;
  },

  getMemos: async (marketId: number) => {
    const scenario = brandMock();
    if (scenario) {
      const { mockBrandMemos } = await loadMock();
      return mockDelay(mockBrandMemos(scenario, marketId));
    }
    const { data } = await apiInstance.get<AdminBrandMemoPage>(
      `${BASE}/${marketId}/memos`,
      { params: { page: 1, size: 100 } }
    );
    return data;
  },

  createMemo: async (marketId: number, content: string) => {
    const scenario = brandMock();
    if (scenario) {
      const { mockBrandCreateMemo } = await loadMock();
      return mockDelay(mockBrandCreateMemo(scenario, marketId, content));
    }
    const { data } = await apiInstance.post<MemberMemo>(
      `${BASE}/${marketId}/memos`,
      { content }
    );
    return data;
  },

  updateMemo: async (marketId: number, memoId: number, content: string) => {
    const scenario = brandMock();
    if (scenario) {
      const { mockBrandUpdateMemo } = await loadMock();
      return mockDelay(
        mockBrandUpdateMemo(scenario, marketId, memoId, content)
      );
    }
    const { data } = await apiInstance.patch<MemberMemo>(
      `${BASE}/${marketId}/memos/${memoId}`,
      { content }
    );
    return data;
  },

  deleteMemo: async (marketId: number, memoId: number) => {
    const scenario = brandMock();
    if (scenario) {
      const { mockBrandDeleteMemo } = await loadMock();
      mockBrandDeleteMemo(scenario, marketId, memoId);
      return mockDelay(null);
    }
    await apiInstance.delete(`${BASE}/${marketId}/memos/${memoId}`);
    return null;
  },

  /** 연결 인플루언서 전체 — 연결중 먼저 → 연결 종료 */
  getConnectedCreators: async (marketId: number) => {
    const scenario = brandMock();
    if (scenario) {
      const { mockBrandConnectedCreators } = await loadMock();
      return mockDelay(mockBrandConnectedCreators(scenario, marketId));
    }
    const { data } = await apiInstance.get<AdminBrandConnectedCreatorPage>(
      `${BASE}/${marketId}/connected-creators`,
      { params: { page: 1, size: 100 } }
    );
    return data;
  },

  /** 최근 문의 — 서버 없음(백엔드 요청). 배포본은 「준비 중」 */
  getRecentInquiries: async (
    marketId: number
  ): Promise<{ items: Array<BrandRecentInquiry>; total: number }> => {
    const scenario = brandMock();
    if (scenario) {
      const { mockBrandRecentInquiries } = await loadMock();
      return mockDelay(mockBrandRecentInquiries(scenario, marketId));
    }
    throw new ApiNotReadyError("브랜드 최근 문의");
  },
};
