import { formatDateTimeShort } from "@/common/utils/formatDate";
import type {
  AdminContractDetail,
  ContractStatus,
} from "@/features/contract/types";
import {
  formatMonthDay,
  formatMonthDayTime,
} from "@/features/contract/utils/datetime";

/** 시안 `.stp` 톤 — 파트너센터와 같은 축(거절만 위험, 만료·취소는 중립) */
export type StepTone = "todo" | "done" | "cur" | "stop" | "halt";

export interface StepChip {
  label: string;
  who: string;
  tone: StepTone;
}

/** 서명 입력이 열리는 구간 — 체결 완료 전까지만 체크를 고치고 되돌릴 수 있다 */
export const SIGNING_PHASE: Array<ContractStatus> = [
  "SIGNING",
  "CONCLUSION_PENDING",
];

export const CLOSED_STATUSES: Array<ContractStatus> = [
  "DECLINED",
  "EXPIRED",
  "CANCELED",
];

/** 이력에서 특정 이벤트의 처리자 이름을 찾는다(최신 우선) */
function actorOf(detail: AdminContractDetail, eventType: string) {
  const entry = [...detail.history]
    .reverse()
    .find((item) => item.eventType === eventType);
  return entry?.actorDisplayName ?? null;
}

/** 서명 진행 요약 — 진행 중이면 「대기」, 종결됐으면 「없음」(더 기다릴 서명이 없다) */
function signProgress(detail: AdminContractDetail, empty = "대기") {
  const { brandSignedAt, creatorSignedAt } = detail.signature;
  const brand = brandSignedAt ? "브랜드 완료" : `브랜드 ${empty}`;
  const creator = creatorSignedAt ? "인플루언서 완료" : `인플루언서 ${empty}`;
  return `${brand} · ${creator}`;
}

/** 시안 B1~B6 스텝퍼 — 4스텝 + 종결 칩 */
export function buildStepper(detail: AdminContractDetail): Array<StepChip> {
  const { review, signature, stepper, contract, closure } = detail;

  const approved: StepChip = {
    label: "운영자 검토 통과",
    who: [
      formatMonthDayTime(review.approvedAt),
      stepper.reviewApprovedActorName,
    ]
      .filter(Boolean)
      .join(" · "),
    tone: "done",
  };
  const sent: StepChip = {
    label: "서명 요청 발송",
    who: `${formatMonthDayTime(signature.requestedAt)} · 모두싸인`,
    tone: "done",
  };
  const conclude: StepChip = {
    label: "운영자 체결 완료 처리",
    who: "—",
    tone: "todo",
  };

  switch (contract.status) {
    case "REVIEW_PENDING":
      return [
        {
          label: "운영자 검토",
          who: `제출 ${formatMonthDayTime(review.requestedAt)} · 확인 중`,
          tone: "cur",
        },
        {
          label: "서명 요청 발송",
          who: "통과 시 모두싸인에서 양측 발송",
          tone: "todo",
        },
        { label: "양측 서명", who: "—", tone: "todo" },
        conclude,
      ];
    case "REVIEW_REJECTED":
      return [
        {
          label: "운영자 검토 반려",
          who: [
            formatMonthDayTime(review.rejectedAt),
            actorOf(detail, "REVIEW_REJECTED"),
          ]
            .filter(Boolean)
            .join(" · "),
          tone: "stop",
        },
        { label: "서명 요청 발송", who: "—", tone: "todo" },
        { label: "양측 서명", who: "—", tone: "todo" },
        conclude,
      ];
    case "SIGNING":
      return [
        approved,
        sent,
        {
          label: "양측 서명",
          who:
            signProgress(detail) +
            (signature.deadlinePassedDays > 0 ? " · 기한 경과" : ""),
          tone: "cur",
        },
        conclude,
      ];
    case "CONCLUSION_PENDING":
      return [
        approved,
        sent,
        {
          label: "양측 서명 완료",
          who: `브랜드 ${formatMonthDayTime(signature.brandSignedAt)} · 인플루언서 ${formatMonthDayTime(signature.creatorSignedAt)}`,
          tone: "done",
        },
        { ...conclude, who: "확인 중", tone: "cur" },
      ];
    case "CONCLUDED":
      return [
        approved,
        sent,
        {
          label: "양측 서명 완료",
          who: `${formatMonthDayTime(signature.brandSignedAt)} · ${formatMonthDayTime(signature.creatorSignedAt)}`,
          tone: "done",
        },
        {
          ...conclude,
          who: [
            formatMonthDayTime(stepper.concludedAt),
            stepper.concludedActorName,
          ]
            .filter(Boolean)
            .join(" · "),
          tone: "done",
        },
      ];
    case "DECLINED":
      return [
        approved,
        sent,
        {
          label: "인플루언서 거절",
          who: `${contract.creator?.name ?? "인플루언서"} · ${formatMonthDayTime(closure.closedAt)}`,
          tone: "stop",
        },
        { ...conclude, label: "체결완료", who: "진행되지 않음" },
      ];
    case "EXPIRED":
      return [
        approved,
        sent,
        {
          label: "서명 기한 초과",
          who: `${formatMonthDay(signature.deadlineAt)}까지 · ${signProgress(detail, "없음")}`,
          tone: "halt",
        },
        {
          label: "만료 처리",
          who: [
            formatMonthDayTime(closure.closedAt),
            actorOf(detail, "EXPIRED"),
          ]
            .filter(Boolean)
            .join(" · "),
          tone: "halt",
        },
      ];
    case "CANCELED":
      // 시안 B6 — 서명 스텝은 진행되지 않은 채(취소 시점 기록만) 남는다
      return [
        approved,
        sent,
        {
          label: "양측 서명",
          who: `${signature.brandSignedAt ? "브랜드 완료" : "브랜드 없음"} · ${signature.creatorSignedAt ? "인플루언서 완료" : "인플루언서 없음"}`,
          tone: "todo",
        },
        conclude,
      ];
    default:
      return [];
  }
}

/** 상세 헤더 설명 줄 — "CTR · 브랜드 × 인플루언서 · 시각 이벤트" */
export function headerEvent(detail: AdminContractDetail) {
  const { contract, review, signature, stepper, closure } = detail;
  const f = (value: string | null, suffix: string) =>
    value ? `${formatDateTimeShort(value)} ${suffix}` : null;
  switch (contract.status) {
    case "REVIEW_PENDING":
      return f(review.requestedAt, "검토 요청");
    case "REVIEW_REJECTED":
      return f(review.rejectedAt, "반려");
    case "SIGNING":
      return f(signature.requestedAt, "서명 요청 발송");
    case "CONCLUSION_PENDING":
      return f(signature.asOf, "양측 서명 확인");
    case "CONCLUDED":
      return f(stepper.concludedAt, "체결");
    case "DECLINED":
      return f(closure.closedAt, "거절");
    case "EXPIRED":
      return f(closure.closedAt, "만료 처리");
    case "CANCELED":
      return f(closure.closedAt, "운영자 직권 취소");
    default:
      return null;
  }
}
