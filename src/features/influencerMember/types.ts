/*
  어드민 인플루언서 회원 — 백엔드 `api/admin/creator/dto/AdminCreatorDto.java`(origin/main 295bb879)와 1:1.
  시각 필드는 이벤트(UTC 벽시계)다. KST 벽시계는 정지 `term` · 조정 협의 `deadlineAt` · 정산 `payoutDueDate` ·
  탈퇴 심사 `dueDate`(LocalDate)뿐이다.
*/
import type { PageInfo } from "@/common/types/page";
import type {
  AdminReasonOption,
  MemberListStatus,
  MemberListSummary,
  MemberMemo,
  SanctionTerm,
  SuspensionTermPreview,
} from "@/features/memberShared/types";

export type CreatorStatus = "ACTIVE" | "SUSPENDED" | "WITHDRAWN";
export type CreatorBusinessType = "INDIVIDUAL" | "BUSINESS";
export type WithholdingType = "WITHHOLDING_3_3" | "TAX_INVOICE";
export type DeviceType =
  "ANDROID" | "IPHONE" | "DESKTOP_CHROME" | "DESKTOP_EDGE" | "UNKNOWN";
export type CreatorPrivacyAccessReason =
  | "CS_RESPONSE"
  | "SETTLEMENT_WITHHOLDING_CHECK"
  | "CONTRACT_DISPUTE"
  | "INVESTIGATION_COOPERATION";

// ------------------------------------------------------------------ 목록

export interface AdminCreatorListItem {
  creatorId: number;
  /** INF-3018 */
  memberNo: string;
  /** 온보딩 전이면 null */
  showroomName: string | null;
  /** 미등록이거나 탈퇴로 파기됐으면 null */
  instagramUrl: string | null;
  businessEmail: string | null;
  businessType: CreatorBusinessType | null;
  /** 목록 표기 — 사업자 · 비사업자 */
  businessTypeLabel: string | null;
  joinedAt: string | null;
  connectedBrandCount: number;
  /** 원래 회원 상태 — 정지 중 탈퇴 신청이면 SUSPENDED 그대로 */
  status: CreatorStatus;
  statusLabel: string;
  listStatus: MemberListStatus;
  listStatusLabel: string;
  listStatusTone: string;
  withdrawalPending: boolean;
  withdrawalRequestedAt: string | null;
}

export interface AdminCreatorListResponse {
  content: Array<AdminCreatorListItem>;
  pageInfo: PageInfo;
  summary: MemberListSummary;
}

// ------------------------------------------------------------------ 상세(상단 4카드 + 레일)

export interface AdminCreatorBasic {
  showroomName: string | null;
  profileImageUrl: string | null;
  /** 쇼룸 주소 핸들(soyeon_showroom) */
  showroomAddress: string | null;
  /** 탈퇴(비공개)면 null */
  showroomUrl: string | null;
  showroomPublic: boolean;
  instagramUrl: string | null;
  businessEmail: string | null;
  joinedAt: string | null;
  onboardingApprovedAt: string | null;
  lastLoginAt: string | null;
  lastLoginDevice: DeviceType | null;
}

/** 본인확인 정보 — 기본 마스킹 · 유효한 해제 세션이 있으면 실값 */
export interface AdminCreatorIdentity {
  destroyed: boolean;
  unmasked: boolean;
  name: string | null;
  birthday: string | null;
  /** 만 나이 — 해제 상태에서만 */
  age: number | null;
  phone: string | null;
  /** 수집하지 않는다(항상 null) — null이면 행을 그리지 않는다 */
  carrier: string | null;
  firstVerifiedAt: string | null;
  /** 수집하지 않는다(항상 null) */
  renewedAt: string | null;
}

export interface AdminCreatorUnmask {
  /** 해제 버튼 활성 — 최고관리자 한정 · 파기 회원은 false */
  allowed: boolean;
  unmasked: boolean;
  operatorName: string | null;
  unmaskedAt: string | null;
  expiresAt: string | null;
  remainingSeconds: number | null;
  /** 직전 해제 사유(M4 프리필) */
  lastReason: CreatorPrivacyAccessReason | null;
}

export interface AdminCreatorBusiness {
  destroyed: boolean;
  businessType: CreatorBusinessType | null;
  /** 개인사업자 · 개인 (비사업자) */
  businessTypeLabel: string | null;
  businessRegistrationNumber: string | null;
  /** 상호 · 대표자 · 주소는 수집하지 않아 등록증으로 확인한다 */
  businessLicenseImageUrl: string | null;
  residentNumberRegistered: boolean | null;
  withholdingType: WithholdingType | null;
  withholdingLabel: string | null;
}

export interface AdminCreatorAccountChange {
  changedAt: string;
  previousBankName: string | null;
  previousLast4: string | null;
}

export interface AdminCreatorPendingBusinessTypeChange {
  changeRequestId: number;
  requestCode: string;
  /** TO_BUSINESS · TO_INDIVIDUAL */
  type: string;
  requestedAt: string;
}

export interface AdminCreatorSettlementAccount {
  destroyed: boolean;
  bankName: string | null;
  accountHolder: string | null;
  accountNumber: string | null;
  lastChange: AdminCreatorAccountChange | null;
  pendingBusinessTypeChange: AdminCreatorPendingBusinessTypeChange | null;
}

export interface AdminCreatorSuspension {
  sanctionId: number;
  reason: string;
  reasonLabel: string;
  reasonDetail: string | null;
  suspendedAt: string;
  operatorName: string | null;
  /** 리워드 지급 정지 — 사유가 정한다 */
  payoutHeld: boolean;
  /** 「유지 · 사유가 정산 정보와 무관」 */
  payoutNote: string | null;
  term: SanctionTerm | null;
}

export interface AdminCreatorWithdrawal {
  withdrawnAt: string | null;
  requestedAt: string | null;
  operatorName: string | null;
}

export interface AdminCreatorCurrentStatus {
  status: CreatorStatus;
  label: string;
  tone: string;
  joinedAt: string | null;
  onboardingApprovedAt: string | null;
  lastLoginAt: string | null;
  suspension: AdminCreatorSuspension | null;
  withdrawal: AdminCreatorWithdrawal | null;
}

export interface AdminCreatorOpenAdjustment {
  adjustmentId: number;
  settlementId: number;
  settlementNumber: string;
  /** 합의 기한(KST 벽시계 23:59:59) */
  deadlineAt: string | null;
  threadId: number | null;
}

/** 탈퇴 조건 3종(기-04 · 끝나지 않은 공구 · 계약 · 미정산) — 실시간 */
export interface AdminCreatorConditions {
  unfinishedGroupBuys: number;
  unfinishedContracts: number;
  unsettled: number;
}

export interface AdminCreatorWithdrawalReview {
  requestId: number;
  requestedAt: string;
  elapsedDays: number;
  /** 승인 기한 안내(신청일 + 5영업일 · LocalDate) */
  dueDate: string | null;
  reasonText: string | null;
  conditions: AdminCreatorConditions | null;
}

export interface AdminCreatorHistoryItem {
  /** 파생 행(가입 신청 · 입점 승인)은 null */
  historyId: number | null;
  eventType: string;
  label: string;
  tone: string;
  detail: string | null;
  /** ADMIN · CREATOR · SYSTEM */
  actorType: string | null;
  actorName: string | null;
  refType: string | null;
  refId: number | null;
  occurredAt: string | null;
}

export interface AdminCreatorRail {
  currentStatus: AdminCreatorCurrentStatus;
  operatorChannelThreadId: number | null;
  openAdjustments: Array<AdminCreatorOpenAdjustment>;
  withdrawalReview: AdminCreatorWithdrawalReview | null;
  recentHistories: Array<AdminCreatorHistoryItem>;
  historyTotal: number;
}

export interface AdminCreatorDetail {
  creatorId: number;
  memberNo: string;
  status: CreatorStatus;
  statusLabel: string;
  statusTone: string;
  navigation: { previousId: number | null; nextId: number | null } | null;
  basic: AdminCreatorBasic;
  identity: AdminCreatorIdentity;
  unmask: AdminCreatorUnmask;
  business: AdminCreatorBusiness;
  settlementAccount: AdminCreatorSettlementAccount;
  rail: AdminCreatorRail;
}

// ------------------------------------------------------------------ 하단 카드

export interface AdminCreatorOverview {
  operations: {
    connectedBrandCount: number;
    sellingGroupBuyCount: number;
    /** 정산 진행 중 리워드(세전) */
    rewardInProgressAmount: number;
    /** 조정 협의 — 경고색은 이 수치만 */
    openAdjustmentCount: number;
  };
  activity: {
    groupBuyPostCount: number;
    reviewRejectCount: number;
    /** 노출 중지 횟수(기-08 — 옛 이름 hiddenCount) */
    hiddenCount: number;
    generalPostCount: number;
    /** 앱 내 쇼룸 팔로우 수(인스타 팔로워 아님) */
    followerCount: number;
    threadCount: number;
    openThreadCount: number;
  };
}

export interface AdminCreatorSettlementRow {
  settlementId: number;
  settlementNumber: string;
  groupBuyId: number | null;
  groupBuyTitle: string | null;
  marketName: string | null;
  status: string;
  statusLabel: string;
  tone: string;
  rewardAmount: number;
  creatorPayoutStatus: string | null;
  creatorPayoutStatusLabel: string | null;
  /** LocalDate(KST) */
  payoutDueDate: string | null;
  paidAt: string | null;
  adjustment: AdminCreatorOpenAdjustment | null;
}

export interface AdminCreatorSettlementList {
  total: number;
  content: Array<AdminCreatorSettlementRow>;
}

export interface AdminCreatorContractRow {
  contractId: number;
  contractNumber: string;
  marketName: string | null;
  title: string | null;
  status: string;
  statusLabel: string;
  tone: string;
  /** null이면 「없음」 */
  fixedFeeAmount: number | null;
  fixedFeeTrigger: string | null;
  fixedFeeTriggerLabel: string | null;
  /** 지급 시점 도래 시각(사실) — 미도래면 null */
  fixedFeeTriggerReachedAt: string | null;
  /** 브랜드 지급 기록(자기 신고) — 플랫폼은 보증하지 않는다 */
  fixedFeePaidAt: string | null;
}

export interface AdminCreatorContractPage {
  content: Array<AdminCreatorContractRow>;
  pageInfo: PageInfo;
}

export interface AdminCreatorConnectionRow {
  connectionId: number;
  marketId: number;
  marketName: string | null;
  connectedAt: string | null;
  sellingGroupBuyCount: number;
  /** CONNECTED · DISCONNECTED */
  status: string;
  disconnectedAt: string | null;
}

export interface AdminCreatorConnectionList {
  total: number;
  content: Array<AdminCreatorConnectionRow>;
}

export interface AdminCreatorHistoryPage {
  total: number;
  page: number;
  size: number;
  content: Array<AdminCreatorHistoryItem>;
}

export interface AdminCreatorMemoPage {
  total: number;
  content: Array<MemberMemo>;
}

export interface AdminCreatorReasonOptions {
  suspensionReasons: Array<AdminReasonOption>;
  releaseReasons: Array<AdminReasonOption>;
  withdrawalRejectReasons: Array<AdminReasonOption>;
  privacyUnmaskReasons: Array<AdminReasonOption>;
  suspensionTerm: SuspensionTermPreview | null;
}
