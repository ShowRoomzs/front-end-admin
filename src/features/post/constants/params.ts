import type {
  AdminPostListParams,
  AdminPostSummary,
  PostMonitoringSort,
  PostMonitoringTab,
} from "@/features/post/types";

export const POST_LIST_PATH = "/monitoring/posts";

/**
 * 작성자 · 신고자 링크 — 인플루언서 상세(18)와 소비자 상세(13)는 다른 작업에서 만든다.
 * 라우트가 확정되면 이 두 줄만 고친다. 인플루언서는 `author.showroomId`(= creatorId)로 연다.
 */
export const influencerDetailPath = (creatorId: number) =>
  `/showroom/list/${creatorId}`;
export const consumerDetailPath = (userId: number) => `/member/list/${userId}`;

/** 시안 C1 `.tabs` — 「이의 신청」 탭이 UNDER_REVIEW, 「종결」 탭이 CLOSED(영구 삭제)다 */
export const POST_TABS: Array<{
  value: PostMonitoringTab;
  label: string;
  countKey: keyof AdminPostSummary;
}> = [
  { value: "ALL", label: "전체", countKey: "all" },
  { value: "REPORTED", label: "신고 접수", countKey: "reported" },
  { value: "SUSPENDED", label: "노출 중지", countKey: "suspended" },
  { value: "UNDER_REVIEW", label: "이의 신청", countKey: "underReview" },
  { value: "CLOSED", label: "종결", countKey: "closed" },
];

export const POST_SORT_OPTIONS: Array<{
  value: PostMonitoringSort;
  label: string;
}> = [
  { value: "ACTION_FIRST", label: "조치 필요 우선" },
  { value: "LATEST", label: "최신 등록순" },
  { value: "MOST_REPORTED", label: "신고 많은 순" },
];

export const POST_PAGE_SIZES = [20, 50];

export const POST_INITIAL_PARAMS: AdminPostListParams = {
  tab: "ALL",
  sort: "ACTION_FIRST",
  keyword: "",
  showroomId: "",
  page: 1,
  size: 20,
};

/** 원문 사진 격자 — 고정 5열 · 2줄까지 펼치고 10번째 칸을 「+N장 더 보기」로 쓴다(rev.3 20장 처리) */
export const PHOTO_COLUMNS = 5;
export const PHOTO_FOLD_LIMIT = 10;

/** 시안 `.sel-sm` 갈매기표 */
export const SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235B5F68' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 9px center",
};

/** 시안 `.msel` — 모달 셀렉트는 갈매기표가 1px 안쪽이다 */
export const MODAL_SELECT_CHEVRON_STYLE = {
  ...SELECT_CHEVRON_STYLE,
  backgroundPosition: "right 10px center",
};
