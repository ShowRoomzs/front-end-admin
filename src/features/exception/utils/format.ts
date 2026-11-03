import { parseServerDateTime } from "@/common/utils/formatDate";
import {
  CLAIM_LIST_PATH,
  ORDER_LIST_PATH,
} from "@/features/exception/constants/params";
import type { ExceptionLink } from "@/features/exception/types";

/**
 * 기한 열 — 시안 표기 「09.16 23:59」(연도 없음).
 * 서버는 기한을 UTC 순간(`…Z` · 09.16 23:59 KST = `2026-09-16T14:59:59Z`)으로 내린다 —
 * 문자열을 그대로 자르면 9시간 이르게 보이므로 KST로 고정해 읽는다.
 */
export function formatMonthDayTime(value: string | null) {
  return value
    ? parseServerDateTime(value).utcOffset(9).format("MM.DD HH:mm")
    : "—";
}

/**
 * 「자동 알림 3회 무응답 · 대행 가능」의 마지막 마디를 굵게 — 시안은 조건을 배지가 아니라 글자로 적고
 * 결론(「대행 가능」)만 강조한다. 문장 자체는 서버가 만든다.
 */
export function splitLastSegment(label: string) {
  const index = label.lastIndexOf(" · ");
  if (index < 0) {
    return { head: "", tail: label };
  }
  return { head: label.slice(0, index + 3), tail: label.slice(index + 3) };
}

/**
 * 열기 — 이 화면에는 실행 버튼이 없고 대행은 상세에서 한다(같은 조치를 두 화면에 두면
 * 근거를 읽지 않고 누르는 경로가 생긴다). 목적지는 서버 `link`가 정한다.
 */
export function openPath(link: ExceptionLink) {
  if (link.type === "CLAIM" && link.claimId !== null) {
    return `${CLAIM_LIST_PATH}?claimId=${link.claimId}`;
  }
  return `${ORDER_LIST_PATH}?orderId=${link.orderId}`;
}
