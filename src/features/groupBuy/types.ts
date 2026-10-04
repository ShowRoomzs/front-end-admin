/*
  공구 관리(어드민) — 서버 `/v1/admin/group-buys` 응답을 그대로 옮긴 타입.
  근거: back-end `api/admin/groupbuy/dto/*` · `domain/groupbuy/type/*`.

  판정 버튼(승인·반려·숨김·통지·집행·철회·긴급)은 서버 permissions로만 노출한다 —
  실행 API가 같은 판정으로 409를 내므로 FE가 조건을 복제하지 않는다.
*/

export type GroupBuyTone =
  "NEUTRAL" | "INFO" | "WARNING" | "SUCCESS" | "DANGER";

export type GroupBuyStatus =
  | "PREPARING"
  | "READY"
  | "IN_PROGRESS"
  | "SUSPENSION_SCHEDULED"
  | "ENDED"
  | "SETTLED"
  | "SUSPENDED";

export type GroupBuyPostStatus =
  | "NOT_WRITTEN"
  | "WRITING"
  | "PENDING_APPROVAL"
  | "REJECTED"
  | "SCHEDULED"
  | "EXPOSED"
  | "HIDDEN"
  | "CLOSED";

export type AdminGroupBuyTab =
  | "ALL"
  | "ACTION_REQUIRED"
  | "PREPARING"
  | "READY"
  | "IN_PROGRESS"
  | "ENDED"
  | "SETTLED"
  | "SUSPENDED";

export type AdminGroupBuySort =
  "ACTION_REQUIRED_FIRST" | "CREATED_DESC" | "END_AT_ASC";

export type AdminGroupBuyQueue =
  "OPEN_REVIEW" | "SUSPEND_REQUEST" | "EARLY_CLOSE_REQUEST" | "APPEAL_REVIEW";

export type GroupBuyActorType = "SELLER" | "CREATOR" | "ADMIN" | "SYSTEM";

export type GroupBuyCloseType = "COMPLETED" | "EARLY_CLOSED" | "SUSPENDED";

export type PostRejectReason =
  | "AD_EFFECT_ASSERTION"
  | "AD_MEDICAL_CLAIM"
  | "AD_SUPERLATIVE"
  | "CONTRACT_PRODUCT_MISMATCH"
  | "CONTRACT_PRICE_MISMATCH"
  | "DISCLOSURE_DAMAGED"
  | "ETC";

export type PostHideReason =
  | "AD_EFFECT_ASSERTION"
  | "AD_MEDICAL_CLAIM"
  | "AD_SUPERLATIVE"
  | "DISCLOSURE_DAMAGED"
  | "CONTRACT_MISMATCH"
  | "FALSE_INFORMATION"
  | "ETC";

export type SuspensionReasonClause =
  "ART17_1_LAW" | "ART17_2_IP_DEFECT" | "ART17_3_BREACH" | "ART17_4_DISPUTE";

export type EmergencySuspensionReason =
  "CONSUMER_HARM" | "AUTHORITY_ORDER" | "DAMAGE_SURGE";

export type SuspensionWithdrawReason =
  "RECTIFIED" | "NOT_A_VIOLATION" | "NOT_BRAND_FAULT" | "ETC";

export type GroupBuyIssueType =
  "CONTENT_FULFILLMENT" | "TERMS_INTERPRETATION" | "SETTLEMENT_AMOUNT" | "ETC";

export type FulfillmentResult = "FULFILLED" | "UNFULFILLED";

export type FulfillmentDuty =
  "SHOWROOM_POST" | "FEED" | "REELS" | "STORY" | "ORDER_DELIVERY";

export type SettlementBlocker =
  | "UNCLOSED_ORDERS"
  | "FULFILLMENT_PENDING"
  | "FULFILLMENT_DISPUTE"
  | "CLOSURE_UNKNOWN";

// ── 목록 ──────────────────────────────────────────────

export interface AdminGroupBuyListParams {
  tab: AdminGroupBuyTab;
  keyword: string;
  sort: AdminGroupBuySort;
  page: number;
  size: number;
}

export interface AdminGroupBuyListItem {
  groupBuyId: number;
  groupBuyNumber: string;
  title: string;
  creatorName: string;
  brandName: string;
  itemCount: number;
  startAt: string;
  endAt: string;
  postStatus: GroupBuyPostStatus;
  postStatusLabel: string;
  postStatusTone: GroupBuyTone;
  status: GroupBuyStatus;
  statusLabel: string;
  statusTone: GroupBuyTone;
  actionRequired: boolean;
}

export interface AdminGroupBuySummary {
  queues: Partial<Record<AdminGroupBuyQueue, number>>;
  actionRequiredCount: number;
  tabCounts: Partial<Record<AdminGroupBuyTab, number>>;
  nearestDeadlines: Array<{
    queue: AdminGroupBuyQueue;
    groupBuyId: number;
    title: string;
    dueAt: string;
    daysLeft: number;
  }>;
  settlementWatch: {
    watchingCount: number;
    overdueCount: number;
    nearest: {
      groupBuyId: number;
      title: string;
      dueAt: string;
      reached: boolean;
    } | null;
  } | null;
}

// ── 상세 ──────────────────────────────────────────────

export interface FulfillmentCheck {
  result: FulfillmentResult;
  reason: string | null;
  checkedAt: string;
  checkedByName: string | null;
  auto: boolean;
}

export interface FulfillmentTarget {
  duties: Array<FulfillmentDuty>;
  counts: {
    feed: number | null;
    reels: number | null;
    story: number | null;
  } | null;
}

export interface AdminGroupBuyDetail {
  groupBuy: {
    groupBuyId: number;
    groupBuyNumber: string;
    title: string;
    status: GroupBuyStatus;
    statusLabel: string;
    statusTone: GroupBuyTone;
    createdAt: string;
    readyAt: string | null;
    openedAt: string | null;
    endedAt: string | null;
    closeType: GroupBuyCloseType | null;
    closeTypeLabel: string | null;
    settledAt: string | null;
  };
  timeline: {
    startAt: string;
    endAt: string;
    originalEndAt: string;
    totalDays: number;
    elapsedDays: number;
    daysUntilStart: number | null;
    daysUntilEnd: number | null;
    startOverdue: boolean;
  };
  brand: { marketId: number; name: string; pairThreadId: number | null };
  creator: { creatorId: number; name: string; accountId: string | null };
  contract: {
    contractId: number;
    contractNumber: string;
    concludedAt: string | null;
  };
  items: Array<{
    productId: number | null;
    productName: string;
    regularPrice: number | null;
    groupBuyPrice: number | null;
    rewardRate: number | null;
    expectedUnitReward: number | null;
    /** 옵션별 최소 물량의 합계 */
    minQuantity: number | null;
    /** 옵션별 판매가(공구가 + 옵션가) · 최소 물량 — 옵션 없는 상품은 이름 없는 1행 */
    options: Array<{
      variantId: number | null;
      variantName: string | null;
      salePrice: number | null;
      minQuantity: number | null;
    }>;
  }>;
  fixedFee: {
    amount: number | null;
    trigger: string | null;
    triggerLabel: string | null;
    displayText: string | null;
  };
  readiness: {
    gates: Array<{
      key: "STOCK_CONFIRMED" | "POST_SUBMITTED" | "OPEN_APPROVED";
      actorType: GroupBuyActorType;
      done: boolean;
      doneAt: string | null;
      doneByName: string | null;
      state: "DONE" | "WAITING" | "REJECTED" | "MY_TURN";
      tone: GroupBuyTone;
    }>;
  } | null;
  openReview: {
    submittedAt: string;
    slaBusinessDays: number;
    dueAt: string;
    daysLeft: number;
    startAt: string;
    overdue: boolean;
  } | null;
  post: {
    status: GroupBuyPostStatus;
    statusLabel: string;
    statusTone: GroupBuyTone;
    postNumber: string | null;
    title: string | null;
    content: string | null;
    disclosureText: string | null;
    submittedAt: string | null;
    reviewedAt: string | null;
    reviewedByName: string | null;
    lastEditedAt: string | null;
    editCount: number;
    latestRevisionNo: number | null;
    rejection: {
      code: string;
      label: string | null;
      axis: string;
      axisLabel: string | null;
      detail: string;
      rejectedAt: string;
      rejectedByName: string | null;
    } | null;
    hidden: {
      code: string;
      label: string | null;
      detail: string;
      hiddenAt: string;
      hiddenByName: string | null;
      hiddenDays: number;
      revisionNo: number | null;
      ordersSinceHidden: number | null;
    } | null;
    closedBy: GroupBuyCloseType | null;
  };
  sales: {
    basis: "LIVE" | "SETTLED";
    orderCount: number;
    amount: number;
    rewardAmount: number;
    itemQuantities: Array<{ productId: number; quantity: number }>;
  } | null;
  activeRequest: {
    requestId: number;
    type: "SUSPEND" | "EARLY_CLOSE";
    typeLabel: string;
    requesterType: GroupBuyActorType;
    requesterName: string;
    reasonCode: string;
    reasonLabel: string | null;
    memo: string | null;
    statusAtRequest: GroupBuyStatus;
    requestedAt: string;
    elapsed: string;
    decisionBasis: {
      ordersAtRequest: number | null;
      ordersNow: number | null;
      ordersSinceRequest: number | null;
      quantityNow: number | null;
      amountNow: number | null;
      inquiries: { total: number | null; defectRelated: number | null } | null;
      preparedQuantity: number | null;
      sellThroughRate: number | null;
      soldOutInquiriesSinceRequest: number | null;
      originalEndAt: string | null;
      endsImmediatelyIfApproved: boolean | null;
    } | null;
  } | null;
  extension: {
    status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
    days: number;
    reason: string | null;
    beforeEndAt: string;
    afterEndAt: string;
    beforeTotalDays: number;
    afterTotalDays: number;
    requestedAt: string;
    respondDeadlineAt: string;
    respondedAt: string | null;
    responseActorType: GroupBuyActorType | null;
    rejectReasonCode: string | null;
    rejectReasonLabel: string | null;
    rejectMemo: string | null;
  } | null;
  adminSuspension: {
    adminSuspensionId: number;
    kind: "NOTICE" | "EMERGENCY";
    clause: SuspensionReasonClause | null;
    clauseLabel: string | null;
    noticeBody: string;
    noticedAt: string;
    noticedByName: string | null;
    elapsedDays: number;
    executeScheduledAt: string;
    appealDeadlineAt: string;
    noticeRevisionNo: number | null;
    salesSinceNotice: { orders: number; amount: number } | null;
    appeal: {
      content: string;
      submittedAt: string;
      submittedByName: string | null;
      attachments: Array<{
        attachmentId: number;
        name: string;
        contentType: string;
        sizeBytes: number;
      }>;
    } | null;
    appealDeadlinePassed: boolean;
  } | null;
  afterEnd: {
    fulfillment: {
      brandToCreator: FulfillmentCheck | null;
      creatorToBrand: FulfillmentCheck | null;
      targets: {
        brandToCreator: FulfillmentTarget;
        creatorToBrand: FulfillmentTarget;
      };
      dueAt: string | null;
      duePassed: boolean;
      autoConfirmOnTimeout: boolean;
      threadId: number | null;
      agreedAt: string | null;
      resolutionNote: string | null;
      resolvedAt: string | null;
      onHold: boolean;
    } | null;
    settlement: {
      stage: "WAITING" | "CONFIRMED" | "TRANSFERRED";
      stageSource: "PORT" | "DERIVED";
      blockers: Array<SettlementBlocker>;
      watch: { dueAt: string; elapsedDays: number; reached: boolean } | null;
      preview: {
        provisionalSalesAmount: number | null;
        rewardRates: Array<number>;
        rewardAmount: number | null;
      };
    } | null;
    orderClosure: {
      totalCount: number;
      closedCount: number;
      unclosedCount: number;
      unclosed: Array<{ stage: string; label: string; count: number }>;
      /** 종결 중 구매확정(반품·교환 거절 확정 포함) — 판매 모듈이 모르면 null */
      purchaseConfirmedCount: number | null;
      /** 종결 중 환불(결제 후 취소) — 판매 모듈이 모르면 null */
      refundedCount: number | null;
    } | null;
    openIssue: {
      issueId: number;
      issueType: GroupBuyIssueType;
      issueTypeLabel: string;
      openerType: GroupBuyActorType;
      openedAt: string;
      threadId: number | null;
    } | null;
  } | null;
  closure: {
    closeType: GroupBuyCloseType;
    closeTypeLabel: string;
    endedAt: string;
    source: "REQUEST" | "ADMIN_NOTICE" | "ADMIN_EMERGENCY" | null;
    reasonLabel: string | null;
    reasonDetail: string | null;
    requester: {
      type: GroupBuyActorType;
      name: string;
      requestedAt: string;
    } | null;
    decidedByName: string | null;
    decisionReason: string | null;
    acceptedOrderCount: number | null;
    adminBasis: {
      kind: "NOTICE" | "EMERGENCY";
      clause: SuspensionReasonClause | null;
      emergencyReason: EmergencySuspensionReason | null;
      basisLabel: string;
      body: string;
      executionNote: string | null;
    } | null;
  } | null;
  permissions: {
    canApproveOpen: boolean;
    canRejectOpen: boolean;
    canHidePost: boolean;
    canUnhidePost: boolean;
    canNoticeSuspension: boolean;
    noticeUnavailableReason:
      "STATUS" | "REQUEST_PENDING" | "NO_WINDOW_BEFORE_END" | null;
    canEmergencySuspend: boolean;
    canExecuteSuspension: boolean;
    canWithdrawSuspension: boolean;
    canApproveRequest: boolean;
    canRejectRequest: boolean;
    canOpenIssue: boolean;
    canConfirmSettlement: boolean;
  };
  history: Array<{
    eventType: string;
    actorType: GroupBuyActorType;
    actorDisplayName: string | null;
    detail: string | null;
    occurredAt: string;
    synthetic: boolean;
    revisionNo: number | null;
  }>;
  navigation: {
    prevGroupBuyId: number | null;
    nextGroupBuyId: number | null;
  } | null;
}

export interface DetailNavParams {
  tab?: string;
  keyword?: string;
  sort?: string;
}

// ── 실행 요청 · 응답 ──────────────────────────────────

export interface ActionResponse {
  groupBuyId: number;
  status: GroupBuyStatus;
  statusLabel: string;
  postStatus: GroupBuyPostStatus;
  postStatusLabel: string;
  openAt: string | null;
  revisionAdvanced: boolean | null;
  clauseCaution: string | null;
}

/** 게시물 판본(`AdminGroupBuyDto.PostRevisionItem`) — 차분은 서버가 계산하지 않는다 */
export interface PostRevision {
  revisionNo: number;
  /** 제출·재제출 | 승인 후 수정 */
  kind: "SUBMITTED" | "EDITED";
  title: string | null;
  content: string | null;
  createdAt: string;
  /** 운영자가 승인한 판 */
  approved: boolean;
  /** 현재·마지막 숨김의 기준 판 */
  hiddenBasis: boolean;
  /** 숨김 해제 판단에 쓴 판 */
  unhiddenBasis: boolean;
  /** 최근 직권 중단 통지의 기준 판 */
  noticeBasis: boolean;
  latest: boolean;
}

export interface NoticeOptions {
  today: string;
  appealDeadline: { default: string; min: string };
  executionDates: Array<{ date: string; selectable: boolean }>;
  latestExecutionBefore: string;
  available: boolean;
  unavailableReason: string | null;
}

export interface OpenRejectBody {
  reasonCode: PostRejectReason;
  detail: string;
}

export interface PostHideBody {
  reasonCode: PostHideReason;
  detail: string;
  observedRevisionNo: number | null;
}

export interface SuspensionNoticeBody {
  clause: SuspensionReasonClause;
  executeScheduledAt: string;
  appealDeadlineAt: string;
  noticeBody: string;
}

export interface SuspensionWithdrawBody {
  reasonCode: SuspensionWithdrawReason;
  detail: string;
}

export interface EmergencySuspensionBody {
  emergencyReason: EmergencySuspensionReason;
  body: string;
}

export interface IssueOpenBody {
  issueType: GroupBuyIssueType;
  content: string;
}
