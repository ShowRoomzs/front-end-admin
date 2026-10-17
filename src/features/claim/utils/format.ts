import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import { parseServerDateTime } from "@/common/utils/formatDate";
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

/** 09.18 10:00 */
export function mdHm(value: string | null): string {
  return value ? kst(value).format("MM.DD HH:mm") : "—";
}

/** 기한까지 남은 달력일 — 「D-12」 · 지났으면 「D+2」 */
export function dDay(value: string): string {
  const days = kst(value)
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
 * 「경과」 열 — 시안의 「신청 1일 · 집화 2일 · 입고 3일 · 통과 1일 · 고지 1회 · 09.12(완료)」.
 * 서버 `elapsedDays`는 현재 단계 진입부터의 **달력일**이다(시안의 「영업일」 표기는 서버에 없다).
 */
export function elapsedLabel(row: SellerClaimListItem): string {
  switch (row.stage) {
    case "COLLECT_WAIT":
      return `신청 ${row.elapsedDays}일`;
    case "COLLECTING":
      return `회수 ${row.elapsedDays}일`;
    case "INSPECTION":
      return row.status === "ARRIVED"
        ? `도착 ${row.elapsedDays}일`
        : `입고 ${row.elapsedDays}일`;
    case "RESHIP":
      return row.reshipReason === "REJECT_RETURN"
        ? `반려 ${row.elapsedDays}일`
        : `통과 ${row.elapsedDays}일`;
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
