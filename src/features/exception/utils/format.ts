import {
  CLAIM_LIST_PATH,
  ORDER_LIST_PATH,
} from "@/features/exception/constants/params";
import type { ExceptionLink } from "@/features/exception/types";

/**
 * 서버 LocalDateTime(「2026-10-07T23:59:59」 · 한국 시각 · 시간대 없음)에서 바로 자른다 —
 * `new Date()`로 읽으면 브라우저 시간대로 해석돼 한국 밖에서 날짜가 밀린다.
 */
const LOCAL_DATE_TIME = /^\d{4}-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

/** 기한 열 — 시안 표기 「09.16 23:59」(연도 없음) */
export function formatMonthDayTime(value: string | null) {
  const match = value ? LOCAL_DATE_TIME.exec(value) : null;
  if (!match) {
    return "—";
  }
  const [, month, day, hour, minute] = match;
  return `${month}.${day} ${hour}:${minute}`;
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
