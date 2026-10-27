/*
  계약 상세 DEV 목업 — origin/main(1021 기-05 · 06 · 07)에 생겼지만 개발 서버(10-21)에 아직 없는
  필드 · 상태(TERMINATED · 해지 요청 · 정지 중 기한 경과 · 공구 생성/해지 권한)를 로컬에서 시안 state로 보기 위한 것.
  서비스(`services/adminContractService.ts`)가 `?mock=` 시나리오일 때만 동적 import로 불러 배포 번들에 들어가지 않는다.
  모양은 origin/main `AdminContractDto.Detail` 그대로, 값은 시안 ui-admin-01 rev.9.
  백엔드 배포 후 삭제.
*/
import type {
  AdminContractDetail,
  AdminContractHistory,
  AdminContractProcessResponse,
  AdminContractSummary,
  ContractStatus,
} from "@/features/contract/types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const CONTRACT_MOCK_SCENARIOS = [
  "c1",
  "b3s",
  "b4",
  "b5",
  "b5-request",
  "b7",
] as const;

export type ContractMockScenario = (typeof CONTRACT_MOCK_SCENARIOS)[number];

export function isContractMockScenario(
  value: string | null
): value is ContractMockScenario {
  return (
    value !== null &&
    (CONTRACT_MOCK_SCENARIOS as ReadonlyArray<string>).includes(value)
  );
}

/** 시안의 KST 시각 → 서버 형식(UTC 벽시계 · 시간대 표기 없음) */
function k(value: string) {
  return dayjs(`${value.replace(" ", "T")}:00+09:00`)
    .utc()
    .format("YYYY-MM-DDTHH:mm:ss");
}

function h(
  eventType: AdminContractHistory["eventType"],
  actorType: AdminContractHistory["actorType"],
  actorDisplayName: string | null,
  occurredAt: string,
  detail: string | null = null
): AdminContractHistory {
  return {
    eventType,
    actorType,
    actorId: null,
    actorDisplayName,
    detail,
    occurredAt,
  };
}

const STATUS_META: Record<
  ContractStatus,
  Pick<AdminContractDetail["contract"], "statusLabel" | "statusTone">
> = {
  DRAFT: { statusLabel: "작성중", statusTone: "NEUTRAL" },
  REVIEW_PENDING: { statusLabel: "검토 대기", statusTone: "INFO" },
  REVIEW_REJECTED: { statusLabel: "검토 반려", statusTone: "WARNING" },
  SIGNING: { statusLabel: "서명 진행중", statusTone: "INFO" },
  CONCLUSION_PENDING: { statusLabel: "공구 생성 대기", statusTone: "INFO" },
  CONCLUDED: { statusLabel: "체결완료", statusTone: "SUCCESS" },
  DECLINED: { statusLabel: "거절", statusTone: "DANGER" },
  EXPIRED: { statusLabel: "만료", statusTone: "NEUTRAL" },
  CANCELED: { statusLabel: "취소", statusTone: "NEUTRAL" },
  TERMINATED: { statusLabel: "해지", statusTone: "NEUTRAL" },
};

const NO_PERMISSIONS: AdminContractDetail["permissions"] = {
  canApprove: false,
  canReject: false,
  canUpdateSignature: false,
  canConclude: false,
  canExpire: false,
  canHandleResend: false,
  canUploadDocument: false,
  canCancel: false,
  canCreateGroupBuy: false,
  canTerminate: false,
};

const SIGNED = {
  brand: k("2026-08-14 09:12"),
  creator: k("2026-08-14 11:40"),
  asOf: k("2026-08-14 12:00"),
  requested: k("2026-08-13 16:40"),
  approved: k("2026-08-13 15:20"),
  reviewRequested: k("2026-08-13 14:50"),
  concluded: k("2026-08-14 12:08"),
};

/** 시안 B3~B7 「여름 수분 세럼 공구」 — 시나리오마다 상태 블록만 갈아 끼운다 */
function base(contractId: number, status: ContractStatus): AdminContractDetail {
  return {
    contract: {
      contractId,
      contractNumber: "CTR-20260813-034",
      title: "여름 수분 세럼 공구",
      status,
      ...STATUS_META[status],
      startAt: k("2026-08-24 10:00"),
      endAt: k("2026-08-31 23:55"),
      days: 8,
      brand: {
        marketId: 12,
        name: "무드코스메틱",
        link: null,
        email: "contact@moodcosmetic.kr",
      },
      creator: {
        creatorId: 34,
        name: "뷰티_소연",
        link: null,
        email: "soyeon.biz@gmail.com",
      },
      threadId: null,
      sanctionHold: null,
      signatureDeadlinePaused: false,
    },
    stepper: {
      reviewApprovedAt: SIGNED.approved,
      reviewApprovedActorName: "김운영",
      signatureRequestedAt: SIGNED.requested,
      signedCount: 2,
      concludedAt: null,
      concludedActorName: null,
      establishedAt: SIGNED.creator,
    },
    review: {
      requestedAt: SIGNED.reviewRequested,
      waitingElapsed: null,
      approvedAt: SIGNED.approved,
      rejectedAt: null,
      rejectReason: null,
    },
    signature: {
      requestedAt: SIGNED.requested,
      deadlineAt: k("2026-08-21 23:55"),
      brandSignedAt: SIGNED.brand,
      creatorSignedAt: SIGNED.creator,
      asOf: SIGNED.asOf,
      asOfActorName: "김운영",
      deadlinePassedDays: 0,
      deadlineSuggestedAt: null,
      deadlineOverdueWhileHeld: false,
    },
    items: [
      {
        contractItemId: 1,
        productId: 101,
        productName: "수분진정 세럼 30ml",
        regularPrice: 32000,
        groupBuyPrice: 28000,
        rewardRate: 15,
        unitReward: 4200,
        minQuantity: 300,
      },
      {
        contractItemId: 2,
        productId: 102,
        productName: "수분진정 크림 50ml",
        regularPrice: 24000,
        groupBuyPrice: 22000,
        rewardRate: 12,
        unitReward: 2640,
        minQuantity: 150,
      },
    ],
    content: {
      feedCount: 1,
      reelsCount: 1,
      storyCount: 3,
      dueDate: "2026-08-31",
      secondaryUseAllowed: true,
      secondaryUsePeriodType: "FIXED",
      secondaryUseMonths: 12,
      brandPreReview: true,
      note: "2차 활용 범위: 자사 상세페이지·인스타 광고 소재로 게시 후 12개월간 사용. 스토리 3회는 공구 기간 중 균등 분배.",
    },
    fixedFee: {
      amount: 1200000,
      trigger: "POST_REGISTERED",
      triggerLabel: "공구 게시물 등록 후",
      noticeAgreedAt: SIGNED.reviewRequested,
      paidAt: null,
      obligationAlive: true,
      triggerDescription: "운영자 오픈 승인 후 게시물이 쇼룸에 노출된 때",
      paymentBusinessDays: null,
    },
    settlement: {
      platformFeeRate: 10,
      pgFeeRate: 3.3,
      withholdingType: "WITHHOLDING_3_3",
      withholdingLabel: "원천징수 3.3%",
    },
    closure: {
      closedAt: null,
      actorType: null,
      reasonCode: null,
      reasonLabel: null,
      memo: null,
    },
    cancelRequest: null,
    terminationRequest: null,
    termination: null,
    documents: [
      {
        type: "GENERATED_DRAFT",
        exists: true,
        fileName: "계약서_여름수분세럼공구_CTR-20260813-034.pdf",
        downloadUrl: null,
        sizeBytes: 182000,
        uploadedAt: SIGNED.reviewRequested,
        sourceReviewRequestedAt: SIGNED.reviewRequested,
      },
      {
        type: "SIGNED_PDF",
        exists: true,
        fileName: "서명완료_여름수분세럼공구_CTR-20260813-034.pdf",
        downloadUrl: null,
        sizeBytes: 1258291,
        uploadedAt: k("2026-08-14 12:02"),
        sourceReviewRequestedAt: null,
      },
      {
        type: "AUDIT_TRAIL",
        exists: true,
        fileName: "감사추적인증서_CTR-20260813-034.pdf",
        downloadUrl: null,
        sizeBytes: 348160,
        uploadedAt: k("2026-08-14 12:06"),
        sourceReviewRequestedAt: null,
      },
    ],
    resend: { pendingCount: 0, lastRequestedAt: null, lastRequesterType: null },
    groupBuy: { groupBuyId: null, groupBuyNumber: null, status: null },
    permissions: NO_PERMISSIONS,
    history: [
      h("REVIEW_REQUESTED", "SELLER", "무드코스메틱", SIGNED.reviewRequested),
      h("REVIEW_APPROVED", "ADMIN", "김운영", SIGNED.approved),
      h("SIGNATURE_SENT", "ADMIN", "김운영", SIGNED.requested),
      h(
        "SIGNATURE_UPDATED",
        "ADMIN",
        "김운영",
        k("2026-08-14 09:30"),
        `브랜드 서명: null → ${SIGNED.brand}`
      ),
    ],
    version: 3,
  };
}

/** 양측 서명 저장 · 성립까지의 이력(B4 이후 공통) */
function establishedHistory(): Array<AdminContractHistory> {
  return [
    h("ESTABLISHED", "SYSTEM", null, SIGNED.creator),
    h(
      "SIGNATURE_UPDATED",
      "ADMIN",
      "김운영",
      SIGNED.asOf,
      `인플루언서 서명: null → ${SIGNED.creator}`
    ),
    h("BOTH_SIGNED_CONFIRMED", "ADMIN", "김운영", SIGNED.asOf),
  ];
}

function concludedHistory(): Array<AdminContractHistory> {
  return [
    h(
      "DOCUMENT_UPLOADED",
      "ADMIN",
      "김운영",
      k("2026-08-14 12:02"),
      "SIGNED_PDF"
    ),
    h(
      "DOCUMENT_UPLOADED",
      "ADMIN",
      "김운영",
      k("2026-08-14 12:06"),
      "AUDIT_TRAIL"
    ),
    h("CONCLUDED", "ADMIN", "김운영", SIGNED.concluded),
    h(
      "GROUP_BUY_CREATED",
      "SYSTEM",
      null,
      SIGNED.concluded,
      "GRB-20260814-021"
    ),
  ];
}

function c1(contractId: number): AdminContractDetail {
  // 제안값이 보이도록 공구 시작을 오늘 기준 20일 뒤 10:00(KST)로 둔다(시안 날짜는 이미 지났다)
  const start = dayjs().add(20, "day").hour(10).minute(0).second(0);
  const requested = k(dayjs().subtract(1, "day").format("YYYY-MM-DD HH:mm"));
  const detail = base(contractId, "REVIEW_PENDING");
  return {
    ...detail,
    contract: {
      ...detail.contract,
      contractNumber: "CTR-20260813-041",
      title: "겨울 리페어 크림 공구",
      startAt: start.utc().format("YYYY-MM-DDTHH:mm:ss"),
      endAt: start
        .add(7, "day")
        .hour(23)
        .minute(55)
        .utc()
        .format("YYYY-MM-DDTHH:mm:ss"),
      brand: {
        ...detail.contract.brand,
        name: "글로우랩",
        email: "contact@glowlab.kr",
      },
      creator: {
        creatorId: 35,
        name: "뷰티_하윤",
        link: null,
        email: "hayun.beauty@gmail.com",
      },
    },
    stepper: {
      reviewApprovedAt: null,
      reviewApprovedActorName: null,
      signatureRequestedAt: null,
      signedCount: 0,
      concludedAt: null,
      concludedActorName: null,
      establishedAt: null,
    },
    review: {
      requestedAt: requested,
      waitingElapsed: "1일 2시간",
      approvedAt: null,
      rejectedAt: null,
      rejectReason: null,
    },
    signature: {
      ...detail.signature,
      requestedAt: null,
      deadlineAt: null,
      brandSignedAt: null,
      creatorSignedAt: null,
      asOf: null,
      asOfActorName: null,
      // 서버 계산 그대로(UTC 날짜 기준) — 화면은 쓰지 않는다(types.ts 주석)
      deadlineSuggestedAt: `${start.utc().subtract(3, "day").format("YYYY-MM-DD")}T23:55:00`,
    },
    documents: detail.documents.map((document) =>
      document.type === "GENERATED_DRAFT"
        ? { ...document, sourceReviewRequestedAt: requested }
        : { ...document, exists: false, fileName: null, sizeBytes: null }
    ),
    permissions: { ...NO_PERMISSIONS, canApprove: true, canReject: true },
    history: [h("REVIEW_REQUESTED", "SELLER", "글로우랩", requested)],
  };
}

function b3s(contractId: number): AdminContractDetail {
  const detail = base(contractId, "SIGNING");
  const deadline = detail.signature.deadlineAt as string;
  return {
    ...detail,
    contract: {
      ...detail.contract,
      sanctionHold: {
        kind: "ADMIN",
        label: "서명 보류 · 계정 이용 정지",
        tone: "WARNING",
        party: "CREATOR",
      },
      signatureDeadlinePaused: true,
    },
    stepper: { ...detail.stepper, signedCount: 1, establishedAt: null },
    signature: {
      ...detail.signature,
      creatorSignedAt: null,
      asOf: k("2026-08-14 09:30"),
      deadlinePassedDays: Math.max(
        0,
        dayjs().diff(dayjs.utc(deadline).local(), "day")
      ),
      deadlineOverdueWhileHeld: true,
    },
    documents: detail.documents.map((document) =>
      document.type === "GENERATED_DRAFT"
        ? document
        : { ...document, exists: false, fileName: null, sizeBytes: null }
    ),
    permissions: {
      ...NO_PERMISSIONS,
      canUpdateSignature: true,
      canExpire: true,
      canCancel: true,
    },
  };
}

function b4(contractId: number): AdminContractDetail {
  const detail = base(contractId, "CONCLUSION_PENDING");
  return {
    ...detail,
    documents: detail.documents.map((document) =>
      document.type === "AUDIT_TRAIL"
        ? { ...document, exists: false, fileName: null, sizeBytes: null }
        : document
    ),
    permissions: {
      ...NO_PERMISSIONS,
      canUpdateSignature: true,
      canUploadDocument: true,
      canTerminate: true,
    },
    history: [...detail.history, ...establishedHistory()],
  };
}

function b5(contractId: number, withRequest: boolean): AdminContractDetail {
  const detail = base(contractId, "CONCLUDED");
  const requestedAt = k("2026-08-16 10:05");
  return {
    ...detail,
    stepper: {
      ...detail.stepper,
      concludedAt: SIGNED.concluded,
      concludedActorName: "김운영",
    },
    groupBuy: {
      groupBuyId: 21,
      groupBuyNumber: "GRB-20260814-021",
      status: "PREPARING",
    },
    terminationRequest: withRequest
      ? {
          requestId: 7,
          requesterType: "SELLER",
          requesterName: "무드코스메틱",
          reasonCode: "NEGOTIATION_BROKEN",
          reasonLabel: "인플루언서와 협의 결렬",
          memo: "공구 기간 재협의가 필요해 해지를 요청합니다.",
          requestedAt,
          consentCardMessageId: 501,
        }
      : null,
    permissions: { ...NO_PERMISSIONS, canTerminate: true },
    history: [
      ...detail.history,
      ...establishedHistory(),
      ...concludedHistory(),
      ...(withRequest
        ? [
            h(
              "TERMINATION_REQUESTED",
              "SELLER",
              "무드코스메틱",
              requestedAt,
              "인플루언서와 협의 결렬"
            ),
          ]
        : []),
    ],
  };
}

function b7(contractId: number): AdminContractDetail {
  const detail = b5(contractId, true);
  const terminatedAt = k("2026-08-16 10:40");
  return {
    ...detail,
    contract: {
      ...detail.contract,
      status: "TERMINATED",
      ...STATUS_META.TERMINATED,
    },
    groupBuy: { ...detail.groupBuy, status: "TERMINATED" },
    closure: {
      closedAt: terminatedAt,
      actorType: "ADMIN",
      reasonCode: "TERMINATE_RENEGOTIATION",
      reasonLabel: "당사자 요청 — 조건 재협의 필요",
      memo: "브랜드 요청으로 공구 기간 재협의가 필요해 이 계약을 해지합니다.",
    },
    terminationRequest: null,
    termination: {
      terminatedAt,
      reasonCode: "TERMINATE_RENEGOTIATION",
      reasonLabel: "당사자 요청 — 조건 재협의 필요",
      explanation:
        "브랜드 요청으로 공구 기간 재협의가 필요해 이 계약을 해지합니다.",
      requesterType: "SELLER",
      requesterName: "무드코스메틱",
      requestReasonLabel: "인플루언서와 협의 결렬",
      requestMemo: "공구 기간 재협의가 필요해 해지를 요청합니다.",
      operatorName: "김운영",
      groupBuyClosed: true,
    },
    permissions: NO_PERMISSIONS,
    history: [
      ...detail.history,
      h(
        "TERMINATED",
        "ADMIN",
        "김운영",
        terminatedAt,
        "당사자 요청 — 조건 재협의 필요"
      ),
    ],
  };
}

/** 목업에서 해지 처리한 계약 — 다시 불러오면 B7로 보인다(새로고침하면 초기화) */
const terminatedIds = new Set<number>();

export function mockContractDetail(
  scenario: ContractMockScenario,
  contractId: number
): AdminContractDetail {
  if (terminatedIds.has(contractId)) {
    return b7(contractId);
  }
  switch (scenario) {
    case "c1":
      return c1(contractId);
    case "b3s":
      return b3s(contractId);
    case "b4":
      return b4(contractId);
    case "b5":
      return b5(contractId, false);
    case "b5-request":
      return b5(contractId, true);
    case "b7":
      return b7(contractId);
  }
}

/** 요약 — 실서버 요약에 「해지 요청」 큐 1건을 더한다(개발 서버는 이 큐를 세지 않는다) */
export function mockContractSummary(
  real: AdminContractSummary
): AdminContractSummary {
  return { ...real, queues: { ...real.queues, TERMINATION: 1 } };
}

/** 목업 시나리오의 쓰기 — 서버로 보내지 않고 성공 응답만 돌려준다(실데이터 보호) */
export function mockProcess(
  contractId: number,
  status: ContractStatus
): AdminContractProcessResponse {
  if (status === "TERMINATED") {
    terminatedIds.add(contractId);
  }
  return {
    contractId,
    status,
    version: 4,
    groupBuyNumber: status === "CONCLUDED" ? "GRB-20260814-021" : null,
  };
}
