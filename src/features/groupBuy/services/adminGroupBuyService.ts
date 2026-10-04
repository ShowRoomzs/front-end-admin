import { apiInstance } from "@/common/lib/apiInstance";
import type { PageResponse } from "@/common/types/page";
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams";
import type {
  ActionResponse,
  AdminGroupBuyDetail,
  AdminGroupBuyListItem,
  AdminGroupBuyListParams,
  AdminGroupBuySummary,
  DetailNavParams,
  EmergencySuspensionBody,
  IssueOpenBody,
  NoticeOptions,
  OpenRejectBody,
  PostHideBody,
  SuspensionNoticeBody,
  SuspensionWithdrawBody,
} from "@/features/groupBuy/types";

const BASE = "/admin/group-buys";

/** 어드민 공구 API — 백엔드 `AdminGroupBuyController`와 1:1(게시물 판본 조회는 화면이 쓰지 않는다) */
export const adminGroupBuyService = {
  getList: async (params: AdminGroupBuyListParams) => {
    const { data } = await apiInstance.get<PageResponse<AdminGroupBuyListItem>>(
      BASE,
      { params: paramsToSearchParams(params) }
    );
    return data;
  },

  getSummary: async () => {
    const { data } = await apiInstance.get<AdminGroupBuySummary>(
      `${BASE}/summary`
    );
    return data;
  },

  /** 목록 조건을 함께 넘긴다 — 서버가 그 범위로 이전/다음 ID를 계산한다 */
  getDetail: async (groupBuyId: number, params: DetailNavParams) => {
    const { data } = await apiInstance.get<AdminGroupBuyDetail>(
      `${BASE}/${groupBuyId}`,
      { params: paramsToSearchParams(params) }
    );
    return data;
  },

  getNoticeOptions: async (groupBuyId: number) => {
    const { data } = await apiInstance.get<NoticeOptions>(
      `${BASE}/${groupBuyId}/admin-suspension/notice-options`
    );
    return data;
  },

  /** 소명 첨부 — 누를 때 발급하는 짧은 수명의 다운로드 URL */
  getAppealAttachmentUrl: async (groupBuyId: number, attachmentId: number) => {
    const { data } = await apiInstance.get<{
      attachmentId: number;
      url: string;
      fileName: string;
      expiresInSeconds: number;
    }>(`${BASE}/${groupBuyId}/admin-suspension/attachments/${attachmentId}`);
    return data;
  },

  approveOpen: async (groupBuyId: number) => {
    const { data } = await apiInstance.post<ActionResponse>(
      `${BASE}/${groupBuyId}/open-review/approve`
    );
    return data;
  },

  rejectOpen: async (groupBuyId: number, body: OpenRejectBody) => {
    const { data } = await apiInstance.post<ActionResponse>(
      `${BASE}/${groupBuyId}/open-review/reject`,
      body
    );
    return data;
  },

  hidePost: async (groupBuyId: number, body: PostHideBody) => {
    const { data } = await apiInstance.post<ActionResponse>(
      `${BASE}/${groupBuyId}/post/hide`,
      body
    );
    return data;
  },

  /** 숨김 해제 — 읽은 판본을 돌려준다. 그사이 수정됐으면 409 GROUP_BUY_POST_CHANGED_SINCE_VIEW */
  unhidePost: async (groupBuyId: number, expectedRevisionNo: number) => {
    const { data } = await apiInstance.post<ActionResponse>(
      `${BASE}/${groupBuyId}/post/unhide`,
      { expectedRevisionNo },
      { suppressErrorToast: true }
    );
    return data;
  },

  noticeSuspension: async (groupBuyId: number, body: SuspensionNoticeBody) => {
    const { data } = await apiInstance.post<ActionResponse>(
      `${BASE}/${groupBuyId}/admin-suspension/notice`,
      body
    );
    return data;
  },

  executeSuspension: async (groupBuyId: number, executionNote: string) => {
    const { data } = await apiInstance.post<ActionResponse>(
      `${BASE}/${groupBuyId}/admin-suspension/execute`,
      { executionNote }
    );
    return data;
  },

  withdrawSuspension: async (
    groupBuyId: number,
    body: SuspensionWithdrawBody
  ) => {
    const { data } = await apiInstance.post<ActionResponse>(
      `${BASE}/${groupBuyId}/admin-suspension/withdraw`,
      body
    );
    return data;
  },

  emergencySuspend: async (
    groupBuyId: number,
    body: EmergencySuspensionBody
  ) => {
    const { data } = await apiInstance.post<ActionResponse>(
      `${BASE}/${groupBuyId}/admin-suspension/emergency`,
      body
    );
    return data;
  },

  approveRequest: async (
    groupBuyId: number,
    requestId: number,
    decisionReason: string
  ) => {
    const { data } = await apiInstance.post<ActionResponse>(
      `${BASE}/${groupBuyId}/change-requests/${requestId}/approve`,
      { decisionReason }
    );
    return data;
  },

  rejectRequest: async (
    groupBuyId: number,
    requestId: number,
    decisionReason: string
  ) => {
    const { data } = await apiInstance.post<ActionResponse>(
      `${BASE}/${groupBuyId}/change-requests/${requestId}/reject`,
      { decisionReason }
    );
    return data;
  },

  openIssue: async (groupBuyId: number, body: IssueOpenBody) => {
    const { data } = await apiInstance.post<{
      issueId: number;
      threadId: number | null;
    }>(`${BASE}/${groupBuyId}/issues`, body);
    return data;
  },

  confirmSettlement: async (groupBuyId: number) => {
    await apiInstance.post(`${BASE}/${groupBuyId}/settlement/confirm`);
  },
};
