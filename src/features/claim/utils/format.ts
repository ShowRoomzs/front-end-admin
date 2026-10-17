import type { StatusBadgeVariant } from "@/common/components/StatusBadge/StatusBadge";
import type { ClaimTone } from "@/features/claim/types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/** 서버가 내린 배지 톤을 그대로 매핑한다 — FE가 단계→색 표를 갖지 않는다 */
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
  시각이 달린 값은 운영자 기준(KST)으로 고정한다 — 브라우저 시간대가 달라도 같은 날로 보이게.
  `YYYY-MM-DD`만 오는 값(보관 기한 · 법정 기한)은 시각이 없어 그대로 읽는다.
*/
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function parse(value: string) {
  return DATE_ONLY.test(value) ? dayjs(value) : dayjs(value).utcOffset(9);
}

/** 09.18 */
export function md(value: string | null): string {
  return value ? parse(value).format("MM.DD") : "—";
}

/** 09.18 10:00 */
export function mdHm(value: string | null): string {
  if (!value) return "—";
  // 시각 없이 날짜만 아는 이력(구매확정 자동 처리 등)은 날짜만 보인다
  return DATE_ONLY.test(value) ? md(value) : parse(value).format("MM.DD HH:mm");
}

/** 16,000원 */
export function won(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

/** − 3,000원 — 차감 표기는 부호와 숫자 사이를 띄운다 */
export function minusWon(amount: number): string {
  return `− ${won(amount)}`;
}
