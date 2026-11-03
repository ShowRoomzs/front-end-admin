import { apiInstance } from "@/common/lib/apiInstance";
import { ApiNotReadyError, mockDelay } from "@/common/utils/devMock";
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
  어드민 브랜드 회원 API — 백엔드 `AdminBrandController`(origin/main)와 1:1. 개발 서버에 배포돼 DEV에서도 실호출만 한다
  (58 반영 · 목업 어댑터 삭제).

  「최근 문의」(파트너센터 1:1 문의)만 서버에 아직 없다(§55 A-5 — 1:1 문의 목록에 브랜드 필터가 없다) —
  DEV만 목업(`mocks/brandMock.ts`), 배포본은 ApiNotReadyError → 「준비 중」.
*/

export const adminBrandService = {
  getList: async (params: MemberListParams) => {
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
    const { data } = await apiInstance.get<AdminBrandReasonOptions>(
      `${BASE}/reason-options`
    );
    return data;
  },

  getDetail: async (marketId: number) => {
    const { data } = await apiInstance.get<AdminBrandDetail>(
      `${BASE}/${marketId}`
    );
    return data;
  },

  /** M1 — 정지 종료일 다음 날 00:00 자동 해제(기-02). 응답은 갱신된 레일 */
  suspend: async (marketId: number, payload: MemberSuspendPayload) => {
    const { data } = await apiInstance.post<AdminBrandRail>(
      `${BASE}/${marketId}/suspend`,
      payload
    );
    return data;
  },

  release: async (marketId: number, payload: MemberReleasePayload) => {
    const { data } = await apiInstance.post<AdminBrandRail>(
      `${BASE}/${marketId}/release`,
      payload
    );
    return data;
  },

  /** M2 — 되돌릴 수 없다. 서버가 조건 4종을 다시 판정한다(남으면 409) */
  approveWithdrawal: async (marketId: number, requestId: number) => {
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
    const { data } = await apiInstance.post<AdminBrandRail>(
      `${BASE}/${marketId}/withdrawal-requests/${requestId}/reject`,
      payload
    );
    return data;
  },

  getHistories: async (marketId: number, page: number, size: number) => {
    const { data } = await apiInstance.get<AdminBrandHistoryPage>(
      `${BASE}/${marketId}/histories`,
      { params: { page, size } }
    );
    return data;
  },

  getMemos: async (marketId: number) => {
    const { data } = await apiInstance.get<AdminBrandMemoPage>(
      `${BASE}/${marketId}/memos`,
      { params: { page: 1, size: 100 } }
    );
    return data;
  },

  createMemo: async (marketId: number, content: string) => {
    const { data } = await apiInstance.post<MemberMemo>(
      `${BASE}/${marketId}/memos`,
      { content }
    );
    return data;
  },

  updateMemo: async (marketId: number, memoId: number, content: string) => {
    const { data } = await apiInstance.patch<MemberMemo>(
      `${BASE}/${marketId}/memos/${memoId}`,
      { content }
    );
    return data;
  },

  deleteMemo: async (marketId: number, memoId: number) => {
    await apiInstance.delete(`${BASE}/${marketId}/memos/${memoId}`);
    return null;
  },

  /** 연결 인플루언서 전체 — 연결중 먼저 → 연결 종료 */
  getConnectedCreators: async (marketId: number) => {
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
    if (import.meta.env.DEV) {
      // 배포 빌드에서 목업 모듈이 청크로 남지 않게 상수 조건 안에서만 부른다
      const { mockBrandRecentInquiries } = await import("../mocks/brandMock");
      return mockDelay(mockBrandRecentInquiries());
    }
    throw new ApiNotReadyError(`브랜드 최근 문의(${marketId})`);
  },
};
