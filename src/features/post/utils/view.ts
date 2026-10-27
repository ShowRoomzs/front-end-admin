import { parseServerDateTime } from "@/common/utils/formatDate";
import {
  REASON_CODE_LABEL,
  TIMELINE_ACTOR_LABEL,
} from "@/features/post/constants/labels";
import {
  CLAUSE_SHORT_TAG,
  POLICY_PLACEHOLDER,
} from "@/features/post/constants/provisional";
import type {
  AdminPostDetail,
  AdminPostReports,
  AdminPostSuspension,
  AdminPostTimelineItem,
  PostPolicyClause,
} from "@/features/post/types";
import dayjs from "dayjs";

/*
  이 화면의 날짜는 전부 서버 이벤트 시각(UTC 벽시계)이다 — types.ts 머리 주석.
  D-n은 서버가 내리지 않는다(캐시한 응답이 날을 넘기면 틀린다 · 54 설계 3-3). 오늘과 기한의 달력 날짜 차이로 센다.
*/

/** 2026.08.11 21:05 */
export function dateTime(value: string | null | undefined): string {
  return value ? parseServerDateTime(value).format("YYYY.MM.DD HH:mm") : "—";
}

/** 2026.08.15 */
export function dateOnly(value: string | null | undefined): string {
  return value ? parseServerDateTime(value).format("YYYY.MM.DD") : "—";
}

/** 08.10 21:14 — 같은 해 안의 부기 */
export function monthDayTime(value: string | null | undefined): string {
  return value ? parseServerDateTime(value).format("MM.DD HH:mm") : "—";
}

/** 보관 ~2027.02 */
export function yearMonth(value: string | null | undefined): string {
  return value ? parseServerDateTime(value).format("YYYY.MM") : "—";
}

/** 기준 시각(없으면 지금)에서 기한까지 남은 달력 일수 — 지났으면 음수 */
export function daysLeft(
  deadline: string | null | undefined,
  from?: string | null
): number | null {
  if (!deadline) {
    return null;
  }
  const base = from ? parseServerDateTime(from) : dayjs();
  return parseServerDateTime(deadline)
    .startOf("day")
    .diff(base.startOf("day"), "day");
}

/** 「D-2」 · 「D-day」 · 지났으면 「D+1」(공구 화면과 같은 표기) */
export function dLabel(days: number | null): string {
  if (days === null) {
    return "—";
  }
  if (days === 0) {
    return "D-day";
  }
  return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
}

export function num(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString("ko-KR");
}

/** 사유 표시명 — 서버 라벨이 우선, 없으면 코드 표(옛 코드 포함), 그것도 없으면 코드 그대로 */
export function reasonText(
  code: string | null | undefined,
  label: string | null | undefined
): string {
  if (label) {
    return label;
  }
  if (!code) {
    return "—";
  }
  return REASON_CODE_LABEL[code] ?? code;
}

/** 「허위 · 과장 정보(의약품 오인)」 — 조항으로 갈라 읽는 사유만 꼬리표가 붙는다 */
export function suspensionReasonWithTag(
  suspension: AdminPostSuspension
): string {
  const reason = reasonText(suspension.reasonCode, suspension.reasonLabel);
  const tag = suspension.policyClauseCode
    ? CLAUSE_SHORT_TAG[suspension.policyClauseCode as PostPolicyClause]
    : undefined;
  return tag ? `${reason}(${tag})` : reason;
}

/**
 * 일반 게시물에는 제목이 없다(사진 + 본문뿐) — 본문 첫 줄을 제목 자리에 쓴다.
 * 목록은 서버 미리보기(80자 · 공백 평탄화)를 그대로 쓴다.
 */
export function postTitle(content: string | null | undefined): string {
  const firstLine = (content ?? "")
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  return firstLine ?? "(본문 없음)";
}

/** 진행 중인 조치 — 없으면 가장 최근 조치(삭제 · 재게시로 닫힌 것) */
export function currentSuspension(
  detail: AdminPostDetail
): AdminPostSuspension | null {
  const list = detail.suspensions ?? [];
  return list.find((item) => item.open) ?? list[0] ?? null;
}

/** 삭제 경위의 원 조치 */
export function originSuspension(
  detail: AdminPostDetail
): AdminPostSuspension | null {
  const originId = detail.deletion?.originSuspensionId;
  if (originId === null || originId === undefined) {
    return null;
  }
  return (
    (detail.suspensions ?? []).find((item) => item.suspensionId === originId) ??
    null
  );
}

/** 레일 「신고」 — 「3건 · 허위 · 과장 정보 2」. 같은 유형이 2건 이상일 때만 유형별 건수를 붙인다 */
export function reportsSummary(reports: AdminPostReports | null): string {
  if (!reports || reports.pendingCount === 0) {
    return "없음";
  }
  const repeated = (reports.countsByReason ?? [])
    .filter((item) => item.count >= 2)
    .map(
      (item) => `${reasonText(item.reasonCode, item.reasonLabel)} ${item.count}`
    );
  return [`${reports.pendingCount}건`, ...repeated].join(" · ");
}

/** 처리 이력 주체 — 「운영자(김운영)」 · 「시스템」 */
export function timelineActor(item: AdminPostTimelineItem): string {
  const role = TIMELINE_ACTOR_LABEL[item.actorType] ?? item.actorType;
  if (item.actorType === "SYSTEM" || !item.actorName) {
    return role;
  }
  return `${role}(${item.actorName})`;
}

/** 정책값 숫자 — 오지 않으면 「N」 자리 */
export function policyValue(value: number | null | undefined): string {
  return value === null || value === undefined
    ? POLICY_PLACEHOLDER
    : String(value);
}

/** 이니셜 아바타 — 이름 첫 글자 */
export function initialOf(name: string | null | undefined): string {
  return name?.trim().charAt(0) ?? "";
}
