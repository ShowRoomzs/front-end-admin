import { apiInstance } from "@/common/lib/apiInstance";
import type { PageResponse } from "@/common/types/page";
import { DEV_MOCK_ENABLED, mockScenario } from "@/common/utils/devMock";
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
  어드민 일반 게시물 모니터링 API — 백엔드 origin/main `AdminPostController`와 1:1(feat/add 병합 · 39ecd9e8 · d79be177 · 2f53ff60).

  개발 서버(api.showroomz.shop · 10-21 배포본)는 아직 옛 버전이다:
  - 없음: `GET /posts/summary` · `GET /posts/policy-clauses` · `POST /posts/{id}/reports/close` ·
    `POST /posts/{id}/suspension/cancel` · `PUT·DELETE /posts/{id}/images/{imageId}/report-flag`
  - 모양이 다름: `GET /posts`(옛 AdminPostListItem · tab/sort 없음) · `GET /posts/{id}`(옛 imageUrls · reports/timeline/policy 없음) ·
    `GET /posts/suspension-reasons`(옛 사유 코드 8종 · operatorOnly 없음) · `POST /posts/{id}/suspend`(옛 policyRef 문자열 · policyClause 없음)
  배포본은 항상 실호출이다(백엔드 배포 순서는 메인이 관리한다). 로컬에서 시안 state를 보려면 `?mock=`를 붙인다 — 백엔드 배포 후 삭제.

  ?mock= 시나리오(목록 · 상세 공통 · 목록에서 행을 누르면 같은 값을 들고 상세로 간다)
  - c1  : C1 목록 6행(전체 6 · 신고 접수 2 · 노출 중지 1 · 이의 신청 1 · 종결 1 · 조치 필요 3)
  - c9  : C9 신고 접수 탭 빈 상태(신고 2건이 종결된 날 · 조치 필요 1 = 이의 신청만)
  - c2  : C2 게시중(388)            - c3 · c4 · c11 : C3 신고 접수 · 사진 14장 · 3번 신고 지목(342) — [노출 중지] → C4, 썸네일 → C11
  - c5  : C5 노출 중지 · 기한 D-5(271) - c6 · c7 : C6 이의 신청 심사 중(288) — [반려] → C7
  - c8  : C8 영구 삭제 · 반려(198)   - c10 : C10 작성자 삭제(199)
  상세 시나리오 값은 주소의 id가 목업에 없을 때 그 게시물을 연다(예: /monitoring/posts/1?mock=c6).
  시나리오 중 쓰기는 서버로 보내지 않고 목업 저장소만 바꾼다(새로고침하면 초기화).
*/

const BASE = "/admin/posts";

/** 목업 시나리오(개발 서버 전용) — 배포본에서는 mockScenario()가 항상 null이라 분기와 목업 모듈이 번들에서 빠진다 */
async function mockModule() {
  const scenario = mockScenario();
  if (!DEV_MOCK_ENABLED || scenario === null) {
    return null;
  }
  const mock = await import("../mocks/postMock");
  return { mock, scenario };
}

export const adminPostService = {
  getList: async (params: AdminPostListParams) => {
    const mocked = await mockModule();
    if (mocked) {
      return mocked.mock.mockList(mocked.scenario, params);
    }
    const { data } = await apiInstance.get<PageResponse<AdminPostListItem>>(
      BASE,
      { params: paramsToSearchParams(params) }
    );
    return data;
  },

  /** 탭 건수 · GNB 배지(조치 필요 = 신고 접수 + 이의 신청 심사 중) */
  getSummary: async () => {
    const mocked = await mockModule();
    if (mocked) {
      return mocked.mock.mockSummary(mocked.scenario);
    }
    const { data } = await apiInstance.get<AdminPostSummary>(`${BASE}/summary`);
    return data;
  },

  /** 목록 조건을 함께 넘긴다 — 서버가 그 목록 순서로 이전 · 다음을 센다 */
  getDetail: async (postId: number, nav: PostDetailNavParams) => {
    const mocked = await mockModule();
    if (mocked) {
      return mocked.mock.mockDetail(mocked.scenario, postId, nav);
    }
    const { data } = await apiInstance.get<AdminPostDetail>(
      `${BASE}/${postId}`,
      // 없는 게시물 · 파기됨(404)은 화면이 직접 안내한다
      { params: paramsToSearchParams(nav), suppressErrorToast: true }
    );
    return data;
  },

  getSuspensionReasons: async () => {
    const mocked = await mockModule();
    if (mocked) {
      return mocked.mock.MOCK_SUSPENSION_REASONS;
    }
    const { data } = await apiInstance.get<Array<SuspensionReasonItem>>(
      `${BASE}/suspension-reasons`
    );
    return data;
  },

  getPolicyClauses: async () => {
    const mocked = await mockModule();
    if (mocked) {
      return mocked.mock.MOCK_POLICY_CLAUSES;
    }
    const { data } = await apiInstance.get<Array<PolicyClauseItem>>(
      `${BASE}/policy-clauses`
    );
    return data;
  },

  /** C4 노출 중지 — 대기 신고가 전부 함께 닫히고(조치로 이어짐) 이의 신청 기간이 시작된다 */
  suspend: async (postId: number, body: SuspendPostBody) => {
    const mocked = await mockModule();
    if (mocked) {
      return mocked.mock.mockSuspend(mocked.scenario, postId, body);
    }
    const { data } = await apiInstance.post<AdminPostActionResponse>(
      `${BASE}/${postId}/suspend`,
      body
    );
    return data;
  },

  /** C3 신고 종결 — 대기 신고 전부를 반려로 닫는다. 작성자 · 신고자 누구에게도 알리지 않는다 */
  closeReports: async (postId: number, body: ActionNoteBody) => {
    const mocked = await mockModule();
    if (mocked) {
      return mocked.mock.mockCloseReports(mocked.scenario, postId);
    }
    const { data } = await apiInstance.post<AdminPostActionResponse>(
      `${BASE}/${postId}/reports/close`,
      body
    );
    return data;
  },

  /** C5 조치 취소 · 재게시 — 이의 신청 전에만. 메모는 작성자 알림에 실린다 */
  cancelSuspension: async (postId: number, body: ActionNoteBody) => {
    const mocked = await mockModule();
    if (mocked) {
      return mocked.mock.mockCancelSuspension(mocked.scenario, postId);
    }
    const { data } = await apiInstance.post<AdminPostActionResponse>(
      `${BASE}/${postId}/suspension/cancel`,
      body
    );
    return data;
  },

  /** C3 · C11 사진 「신고 지목」 켜기 / 끄기 — 읽기 보조 표식(사진 단위 조치 아님) · 이력 없음 */
  setImageFlag: async (postId: number, imageId: number, flagged: boolean) => {
    const mocked = await mockModule();
    if (mocked) {
      return mocked.mock.mockFlagImage(
        mocked.scenario,
        postId,
        imageId,
        flagged
      );
    }
    const url = `${BASE}/${postId}/images/${imageId}/report-flag`;
    if (flagged) {
      await apiInstance.put(url);
    } else {
      await apiInstance.delete(url);
    }
  },

  /** C6 승인 · 재게시 — 좋아요 · 인사이트를 유지한 채 다시 노출된다 */
  approveAppeal: async (appealId: number, body: AppealReviewBody) => {
    const mocked = await mockModule();
    if (mocked) {
      return mocked.mock.mockApproveAppeal(
        mocked.scenario,
        appealId,
        body.comment
      );
    }
    const { data } = await apiInstance.post<AdminPostActionResponse>(
      `/admin/post-appeals/${appealId}/approve`,
      body
    );
    return data;
  },

  /** C7 반려 → 영구 삭제 — 반려 사유 필수 */
  rejectAppeal: async (appealId: number, body: Required<AppealReviewBody>) => {
    const mocked = await mockModule();
    if (mocked) {
      return mocked.mock.mockRejectAppeal(
        mocked.scenario,
        appealId,
        body.comment
      );
    }
    const { data } = await apiInstance.post<AdminPostActionResponse>(
      `/admin/post-appeals/${appealId}/reject`,
      body
    );
    return data;
  },
};
