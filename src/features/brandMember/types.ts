/*
  어드민 브랜드 회원 — 백엔드 `api/admin/brand/dto/AdminBrandDto.java`(origin/main 295bb879)와 1:1.
  시각 필드는 이벤트(UTC 벽시계)다 — 가입 · 승인 · 접속 · 정지 · 신청 · 이력 · 메모. `term` 안의 날짜만 KST 벽시계.
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

// ------------------------------------------------------------------ 목록

export interface AdminBrandListItem {
  marketId: number;
  /** BRD-1042 */
  brandNo: string;
  brandName: string;
  /** 탈퇴면 null(파기) */
  managerName: string | null;
  /** 마스킹하지 않는다(CS가 바로 연락하는 사업자 담당자) · 탈퇴면 null */
  managerContact: string | null;
  /** 평문 — 법인사업자 · 일반과세자 · 간이과세자 */
  businessType: string | null;
  /** 원래 회원 상태 — 정지 중 탈퇴 신청이면 SUSPENDED 그대로 */
  memberStatus: string;
  memberStatusLabel: string;
  withdrawalPending: boolean;
  withdrawalRequestedAt: string | null;
  /** 목록 표시 상태(대기를 반영) */
  listStatus: MemberListStatus;
  listStatusLabel: string;
  listStatusTone: string;
  connectedCreatorCount: number;
  joinedAt: string | null;
  lastLoginAt: string | null;
}

export interface AdminBrandListResponse {
  content: Array<AdminBrandListItem>;
  pageInfo: PageInfo;
  summary: MemberListSummary;
}

// ------------------------------------------------------------------ 상세

export interface AdminBrandNavigation {
  previousMarketId: number | null;
  nextMarketId: number | null;
}

export interface AdminBrandBasicInfo {
  managerName: string | null;
  managerContact: string | null;
  email: string | null;
  siteUrl: string | null;
  joinedAt: string | null;
  approvedAt: string | null;
}

/** 업태 · 종목은 내리지 않는다(§52-1) */
export interface AdminBrandBusinessInfo {
  businessType: string | null;
  companyName: string | null;
  representativeName: string | null;
  businessRegistrationNumber: string | null;
  mailOrderRegNumber: string | null;
  businessAddress: string | null;
}

export interface AdminBrandPendingChangeRequest {
  requestId: number;
  requestCode: string;
  type: string;
  typeLabel: string;
  requestedAt: string;
}

export interface AdminBrandSettlementInfo {
  bankName: string | null;
  accountHolder: string | null;
  /** 가운데 마스킹 — 전체 값은 정산 관리 */
  maskedAccountNumber: string | null;
  taxEmail: string | null;
  pendingChangeRequests: Array<AdminBrandPendingChangeRequest>;
}

export interface AdminBrandShipLeadChange {
  changedAt: string;
  previousDays: number | null;
  newDays: number | null;
}

export interface AdminBrandReturnAddress {
  recipientName: string | null;
  contact: string | null;
  address: string | null;
  detailAddress: string | null;
}

/** 조회 전용 · 탈퇴 후에도 보존(남은 반품의 비용 기준). 배송 방법 · 택배사 연동 · 반품비 · 교환비는 내리지 않는다 */
export interface AdminBrandDeliveryPolicy {
  defaultDeliveryFee: number | null;
  freeShippingThreshold: number | null;
  jejuSurcharge: number | null;
  /** 도서산간 추가비 — 제주 제외 */
  remoteAreaSurcharge: number | null;
  shipLeadBusinessDays: number;
  shipLeadText: string | null;
  shipLeadLastChange: AdminBrandShipLeadChange | null;
  returnAddress: AdminBrandReturnAddress | null;
}

export interface AdminBrandOperations {
  connectedCreatorCount: number;
  activeGroupBuyCount: number;
  settledAmountTotal: number;
  /** 0이 아니면 경고색 */
  unsettledAmount: number;
  payoutHeld: boolean;
  contracts: { signing: number; concluded: number };
  products: { selling: number; soldOut: number };
}

export interface AdminBrandConnectedCreator {
  creatorId: number;
  showroomName: string | null;
  connectedAt: string | null;
  disconnectedAt: string | null;
  activeGroupBuyCount: number;
  /** CONNECTED · DISCONNECTED */
  status: string;
  statusLabel: string;
}

export interface AdminBrandOperatorThread {
  threadId: number;
  unreadByOperator: number;
  lastMessageAt: string | null;
}

export interface AdminBrandSanction {
  sanctionId: number;
  reason: string;
  reasonLabel: string;
  reasonDetail: string | null;
  /** 브랜드 몫 지급 정지 — 사유가 정한다 */
  payoutHeld: boolean;
  suspendedAt: string;
  suspendedByName: string | null;
  /** 소명 경로 — 운영팀 스레드 */
  threadId: number | null;
  term: SanctionTerm | null;
}

export interface AdminBrandWithdrawal {
  requestedAt: string | null;
  reason: string | null;
  reasonLabel: string | null;
  message: string | null;
  approvedAt: string | null;
  approvedByName: string | null;
}

export interface AdminBrandActions {
  canSuspend: boolean;
  canRelease: boolean;
  canReviewWithdrawal: boolean;
}

export interface AdminBrandCurrentStatus {
  marketId: number;
  memberStatus: string;
  label: string;
  tone: string;
  joinedAt: string | null;
  approvedAt: string | null;
  lastLoginAt: string | null;
  sanction: AdminBrandSanction | null;
  withdrawal: AdminBrandWithdrawal | null;
  actions: AdminBrandActions;
}

/** 이동할 화면 — ORDERS · CLAIMS · PRODUCT_INQUIRIES · THREAD · SETTLEMENTS */
export type AdminBrandChipTarget =
  "ORDERS" | "CLAIMS" | "PRODUCT_INQUIRIES" | "THREAD" | "SETTLEMENTS";

export interface AdminBrandPendingChip {
  key: string;
  label: string;
  tone: string;
  count: number;
  target: AdminBrandChipTarget | string;
  threadId: number | null;
}

/** 탈퇴 조건 4종 건수(기-04) — 하나라도 0이 아니면 승인은 409 */
export interface AdminBrandWithdrawalConditions {
  activeGroupBuys: number;
  contractsBeforeConclusion: number;
  unclosedOrders: number;
  unsettled: number;
}

export interface AdminBrandWithdrawalReview {
  requestId: number;
  requestedAt: string;
  elapsedDays: number;
  requesterName: string | null;
  reason: string | null;
  reasonLabel: string | null;
  message: string | null;
  conditions: AdminBrandWithdrawalConditions | null;
}

export interface AdminBrandHistoryItem {
  type: string;
  label: string;
  tone: string;
  /** ADMIN · BRAND · SYSTEM */
  actorType: string | null;
  actorName: string | null;
  detail: string | null;
  refType: string | null;
  refId: number | null;
  occurredAt: string | null;
}

export interface AdminBrandRail {
  currentStatus: AdminBrandCurrentStatus;
  /** 1건 이상인 칩만 */
  pendingChips: Array<AdminBrandPendingChip>;
  withdrawalReview: AdminBrandWithdrawalReview | null;
  /** 최신 3건(탈퇴 심사 중이면 2건) */
  histories: { items: Array<AdminBrandHistoryItem>; total: number };
}

export interface AdminBrandDetail {
  marketId: number;
  brandNo: string;
  brandName: string;
  memberStatus: string;
  memberStatusLabel: string;
  withdrawalPending: boolean;
  /** 탈퇴로 파기됨 — null을 「— 파기됨」으로 그린다 */
  purged: boolean;
  navigation: AdminBrandNavigation | null;
  basicInfo: AdminBrandBasicInfo;
  businessInfo: AdminBrandBusinessInfo;
  settlementInfo: AdminBrandSettlementInfo;
  deliveryPolicy: AdminBrandDeliveryPolicy | null;
  operations: AdminBrandOperations;
  connectedCreators: {
    total: number;
    items: Array<AdminBrandConnectedCreator>;
  };
  /** 운영팀 소통 스레드 — 채널이 없으면 null */
  operatorThread: AdminBrandOperatorThread | null;
  rail: AdminBrandRail;
  /** 최신 1건 + 전체 건수 */
  memos: { items: Array<MemberMemo>; total: number };
}

export interface AdminBrandHistoryPage {
  content: Array<AdminBrandHistoryItem>;
  pageInfo: PageInfo;
}

export interface AdminBrandMemoPage {
  content: Array<MemberMemo>;
  pageInfo: PageInfo;
}

export interface AdminBrandConnectedCreatorPage {
  content: Array<AdminBrandConnectedCreator>;
  pageInfo: PageInfo;
}

export interface AdminBrandReasonOptions {
  suspensionReasons: Array<AdminReasonOption>;
  releaseReasons: Array<AdminReasonOption>;
  withdrawalRejectReasons: Array<AdminReasonOption>;
  suspensionTerm: SuspensionTermPreview | null;
}

/**
 * 최근 문의 — 파트너센터 1:1 문의가 서버에 정의되지 않아(§55 A-5) 응답에 없다.
 * 화면은 시안대로 자리를 두고 DEV에서만 목업으로 채운다(배포본은 「준비 중」).
 */
export interface BrandRecentInquiry {
  inquiryNumber: string;
  typeLabel: string;
  title: string;
  statusLabel: string;
  tone: string;
  createdAt: string;
}
