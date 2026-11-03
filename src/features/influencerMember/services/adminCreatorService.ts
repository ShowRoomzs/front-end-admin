import { apiInstance } from "@/common/lib/apiInstance";
import type {
  AdminCreatorConnectionList,
  AdminCreatorContractPage,
  AdminCreatorDetail,
  AdminCreatorHistoryPage,
  AdminCreatorListResponse,
  AdminCreatorMemoPage,
  AdminCreatorOverview,
  AdminCreatorReasonOptions,
  AdminCreatorSettlementList,
  CreatorPrivacyAccessReason,
} from "@/features/influencerMember/types";
import type {
  MemberListParams,
  MemberMemo,
  MemberReleasePayload,
  MemberSuspendPayload,
  MemberWithdrawalRejectPayload,
} from "@/features/memberShared/types";

const BASE = "/admin/creators";

/*
  어드민 인플루언서 회원 API — 백엔드 `AdminCreatorController`(origin/main)와 1:1.
  `/v1/admin/creators/**`가 개발 서버에 배포돼 DEV에서도 실호출만 한다(58 반영 · 목업 어댑터 삭제).
*/

export const adminCreatorService = {
  getList: async (params: MemberListParams) => {
    const { data } = await apiInstance.get<AdminCreatorListResponse>(BASE, {
      params: {
        tab: params.tab,
        keyword: params.keyword || undefined,
        page: params.page,
        size: params.size,
      },
    });
    return data;
  },

  /** 정지 · 해제 · 탈퇴 반려 · 마스킹 해제 사유 + 정지 모달 미리보기 */
  getReasonOptions: async () => {
    const { data } = await apiInstance.get<AdminCreatorReasonOptions>(
      `${BASE}/reason-options`
    );
    return data;
  },

  getDetail: async (creatorId: number) => {
    const { data } = await apiInstance.get<AdminCreatorDetail>(
      `${BASE}/${creatorId}`
    );
    return data;
  },

  getOverview: async (creatorId: number) => {
    const { data } = await apiInstance.get<AdminCreatorOverview>(
      `${BASE}/${creatorId}/overview`
    );
    return data;
  },

  getSettlements: async (creatorId: number, size: number) => {
    const { data } = await apiInstance.get<AdminCreatorSettlementList>(
      `${BASE}/${creatorId}/settlements`,
      { params: { size } }
    );
    return data;
  },

  getContracts: async (creatorId: number) => {
    const { data } = await apiInstance.get<AdminCreatorContractPage>(
      `${BASE}/${creatorId}/contracts`,
      { params: { page: 1, size: 20 } }
    );
    return data;
  },

  getConnections: async (creatorId: number) => {
    const { data } = await apiInstance.get<AdminCreatorConnectionList>(
      `${BASE}/${creatorId}/connections`
    );
    return data;
  },

  getHistories: async (creatorId: number, page: number, size: number) => {
    const { data } = await apiInstance.get<AdminCreatorHistoryPage>(
      `${BASE}/${creatorId}/histories`,
      { params: { page, size } }
    );
    return data;
  },

  getMemos: async (creatorId: number) => {
    const { data } = await apiInstance.get<AdminCreatorMemoPage>(
      `${BASE}/${creatorId}/memos`,
      { params: { page: 1, size: 100 } }
    );
    return data;
  },

  createMemo: async (creatorId: number, content: string) => {
    const { data } = await apiInstance.post<MemberMemo>(
      `${BASE}/${creatorId}/memos`,
      { content }
    );
    return data;
  },

  updateMemo: async (creatorId: number, memoId: number, content: string) => {
    const { data } = await apiInstance.patch<MemberMemo>(
      `${BASE}/${creatorId}/memos/${memoId}`,
      { content }
    );
    return data;
  },

  deleteMemo: async (creatorId: number, memoId: number) => {
    await apiInstance.delete(`${BASE}/${creatorId}/memos/${memoId}`);
    return null;
  },

  /** M4 — 이 인플루언서 1건 · 이 운영자 · 10분 고정 만료. 응답은 실값이 든 상세 */
  unmask: async (creatorId: number, reason: CreatorPrivacyAccessReason) => {
    const { data } = await apiInstance.post<AdminCreatorDetail>(
      `${BASE}/${creatorId}/privacy-unmask`,
      { reason }
    );
    return data;
  },

  /** 「지금 잠금」 · 화면을 떠날 때 — 세션이 없어도 204(멱등) */
  lock: async (creatorId: number) => {
    await apiInstance.post(`${BASE}/${creatorId}/privacy-lock`);
    return null;
  },

  suspend: async (creatorId: number, payload: MemberSuspendPayload) => {
    const { data } = await apiInstance.post<AdminCreatorDetail>(
      `${BASE}/${creatorId}/suspend`,
      payload
    );
    return data;
  },

  release: async (creatorId: number, payload: MemberReleasePayload) => {
    const { data } = await apiInstance.post<AdminCreatorDetail>(
      `${BASE}/${creatorId}/release`,
      payload
    );
    return data;
  },

  approveWithdrawal: async (creatorId: number, requestId: number) => {
    const { data } = await apiInstance.post<AdminCreatorDetail>(
      `${BASE}/${creatorId}/withdrawal-requests/${requestId}/approve`
    );
    return data;
  },

  rejectWithdrawal: async (
    creatorId: number,
    requestId: number,
    payload: MemberWithdrawalRejectPayload
  ) => {
    const { data } = await apiInstance.post<AdminCreatorDetail>(
      `${BASE}/${creatorId}/withdrawal-requests/${requestId}/reject`,
      payload
    );
    return data;
  },
};
