import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import { parseServerDateTime, parseWallClock } from "@/common/utils/formatDate";
import type {
  ClaimListItem,
  ClaimTone,
  SellerClaimListItem,
} from "@/features/claim/types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export function toneToVariant(tone: ClaimTone): StatusBadgeVariant {
  switch (tone) {
    case "INFO":
      return "info";
    case "SUCCESS":
      return "success";
    case "WARNING":
      return "warning";
    case "DANGER":
      return "danger";
    default:
      return "neutral";
  }
}

/*
  날짜는 시안처럼 연도 없이 「09.18」·「09.18 10:00」로 쓴다.
  서버 LocalDateTime(시간대 없음 · UTC 벽시계)을 읽어 운영자 기준(KST)으로 고정한다 —
  브라우저 시간대가 달라도 같은 날로 보이게.
*/
function kst(value: string) {
  return parseServerDateTime(value).utcOffset(9);
}

/** 09.18 */
export function md(value: string | null): string {
  return value ? kst(value).format("MM.DD") : "—";
}

/** 서버 LocalDate(「2026-08-27」 · 시각 없음)를 「08.27」로 — 시간대를 옮기지 않는다 */
export function mdDate(value: string | null): string {
  return value ? dayjs(value).format("MM.DD") : "—";
}

/** 09.18 10:00 */
export function mdHm(value: string | null): string {
  return value ? kst(value).format("MM.DD HH:mm") : "—";
}

/*
  기한(검수 기한 · 재발송비 결제 기한 · 보관 기한)은 서버가 날짜에 23:59:59를 붙인 벽시계다
  (`BusinessDayCalculator.dueAt` · `endOfDayAfter` · `ClaimStoragePolicy`) — UTC 보정을 하면 다음 날
  08:59로 밀리므로 그대로 읽는다. 이벤트 시각(신청 · 입고 · 이력 · 확정 예정)만 `md` · `mdHm`을 쓴다.
*/

/** 기한 날짜 — 09.16(벽시계 그대로) */
export function mdDue(value: string | null): string {
  return value ? parseWallClock(value).format("MM.DD") : "—";
}

/** 기한까지 남은 달력일 — 「D-12」 · 지났으면 「D+2」(기한 벽시계 기준) */
export function dDay(value: string): string {
  const days = parseWallClock(value)
    .startOf("day")
    .diff(dayjs().utcOffset(9).startOf("day"), "day");
  return days >= 0 ? `D-${days}` : `D+${-days}`;
}

/** 16,000원 */
export function won(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

/** − 3,000원 — 차감 표기는 부호와 숫자 사이를 띄운다 */
export function minusWon(amount: number): string {
  return `− ${won(amount)}`;
}

/*
  단계 배지 — 서버 `statusTone`은 파트너 기준으로 전부 NEUTRAL이다(38 설계서 2-1).
  시안 06b의 색 규칙(진행은 정보 · 기한 초과만 경고 · 환불·교환 완료는 성공 · 반려 종결·취소는 중립)을
  단계 · `overdue` · `outcome`으로 FE가 고른다.
*/
export function stageBadge(row: SellerClaimListItem): {
  label: string;
  tone: ClaimTone;
} {
  if (row.outcome) {
    const code = row.outcome.code;
    if (code === "REFUNDED" || code === "EXCHANGED") {
      return { label: row.outcome.label, tone: "SUCCESS" };
    }
    if (code === "REJECTED" || code === "CANCELLED") {
      return { label: row.outcome.label, tone: "NEUTRAL" };
    }
    return { label: row.outcome.label, tone: "INFO" };
  }
  if (row.overdue) {
    // 검수 기한 경과는 시안 표기 「검수 지연」으로 — 회수 대기 방치는 단계 이름에 경고색만
    return {
      label: row.status === "RECEIVED" ? "검수 지연" : row.statusLabel,
      tone: "WARNING",
    };
  }
  return { label: row.statusLabel, tone: "INFO" };
}

/**
 * 「경과」 열 — 시안의 「신청 1일 · 집화 2일 · 입고 3영업일 · 통과 1영업일 · 고지 1회 · 09.12(완료)」.
 * 브랜드가 기한 안에 해야 하는 단계(입고·검수 · 재발송)는 서버 `elapsedBusinessDays`(영업일)로,
 * 소비자·택배사 쪽 단계(신청 · 집화)는 시안대로 `claim.elapsedDays`(달력일)로 적는다. 기준점은 둘 다 단계 진입이다.
 */
export function elapsedLabel(item: ClaimListItem): string {
  const row = item.claim;
  const business = item.elapsedBusinessDays;
  switch (row.stage) {
    case "COLLECT_WAIT":
      return `신청 ${row.elapsedDays}일`;
    case "COLLECTING":
      return `집화 ${row.elapsedDays}일`;
    case "INSPECTION":
      return row.status === "ARRIVED"
        ? `도착 ${business}영업일`
        : `입고 ${business}영업일`;
    case "RESHIP":
      return row.reshipReason === "REJECT_RETURN"
        ? `반려 ${business}영업일`
        : `통과 ${business}영업일`;
    case "REJECT_HOLD":
      return row.storage
        ? `고지 ${row.storage.noticeCount}회`
        : `반려 ${row.elapsedDays}일`;
    case "DONE":
      return row.completedAt ? md(row.completedAt) : `${row.elapsedDays}일`;
    default:
      return `${row.elapsedDays}일`;
  }
}

/** 「귀책」 열 — 라벨의 「귀책」을 떼고 짧게(「소비자」 · 「브랜드」) */
export function feeBearerShort(item: Pick<ClaimListItem, "feeBearer">) {
  if (item.feeBearer === "SELLER") return "브랜드";
  if (item.feeBearer === "CONSUMER") return "소비자";
  return "—";
}
