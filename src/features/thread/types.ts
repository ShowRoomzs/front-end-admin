/*
  어드민 소통 스레드 — 백엔드 `AdminThreadDto`(api.admin.thread.dto)와 1:1.
  운영자 이름(`operatorName` · `doneByName` · `processedByName`)이 실리는 유일한 응답이다 —
  파트너센터 · 스튜디오 타입과 합치지 않는다(36 설계 0-4).
*/

/** 좌측 목록 탭 — `AdminChannelTab` */
export type AdminChannelTab = "BRAND" | "INFLUENCER" | "ISSUE";

/** 이슈 탭 seg — `AdminIssueState`. 종결 = 합의 ∪ 기한 만료 */
export type AdminIssueState = "OPEN" | "CLOSED";

/** `AdminChannelMemberStatus` — 인플루언서의 NORMAL은 서버가 ACTIVE로 맞춰 내린다 */
export type AdminChannelMemberStatus =
  "ACTIVE" | "DORMANT" | "SUSPENDED" | "WITHDRAWN";

export type CreatorBusinessType = "BUSINESS" | "INDIVIDUAL";

export type ParticipantType = "SELLER" | "CREATOR" | "ADMIN";

export type MessageType = "TEXT" | "SYSTEM";

export type MessageCardType =
  | "CONTRACT_RESEND_REQUEST"
  | "CONTRACT_ADMIN_CANCELED"
  | "SETTLEMENT_ADJUSTMENT_OPENED"
  | "SETTLEMENT_ADJUSTMENT_REQUEST"
  | "SETTLEMENT_ADJUSTMENT_COUNTER"
  | "SETTLEMENT_ADJUSTMENT_ACCEPTED"
  | "SETTLEMENT_ADJUSTMENT_REJECTED"
  | "SETTLEMENT_ADJUSTMENT_DEADLINE_NOTICE"
  | "SETTLEMENT_ADJUSTMENT_AGREED"
  | "SETTLEMENT_ADJUSTMENT_EXPIRED";

export type MessageCardTone = "WARNING" | "NEUTRAL";

export type MessageCardActionState = "PENDING" | "DONE" | "CLOSED";

/** `ThreadKind` — 공구 3자 스레드 두 종류는 폐기 이력(메시지 API 403) */
export type ThreadKind =
  | "CONNECTION"
  | "GROUP_BUY_ISSUE"
  | "GROUP_BUY_FULFILLMENT"
  | "SETTLEMENT_ADJUSTMENT";

/** 협의 상태 — OPEN(협의 중) · AGREED(합의) · EXPIRED(기한 만료) */
export type AdjustmentStatus = "OPEN" | "AGREED" | "EXPIRED";

/**
 * 서버 톤 문자열(INFO · SUCCESS · NEUTRAL · WARNING …) — 배지 색은 `utils/tone.ts`가
 * 앱 배지 변형으로 옮긴다. 값이 늘어도 화면이 깨지지 않게 문자열로 받는다.
 */
export type ServerTone = string;

export type SettlementParty = "SELLER" | "CREATOR";

// ── 첨부 ───────────────────────────────────────────────────────────────

export type AttachmentType = "IMAGE" | "VIDEO" | "DOCUMENT";

/** 메시지에 붙은 첨부는 사실상 UPLOADED만 온다. REJECTED는 complete 응답의 값이다 */
export type AttachmentStatus = "PENDING" | "UPLOADED" | "REJECTED";

export interface AttachmentSummary {
  attachmentId: number;
  status: AttachmentStatus;
  attachmentType: AttachmentType;
  /** CDN URL — 미리보기(이미지 · 영상)에만 쓴다. 저장은 download API로 매번 서명받는다 */
  fileUrl: string | null;
  originalName: string;
  extension: string;
  sizeBytes: number;
  durationSeconds: number | null;
  sortOrder: number | null;
}

export interface PresignRequest {
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface PresignResponse {
  attachmentId: number;
  uploadUrl: string;
  /** PUT의 Content-Type이 이 값과 다르면 S3가 서명 불일치로 거부한다 */
  requiredContentType: string;
  expiresInSeconds: number;
}

export interface AttachmentDownloadResponse {
  attachmentId: number;
  /** 원본 파일명으로 저장되도록 Content-Disposition이 서명된 URL — 5분 만료, 받은 즉시 쓴다 */
  downloadUrl: string;
  originalName: string;
  sizeBytes: number;
  expiresInSeconds: number;
}

// ── 목록 · 배지 ─────────────────────────────────────────────────────────

/** 이슈 탭 행 — 정산 조정 협의(44 이슈 스레드 설계서 4-1). 행의 name = 공구명 */
export interface IssueListItem {
  adjustmentId: number;
  status: AdjustmentStatus;
  statusLabel: string;
  /** 운영자 기준 — 응답 대기 · 합의 · 금액 변경 · 기한 만료 · 원래 금액 */
  badgeLabel: string;
  badgeTone: ServerTone;
  /** 「{브랜드명} × {쇼룸명} · 정산 조정 요청」 */
  subtitle: string;
  settlementId: number;
  settlementNumber: string;
  groupBuyId: number;
  marketId: number;
  brandName: string;
  creatorId: number;
  showroomName: string;
  deadlineAt: string;
  /** D-N — 종결 뒤 null */
  remainingBusinessDays: number | null;
}

export interface ChannelListItem {
  threadId: number;
  tab: AdminChannelTab;
  /** 브랜드명 · 쇼룸명 · (이슈) 공구명 */
  name: string;
  imageUrl: string | null;
  /** BRD-{마켓 ID} · INF-{크리에이터 ID} — 이슈 행은 null */
  memberNo: string | null;
  memberId: number | null;
  /** [브랜드] 보조 줄 「담당 {이름}」 */
  managerName: string | null;
  /** [인플루언서] 보조 줄 「사업자」 · 「개인」 */
  businessType: CreatorBusinessType | null;
  memberStatus: AdminChannelMemberStatus | null;
  /** 카드가 마지막이면 카드 제목, 첨부만이면 「사진」 · 「파일 3개」 */
  lastMessagePreview: string | null;
  /** true면 미리보기 앞에 「운영팀: 」을 붙인다 */
  lastMessageByOperator: boolean;
  lastMessageAt: string | null;
  /** 운영팀 공용 안 읽은 수 — 이슈 행은 항상 0 */
  unreadCount: number;
  /** 탈퇴 회원 · 이슈 행은 false(열람만) */
  writable: boolean;
  issue: IssueListItem | null;
}

export interface TabSummary {
  /** 그 탭 전 채널의 운영팀 기준 안 읽은 메시지 수 */
  unreadCount: number;
  /** 운영팀 확인을 기다리는 재발송 요청 카드 수 */
  pendingCardCount: number;
}

export interface IssueTabSummary extends TabSummary {
  /** 진행 중(OPEN) 협의 수 — seg 숫자 */
  openCount: number;
  /** 종결(AGREED · EXPIRED) 협의 수 — seg 숫자 */
  closedCount: number;
}

export interface ThreadSummary {
  brand: TabSummary;
  influencer: TabSummary;
  issue: IssueTabSummary;
}

export interface ChannelListQuery {
  tab: AdminChannelTab;
  /** 이슈 탭에서만 보낸다 */
  state?: AdminIssueState;
  keyword?: string;
  page: number;
  size: number;
}

// ── 헤더 · 정보 바 · 이슈 패널 ───────────────────────────────────────────

/** ① 정보 — 브랜드와 인플루언서가 채우는 칸이 다르다. 해당 없는 값은 null */
export interface ChannelProfile {
  managerName: string | null;
  managerContact: string | null;
  businessType: CreatorBusinessType | null;
  /** 저장 값이 없어 항상 null */
  taxType: string | null;
  businessEmail: string | null;
  instagramUrl: string | null;
  joinedAt: string | null;
}

/** ② 진행 중 — null은 0이 아니라 「집계할 수 없음」이다. 그 행을 그리지 않는다 */
export interface ChannelProgress {
  contractSigning: number | null;
  contractConcluded: number | null;
  groupBuyOngoing: number | null;
  groupBuyEnded: number | null;
  unsettledCount: number | null;
  connectedBrandCount: number | null;
}

export interface OpenIssueThread {
  threadId: number;
  /** SETTLEMENT_ADJUSTMENT만 이슈 탭으로 이동한다 — 나머지는 폐기 이력(메시지 403) */
  kind: ThreadKind;
  groupBuyId: number | null;
  groupBuyTitle: string | null;
}

export interface IssueProposal {
  proposalId: number;
  seq: number;
  rewardAmount: number;
  proposerType: SettlementParty;
  proposerName: string;
  /** 답할 쪽 이름 */
  responderName: string;
  status: string;
}

export interface IssueSettlement {
  settlementId: number;
  settlementNumber: string;
  /** 정산 보류 · 전액 / 보류 해제 · 금액 변경 / 보류 해제 · 금액 변경 없음 */
  holdLabel: string;
  holdTone: ServerTone;
  originalRewardAmount: number;
  currentProposal: IssueProposal | null;
  agreedRewardAmount: number | null;
  finalRewardAmount: number | null;
  finalCreatorNetAmount: number | null;
}

export interface IssueStep {
  /** REQUESTED · OPEN · AGREED · CLOSED */
  key: string;
  label: string;
  /** DONE · CURRENT · TODO · SKIPPED(만료 — 합의 · 반영이 없었다, 완료처럼 그리지 않는다) */
  state: string;
  note: string | null;
}

export interface IssueLinks {
  /** 그 쌍의 브랜드–인플루언서 1:1 스레드 — 열람 전용 · 끊긴 연결이면 null */
  pairThreadId: number | null;
  settlementId: number;
  marketId: number;
  creatorId: number;
}

export interface IssuePanel {
  adjustmentId: number;
  status: AdjustmentStatus;
  statusLabel: string;
  badgeLabel: string;
  badgeTone: ServerTone;
  settlement: IssueSettlement;
  groupBuy: { groupBuyId: number; groupBuyNumber: string; title: string };
  contract: { contractId: number; contractNumber: string } | null;
  brand: { marketId: number; name: string };
  influencer: { creatorId: number; name: string };
  /** 처음 요청한 쪽 */
  requesterType: SettlementParty;
  openedAt: string;
  deadlineAt: string;
  remainingBusinessDays: number | null;
  closedAt: string | null;
  steps: Array<IssueStep>;
  links: IssueLinks;
}

export interface PairInfo {
  marketId: number;
  brandName: string;
  creatorId: number;
  showroomName: string;
}

export interface ChannelInfo {
  threadId: number;
  /** 이슈 패널에서 들어온 브랜드–인플루언서 1:1 스레드는 null */
  tab: AdminChannelTab | null;
  name: string;
  imageUrl: string | null;
  memberNo: string | null;
  memberId: number | null;
  memberStatus: AdminChannelMemberStatus | null;
  writable: boolean;
  profile: ChannelProfile | null;
  progress: ChannelProgress | null;
  openIssueThreads: Array<OpenIssueThread> | null;
  issue: IssuePanel | null;
  pair: PairInfo | null;
}

// ── 메시지 ────────────────────────────────────────────────────────────

/** 정산 조정 카드의 사실(생성 시점 스냅샷) — 카드 종류마다 채워지는 칸이 다르다 */
export interface AdjustmentDetail {
  settlementId?: number;
  settlementNumber?: string;
  groupBuyId?: number;
  adjustmentId?: number;
  proposalId?: number;
  seq?: number;
  proposerType?: SettlementParty;
  proposerName?: string;
  originalRewardAmount?: number;
  rewardAmount?: number;
  reason?: string;
  deadlineAt?: string;
  responderType?: SettlementParty;
  responderName?: string;
  respondedAt?: string;
  finalRewardAmount?: number;
  agreedByType?: SettlementParty;
  agreedByName?: string;
  closedAt?: string;
}

/** 값이 있는 필드만 내려온다(카드 종류마다 키가 다르다) */
export interface CardDetail {
  requesterType?: SettlementParty;
  requesterName?: string;
  requestedAt?: string;
  reasonLabel?: string;
  processedAt?: string;
  processedByName?: string;
  notifiedBothParties?: boolean;
  adjustment?: AdjustmentDetail;
}

export interface CardAction {
  /** RESEND_NOTICE · ADJUSTMENT_RESPOND */
  type: string;
  state: MessageCardActionState;
  /** [재발송 완료 알림 보내기]를 누를 수 있는가 */
  canExecute: boolean;
  doneAt: string | null;
  doneByName: string | null;
  noticeMessageId: number | null;
  /** [정산 조정] 결과 문구 — 동의 · 반대 · 다른 금액 제안으로 응답됨 · 기한 만료 */
  resultLabel: string | null;
  respondable: boolean;
}

export interface MessageCard {
  cardType: MessageCardType;
  title: string;
  tone: MessageCardTone;
  contractId: number | null;
  contractNumber: string | null;
  groupBuyTitle: string | null;
  detail: CardDetail | null;
  action: CardAction | null;
}

export interface MessageItem {
  messageId: number;
  messageType: MessageType;
  senderType: ParticipantType;
  /** 운영팀의 말풍선인가(운영자 개인이 아니라 팀 기준) — 카드는 항상 false */
  mine: boolean;
  /** 상대 말풍선의 이름(브랜드명 · 쇼룸명) — 운영팀 메시지는 null */
  senderName: string | null;
  /** 「운영팀 · {이름}」 — 시스템 발신이면 null */
  operatorName: string | null;
  /** 「자동 안내」 태그 — 어드민에만 보인다 */
  autoNotice: boolean;
  content: string | null;
  attachments: Array<AttachmentSummary>;
  card: MessageCard | null;
  createdAt: string;
}

export interface MessageListResponse {
  /** 최신순 */
  content: Array<MessageItem>;
  nextCursor: number | null;
  hasNext: boolean;
}

export interface SendMessageRequest {
  /** 멱등키 — 재전송은 같은 값으로 */
  clientMessageId: string;
  content?: string;
  attachmentIds?: Array<number>;
}

export interface ResendNoticeResponse {
  /** true면 다른 요청이 먼저 보냈다 — 이번 호출은 아무것도 보내지 않았다 */
  alreadyNotified: boolean;
  card: MessageItem;
  notice: MessageItem | null;
}

// ── 화면 로컬 상태 ──────────────────────────────────────────────────────

/** 전송 중인 첨부 — 서버에 저장되기 전까지만 존재한다 */
export interface OutgoingAttachment {
  localId: string;
  file: File;
  attachmentType: AttachmentType;
  progress: number;
  /** 업로드 · 검증이 끝난 첨부. 재전송 때 다시 올리지 않는다 */
  summary?: AttachmentSummary;
}

/** 아직 서버에 저장되지 않은 운영자 메시지 — 실패해도 [재전송]/[취소] 전까지 남는다 */
export interface OutgoingMessage {
  clientMessageId: string;
  content: string | null;
  attachments: Array<OutgoingAttachment>;
  status: "sending" | "failed";
  error?: string;
  createdAt: string;
}
