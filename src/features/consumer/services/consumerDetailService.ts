import { apiInstance } from "@/common/lib/apiInstance";
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
  ConsumerTermsAgreementList,
  ConsumerUnmaskRequest,
} from "@/features/consumer/types/consumerDetail";

const BASE = "/admin/users";

/*
  13 소비자 상세 — 백엔드 origin/main `UserAdminController`와 1:1.
  전부 개발 서버에 배포돼 DEV에서도 실호출만 한다(58 반영 · DEV 목업 어댑터 · 옛 응답 가드 삭제).
  약관 동의 내역도 이제 서버가 준다(`GET /{userId}/consents` · 58 5-29).
*/

export const consumerDetailService = {
  /** GET /v1/admin/users/{userId} */
  getDetail: async (userId: number) => {
    const { data } = await apiInstance.get<ConsumerDetail>(`${BASE}/${userId}`);
    return data;
  },

  /** GET /v1/admin/users/reason-options — 정지(M1) · 해제(M4) · 마스킹 해제(M2) 사유 + 정지 미리보기 */
  getReasonOptions: async (): Promise<ConsumerReasonOptions> => {
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
    const { data } = await apiInstance.post<ConsumerDetail>(
      `${BASE}/${userId}/privacy-unmask`,
      body
    );
    return data;
  },

  /** POST /v1/admin/users/{userId}/privacy-lock — 세션이 없어도 204(멱등) */
  lock: async (userId: number): Promise<void> => {
    await apiInstance.post(`${BASE}/${userId}/privacy-lock`);
  },

  /** POST /v1/admin/users/{userId}/suspend — 갱신된 상태 카드 + 이력 최신 5건 */
  suspend: async (
    userId: number,
    body: ConsumerSuspendRequest
  ): Promise<ConsumerStatusResult> => {
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
    const { data } = await apiInstance.post<ConsumerStatusResult>(
      `${BASE}/${userId}/release`,
      body
    );
    return data;
  },

  /** GET /v1/admin/users/{userId}/histories — 상세의 최신 5건을 넘을 때만 부른다 */
  getHistories: async (userId: number): Promise<ConsumerHistoryPage> => {
    const { data } = await apiInstance.get<ConsumerHistoryPage>(
      `${BASE}/${userId}/histories`,
      { params: { page: 1, size: 100 } }
    );
    return data;
  },

  /** GET /v1/admin/users/{userId}/memos — 상세의 최신 3건을 넘을 때만 부른다 */
  getMemos: async (userId: number): Promise<ConsumerMemoPage> => {
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
    const { data } = await apiInstance.patch<ConsumerMemo>(
      `${BASE}/${userId}/memos/${memoId}`,
      body
    );
    return data;
  },

  /** DELETE /v1/admin/users/{userId}/memos/{memoId} — 작성자 본인 · 24시간 내 */
  deleteMemo: async (userId: number, memoId: number): Promise<void> => {
    await apiInstance.delete(`${BASE}/${userId}/memos/${memoId}`);
  },

  /** GET /v1/admin/users/{userId}/consents — 약관 동의 3행(이용 약관 · 개인정보 · 마케팅) */
  getTermsAgreements: async (userId: number) => {
    const { data } = await apiInstance.get<ConsumerTermsAgreementList>(
      `${BASE}/${userId}/consents`
    );
    return data.content;
  },
};
