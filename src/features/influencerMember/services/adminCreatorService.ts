import { apiInstance } from "@/common/lib/apiInstance";
import {
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock";
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
  어드민 인플루언서 회원 API — 백엔드 `AdminCreatorController`(origin/main)와 1:1. 배포본은 항상 실호출한다.
  목록 GET `/v1/admin/creators`(55 계획서 M1)도 origin/main에 있다.

  ⚠ 백엔드 배포 후 삭제: `/v1/admin/creators/**`는 개발 서버(api.showroomz.shop)에 아직 없다.
  그래서 DEV(`pnpm dev`)에서는 기본으로 목업 어댑터(`mocks/influencerMock.ts`, 동적 import)를 쓴다.

  DEV 목업 시나리오(`?mock=<값>`):
  - (없음)                  C1 목록 8건(탈퇴 승인 대기 2건 상단 고정) · 대기 탭 = C2(최장 대기 N일)
                             소연 쇼룸 A1(조정 협의 · 정산 · 계약) · 하린의 뷰티랩/예린 뷰티 B1 · 민재 셀렉트 C1(정지) · 라온 뷰티노트 D1(탈퇴)
  - `influencer-no-pending` C3 승인 대기 0건
  - `influencer-empty`      목록 0건
  - `influencer-a1` · `influencer-b1` · `influencer-c1` · `influencer-d1`  어떤 상세로 들어가도 그 상태
  - `influencer-a1u`        A1-u 마스킹 해제됨(10분 잠금 카운트다운)
  - `influencer-noperm`     M4 해제 권한 없음(버튼 비활성 · 최고관리자 한정)
  - `live`                  DEV에서도 실서버를 부른다
  조치(정지 · 해제 · 승인 · 반려 · 메모 · 마스킹 해제/잠금)는 목업 안의 상태를 바꾼다(새로고침하면 처음으로).
*/
function creatorMock(): string | null {
  if (!DEV_MOCK_ENABLED) return null;
  const scenario = mockScenario();
  if (scenario === "live") return null;
  return scenario?.startsWith("influencer") ? scenario : "default";
}

async function loadMock() {
  // 배포 빌드에서 목업 모듈이 청크로 남지 않게 상수 조건으로 막는다(번들러가 이 분기를 지운다)
  if (!import.meta.env.DEV) throw new Error("mock disabled");
  return import("../mocks/influencerMock");
}

export const adminCreatorService = {
  getList: async (params: MemberListParams) => {
    const scenario = creatorMock();
    if (scenario) {
      const { mockInfluencerList } = await loadMock();
      return mockDelay(mockInfluencerList(scenario, params));
    }
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
    if (creatorMock()) {
      const { mockInfluencerReasonOptions } = await loadMock();
      return mockDelay(mockInfluencerReasonOptions());
    }
    const { data } = await apiInstance.get<AdminCreatorReasonOptions>(
      `${BASE}/reason-options`
    );
    return data;
  },

  getDetail: async (creatorId: number) => {
    const scenario = creatorMock();
    if (scenario) {
      const { mockInfluencerDetail } = await loadMock();
      return mockDelay(mockInfluencerDetail(scenario, creatorId));
    }
    const { data } = await apiInstance.get<AdminCreatorDetail>(
      `${BASE}/${creatorId}`
    );
    return data;
  },

  getOverview: async (creatorId: number) => {
    const scenario = creatorMock();
    if (scenario) {
      const { mockInfluencerOverview } = await loadMock();
      return mockDelay(mockInfluencerOverview(scenario, creatorId));
    }
    const { data } = await apiInstance.get<AdminCreatorOverview>(
      `${BASE}/${creatorId}/overview`
    );
    return data;
  },

  getSettlements: async (creatorId: number, size: number) => {
    const scenario = creatorMock();
    if (scenario) {
      const { mockInfluencerSettlements } = await loadMock();
      return mockDelay(mockInfluencerSettlements(scenario, creatorId));
    }
    const { data } = await apiInstance.get<AdminCreatorSettlementList>(
      `${BASE}/${creatorId}/settlements`,
      { params: { size } }
    );
    return data;
  },

  getContracts: async (creatorId: number) => {
    const scenario = creatorMock();
    if (scenario) {
      const { mockInfluencerContracts } = await loadMock();
      return mockDelay(mockInfluencerContracts(scenario, creatorId));
    }
    const { data } = await apiInstance.get<AdminCreatorContractPage>(
      `${BASE}/${creatorId}/contracts`,
      { params: { page: 1, size: 20 } }
    );
    return data;
  },

  getConnections: async (creatorId: number) => {
    const scenario = creatorMock();
    if (scenario) {
      const { mockInfluencerConnections } = await loadMock();
      return mockDelay(mockInfluencerConnections(scenario, creatorId));
    }
    const { data } = await apiInstance.get<AdminCreatorConnectionList>(
      `${BASE}/${creatorId}/connections`
    );
    return data;
  },

  getHistories: async (creatorId: number, page: number, size: number) => {
    const scenario = creatorMock();
    if (scenario) {
      const { mockInfluencerHistories } = await loadMock();
      return mockDelay(
        mockInfluencerHistories(scenario, creatorId, page, size)
      );
    }
    const { data } = await apiInstance.get<AdminCreatorHistoryPage>(
      `${BASE}/${creatorId}/histories`,
      { params: { page, size } }
    );
    return data;
  },

  getMemos: async (creatorId: number) => {
    const scenario = creatorMock();
    if (scenario) {
      const { mockInfluencerMemos } = await loadMock();
      return mockDelay(mockInfluencerMemos(scenario, creatorId));
    }
    const { data } = await apiInstance.get<AdminCreatorMemoPage>(
      `${BASE}/${creatorId}/memos`,
      { params: { page: 1, size: 100 } }
    );
    return data;
  },

  createMemo: async (creatorId: number, content: string) => {
    const scenario = creatorMock();
    if (scenario) {
      const { mockInfluencerCreateMemo } = await loadMock();
      return mockDelay(mockInfluencerCreateMemo(scenario, creatorId, content));
    }
    const { data } = await apiInstance.post<MemberMemo>(
      `${BASE}/${creatorId}/memos`,
      { content }
    );
    return data;
  },

  updateMemo: async (creatorId: number, memoId: number, content: string) => {
    const scenario = creatorMock();
    if (scenario) {
      const { mockInfluencerUpdateMemo } = await loadMock();
      return mockDelay(
        mockInfluencerUpdateMemo(scenario, creatorId, memoId, content)
      );
    }
    const { data } = await apiInstance.patch<MemberMemo>(
      `${BASE}/${creatorId}/memos/${memoId}`,
      { content }
    );
    return data;
  },

  deleteMemo: async (creatorId: number, memoId: number) => {
    const scenario = creatorMock();
    if (scenario) {
      const { mockInfluencerDeleteMemo } = await loadMock();
      mockInfluencerDeleteMemo(scenario, creatorId, memoId);
      return mockDelay(null);
    }
    await apiInstance.delete(`${BASE}/${creatorId}/memos/${memoId}`);
    return null;
  },

  /** M4 — 이 인플루언서 1건 · 이 운영자 · 10분 고정 만료. 응답은 실값이 든 상세 */
  unmask: async (creatorId: number, reason: CreatorPrivacyAccessReason) => {
    const scenario = creatorMock();
    if (scenario) {
      const { mockInfluencerUnmask } = await loadMock();
      return mockDelay(mockInfluencerUnmask(scenario, creatorId, reason));
    }
    const { data } = await apiInstance.post<AdminCreatorDetail>(
      `${BASE}/${creatorId}/privacy-unmask`,
      { reason }
    );
    return data;
  },

  /** 「지금 잠금」 · 화면을 떠날 때 — 세션이 없어도 204(멱등) */
  lock: async (creatorId: number) => {
    const scenario = creatorMock();
    if (scenario) {
      const { mockInfluencerLock } = await loadMock();
      mockInfluencerLock(scenario, creatorId);
      return null;
    }
    await apiInstance.post(`${BASE}/${creatorId}/privacy-lock`);
    return null;
  },

  suspend: async (creatorId: number, payload: MemberSuspendPayload) => {
    const scenario = creatorMock();
    if (scenario) {
      const { mockInfluencerSuspend } = await loadMock();
      return mockDelay(mockInfluencerSuspend(scenario, creatorId, payload));
    }
    const { data } = await apiInstance.post<AdminCreatorDetail>(
      `${BASE}/${creatorId}/suspend`,
      payload
    );
    return data;
  },

  release: async (creatorId: number, payload: MemberReleasePayload) => {
    const scenario = creatorMock();
    if (scenario) {
      const { mockInfluencerRelease } = await loadMock();
      return mockDelay(mockInfluencerRelease(scenario, creatorId, payload));
    }
    const { data } = await apiInstance.post<AdminCreatorDetail>(
      `${BASE}/${creatorId}/release`,
      payload
    );
    return data;
  },

  approveWithdrawal: async (creatorId: number, requestId: number) => {
    const scenario = creatorMock();
    if (scenario) {
      const { mockInfluencerApprove } = await loadMock();
      return mockDelay(mockInfluencerApprove(scenario, creatorId));
    }
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
    const scenario = creatorMock();
    if (scenario) {
      const { mockInfluencerReject } = await loadMock();
      return mockDelay(mockInfluencerReject(scenario, creatorId, payload));
    }
    const { data } = await apiInstance.post<AdminCreatorDetail>(
      `${BASE}/${creatorId}/withdrawal-requests/${requestId}/reject`,
      payload
    );
    return data;
  },
};
