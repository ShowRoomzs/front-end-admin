import type { BaseParams } from "@/common/types/page";

/*
  어드민 일반 게시물 모니터링 — 백엔드 origin/main `AdminPostController` DTO 그대로
  (`AdminPostMonitoringDto` · `AdminPostDto` · domain/post/type enum).

  날짜 필드는 전부 서버 `now()`로 찍은 이벤트 시각이거나 그 시각에서 더한 기한이다
  (게시 · 수정 · 신고 · 조치 · 이의 신청 · 삭제 · 기한 = 조치 + N일 · 접수 + N영업일 · 삭제 + N개월).
  UTC 벽시계라 표시는 `parseServerDateTime`을 거친다.
*/

/** 어드민 모니터링 상태 — 저장하지 않는 파생값(`PostMonitoringStatus`) */
export type PostMonitoringStatus =
  "PUBLISHED" | "REPORTED" | "SUSPENDED" | "UNDER_REVIEW" | "CLOSED" | "DRAFT";

/** 저장 상태(`PostStatus`) */
export type PostStatus =
  "DRAFT" | "PUBLISHED" | "SUSPENDED" | "UNDER_REVIEW" | "DELETED";

export type PostMonitoringTab =
  "ALL" | "REPORTED" | "SUSPENDED" | "UNDER_REVIEW" | "CLOSED";

export type PostMonitoringSort = "ACTION_FIRST" | "LATEST" | "MOST_REPORTED";

/** 삭제 경로(`PostDeleteReason`) */
export type PostDeleteReason =
  "SELF" | "APPEAL_REJECTED" | "APPEAL_EXPIRED" | "ADMIN";

/**
 * 노출 중지 사유(`PostSuspensionReason`) — V192 재매핑 후 7종(소비자 신고 6종 + 운영자 전용 1종).
 * 10-21 배포 서버는 옛 코드 8종(MEDICAL_CLAIM · AD_DISCLOSURE · …)을 내릴 수 있어 string도 받는다 —
 * 표시는 서버 `reasonLabel`을 쓰고, 없을 때만 `constants/labels.ts`의 표로 덮는다.
 */
export type PostSuspensionReason =
  | "MISLEADING_INFO"
  | "FRAUD_IMPERSONATION"
  | "ABUSE_HATE"
  | "SEXUAL_CONTENT"
  | "SPAM"
  | "PERSONAL_INFO"
  | "OTHER";

/** 소비자 신고 사유(`PostReportReason`) — 중지 사유의 부분집합 */
export type PostReportReason = Exclude<PostSuspensionReason, "PERSONAL_INFO">;

/** 근거 규정 조항(`PostPolicyClause`) — 서비스 운영정책 커뮤니티 장 · 번호와 문구는 가정값 */
export type PostPolicyClause =
  "ARTICLE_3_2" | "ARTICLE_3_4" | "ARTICLE_4_1" | "ARTICLE_4_3" | "ARTICLE_5";

export type PostReportStatus = "PENDING" | "ACCEPTED" | "DISMISSED";

export type PostAppealStatus = "PENDING" | "APPROVED" | "REJECTED";

export type SuspensionResolution =
  | "REPUBLISHED"
  | "DELETED_BY_REJECT"
  | "DELETED_BY_EXPIRE"
  | "DELETED_BY_SELF"
  | "CANCELED_BY_ADMIN";

export type TimelineType =
  | "PUBLISHED"
  | "EDITED"
  | "REPORTED"
  | "REPORTS_CLOSED"
  | "SUSPENDED"
  | "SUSPENSION_CANCELED"
  | "NOTIFIED"
  | "APPEAL_SUBMITTED"
  | "APPEAL_APPROVED"
  | "APPEAL_REJECTED"
  | "ORIGINAL_DOWNLOADED"
  | "DELETED";

export type TimelineActor = "ADMIN" | "CREATOR" | "USER" | "SYSTEM";

export type TimelineTone =
  "INFO" | "SUCCESS" | "WARNING" | "DANGER" | "NEUTRAL";

// ------------------------------------------------------------------ 목록 · 요약

export interface AdminPostListParams extends BaseParams {
  tab: PostMonitoringTab;
  sort: PostMonitoringSort;
  keyword: string;
  /** 인플루언서 상세 「일반 게시물 N건」 딥링크 — 비어 있으면 보내지 않는다 */
  showroomId?: string;
}

/** `AdminPostMonitoringDto.ListItem` */
export interface AdminPostListItem {
  postId: number;
  postNo: string;
  monitoringStatus: PostMonitoringStatus;
  monitoringStatusLabel: string;
  status: PostStatus;
  showroomId: number | null;
  showroomName: string | null;
  thumbnailUrl: string | null;
  contentPreview: string | null;
  imageCount: number | null;
  publishedAt: string | null;
  /** 게시 후 수정이 없으면 null(시안 「—」) */
  editedAt: string | null;
  editedAfterFirstReport: boolean;
  /** 「신고」 열 — 대기 + 조치로 이어진 신고(신고 종결로 닫힌 신고는 빠진다) */
  reportCount: number;
  pendingReportCount: number;
  /** 노출 중지 — 이의 신청 기한 */
  appealDeadline: string | null;
  /** 이의 신청 심사 중 — 심사 기한 */
  reviewDueAt: string | null;
  deletedAt: string | null;
  deleteReason: PostDeleteReason | null;
  /** 영구 삭제 — 파기 예정 */
  purgeAt: string | null;
}

/** `AdminPostMonitoringDto.SummaryResponse` — 탭 건수 · GNB 배지 */
export interface AdminPostSummary {
  all: number;
  reported: number;
  suspended: number;
  underReview: number;
  closed: number;
  /** 신고 접수 + 이의 신청 심사 중 — GNB 배지 */
  actionRequired: number;
}

// ------------------------------------------------------------------ 상세

/** 상세를 연 목록 조건 — 서버가 이 순서로 이전 · 다음을 센다 */
export interface PostDetailNavParams {
  tab?: string;
  sort?: string;
  keyword?: string;
  showroomId?: string;
}

export interface AdminPostAuthor {
  showroomId: number | null;
  showroomName: string | null;
  userId: number | null;
  profileImageUrl: string | null;
  /** 앱 내 팔로우 수 — 인스타 팔로워 아님 */
  followerCount: number;
  /** 노출 중지 횟수 — 운영자가 거둔 조치는 뺀다 */
  suspensionCount: number;
  /** 제재로 끝난 삭제 횟수 — 이의 반려 + 기한 경과 · 본인 삭제 제외 */
  sanctionDeleteCount: number;
}

export interface AdminPostImage {
  imageId: number;
  sortOrder: number;
  /** 표시용(크롭본) */
  imageUrl: string | null;
  /** 원본 — 뷰어는 게시 비율 그대로 */
  originalUrl: string | null;
  fileName: string | null;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  uploadedAt: string | null;
  reportFlagged: boolean;
  reportFlaggedAt: string | null;
  reportFlaggedByName: string | null;
}

export interface AdminPostMetrics {
  impressions: number;
  likes: number;
  /** 좋아요율(%) — 노출 0이면 null */
  likeRate: number | null;
  showroomVisits: number;
  follows: number;
  /** 집계 상한 — 노출 중지면 조치 시각, 삭제면 삭제 시각, 게시중이면 null */
  frozenAt: string | null;
}

export interface AdminPostReasonCount {
  reasonCode: PostReportReason | string;
  reasonLabel: string;
  count: number;
}

export interface AdminPostReport {
  reportId: number;
  reasonCode: PostReportReason | string;
  reasonLabel: string | null;
  reasonDetail: string | null;
  status: PostReportStatus;
  reportedAt: string | null;
  reporterUserId: number | null;
  /** 신고자 마스킹 이름(한*준) */
  reporterMaskedName: string | null;
  handledAt: string | null;
  handledByName: string | null;
}

export interface AdminPostReports {
  pendingCount: number;
  totalCount: number;
  /** 레일 「최초 신고」 — 대기 신고 기준 */
  firstPendingAt: string | null;
  /** 대기 신고 기준, 대기가 없으면 전체 기준 */
  countsByReason: Array<AdminPostReasonCount>;
  /** 전부 · 접수 순 */
  items: Array<AdminPostReport>;
}

/** 운영자 조치 한 건 — 조치 기록 5항목 */
export interface AdminPostSuspension {
  suspensionId: number;
  /** 진행 중인 조치인가 */
  open: boolean;
  reasonCode: PostSuspensionReason | string;
  reasonLabel: string | null;
  /** 작성자에게 전달한 설명 */
  reasonDetail: string | null;
  policyClauseCode: PostPolicyClause | null;
  /** 근거 규정 문구 — 조치 시점 스냅샷 */
  policyRef: string | null;
  suspendedAt: string | null;
  suspendedBy: number | null;
  suspendedByName: string | null;
  appealDeadline: string | null;
  /** 이의 신청 접수로 기한이 정지됐는가 */
  deadlinePaused: boolean;
  resolution: SuspensionResolution | null;
  resolvedAt: string | null;
  resolvedByName: string | null;
  /** 작성자 알림 적재 시각 */
  notifiedAt: string | null;
  /** 실제 발송 성공 여부 — 발송 인프라 미설정이면 false */
  notificationDelivered: boolean | null;
}

export interface AdminPostAppeal {
  appealId: number;
  status: PostAppealStatus;
  content: string | null;
  submittedAt: string | null;
  /** 심사 기한 — 접수 + N영업일 */
  reviewDueAt: string | null;
  reviewedAt: string | null;
  reviewedByName: string | null;
  reviewComment: string | null;
  graceUntil: string | null;
}

export interface AdminPostOriginalDownload {
  downloadedAt: string | null;
  imageCount: number;
}

/** 삭제 경위(C8 · C10) — 영구 삭제일 때만 */
export interface AdminPostDeletion {
  type: PostDeleteReason | null;
  deletedAt: string | null;
  /** 반려는 운영자 이름, 작성자 삭제는 쇼룸명, 기한 경과는 「시스템」 */
  deletedByName: string | null;
  deletedBySelf: boolean;
  /** 원 조치 — 게시중에 본인이 지웠다면 null */
  originSuspensionId: number | null;
  rejectReason: string | null;
  graceFrom: string | null;
  graceUntil: string | null;
  originalDownloads: Array<AdminPostOriginalDownload> | null;
  /** 작성자 삭제 — 중지 후 며칠 만에 지웠나 */
  daysAfterSuspension: number | null;
  /** 작성자 삭제 — 그 조치의 이의 신청 기한(삭제 시각 기준 D-n은 FE) */
  appealDeadlineAtDeletion: string | null;
  purgeAt: string | null;
}

export interface AdminPostTimelineItem {
  type: TimelineType;
  at: string | null;
  actorType: TimelineActor;
  /** 운영자 이름 · 쇼룸명 · 신고자 마스킹 · null(시스템) */
  actorName: string | null;
  /** 서버가 조립한 문구 — 「신고 접수 (3건째)」 */
  label: string;
  detail: string | null;
  tone: TimelineTone | string | null;
  refId: number | null;
}

export interface AdminPostNavigation {
  previousPostId: number | null;
  nextPostId: number | null;
}

/** 조치 모달 · 안내 문구의 정책값(설정 post.*) — FE 하드코딩 금지 */
export interface AdminPostPolicy {
  appealDeadlineDays: number;
  appealReviewBusinessDays: number;
  downloadGraceDays: number;
  retentionMonths: number;
}

/** `AdminPostMonitoringDto.DetailResponse` */
export interface AdminPostDetail {
  postId: number;
  postNo: string;
  monitoringStatus: PostMonitoringStatus;
  monitoringStatusLabel: string;
  status: PostStatus;
  content: string | null;
  aspectRatio: number | null;
  aspectRatioLabel: string | null;
  publishedAt: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  deleteReason: PostDeleteReason | null;
  purgeAt: string | null;
  author: AdminPostAuthor | null;
  images: Array<AdminPostImage> | null;
  metrics: AdminPostMetrics | null;
  reports: AdminPostReports | null;
  /** 최신 우선 · open=true가 진행 중인 조치 */
  suspensions: Array<AdminPostSuspension> | null;
  /** 게시물당 1건 또는 null */
  appeal: AdminPostAppeal | null;
  deletion: AdminPostDeletion | null;
  /** 최신 우선 */
  timeline: Array<AdminPostTimelineItem> | null;
  navigation: AdminPostNavigation | null;
  policy: AdminPostPolicy | null;
}

// ------------------------------------------------------------------ 코드 목록

/** `AdminPostDto.SuspensionReasonItem` */
export interface SuspensionReasonItem {
  code: PostSuspensionReason;
  label: string;
  detailRequired: boolean;
  /** 운영자 전용 — FE가 「(운영자 전용)」을 붙인다. 10-21 배포 서버에는 없다 */
  operatorOnly?: boolean;
}

/** `AdminPostDto.PolicyClauseItem` */
export interface PolicyClauseItem {
  code: PostPolicyClause;
  /** 「서비스 운영정책 — 커뮤니티 장 3조 2항 — 효과 · 가격 오인 표현」 */
  label: string;
  /** 기본 선택 추천 사유 — 서버는 조합을 검증하지 않는다 */
  suggestedFor: Array<PostSuspensionReason>;
}

// ------------------------------------------------------------------ 조치

/** `AdminPostDto.SuspendRequest` — 사유 · 근거 규정 필수, 설명은 선택(기타면 필수 · 500자) */
export interface SuspendPostBody {
  reasonCode: PostSuspensionReason;
  reasonDetail?: string;
  policyClause: PostPolicyClause;
}

/** `AdminPostDto.ActionNoteRequest` — 신고 종결 · 조치 취소 메모(200자 · 선택) */
export interface ActionNoteBody {
  note?: string;
}

/** `AdminPostDto.AppealReviewRequest` — 반려는 comment 필수(500자) */
export interface AppealReviewBody {
  comment?: string;
}

/** `AdminPostDto.AdminPostActionResponse` */
export interface AdminPostActionResponse {
  postId: number;
  status: PostStatus;
  monitoringStatus: PostMonitoringStatus;
  appealDeadline: string | null;
  closedReportCount: number | null;
}
