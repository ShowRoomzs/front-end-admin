import type { BaseParams } from "@/common/types";

/*
  어드민 계약 관리(§28) 타입 — 백엔드 `api/admin/contract/dto/AdminContractDto.java`와 1:1.
  상품 항목·콘텐츠 의무·고정 지급비·정산·종결은 셀러 상세(`ContractDetailResponse`)의
  중첩 record를 그대로 재사용하므로 모양이 파트너센터와 같다.
*/

/**
 * 상태 10종 — 3서피스 공통. 어드민에는 작성중이 도착하지 않는다.
 * `TERMINATED`(해지 · 1021 기-05)는 origin/main에 생겼고 개발 서버에는 아직 없다.
 */
export type ContractStatus =
  | "DRAFT"
  | "REVIEW_PENDING"
  | "REVIEW_REJECTED"
  | "SIGNING"
  | "CONCLUSION_PENDING"
  | "CONCLUDED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELED"
  | "TERMINATED";

/** 배지 색 — 서버가 상태별로 하나만 내린다(같은 계약이 세 화면에서 같은 색) */
export type ContractStatusTone =
  "NEUTRAL" | "INFO" | "WARNING" | "SUCCESS" | "DANGER";

/** 목록 탭 6종 — 작성중·검토 반려는 탭이 없다(전체 탭에 배지로만 남는다) */
export type AdminContractTab =
  | "ALL"
  | "REVIEW_PENDING"
  | "SIGNING"
  | "CONCLUSION_PENDING"
  | "CONCLUDED"
  | "CLOSED";

/**
 * 조치 큐 — 선택하면 탭·정렬보다 우선한다. 서버는 5종을 센다.
 * `RESEND`는 rev.8 ②로 화면에서 뺐다(재발송 요청은 20a 운영팀 채널 카드) — 응답 호환으로만 남긴다.
 */
export type AdminContractQueue =
  "REVIEW" | "CONCLUSION" | "EXPIRY" | "RESEND" | "TERMINATION";

export type AdminContractSort =
  "REVIEW_REQUESTED_ASC" | "CREATED_DESC" | "START_AT_ASC";

export type FixedFeeTrigger =
  "POST_REGISTERED" | "GROUP_BUY_ENDED" | "SETTLEMENT_COMPLETED";

export type SecondaryUsePeriodType = "FIXED" | "UNLIMITED";

export type WithholdingType = "WITHHOLDING_3_3" | "TAX_INVOICE";

export type ContractDocumentType =
  "GENERATED_DRAFT" | "SIGNED_PDF" | "AUDIT_TRAIL";

export type ContractActorType = "SELLER" | "CREATOR" | "ADMIN" | "SYSTEM";

/** 이력 이벤트 — append-only. 서버가 값을 늘려도 화면이 죽지 않게 라벨 표는 기본값을 둔다 */
export type ContractEventType =
  | "CREATED"
  | "REVIEW_REQUESTED"
  | "REVIEW_REQUEST_CANCELED"
  | "REVIEW_APPROVED"
  | "REVIEW_REJECTED"
  | "SIGNATURE_SENT"
  | "BRAND_SIGNED"
  | "CREATOR_SIGNED"
  | "SIGNATURE_UPDATED"
  | "BOTH_SIGNED_CONFIRMED"
  | "ESTABLISHED"
  | "RESEND_REQUESTED"
  | "RESEND_HANDLED"
  | "CONTRACT_PDF_GENERATED"
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_DELETED"
  | "CONCLUDED"
  | "DECLINED"
  | "EXPIRED"
  | "CANCELED"
  | "FIXED_FEE_PAID"
  | "GROUP_BUY_CREATED"
  | "TERMINATION_REQUESTED"
  | "TERMINATION_REQUEST_WITHDRAWN"
  | "TERMINATED"
  | "DRAFT_APPROVAL_RECORDED"
  | "DELETED";

/** 검토 반려 사유 — 서버 `ContractReviewRejectReason` */
export type ContractReviewRejectReason =
  | "AGREEMENT_MISMATCH"
  | "INFO_MISMATCH"
  | "OBLIGATION_UNVERIFIABLE"
  | "TYPO_OR_OMISSION"
  | "ACCOUNT_STATUS"
  | "ETC";

/**
 * 직권 취소 사유 — 서버 `ContractCloseReasonCode`. 앞 3종이 C6(1021 기-06) 선택지이고
 * 뒤 4종은 1021 이전 선택지(저장된 행 표시용)다. ETC면 설명 필수.
 */
export type ContractCloseReasonCode =
  | "PARTY_RENEGOTIATION"
  | "PARTY_CANNOT_PROCEED"
  | "CONTENT_ERROR_AFTER_REVIEW"
  | "CONDITION_REVIEW"
  | "OUT_OF_STOCK"
  | "SCHEDULE_CHANGE"
  | "NEGOTIATION_STOPPED"
  | "ETC";

/** 해지 사유 — 서버 `ContractTerminationReasonCode`(C7 선택지) */
export type ContractTerminationReasonCode =
  | "TERMINATE_CANNOT_PROCEED"
  | "TERMINATE_RENEGOTIATION"
  | "TERMINATE_CONTENT_ERROR"
  | "TERMINATE_OTHER";

/** 정지 보류 보조 배지 — 서버 `api/common/sanction/SanctionHoldView` */
export interface SanctionHoldView {
  /** MINE · COUNTERPARTY · ADMIN */
  kind: string;
  label: string;
  /** WARNING · NEUTRAL */
  tone: string;
  /** 어드민만 — 정지 당사자 BRAND · CREATOR · BOTH */
  party: "BRAND" | "CREATOR" | "BOTH" | null;
}

/** 직권 취소 요청이 들어온 경로 — 서버 `ContractCancelRequestChannel`. 운영자가 취소 모달에서 고른다 */
export type ContractCancelRequestChannel = "THREAD" | "PHONE" | "EMAIL" | "ETC";

export interface AdminContractListParams extends BaseParams {
  tab: AdminContractTab;
  /** 빈 문자열이면 큐 미선택 */
  queue: AdminContractQueue | "";
  keyword: string;
  sort: AdminContractSort;
}

export interface AdminContractListItem {
  contractId: number;
  contractNumber: string | null;
  title: string | null;
  brandName: string;
  creatorName: string | null;
  itemCount: number;
  startAt: string | null;
  endAt: string | null;
  reviewRequestedAt: string | null;
  status: ContractStatus;
  statusLabel: string;
  statusTone: ContractStatusTone;
  /**
   * 정지 보류(1017 설계서 8-4) — origin/main 필드. 개발 서버(10-21)는 아직 내리지 않아
   * 선택 필드로 둔다(배포 후 `?` 제거).
   */
  sanctionHold?: SanctionHoldView | null;
}

/** 검색과 무관한 큐·탭 카운트 */
export interface AdminContractSummary {
  queues: Partial<Record<AdminContractQueue, number>>;
  tabCounts: Partial<Record<AdminContractTab, number>>;
  /**
   * 서버의 조치 큐 합계 — `RESEND`까지 더한 값이라 화면 · 배지에는 쓰지 않는다.
   * 화면 기준 합계는 `utils/summary.ts`의 `contractActionRequiredCount`.
   */
  actionRequiredCount: number;
}

export interface AdminContractInfo {
  contractId: number;
  contractNumber: string | null;
  title: string | null;
  status: ContractStatus;
  statusLabel: string;
  statusTone: ContractStatusTone;
  startAt: string | null;
  endAt: string | null;
  days: number | null;
  /** email — 모두싸인 수신자 등록용(브랜드 계정 이메일) */
  brand: {
    marketId: number;
    name: string;
    link: string | null;
    email: string | null;
  };
  /** email — 모두싸인 수신자 등록용(인플루언서 비즈니스 이메일) */
  creator: {
    creatorId: number;
    name: string;
    link: string | null;
    email: string | null;
  } | null;
  /** 연결·소통 스레드 — 없으면 null */
  threadId: number | null;
  /** 정지 보류 — `party`가 정지 당사자(B3-s). origin/main 필드 · 개발 서버 미배포 */
  sanctionHold?: SanctionHoldView | null;
  /** 서명 기한이 멈춰 있는가(당사자 정지 보류 중). origin/main 필드 · 개발 서버 미배포 */
  signatureDeadlinePaused?: boolean;
}

export interface AdminContractStepper {
  reviewApprovedAt: string | null;
  reviewApprovedActorName: string | null;
  signatureRequestedAt: string | null;
  signedCount: number;
  /** 공구 생성 처리 시각(운영자) — 1021 이후 「체결」은 공구 생성을 뜻한다 */
  concludedAt: string | null;
  concludedActorName: string | null;
  /** 계약 성립 = 양측 서명 완료 시각(기-05). origin/main 필드 · 개발 서버 미배포 */
  establishedAt?: string | null;
}

export interface AdminContractReview {
  requestedAt: string | null;
  /** 「1일 2시간」 — 서버 문구. 검토 대기가 아니면 null */
  waitingElapsed: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectReason: { code: string; detail: string | null } | null;
}

export interface AdminContractSignature {
  requestedAt: string | null;
  /** 서명 기한 — 만료 판단의 유일한 기준. 운영자가 C1에서 옮겨 적은 값 */
  deadlineAt: string | null;
  brandSignedAt: string | null;
  creatorSignedAt: string | null;
  /** 기준 시각 — 서명 현황 저장 시각. 양측 화면 「N 기준」에 그대로 나간다 */
  asOf: string | null;
  asOfActorName: string | null;
  /** 기한 경과 일수 — 기한 전이면 0 */
  deadlinePassedDays: number;
  /**
   * C1 서명 기한 제안값(기-07) — 검토 대기에서만. origin/main 필드 · 개발 서버 미배포.
   * 서버가 UTC 벽시계로 저장된 공구 시작의 **날짜**로 계산해(23:55) 다른 시각 필드와 시간대가
   * 어긋나므로 화면은 쓰지 않고 `utils/contractView.ts#suggestedDeadlineParts`로 계산한다(백엔드 요청).
   */
  deadlineSuggestedAt?: string | null;
  /** B3-s — 서명 진행중 ∧ 당사자 정지 보류 ∧ 기한 경과. origin/main 필드 · 개발 서버 미배포 */
  deadlineOverdueWhileHeld?: boolean;
}

export interface ContractItem {
  contractItemId: number;
  productId: number | null;
  productName: string | null;
  regularPrice: number | null;
  groupBuyPrice: number | null;
  rewardRate: number | null;
  unitReward: number | null;
  minQuantity: number | null;
}

export interface ContractContent {
  feedCount: number | null;
  reelsCount: number | null;
  storyCount: number | null;
  dueDate: string | null;
  secondaryUseAllowed: boolean | null;
  secondaryUsePeriodType: SecondaryUsePeriodType | null;
  secondaryUseMonths: number | null;
  brandPreReview: boolean | null;
  note: string | null;
}

export interface ContractFixedFee {
  amount: number | null;
  trigger: FixedFeeTrigger | null;
  triggerLabel: string | null;
  noticeAgreedAt: string | null;
  paidAt: string | null;
  obligationAlive: boolean;
  /** 지급 시점 정의(툴팁 · 기-28). origin/main 필드 · 개발 서버 미배포 */
  triggerDescription?: string | null;
  /** 지급 시점 뒤 N영업일 — null이면 [정책값 미정]. origin/main 필드 · 개발 서버 미배포 */
  paymentBusinessDays?: number | null;
}

export interface ContractSettlement {
  platformFeeRate: number;
  pgFeeRate: number | null;
  withholdingType: WithholdingType | null;
  withholdingLabel: string | null;
}

export interface ContractClosure {
  closedAt: string | null;
  actorType: ContractActorType | null;
  reasonCode: string | null;
  reasonLabel: string | null;
  memo: string | null;
}

export interface AdminContractDocument {
  type: ContractDocumentType;
  exists: boolean;
  fileName: string | null;
  downloadUrl: string | null;
  /** 바이트 — 표시 단위는 FE가 계산한다. 문서가 없으면 null */
  sizeBytes: number | null;
  uploadedAt: string | null;
  /** 생성본만 — 어느 제출본으로 만든 파일인지 */
  sourceReviewRequestedAt: string | null;
}

/**
 * 운영자 취소의 요청·처리(C6 · 취소 계약 우측 레일). 운영자 취소가 아니면 상세에서 null.
 * 요청 필드는 기록 도입 이전 취소 건이면 null이고 처리 필드만 채워진다.
 */
export interface AdminContractCancelRequestInfo {
  /** SELLER · CREATOR · ADMIN(직권) */
  requesterType: ContractActorType | null;
  /** 브랜드면 마켓명, 인플루언서면 쇼룸명 — 직권이면 null */
  requesterName: string | null;
  requestChannel: ContractCancelRequestChannel | null;
  requestChannelLabel: string | null;
  requestedAt: string | null;
  processedAt: string | null;
  processedByName: string | null;
}

/** 처리 대기 중인 해지 요청(기-05) — 서버 `TerminationRequestInfo` */
export interface AdminContractTerminationRequestInfo {
  requestId: number;
  /** SELLER · CREATOR */
  requesterType: ContractActorType;
  requesterName: string | null;
  /** 공구 중단 요청과 같은 4종(QUALITY_ISSUE …) */
  reasonCode: string | null;
  reasonLabel: string | null;
  memo: string | null;
  requestedAt: string | null;
  /** 상대방 운영팀 채널에 붙은 「동의 확인」 카드 메시지 */
  consentCardMessageId: number | null;
}

/** 해지 결과(B7) — 서버 `TerminationInfo`. 해지된 계약만 */
export interface AdminContractTerminationInfo {
  terminatedAt: string | null;
  reasonCode: ContractTerminationReasonCode | null;
  reasonLabel: string | null;
  explanation: string | null;
  /** 요청 없이 운영자가 처리했으면 null */
  requesterType: ContractActorType | null;
  requesterName: string | null;
  requestReasonLabel: string | null;
  requestMemo: string | null;
  operatorName: string | null;
  groupBuyClosed: boolean;
}

/** 서명 안내 재발송 — rev.8 ②로 화면에서 뺐다. 응답 호환으로만 남긴다 */
export interface AdminContractResend {
  /** 미처리 재발송 요청 수 */
  pendingCount: number;
  lastRequestedAt: string | null;
  lastRequesterType: ContractActorType | null;
}

export interface AdminContractGroupBuy {
  groupBuyId: number | null;
  groupBuyNumber: string | null;
  status: string | null;
}

/** 버튼 노출 판정 — 서버가 내려준다. FE는 이 값 외의 근거로 버튼을 그리지 않는다 */
export interface AdminContractPermissions {
  canApprove: boolean;
  canReject: boolean;
  canUpdateSignature: boolean;
  /** 폐지 예정 — `canCreateGroupBuy`와 같은 값. 배포 전 서버는 이것만 내린다 */
  canConclude: boolean;
  canExpire: boolean;
  /** rev.8 ②로 화면에서 쓰지 않는다 */
  canHandleResend: boolean;
  canUploadDocument: boolean;
  /** 직권 취소 — 1021 이후 서명 진행중만(성립 뒤는 해지) */
  canCancel: boolean;
  /** [공구 생성](C4) — origin/main 필드 · 개발 서버 미배포 */
  canCreateGroupBuy?: boolean;
  /** [해지 처리](C7) — 성립 뒤 ∧ 공구 오픈 전. origin/main 필드 · 개발 서버 미배포 */
  canTerminate?: boolean;
}

export interface AdminContractHistory {
  eventType: ContractEventType;
  actorType: ContractActorType;
  actorId: number | null;
  /** 어드민 화면은 실명 — 파트너·스튜디오와 달리 익명 처리하지 않는다 */
  actorDisplayName: string | null;
  detail: string | null;
  occurredAt: string;
}

export interface AdminContractDetail {
  contract: AdminContractInfo;
  stepper: AdminContractStepper;
  review: AdminContractReview;
  signature: AdminContractSignature;
  items: Array<ContractItem>;
  content: ContractContent;
  fixedFee: ContractFixedFee;
  settlement: ContractSettlement;
  closure: ContractClosure;
  cancelRequest: AdminContractCancelRequestInfo | null;
  /** 처리 대기 해지 요청 — origin/main 필드 · 개발 서버 미배포 */
  terminationRequest?: AdminContractTerminationRequestInfo | null;
  /** 해지 결과 — origin/main 필드 · 개발 서버 미배포 */
  termination?: AdminContractTerminationInfo | null;
  documents: Array<AdminContractDocument>;
  resend: AdminContractResend;
  groupBuy: AdminContractGroupBuy;
  permissions: AdminContractPermissions;
  history: Array<AdminContractHistory>;
  /** 낙관적 락 — 서명 현황 저장(PUT)에 그대로 보낸다 */
  version: number;
}

export interface AdminContractApproveRequest {
  recipientsRegistered: boolean;
  documentUploaded: boolean;
  requestSent: boolean;
  signatureRequestedAt: string;
  signatureDeadlineAt: string;
}

export interface AdminContractRejectRequest {
  reasonCode: ContractReviewRejectReason;
  reasonDetail: string;
}

export interface AdminContractSignatureRequest {
  brandSignedAt: string | null;
  creatorSignedAt: string | null;
  version: number;
}

export interface AdminContractCancelRequest {
  signatureRequestWithdrawn: boolean;
  reasonCode: ContractCloseReasonCode;
  memo: string;
  /** 필수 — ADMIN이면 운영자 직권(요청자 없음) */
  requesterType: "SELLER" | "CREATOR" | "ADMIN";
  /** 요청자가 브랜드·인플루언서면 필수, 직권이면 null */
  requestChannel: ContractCancelRequestChannel | null;
  /** 요청자가 브랜드·인플루언서면 필수(현재 이전·계약 생성 이후), 직권이면 null */
  requestedAt: string | null;
  /**
   * 상대방 동의를 운영팀 채널에서 확인함(C6 · 기-06) — 서버는 요청자가 브랜드·인플루언서일 때만
   * 필수로 보지만 시안은 직권도 체크 2개를 모두 요구한다. 배포 전 서버는 이 필드를 무시한다.
   */
  counterpartyConsentConfirmed: boolean;
}

/** 해지 처리(C7) — 서버 `TerminateRequest` · POST /admin/contracts/{id}/terminate */
export interface AdminContractTerminateRequest {
  reasonCode: ContractTerminationReasonCode;
  /** 필수 · 1000자 — 양측 운영팀 채널 카드에 그대로 나간다 */
  explanation: string;
  counterpartyConsentConfirmed: boolean;
  groupBuyNotOpenedConfirmed: boolean;
  /** 처리할 해지 요청 — 요청 없이 운영자가 처리하면 null */
  requestId: number | null;
}

export interface AdminContractProcessResponse {
  contractId: number;
  status: ContractStatus;
  version: number;
  /** 공구 생성 응답에만 — 함께 만들어진 공구 번호 */
  groupBuyNumber: string | null;
}

export interface AdminContractPresignResponse {
  s3Key: string;
  uploadUrl: string;
  contentType: string;
  expiresInSeconds: number;
}

export interface AdminContractDownloadResponse {
  downloadUrl: string;
  fileName: string;
  sizeBytes: number | null;
  expiresInSeconds: number;
  sourceReviewRequestedAt: string | null;
}
