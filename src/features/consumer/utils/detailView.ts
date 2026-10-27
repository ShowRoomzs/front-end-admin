import type { HistoryDotTone } from "@/common/components/HistoryList/HistoryList";
import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import { parseServerDateTime, parseWallClock } from "@/common/utils/formatDate";
import {
  MEMO_EDIT_WINDOW_HOURS,
  PENDING_TARGET_PATHS,
} from "@/features/consumer/constants/detail";
import type {
  ConsumerElapsed,
  ConsumerMemo,
  ConsumerPendingChipLink,
  ConsumerRecentOrder,
  ServerTone,
} from "@/features/consumer/types/consumerDetail";

/** KST 벽시계 값(정지 종료일 · 기한)은 시간대 변환 없이 그대로 읽는다 */
export function formatKstDate(value: string | null): string {
  return value ? parseWallClock(value).format("YYYY.MM.DD") : "—";
}

/** UTC 이벤트 시각의 시:분만(해제 칩 「해제됨 · 김운영 · 14:22」) */
export function formatServerTime(value: string | null): string {
  return value ? parseServerDateTime(value).format("HH:mm") : "—";
}

export function formatWon(value: number | null): string {
  return value === null ? "—" : `${value.toLocaleString()}원`;
}

/** mm:ss — 자동 잠금 카운트다운 */
export function formatCountdown(seconds: number): string {
  const safe = Math.max(0, seconds);
  const mm = String(Math.floor(safe / 60)).padStart(2, "0");
  const ss = String(safe % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/** 가입 후 경과 「6개월 13일」 · 「8개월」 · 「13일」 */
export function formatElapsed(elapsed: ConsumerElapsed | null): string {
  if (!elapsed) return "—";
  const parts: Array<string> = [];
  if (elapsed.months > 0) parts.push(`${elapsed.months}개월`);
  if (elapsed.days > 0 || parts.length === 0) parts.push(`${elapsed.days}일`);
  return parts.join(" ");
}

/** 서버 톤(대문자) → 처리 이력 점 색. 시안 `.h-info`는 액센트 계열이다 */
export function historyTone(tone: ServerTone): HistoryDotTone {
  switch (tone) {
    case "DANGER":
      return "danger";
    case "WARNING":
      return "warn";
    case "SUCCESS":
      return "success";
    case "INFO":
      return "accent";
    default:
      return "muted";
  }
}

/**
 * 최근 주문 상태 칸 — 반품 · 교환 요약이 있으면 그 문구(「반품완료」 · 「교환완료」 · 56 C2),
 * 없으면 배송 이행 상태. 종결된 반품 · 교환은 중립(원칙 ② 종결), 진행 중은 정보색이다.
 */
export function orderStatusBadge(order: ConsumerRecentOrder): {
  variant: StatusBadgeVariant;
  label: string;
} {
  const group = order.groups[0];
  if (!group) return { variant: "neutral", label: "—" };
  if (group.claim) {
    return {
      variant: group.claim.result === null ? "info" : "neutral",
      label: group.claim.label,
    };
  }
  const toneMap: Record<ServerTone, StatusBadgeVariant> = {
    NEUTRAL: "neutral",
    INFO: "info",
    WARNING: "warning",
    SUCCESS: "success",
    DANGER: "danger",
  };
  return {
    variant: toneMap[group.statusTone] ?? "neutral",
    label: group.statusLabel,
  };
}

/** 한 주문에 하위주문(브랜드)이 여럿이면 첫 하위주문 기준 + 「외 N」 */
export function orderBrandLabel(order: ConsumerRecentOrder): string {
  const [first, ...rest] = order.groups;
  if (!first) return "—";
  return rest.length > 0
    ? `${first.brandName} 외 ${rest.length}`
    : first.brandName;
}

export function orderProductLabel(order: ConsumerRecentOrder): string {
  return order.groups[0]?.itemSummary ?? "—";
}

/** 칩 · 링크가 가리키는 어드민 목록 주소 — 쿼리는 서버가 준 그대로(userId 포함) */
export function pendingLinkHref(link: ConsumerPendingChipLink): string {
  const search = new URLSearchParams(link.query).toString();
  return `${PENDING_TARGET_PATHS[link.target]}${search ? `?${search}` : ""}`;
}

/**
 * 수정 · 삭제할 수 없는 메모의 이유 문구(시안 A1 · B1 · C1).
 * 서버 `editable`이 판정이고, 여기서는 어느 문구를 보일지만 고른다.
 *
 * 「24시간 경과」는 **내가 쓴** 메모에만 맞는 말이다. 응답에 「내 메모」 표시가 없어
 * `editable = true`인 메모의 작성자를 나로 본다(editable은 작성자 본인일 때만 참).
 * 나를 알 수 없으면 언제나 참인 「작성자 본인만 …」을 쓴다.
 */
export function memoLockText(
  memo: ConsumerMemo,
  withdrawn: boolean,
  myName: string | null,
  now: number
): string {
  if (withdrawn) return "탈퇴 계정 · 조회 전용";
  const created = parseServerDateTime(memo.createdAt).valueOf();
  const expired = now - created > MEMO_EDIT_WINDOW_HOURS * 60 * 60 * 1000;
  if (myName !== null && memo.authorName === myName && expired) {
    return "작성 후 24시간 경과 · 수정·삭제 불가";
  }
  return "작성자 본인만 24시간 내 수정·삭제";
}
