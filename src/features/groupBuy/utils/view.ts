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

/** 서버 LocalDate까지 오늘부터 며칠 남았나 — 지났으면 음수 */
export function daysUntilLocalDate(value: string): number {
  return dayjs(value).startOf("day").diff(dayjs().startOf("day"), "day");
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

/** 두 서버 시각 사이의 날짜 차이(달력 기준) — 「종료 후 3일」 · 「소요 12일」 */
export function daysBetween(
  from: string | null | undefined,
  to: string | null | undefined
): number | null {
  if (!from || !to) {
    return null;
  }
  return parseServerDateTime(to)
    .startOf("day")
    .diff(parseServerDateTime(from).startOf("day"), "day");
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

/** 상품명 끝의 용량·구성 표기 — 「50ml」 「120매」 「2개입」 「SPF50+」 「기획」 「리필」 */
const NAME_TAIL_TOKEN =
  /^(\d+(\.\d+)?\s*(ml|l|g|kg|mg|매|개입|개|입|ea|p)|spf\d+\+*|pa\+*|기획|세트|리필|단품|본품|대용량|미니)$/i;

/** 두 단어가 한 품목인 이름 — 「클렌징 폼」을 「폼」으로 줄이면 무슨 상품인지 알 수 없다 */
const COMPOUND_ITEM_NAMES = new Set([
  "클렌징 폼",
  "클렌징 오일",
  "클렌징 워터",
  "클렌징 밤",
  "토너 패드",
  "선 크림",
  "선 스틱",
  "선 쿠션",
  "아이 크림",
  "핸드 크림",
  "립 밤",
  "립 틴트",
  "시트 마스크",
  "슬리핑 마스크",
  "바디 로션",
  "바디 워시",
]);

/**
 * KPI 한 줄용 짧은 상품명 — 시안 「에센스 130 · 토닉 88」(리페어 헤어 에센스 100ml → 에센스).
 * 서버는 전체 상품명만 내리므로 끝의 용량·구성 표기를 떼고 품목 단어만 남긴다.
 */
export function shortProductName(name: string): string {
  const words = name
    .replace(/\[[^\]]*\]|\([^)]*\)/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  while (words.length > 1 && NAME_TAIL_TOKEN.test(words[words.length - 1])) {
    words.pop();
  }
  if (words.length === 0) {
    return name;
  }
  const lastTwo = words.slice(-2).join(" ");
  if (words.length >= 2 && COMPOUND_ITEM_NAMES.has(lastTwo)) {
    return lastTwo;
  }
  return words[words.length - 1];
}

/** 판매 수량 합계와 상품별 내역 — 「에센스 130 · 토닉 88」 */
export function quantityText(detail: Detail) {
  const quantities = detail.sales?.itemQuantities ?? [];
  const total = quantities.reduce((sum, item) => sum + item.quantity, 0);
  const names = quantities.map(
    (item) =>
      detail.items.find((product) => product.productId === item.productId)
        ?.productName ?? "상품"
  );
  const shortNames = names.map(shortProductName);
  const breakdown = quantities
    .map((item, index) => {
      // 줄인 이름이 겹치면(수분 크림 · 영양 크림) 어느 상품인지 모르니 전체 이름을 쓴다
      const short = shortNames[index];
      const name =
        shortNames.indexOf(short) === shortNames.lastIndexOf(short)
          ? short
          : names[index];
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
  POST_SUBMITTED: { label: "공구 게시물 등록", tone: "accent" },
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

/** 「앞 · 뒤 · …」를 첫 구분자에서 가른다 — 서버 detail은 「핵심 · 부가」 순서로 쓴다 */
function splitDetail(detail: string): [string, string | null] {
  const index = detail.indexOf(" · ");
  return index < 0
    ? [detail, null]
    : [detail.slice(0, index), detail.slice(index + 3)];
}

/** 이행 확인 방향 — 확인한 쪽 → 확인받은 쪽(시안 B5 「이행 (브랜드 → 인플루언서)」) */
function fulfillmentDirection(actorType: GroupBuyActorType): string {
  if (actorType === "SELLER") {
    return " (브랜드 → 인플루언서)";
  }
  return actorType === "CREATOR" ? " (인플루언서 → 브랜드)" : "";
}

/**
 * 서버 이력(최신순) → 공용 HistoryList 항목. 문장은 FE가 짓는다.
 * 부가 문구(detail)는 시안 자리에 놓는다 — 사유처럼 사건을 가르는 말은 본문(htxt)에,
 * 일정·경로처럼 덧붙는 말은 일시·처리자 줄(hmeta)에.
 */
export function toHistoryItems(history: Detail["history"]): Array<HistoryItem> {
  return history.flatMap((entry): Array<HistoryItem> => {
    const text = EVENT_TEXT[entry.eventType] ?? {
      label: entry.eventType,
      tone: "muted" as const,
    };
    let label = text.label;
    let meta: string | null = null;
    const detail = entry.detail;

    switch (entry.eventType) {
      case "POST_SUBMITTED":
        // 시안 B1 — 게시물 등록과 오픈 승인 요청을 두 줄로 남긴다(같은 시각 · 같은 주체)
        return [
          {
            label: "오픈 승인 요청 접수",
            processedAt: entry.occurredAt,
            tone: "warn",
            processorName: actorText(entry.actorType, entry.actorDisplayName),
          },
          {
            label: detail ? `공구 게시물 등록 · ${detail}` : "공구 게시물 등록",
            processedAt: entry.occurredAt,
            tone: "accent",
            processorName: actorText(entry.actorType, entry.actorDisplayName),
          },
        ];
      case "POST_EDITED": {
        // 서버 detail 「2회차 · 재승인 없음」 → 「공구 게시물 수정 (인플루언서 · 2회차)」 + hmeta 「재승인 없음」
        const [round, rest] = detail ? splitDetail(detail) : [null, null];
        label = round
          ? `공구 게시물 수정 (인플루언서 · ${round})`
          : entry.revisionNo !== null
            ? `${text.label} (${entry.revisionNo}판)`
            : text.label;
        meta = rest;
        break;
      }
      case "SUSPENSION_NOTICED": {
        // 「제17조① 1호 법령 위반 · 집행 예정 … · 소명 기한 …」 — 조항은 본문, 일정은 hmeta
        const [clause, rest] = detail ? splitDetail(detail) : [null, null];
        label = clause ? `${text.label} — ${clause}` : text.label;
        meta = rest;
        break;
      }
      case "EXTENSION_REQUESTED":
        // 「7일 · 사유」 — 사유 원문은 연장 카드에 있으므로 이력에는 기간만
        label = detail ? `${text.label} · ${splitDetail(detail)[0]}` : label;
        break;
      case "FULFILLMENT_CONFIRMED":
        label = `${text.label}${fulfillmentDirection(entry.actorType)}`;
        break;
      case "FULFILLMENT_DISPUTED":
        // 제출 사유 원문은 이행 확인 카드가 보여 준다 — 이력에는 방향만
        label = `계약 이행 확인 — 미이행${fulfillmentDirection(entry.actorType)} · 정산 보류`;
        break;
      case "FULFILLMENT_AUTO_CONFIRMED":
        // 서버 detail = 무응답이었던 쪽(SELLER · CREATOR)
        meta =
          detail === "SELLER"
            ? "브랜드 무응답으로 자동 이행"
            : detail === "CREATOR"
              ? "인플루언서 무응답으로 자동 이행"
              : null;
        break;
      case "FULFILLMENT_AGREED":
      case "FULFILLMENT_RESOLVED":
        // 「양측 동의」 · 「정산 관리」 — 처리 경로라 hmeta에 붙인다
        meta = detail;
        break;
      default:
        label = detail ? `${label} · ${detail}` : label;
    }

    const actor = actorText(entry.actorType, entry.actorDisplayName);
    return [
      {
        label,
        processedAt: entry.occurredAt,
        tone: text.tone,
        processorName: meta ? `${actor} · ${meta}` : actor,
      },
    ];
  });
}
