import {
  formatDateTimeShort,
  parseServerDateTime,
} from "@/common/utils/formatDate";
import dayjs from "dayjs";
import type {
  AdminContractDetail,
  ContractStatus,
} from "@/features/contract/types";
import {
  SIGNATURE_DEADLINE_DAYS_BEFORE_START,
  SIGNATURE_DEADLINE_SUGGEST_TIME,
} from "@/features/contract/constants/params";
import {
  formatMonthDay,
  formatTime,
  formatMonthDayTime,
  type DateTimeParts,
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
  "TERMINATED",
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

/**
 * 당사자 계정 정지 중에 서명 기한이 지났다(B3-s · 기-07) — 정지된 쪽은 서명을 마칠 수 없으므로
 * 만료 확인 화면(C5 뒤)으로 넘기지 않고 「모두싸인 기한 연장 · 재발송」을 먼저 안내한다.
 * 서버 플래그(origin/main)만 근거로 쓴다 — 배포 전 서버는 내리지 않아 false다.
 */
export function isHeldDeadlineOverdue(detail: AdminContractDetail) {
  return (
    detail.contract.status === "SIGNING" &&
    detail.signature.deadlineOverdueWhileHeld === true
  );
}

/**
 * 서명 기한 경과 — 서명 진행중인데 기한이 지났다(시안 C5 뒤 화면). 시스템이 닫지 않으므로
 * 운영자가 만료시킬 때까지 이 상태로 남는다. 서버 `deadlinePassedDays`는 일 단위라 당일 경과를 못 잡는다.
 * 당사자 정지 중의 경과(B3-s)는 여기서 빼고 `isHeldDeadlineOverdue`가 따로 다룬다.
 */
export function isSignatureOverdue(detail: AdminContractDetail) {
  const { deadlineAt } = detail.signature;
  return (
    detail.contract.status === "SIGNING" &&
    deadlineAt !== null &&
    parseServerDateTime(deadlineAt).isBefore(dayjs()) &&
    !isHeldDeadlineOverdue(detail)
  );
}

/** 「기한 경과」 값 — 하루가 안 됐으면 「오늘」 */
export function overdueDaysText(detail: AdminContractDetail) {
  const days = detail.signature.deadlinePassedDays;
  return days > 0 ? `${days}일` : "오늘";
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
    label: "운영자 공구 생성",
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
            // 시안 C5 뒤 화면 「브랜드 완료 · 인플루언서 미서명 · 기한 경과」
            isSignatureOverdue(detail)
              ? `${signProgress(detail, "미서명")} · 기한 경과`
              : signProgress(detail),
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
          // 시안 B5 「08.14 09:12 · 11:40」 — 같은 날이면 두 번째는 시각만 적는다
          who: `${formatMonthDayTime(signature.brandSignedAt)} · ${
            formatMonthDay(signature.brandSignedAt) ===
            formatMonthDay(signature.creatorSignedAt)
              ? formatTime(signature.creatorSignedAt)
              : formatMonthDayTime(signature.creatorSignedAt)
          }`,
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
        { ...conclude, who: "진행되지 않음" },
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
    case "TERMINATED":
      // 시안 B7 — 성립(양측 서명 완료)까지는 끝난 계약이다. 공구를 만들었으면 그 칩도 완료로 남기고,
      // 해지 일시·사유는 레일에 둔다(시안 B7 스텝퍼는 B6 복사본이라 서명 칩이 어긋나 있어 데이터대로 그린다)
      return [
        approved,
        sent,
        {
          label: "양측 서명 완료",
          who: `${formatMonthDayTime(signature.brandSignedAt)} · ${formatMonthDayTime(signature.creatorSignedAt)}`,
          tone: "done",
        },
        stepper.concludedAt
          ? {
              ...conclude,
              who: [
                formatMonthDayTime(stepper.concludedAt),
                stepper.concludedActorName,
              ]
                .filter(Boolean)
                .join(" · "),
              tone: "done",
            }
          : conclude,
      ];
    default:
      return [];
  }
}

/**
 * C1 서명 기한 기본값(기-07) — 공구 시작일(KST) N일 전 23:55. 운영자가 확인한 뒤 모두싸인에 같은 값을 넣는다.
 * 서버 `signature.deadlineSuggestedAt`은 UTC 벽시계로 저장된 공구 시작의 **UTC 날짜**로 23:55를 붙여
 * 다른 시각 필드와 시간대가 어긋난다(KST 10:00 시작이면 다음 날 08:55로 보인다) — 그래서 FE가 같은 규칙으로
 * 계산한다(백엔드 요청). 제안값이 이미 지났으면 서버와 같이 비워 둔다.
 */
export function suggestedDeadlineParts(
  detail: AdminContractDetail
): DateTimeParts | null {
  const { startAt } = detail.contract;
  if (!startAt) {
    return null;
  }
  const suggested = parseServerDateTime(startAt)
    .subtract(SIGNATURE_DEADLINE_DAYS_BEFORE_START, "day")
    .hour(Number(SIGNATURE_DEADLINE_SUGGEST_TIME.hour))
    .minute(Number(SIGNATURE_DEADLINE_SUGGEST_TIME.minute))
    .second(0);
  if (!suggested.isAfter(dayjs())) {
    return null;
  }
  return {
    date: suggested.format("YYYY-MM-DD"),
    hour: SIGNATURE_DEADLINE_SUGGEST_TIME.hour,
    minute: SIGNATURE_DEADLINE_SUGGEST_TIME.minute,
  };
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
    case "TERMINATED":
      return f(
        detail.termination?.terminatedAt ?? closure.closedAt,
        "운영자 해지 처리"
      );
    default:
      return null;
  }
}
