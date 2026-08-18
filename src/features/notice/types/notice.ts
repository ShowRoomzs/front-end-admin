import type { BaseParams, PageInfo } from "@/common/types";

/**
 * 상태 2종 (§20-1) — **삭제가 없다.** 내릴 때는 게시 종료로 처리한다.
 *
 * 공지는 "그때 무엇을 알렸는가"가 기록으로 남아야 한다. 정책 변경·점검 안내는
 * 나중에 분쟁 시 근거가 되므로, FAQ처럼 지우는 액션을 만들지 말 것.
 * 임시저장(초안)도 폐지됐다 — 등록은 곧 게시다.
 */
export type NoticeStatus = "PUBLISHED" | "ENDED";

export type NoticeStatusFilter = "ALL" | NoticeStatus;

export interface NoticeListItem {
  noticeId: number;
  /** 등록 순 채번 — 삭제가 없어 번호가 비지 않는다 */
  number: number;
  title: string;
  /** 중요는 상태가 아니라 **분류**다 — 제목 앞 중립·점 없는 배지로 그린다 */
  pinned: boolean;
  status: NoticeStatus;
  statusName: string;
  createdAt: string;
  modifiedAt: string;
}

/** 서버 `AdminNoticeStatusCount` — 탭 코드·표시명·건수 3종을 담은 배열의 한 칸 */
export interface NoticeStatusCountItem {
  status: NoticeStatusFilter;
  displayName: string;
  count: number;
}

/** 서버에서 막 받은 목록 응답 — 건수를 배열로 준다 */
export interface RawNoticeListResponse {
  content: Array<NoticeListItem>;
  pageInfo: PageInfo;
  statusCounts?: Array<NoticeStatusCountItem>;
  pinnedCount: number;
}

/** 탭 코드 → 건수. 서비스 계층에서 배열을 맵으로 바꿔 넘긴 값이다 */
export type NoticeStatusCounts = Partial<Record<NoticeStatusFilter, number>>;

export interface NoticeListResponse {
  content: Array<NoticeListItem>;
  pageInfo: PageInfo;
  statusCounts: NoticeStatusCounts;
  /** 툴바의 `중요 N건` — 현재 탭·검색어 기준 */
  pinnedCount: number;
}

export interface NoticeListParams extends BaseParams {
  status: NoticeStatusFilter;
  keyword: string;
}

export interface NoticeDetail {
  noticeId: number;
  title: string;
  /** 리치 에디터 HTML — 소비자 앱 공지사항에 그대로 실린다 */
  content: string;
  status: NoticeStatus;
  statusName: string;
  pinned: boolean;
  createdAt: string;
  modifiedAt: string;
  /** 게시 종료 상태에서만 값이 있다 */
  endedAt: string | null;
  authorName: string;
}

/**
 * 등록·수정 요청 — 등록과 수정이 같은 모양이다.
 *
 * **상태 필드가 없는 것이 사양이다.** 저장은 상태를 건드리지 않는다(§20-2) —
 * 게시 종료 상태에서 저장해도 재게시되지 않으며, 재게시는 목록의 `게시` 버튼에서만
 * 일어난다. 여기에 status를 추가하면 "저장이 곧 게시"가 되어 의도치 않은 노출이 생긴다.
 */
export interface NoticeFormRequest {
  title: string;
  content: string;
  pinned: boolean;
}
