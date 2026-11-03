import { apiInstance } from "@/common/lib/apiInstance";
import type { PageResponse } from "@/common/types/page";
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams";
import type {
  ActionNoteBody,
  AdminPostActionResponse,
  AdminPostDetail,
  AdminPostListItem,
  AdminPostListParams,
  AdminPostSummary,
  AppealReviewBody,
  PolicyClauseItem,
  PostDetailNavParams,
  SuspendPostBody,
  SuspensionReasonItem,
} from "@/features/post/types";

/*
  어드민 일반 게시물 모니터링 API — 백엔드 origin/main `AdminPostController`와 1:1.
  요약 · 근거 규정 · 신고 종결 · 중지 취소 · 사진 신고 표시까지 개발 서버에 배포돼 DEV에서도 실호출만 한다
  (58 반영 · `?mock=` 목업 어댑터 삭제).
*/

const BASE = "/admin/posts";

export const adminPostService = {
  getList: async (params: AdminPostListParams) => {
    const { data } = await apiInstance.get<PageResponse<AdminPostListItem>>(
      BASE,
      { params: paramsToSearchParams(params) }
    );
    return data;
  },

  /** 탭 건수 · GNB 배지(조치 필요 = 신고 접수 + 이의 신청 심사 중) */
  getSummary: async () => {
    const { data } = await apiInstance.get<AdminPostSummary>(`${BASE}/summary`);
    return data;
  },

  /** 목록 조건을 함께 넘긴다 — 서버가 그 목록 순서로 이전 · 다음을 센다 */
  getDetail: async (postId: number, nav: PostDetailNavParams) => {
    const { data } = await apiInstance.get<AdminPostDetail>(
      `${BASE}/${postId}`,
      // 없는 게시물 · 파기됨(404)은 화면이 직접 안내한다
      { params: paramsToSearchParams(nav), suppressErrorToast: true }
    );
    return data;
  },

  getSuspensionReasons: async () => {
    const { data } = await apiInstance.get<Array<SuspensionReasonItem>>(
      `${BASE}/suspension-reasons`
    );
    return data;
  },

  getPolicyClauses: async () => {
    const { data } = await apiInstance.get<Array<PolicyClauseItem>>(
      `${BASE}/policy-clauses`
    );
    return data;
  },

  /** C4 노출 중지 — 대기 신고가 전부 함께 닫히고(조치로 이어짐) 이의 신청 기간이 시작된다 */
  suspend: async (postId: number, body: SuspendPostBody) => {
    const { data } = await apiInstance.post<AdminPostActionResponse>(
      `${BASE}/${postId}/suspend`,
      body
    );
    return data;
  },

  /** C3 신고 종결 — 대기 신고 전부를 반려로 닫는다. 작성자 · 신고자 누구에게도 알리지 않는다 */
  closeReports: async (postId: number, body: ActionNoteBody) => {
    const { data } = await apiInstance.post<AdminPostActionResponse>(
      `${BASE}/${postId}/reports/close`,
      body
    );
    return data;
  },

  /** C5 조치 취소 · 재게시 — 이의 신청 전에만. 메모는 작성자 알림에 실린다 */
  cancelSuspension: async (postId: number, body: ActionNoteBody) => {
    const { data } = await apiInstance.post<AdminPostActionResponse>(
      `${BASE}/${postId}/suspension/cancel`,
      body
    );
    return data;
  },

  /** C3 · C11 사진 「신고 지목」 켜기 / 끄기 — 읽기 보조 표식(사진 단위 조치 아님) · 이력 없음 */
  setImageFlag: async (postId: number, imageId: number, flagged: boolean) => {
    const url = `${BASE}/${postId}/images/${imageId}/report-flag`;
    if (flagged) {
      await apiInstance.put(url);
    } else {
      await apiInstance.delete(url);
    }
  },

  /** C6 승인 · 재게시 — 좋아요 · 인사이트를 유지한 채 다시 노출된다 */
  approveAppeal: async (appealId: number, body: AppealReviewBody) => {
    const { data } = await apiInstance.post<AdminPostActionResponse>(
      `/admin/post-appeals/${appealId}/approve`,
      body
    );
    return data;
  },

  /** C7 반려 → 영구 삭제 — 반려 사유 필수 */
  rejectAppeal: async (appealId: number, body: Required<AppealReviewBody>) => {
    const { data } = await apiInstance.post<AdminPostActionResponse>(
      `/admin/post-appeals/${appealId}/reject`,
      body
    );
    return data;
  },
};
