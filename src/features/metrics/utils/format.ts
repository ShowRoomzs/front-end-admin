import { parseServerDateTime } from "@/common/utils/formatDate";
import {
  COUNT_UNIT,
  DAYS_UNIT,
  PERCENT_DELTA_KEYS,
} from "@/features/metrics/constants/labels";
import type {
  AdminMetrics,
  DeltaKind,
  MetricsPeriod,
  MetricsRow,
} from "@/features/metrics/types";
import dayjs from "dayjs";

/** 소수 한 자리까지 — 서버가 round1로 내리지만 증감 % 같은 FE 계산값도 같은 자리로 맞춘다 */
function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function fixed1(value: number) {
  return round1(value).toFixed(1);
}

export function formatNumber(value: number) {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}

/** 지표 값 단위 */
function unitOf(row: Pick<MetricsRow, "key" | "valueType">) {
  switch (row.valueType) {
    case "AMOUNT":
      return "원";
    case "RATE":
      return "%";
    case "RATIO":
      return "배";
    case "DAYS":
      return DAYS_UNIT[row.key] ?? "일";
    case "HOURS":
      return "시간";
    default:
      return COUNT_UNIT[row.key] ?? "건";
  }
}

/** 값 칸 — 「18,240,000원」 · 「66.7% · 4/6」 · 「1곳 · 3명」(나눠 적는 지표) · 계산 불가 「—」 */
export function formatMetricValue(
  row: MetricsRow,
  value: number | null,
  count: string | null,
  breakdown: string | null
) {
  if (breakdown) return breakdown;
  if (value == null) return "—";
  const text =
    row.valueType === "RATE"
      ? `${fixed1(value)}%`
      : `${formatNumber(value)}${unitOf(row)}`;
  return count ? `${text} · ${count}` : text;
}

export interface DeltaView {
  /** 화살표 + 크기(「▲ 12.4%」) — 비교 의미가 없으면 「—」 */
  text: string;
  tone: "up" | "dn" | "eq";
}

/**
 * 증감 칸(시안 [증감 색 = 의미]) — 색은 서버 판정(GOOD 성공 · BAD 위험 · NEUTRAL 회색), 화살표는 값의 방향.
 * 비율은 %p, 금액과 큰 건수는 %(직전 값 대비), 작은 건수 · 소요는 절대값 + 단위.
 */
export function deltaView(row: MetricsRow): DeltaView {
  const { delta, previous } = row;
  if (delta == null || delta === 0 || row.deltaKind === "NEUTRAL") {
    return { text: "—", tone: "eq" };
  }
  const arrow = delta > 0 ? "▲" : "▼";
  const size = Math.abs(delta);
  let text: string;
  if (row.valueType === "RATE") {
    text = `${fixed1(size)}%p`;
  } else if (
    (row.valueType === "AMOUNT" || PERCENT_DELTA_KEYS.has(row.key)) &&
    previous
  ) {
    text = `${fixed1((size / Math.abs(previous)) * 100)}%`;
  } else if (row.valueType === "DAYS") {
    // 시안 「▼ 0.5일」 — 영업일 지표도 증감은 「일」로 적는다
    text = `${formatNumber(round1(size))}일`;
  } else {
    text = `${formatNumber(round1(size))}${unitOf(row)}`;
  }
  return {
    text: `${arrow} ${text}`,
    tone: (row.deltaKind as DeltaKind) === "GOOD" ? "up" : "dn",
  };
}

export const TONE_CLASS: Record<DeltaView["tone"], string> = {
  up: "font-medium text-sz-success-text",
  dn: "font-medium text-sz-danger-text",
  eq: "text-sz-n-500",
};

/**
 * 차트 머리 증감 — 차트 지표는 모두 늘어나는 쪽이 좋다(거래액 · 계약 체결 · 진행 공구 · 구매 소비자 · 처리 완료).
 * 계약 체결은 하루 0~1건이라 절대값(「▲ 2건」), 나머지는 비교 기간 합계 대비 %.
 */
export function chartDeltaView(chart: AdminMetrics["chart"]): DeltaView {
  const { delta, total } = chart;
  if (!delta) return { text: "—", tone: "eq" };
  const arrow = delta > 0 ? "▲" : "▼";
  const previous = total - delta;
  const text =
    chart.metricKey === "CONTRACTS_CONCLUDED" || previous <= 0
      ? `${formatNumber(Math.abs(delta))}${chartUnit(chart.metricKey)}`
      : `${fixed1((Math.abs(delta) / previous) * 100)}%`;
  return { text: `${arrow} ${text}`, tone: delta > 0 ? "up" : "dn" };
}

export function chartUnit(metricKey: string) {
  if (metricKey === "GMV") return "원";
  if (metricKey === "BUYERS") return "명";
  return "건";
}

/** 막대 위 y축 최댓값 표기 — 「1.6M」 · 「36명」 */
export function compactValue(value: number, metricKey: string) {
  if (metricKey === "GMV") {
    if (value >= 1_000_000) return `${round1(value / 1_000_000)}M`;
    if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
    return formatNumber(value);
  }
  return `${formatNumber(value)}${chartUnit(metricKey)}`;
}

/**
 * 막대 눈금 최댓값 — 가장 큰 막대가 칸의 약 90%가 되게(시안 최고 막대 90.9%) 위로 둥근 값을 고른다.
 */
export function niceMax(max: number) {
  if (max <= 0) return 1;
  const target = max * 1.1;
  const power = 10 ** Math.floor(Math.log10(target));
  const steps = [1, 1.2, 1.5, 1.6, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const step = steps.find((s) => s * power >= target) ?? 10;
  return step * power;
}

/** 서버 기간 경계는 날짜(00:00) — 벽시계 그대로 읽는다. 끝은 「제외」라 하루 뺀 날이 마지막 날 */
function lastDay(period: MetricsPeriod) {
  return dayjs(period.to).subtract(1, "day");
}

/** 표 열 제목 · 범례 — 「10.01 ~ 16」(같은 달) · 「09.28 ~ 10.04」 · 월별은 「2026.05 ~ 10」 */
export function shortRange(period: MetricsPeriod, monthly: boolean) {
  const from = dayjs(period.from);
  const to = lastDay(period);
  if (monthly) {
    return from.isSame(to, "year")
      ? `${from.format("YYYY.MM")} ~ ${to.format("MM")}`
      : `${from.format("YYYY.MM")} ~ ${to.format("YYYY.MM")}`;
  }
  if (from.isSame(to, "day")) return from.format("MM.DD");
  return from.isSame(to, "month")
    ? `${from.format("MM.DD")} ~ ${to.format("DD")}`
    : `${from.format("MM.DD")} ~ ${to.format("MM.DD")}`;
}

/**
 * 제목 아래 설명 줄 — 「2026.10.01 ~ 10.16 · 전월 같은 기간(09.01 ~ 09.16) 대비 · 10.17 00:00 집계 기준」.
 * 오늘은 지금까지라 「오늘 00:00 ~ HH:mm · 어제 같은 시간대 대비」(asOf = now() 기반 → UTC 변환).
 */
export function periodDescription(metrics: AdminMetrics) {
  const asOf = parseServerDateTime(metrics.asOf);
  if (metrics.preset === "TODAY") {
    return `${asOf.format("YYYY.MM.DD")} 00:00 ~ ${asOf.format("HH:mm")} · 어제 같은 시간대 대비`;
  }
  const from = dayjs(metrics.period.from);
  const to = lastDay(metrics.period);
  const monthly = metrics.preset === "M6" || metrics.chart.unit === "MONTH";
  const range = monthly
    ? `${from.format("YYYY.MM")} ~ ${to.format(from.isSame(to, "year") ? "MM" : "YYYY.MM")}`
    : `${from.format("YYYY.MM.DD")} ~ ${to.format(from.isSame(to, "year") ? "MM.DD" : "YYYY.MM.DD")}`;
  const compareRange = shortRange(metrics.compare, monthly);
  const compare =
    metrics.preset === "M1"
      ? `전월 같은 기간(${compareRange}) 대비`
      : `직전 같은 기간(${compareRange}) 대비`;
  const base = dayjs(metrics.period.to).format("MM.DD HH:mm");
  return `${range} · ${compare} · ${base} 집계 기준`;
}

/** 표 · 범례 열 제목 */
export function columnLabels(metrics: AdminMetrics) {
  if (metrics.preset === "TODAY") {
    return { current: "오늘", previous: "어제" };
  }
  const monthly = metrics.preset === "M6" || metrics.chart.unit === "MONTH";
  return {
    current: shortRange(metrics.period, monthly),
    previous: shortRange(metrics.compare, monthly),
  };
}
