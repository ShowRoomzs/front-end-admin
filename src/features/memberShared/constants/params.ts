import type {
  MemberListParams,
  MemberListTab,
} from "@/features/memberShared/types";

/**
 * 탭 5종 · 기본 진입 전체(시안 14 · 16 rev.7). 기-01 【잠정】 — 탭과 목록 배지는 칸이 좁아 「정지」로 두고,
 * 모달 · 버튼 · 안내에서는 정식 명칭 「계정 이용 정지」를 쓴다.
 */
export const MEMBER_TABS: Array<{
  value: MemberListTab;
  label: string;
  summaryKey:
    "total" | "active" | "suspended" | "withdrawalPending" | "withdrawn";
}> = [
  { value: "ALL", label: "전체", summaryKey: "total" },
  { value: "ACTIVE", label: "활성", summaryKey: "active" },
  { value: "SUSPENDED", label: "정지", summaryKey: "suspended" },
  {
    value: "WITHDRAWAL_PENDING",
    label: "탈퇴 승인 대기",
    summaryKey: "withdrawalPending",
  },
  { value: "WITHDRAWN", label: "탈퇴", summaryKey: "withdrawn" },
];

export const MEMBER_PAGE_SIZES = [20, 50, 100] as const;

export const MEMBER_LIST_INITIAL_PARAMS: MemberListParams = {
  tab: "ALL",
  keyword: "",
  page: 1,
  size: 20,
};

/** 메모 한 건 최대 글자 수(서버 `MemoRequest` @Size(max = 300)) */
export const MEMO_MAX_LENGTH = 300;

/** 정지 상세 사유 · 해제 메모 · 반려 안내 최대 글자 수(서버 @Size(max = 500)) */
export const REASON_DETAIL_MAX_LENGTH = 500;

/** 운영팀 소통 스레드 — 소명 경로(20a) */
export const THREAD_PATH = "/monitoring/threads";

/** 레일 처리 이력 · 전체 이력 모달 한 페이지 */
export const HISTORY_PAGE_SIZE = 20;
