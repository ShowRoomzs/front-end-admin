import { apiInstance } from "@/common/lib/apiInstance";
import {
  ApiNotReadyError,
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock";
import type {
  ConsumerDetail,
  ConsumerHistoryPage,
  ConsumerMemo,
  ConsumerMemoPage,
  ConsumerMemoRequest,
  ConsumerReasonOptions,
  ConsumerReleaseRequest,
  ConsumerStatusResult,
  ConsumerSuspendRequest,
  ConsumerTermsAgreement,
  ConsumerUnmaskRequest,
} from "@/features/consumer/types/consumerDetail";
import toast from "react-hot-toast";

const BASE = "/admin/users";

/*
  13 소비자 상세 — 백엔드 origin/main `UserAdminController`와 1:1.

  배포본은 **실호출만** 한다. 개발 서버(api.showroomz.shop)에는 아직 옛 버전(10-21)만 있어
  `GET /{userId}`(옛 모양) 말고는 전부 미배포다 — 로컬 화면 확인을 위해 DEV에서만 목업
  어댑터(`../mocks/consumerDetailMock`)로 갈라 둔다. **백엔드 배포 후 각 DEV 분기를 삭제한다.**
  약관 동의 내역만 서버에 없다(55 계획서 4-3-4 보류 · D16) → DEV 목업 · 배포본 「준비 중」.

  DEV 목업 시나리오(`?mock=<값>` · 개발 서버 전용):
  - (없음) · `active`  A1 활성 · 마스킹(홍길동) — 배송지 펼침(A4) · 메모 수정(A6) · 삭제(M3) ·
                       정지 모달(M1) · 해제 사유 모달(M2)은 화면에서 눌러 연다
  - `unmasked`         A2 마스킹 해제됨(남은 9분 41초)
  - `expiring`         A2 → 8초 뒤 자동 재마스킹(A3 「무조작 10분 · 자동 잠김」 · 직전 사유 프리필)
  - `no-memo`          A5 관리자 메모 없음
  - `no-permission`    마스킹 해제 권한 없음(버튼 비활성 · 툴팁)
  - `empty`            주문 · 문의 · 배송지 · 진행 중 0건
  - `suspended`        B1 정지 계정(서준맘) — [활성으로 변경] → M4
  - `withdrawn`        C1 탈퇴 계정(도현 · 파기 표시)
  - `outdated`         배포된 옛 서버 응답 — 배포본이 보일 「준비 중」
*/

/**
 * 배포된 옛 서버(8785b87c)는 상세에 본인확인 · 상태 카드가 없고, 누적 구매액 등을 더미 값으로,
 * 생년월일을 원문으로 내린다. 그 응답을 그리면 가짜 값과 열람 통제 밖의 원문이 화면에 나온다 —
 * 그래서 새 응답 모양이 아니면 상세 전체를 「준비 중」으로 막는다.
 */
export class ConsumerDetailOutdatedError extends Error {
  constructor() {
    super("소비자 상세 API가 아직 배포되지 않았습니다.");
    this.name = "ConsumerDetailOutdatedError";
  }
}

function isCurrentShape(data: unknown): data is ConsumerDetail {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  return Boolean(record.identity && record.statusCard && record.unmask);
}

/** DEV 목업이 실패를 흉내 낼 때 — 실서버 실패는 인터셉터가 토스트를 띄운다 */
async function devMockCall<T>(run: () => T): Promise<T> {
  try {
    return await mockDelay(run());
  } catch (error) {
    toast.error(error instanceof Error ? error.message : String(error));
    throw error;
  }
}

async function loadMock() {
  return import("../mocks/consumerDetailMock");
}

export const consumerDetailService = {
  /** GET /v1/admin/users/{userId} — 개발 서버에는 옛 모양으로 배포됨 */
  getDetail: async (userId: number): Promise<ConsumerDetail> => {
    if (DEV_MOCK_ENABLED) {
      // DEV 목업 — 백엔드 배포 후 삭제
      const mock = await loadMock();
      const scenario = mockScenario();
      if (scenario === "outdated") {
        await mockDelay(mock.mockOutdatedDetail(userId));
        throw new ConsumerDetailOutdatedError();
      }
      return devMockCall(() => mock.mockGetDetail(userId, scenario));
    }
    const { data } = await apiInstance.get<unknown>(`${BASE}/${userId}`);
    if (!isCurrentShape(data)) {
      throw new ConsumerDetailOutdatedError();
    }
    return data;
  },

  /** GET /v1/admin/users/reason-options — 정지(M1) · 해제(M4) · 마스킹 해제(M2) 사유 + 정지 미리보기 */
  getReasonOptions: async (): Promise<ConsumerReasonOptions> => {
    if (DEV_MOCK_ENABLED) {
      // DEV 목업 — 백엔드 배포 후 삭제
      const mock = await loadMock();
      return devMockCall(() => mock.mockReasonOptions());
    }
    const { data } = await apiInstance.get<ConsumerReasonOptions>(
      `${BASE}/reason-options`
    );
    return data;
  },

  /** POST /v1/admin/users/{userId}/privacy-unmask — 해제된 상세 전체로 답한다 */
  unmask: async (
    userId: number,
    body: ConsumerUnmaskRequest
  ): Promise<ConsumerDetail> => {
    if (DEV_MOCK_ENABLED) {
      // DEV 목업 — 백엔드 배포 후 삭제
      const mock = await loadMock();
      return devMockCall(() =>
        mock.mockUnmask(userId, mockScenario(), body.reason)
      );
    }
    const { data } = await apiInstance.post<ConsumerDetail>(
      `${BASE}/${userId}/privacy-unmask`,
      body
    );
    return data;
  },

  /** POST /v1/admin/users/{userId}/privacy-lock — 세션이 없어도 204(멱등) */
  lock: async (userId: number): Promise<void> => {
    if (DEV_MOCK_ENABLED) {
      // DEV 목업 — 백엔드 배포 후 삭제
      const mock = await loadMock();
      return devMockCall(() => mock.mockLock(userId, mockScenario()));
    }
    await apiInstance.post(`${BASE}/${userId}/privacy-lock`);
  },

  /** POST /v1/admin/users/{userId}/suspend — 갱신된 상태 카드 + 이력 최신 5건 */
  suspend: async (
    userId: number,
    body: ConsumerSuspendRequest
  ): Promise<ConsumerStatusResult> => {
    if (DEV_MOCK_ENABLED) {
      // DEV 목업 — 백엔드 배포 후 삭제
      const mock = await loadMock();
      return devMockCall(() => mock.mockSuspend(userId, mockScenario(), body));
    }
    const { data } = await apiInstance.post<ConsumerStatusResult>(
      `${BASE}/${userId}/suspend`,
      body
    );
    return data;
  },

  /** POST /v1/admin/users/{userId}/release */
  release: async (
    userId: number,
    body: ConsumerReleaseRequest
  ): Promise<ConsumerStatusResult> => {
    if (DEV_MOCK_ENABLED) {
      // DEV 목업 — 백엔드 배포 후 삭제
      const mock = await loadMock();
      return devMockCall(() =>
        mock.mockRelease(userId, mockScenario(), body.reason)
      );
    }
    const { data } = await apiInstance.post<ConsumerStatusResult>(
      `${BASE}/${userId}/release`,
      body
    );
    return data;
  },

  /** GET /v1/admin/users/{userId}/histories — 상세의 최신 5건을 넘을 때만 부른다 */
  getHistories: async (userId: number): Promise<ConsumerHistoryPage> => {
    if (DEV_MOCK_ENABLED) {
      // DEV 목업 — 백엔드 배포 후 삭제
      const mock = await loadMock();
      return devMockCall(() => mock.mockGetHistories(userId, mockScenario()));
    }
    const { data } = await apiInstance.get<ConsumerHistoryPage>(
      `${BASE}/${userId}/histories`,
      { params: { page: 1, size: 100 } }
    );
    return data;
  },

  /** GET /v1/admin/users/{userId}/memos — 상세의 최신 3건을 넘을 때만 부른다 */
  getMemos: async (userId: number): Promise<ConsumerMemoPage> => {
    if (DEV_MOCK_ENABLED) {
      // DEV 목업 — 백엔드 배포 후 삭제
      const mock = await loadMock();
      return devMockCall(() => mock.mockGetMemos(userId, mockScenario()));
    }
    const { data } = await apiInstance.get<ConsumerMemoPage>(
      `${BASE}/${userId}/memos`,
      { params: { page: 1, size: 100 } }
    );
    return data;
  },

  /** POST /v1/admin/users/{userId}/memos — 누적 기입 */
  createMemo: async (
    userId: number,
    body: ConsumerMemoRequest
  ): Promise<ConsumerMemo> => {
    if (DEV_MOCK_ENABLED) {
      // DEV 목업 — 백엔드 배포 후 삭제
      const mock = await loadMock();
      return devMockCall(() =>
        mock.mockCreateMemo(userId, mockScenario(), body.content)
      );
    }
    const { data } = await apiInstance.post<ConsumerMemo>(
      `${BASE}/${userId}/memos`,
      body
    );
    return data;
  },

  /** PATCH /v1/admin/users/{userId}/memos/{memoId} — 작성자 본인 · 24시간 내 */
  updateMemo: async (
    userId: number,
    memoId: number,
    body: ConsumerMemoRequest
  ): Promise<ConsumerMemo> => {
    if (DEV_MOCK_ENABLED) {
      // DEV 목업 — 백엔드 배포 후 삭제
      const mock = await loadMock();
      return devMockCall(() =>
        mock.mockUpdateMemo(userId, mockScenario(), memoId, body.content)
      );
    }
    const { data } = await apiInstance.patch<ConsumerMemo>(
      `${BASE}/${userId}/memos/${memoId}`,
      body
    );
    return data;
  },

  /** DELETE /v1/admin/users/{userId}/memos/{memoId} — 작성자 본인 · 24시간 내 */
  deleteMemo: async (userId: number, memoId: number): Promise<void> => {
    if (DEV_MOCK_ENABLED) {
      // DEV 목업 — 백엔드 배포 후 삭제
      const mock = await loadMock();
      return devMockCall(() =>
        mock.mockDeleteMemo(userId, mockScenario(), memoId)
      );
    }
    await apiInstance.delete(`${BASE}/${userId}/memos/${memoId}`);
  },

  /**
   * 【서버 없음】 약관 동의 내역 — 약관 버전 테이블이 법률 자문 뒤로 보류됐다(55 계획서 4-3-4 · D16).
   * DEV에서만 목업, 배포본은 「준비 중」. 서버 API가 생기면 이 본문만 바꾼다.
   */
  getTermsAgreements: async (
    // 서버 API가 생기면 경로에 쓴다
    userId: number
  ): Promise<Array<ConsumerTermsAgreement>> => {
    if (DEV_MOCK_ENABLED) {
      const mock = await loadMock();
      return devMockCall(() => mock.mockTermsAgreements(mockScenario()));
    }
    throw new ApiNotReadyError(`소비자 약관 동의 내역(${userId})`);
  },
};
