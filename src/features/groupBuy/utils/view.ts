import type {
  HistoryDotTone,
  HistoryItem,
} from "@/common/components/HistoryList/HistoryList";
import {
  formatDateOnly,
  formatDateTimeShort,
  parseServerDateTime,
} from "@/common/utils/formatDate";
import type {
  AdminGroupBuyDetail,
  FulfillmentTarget,
  GroupBuyActorType,
} from "@/features/groupBuy/types";
import dayjs from "dayjs";

export type Detail = AdminGroupBuyDetail;

export function num(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "—"
    : value.toLocaleString("ko-KR");
}

export function won(value: number | null | undefined): string {
  return value === null || value === undefined
    ? "—"
    : `${value.toLocaleString("ko-KR")}원`;
}

export const dt = (value: string | null | undefined) =>
  formatDateTimeShort(value ?? null);
export const d = (value: string | null | undefined) =>
  formatDateOnly(value ?? null);

/** "08.14 10:00" */
export function md(value: string | null | undefined): string {
  return value ? parseServerDateTime(value).format("MM.DD HH:mm") : "—";
}

/** "08.14" */
export function mdDate(value: string | null | undefined): string {
  return value ? parseServerDateTime(value).format("MM.DD") : "—";
}

/** 서버 LocalDate(yyyy-MM-dd) */
export function localDate(value: string | null | undefined): string {
  return value ? dayjs(value).format("YYYY.MM.DD") : "—";
}

/** 공구 기간 — 「2026.08.22 10:00 ~ 09.05 23:55」(같은 해면 끝 연도를 줄인다) */
export function periodShort(startAt: string, endAt: string): string {
  const start = parseServerDateTime(startAt);
  const end = parseServerDateTime(endAt);
  const endText =
    start.year() === end.year()
      ? end.format("MM.DD HH:mm")
      : end.format("YYYY.MM.DD HH:mm");
  return `${start.format("YYYY.MM.DD HH:mm")} ~ ${endText}`;
}

/** 목록 공구 기간 — 양끝 모두 연도까지 */
export function periodFull(startAt: string, endAt: string): string {
  return `${dt(startAt)} ~ ${dt(endAt)}`;
}

/** 「D-2」 · 「D-day」 · 지났으면 「D+1」 */
export function dLabel(daysLeft: number): string {
  if (daysLeft === 0) {
    return "D-day";
  }
  return daysLeft > 0 ? `D-${daysLeft}` : `D+${Math.abs(daysLeft)}`;
}

export function dDayFromNow(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const diff = parseServerDateTime(value)
    .startOf("day")
    .diff(dayjs().startOf("day"), "day");
  return dLabel(diff);
}

/** 주체 표기 — 「브랜드(퓨어랩)」 · 「인플루언서(소연 쇼룸)」 · 「운영자(김운영)」 */
export function actorText(
  type: GroupBuyActorType,
  name: string | null | undefined
): string {
  switch (type) {
    case "SELLER":
      return name ? `브랜드(${name})` : "브랜드";
    case "CREATOR":
      return name ? `인플루언서(${name})` : "인플루언서";
    case "ADMIN":
      return name ? `운영자(${name})` : "운영자";
    default:
      return "시스템";
  }
}

/** 이행 의무 — 「콘텐츠 의무(쇼룸 게시물 · 피드 1 · 릴스 1 · 스토리 3)」 · 「배송 의무」 */
export function dutyText(target: FulfillmentTarget | null | undefined): string {
  if (!target) {
    return "—";
  }
  if (target.duties.includes("ORDER_DELIVERY")) {
    return "배송 의무";
  }
  const counts = target.counts;
  const parts = target.duties.map((duty) => {
    switch (duty) {
      case "SHOWROOM_POST":
        return "쇼룸 게시물";
      case "FEED":
        return `피드 ${counts?.feed ?? ""}`.trim();
      case "REELS":
        return `릴스 ${counts?.reels ?? ""}`.trim();
      case "STORY":
        return `스토리 ${counts?.story ?? ""}`.trim();
      default:
        return "";
    }
  });
  return `콘텐츠 의무(${parts.filter(Boolean).join(" · ")})`;
}

/** 판매 수량 합계와 상품별 내역 */
export function quantityText(detail: Detail) {
  const quantities = detail.sales?.itemQuantities ?? [];
  const total = quantities.reduce((sum, item) => sum + item.quantity, 0);
  const breakdown = quantities
    .map((item) => {
      const name =
        detail.items.find((product) => product.productId === item.productId)
          ?.productName ?? "상품";
      return `${name} ${item.quantity.toLocaleString("ko-KR")}`;
    })
    .join(" · ");
  return { total, breakdown };
}

/** 상세가 지금 어느 판정 화면인지 — 시안 B1~B6 */
export type AdminView =
  | "openReview"
  | "preparing"
  | "notice"
  | "request"
  | "hidden"
  | "extension"
  | "selling"
  | "ended"
  | "suspended";

export function adminView(detail: Detail): AdminView {
  const { groupBuy, post, activeRequest, adminSuspension, extension } = detail;
  switch (groupBuy.status) {
    case "PREPARING":
    case "READY":
      if (activeRequest) {
        return "request";
      }
      return post.status === "PENDING_APPROVAL" ? "openReview" : "preparing";
    case "SUSPENSION_SCHEDULED":
      return adminSuspension ? "notice" : "selling";
    case "IN_PROGRESS":
      if (activeRequest) {
        return "request";
      }
      if (post.status === "HIDDEN") {
        return "hidden";
      }
      if (extension?.status === "PENDING") {
        return "extension";
      }
      return "selling";
    case "ENDED":
    case "SETTLED":
      return "ended";
    case "SUSPENDED":
    default:
      return "suspended";
  }
}

// ── 처리 이력 ─────────────────────────────────────────

const EVENT_TEXT: Record<string, { label: string; tone: HistoryDotTone }> = {
  CREATED: { label: "공구 생성 · 계약 체결", tone: "accent" },
  STOCK_CONFIRMED: { label: "최소 준비 물량 확보 확인", tone: "accent" },
  POST_SUBMITTED: { label: "공구 게시물 등록 · 오픈 승인 요청", tone: "warn" },
  OPEN_APPROVED: { label: "오픈 승인", tone: "success" },
  OPEN_REJECTED: { label: "오픈 승인 반려", tone: "warn" },
  READY: { label: "준비 조건 충족 · 준비완료", tone: "success" },
  OPENED: { label: "공구 시작 · 게시물 노출", tone: "accent" },
  POST_EDITED: { label: "공구 게시물 수정", tone: "accent" },
  POST_HIDDEN: { label: "공구 게시물 숨김", tone: "warn" },
  POST_UNHIDDEN: { label: "공구 게시물 숨김 해제", tone: "success" },
  EXTENSION_REQUESTED: { label: "기간 연장 요청 발신", tone: "accent" },
  EXTENSION_ACCEPTED: {
    label: "기간 연장 수락 · 종료일 변경",
    tone: "success",
  },
  EXTENSION_REJECTED: { label: "기간 연장 거절", tone: "danger" },
  EXTENSION_EXPIRED: {
    label: "기간 연장 요청 만료 · 변경 없음",
    tone: "muted",
  },
  EARLY_CLOSE_REQUESTED: { label: "조기 마감 요청 접수", tone: "warn" },
  EARLY_CLOSE_REJECTED: { label: "조기 마감 요청 반려", tone: "danger" },
  EARLY_CLOSED: { label: "조기 마감 승인 · 공구 종료", tone: "accent" },
  SUSPENSION_REQUESTED: { label: "공구 중단 요청 접수", tone: "warn" },
  SUSPENSION_REJECTED: { label: "공구 중단 요청 반려", tone: "muted" },
  SUSPENDED: { label: "공구 중단 승인", tone: "danger" },
  SUSPENSION_NOTICED: { label: "직권 중단 사전 통지 발송", tone: "warn" },
  APPEAL_SUBMITTED: { label: "브랜드 소명 제출", tone: "accent" },
  SUSPENSION_WITHDRAWN: { label: "직권 중단 철회", tone: "success" },
  SUSPENDED_BY_ADMIN: { label: "직권 중단 집행", tone: "danger" },
  SUSPENDED_EMERGENCY: {
    label: "긴급 직권 중단(사후 통지)",
    tone: "danger",
  },
  ENDED: { label: "공구 종료 · 게시물 내림", tone: "accent" },
  ISSUE_OPENED: { label: "이슈 스레드 개설", tone: "warn" },
  FULFILLMENT_CONFIRMED: { label: "계약 이행 확인 — 이행", tone: "success" },
  FULFILLMENT_DISPUTED: {
    label: "계약 이행 확인 — 미이행 · 정산 보류",
    tone: "warn",
  },
  FULFILLMENT_AUTO_CONFIRMED: {
    label: "계약 이행 확인 — 무응답 자동 이행",
    tone: "success",
  },
  FULFILLMENT_AGREED: {
    label: "이슈 스레드 종결 · 이행 합의",
    tone: "success",
  },
  FULFILLMENT_RESOLVED: { label: "정산 보류 해제", tone: "success" },
  SALES_FINALIZED: { label: "전 주문 종결 · 실적 확정", tone: "accent" },
  SETTLED: { label: "정산 완료 · 이체", tone: "success" },
};

/** 서버 이력(최신순) → 공용 HistoryList 항목. 문장은 FE가 짓고 부가 문구(detail)를 붙인다 */
export function toHistoryItems(history: Detail["history"]): Array<HistoryItem> {
  return history.map((entry) => {
    const text = EVENT_TEXT[entry.eventType] ?? {
      label: entry.eventType,
      tone: "muted" as const,
    };
    const label =
      entry.eventType === "POST_EDITED" && entry.revisionNo !== null
        ? `${text.label} (${entry.revisionNo}판)`
        : text.label;
    return {
      label: entry.detail ? `${label} · ${entry.detail}` : label,
      processedAt: entry.occurredAt,
      tone: text.tone,
      processorName: actorText(entry.actorType, entry.actorDisplayName),
    };
  });
}
