/*
  브랜드 · 인플루언서 회원 관리가 함께 쓰는 서버 모양 — 백엔드 `api.admin.common`
  (`AdminMemberListTab` · `AdminMemberListSummary` · `AdminReasonOption` · `AdminSuspensionTermPreview`)과
  `MemberAccountStatusResponse.Term`(1021 기-02)을 그대로 옮겼다. 필드명 = 서버 필드명.
*/

/** 목록 탭 5종 — 건수가 서로 겹치지 않는다(탈퇴 승인 대기 행은 활성 · 정지 탭에서 빠진다) */
export type MemberListTab =
  "ALL" | "ACTIVE" | "SUSPENDED" | "WITHDRAWAL_PENDING" | "WITHDRAWN";

/** 정렬 — 화면에 정렬 선택이 없어 기본(가입 최신순)만 쓴다 */
export type MemberListSort = "RECENT_JOINED" | "MEMBER_NO";

/** 서버 배지 톤 — 상태 · 이력 점 색이 이 값 하나를 읽는다 */
export type MemberTone = "SUCCESS" | "INFO" | "WARNING" | "DANGER" | "NEUTRAL";

/** 목록 표시 상태 — 회원 상태에 탈퇴 승인 대기를 얹은 값 */
export type MemberListStatus =
  "ACTIVE" | "SUSPENDED" | "WITHDRAWAL_PENDING" | "WITHDRAWN";

/** 탭 건수 · 툴바 수치 — 모두 검색어 범위로 센다 */
export interface MemberListSummary {
  total: number;
  active: number;
  suspended: number;
  withdrawalPending: number;
  withdrawn: number;
  /** 탈퇴 승인 대기 탭에서만 — 「최장 대기 N일」. 다른 탭 · 대기 0건이면 null */
  longestPendingDays: number | null;
}

/** 목록 요청 — `useParams`가 주소창과 맞춰 둔다 */
export interface MemberListParams {
  tab: MemberListTab;
  keyword: string;
  page: number;
  size: number;
}

/** 모달 셀렉트 사유 한 줄 — enum 단일 소스라 FE가 목록을 하드코딩하지 않는다 */
export interface AdminReasonOption {
  code: string;
  label: string;
  /** 기타(직접 입력)면 상세 · 안내 필수 */
  detailRequired: boolean;
  /** 정지 사유만 — 그 회원 몫 지급 정지 여부 */
  holdsPayout: boolean | null;
}

/**
 * 정지 모달(M1) 미리보기 — 「이의 신청 기한 · 통지 후 N영업일 이상 · YYYY.MM.DD까지」 · 「소명 검토 · 접수 후 N영업일」.
 * `appealDeadlineAt`은 KST 벽시계(영업일 기한 23:59:59)다.
 */
export interface SuspensionTermPreview {
  appealBusinessDays: number;
  appealDeadlineAt: string;
  /** [정책값 미정]이면 null */
  appealReviewBusinessDays: number | null;
}

/**
 * 정지 기간 · 자동 해제 · 이의 신청 기한(1021 기-02 【잠정】). 날짜는 전부 KST 벽시계다 —
 * `endsOn`은 운영자가 고른 날짜, `autoReleaseAt`은 그다음 날 00:00, `appealDeadlineAt`은 영업일 기한 23:59:59.
 */
export interface SanctionTerm {
  /** 정지 종료일(포함) — 기간 없는 정지면 null */
  endsOn: string | null;
  autoReleaseAt: string | null;
  /** 시작일 · 종료일 포함 일수 */
  periodDays: number | null;
  appealDeadlineAt: string | null;
  appealReviewBusinessDays: number | null;
}

/** 관리자 메모 — 누적 기입 · 300자 · 작성자 본인 24시간 내 수정 · 삭제 */
export interface MemberMemo {
  memoId: number;
  authorName: string;
  content: string;
  createdAt: string;
  /** 값이 있으면 「수정됨」 */
  modifiedAt: string | null;
  editable: boolean;
}

/** 레일 · 전체 이력 모달이 그리는 한 줄 — 브랜드 · 인플루언서 이력을 이 모양으로 맞춘다 */
export interface MemberHistoryEntry {
  key: string;
  label: string;
  tone: string;
  /** 「김운영」 · 「브랜드 본인」 · 「인플루언서 본인」 */
  actorText: string | null;
  detail: string | null;
  occurredAt: string | null;
}

/** 정지 요청 — 세 회원 유형이 같은 모양(`SuspendRequest`) */
export interface MemberSuspendPayload {
  reason: string;
  reasonDetail?: string;
  /** 정지 종료일(포함 · 오늘 이상) — 다음 날 00:00 자동 해제 */
  endsOn: string;
}

/** 정지 해제 요청 — 사유를 비우면 서버가 RESOLVED로 본다 */
export interface MemberReleasePayload {
  reason?: string;
  note?: string;
}

/** 탈퇴 반려 요청 — 기타면 note 필수 */
export interface MemberWithdrawalRejectPayload {
  reason: string;
  note?: string;
}
