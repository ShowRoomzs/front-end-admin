import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import {
  BREAKDOWN,
  ESTIMATED_KEYS,
  METRICS_COPY,
  SUMMARY_HEAD,
  type BreakdownColumn,
} from "@/features/metrics/constants/labels";
import type {
  MetricsBreakdown,
  MetricsRow,
  MetricsTab,
} from "@/features/metrics/types";
import {
  deltaView,
  formatMetricValue,
  TONE_CLASS,
} from "@/features/metrics/utils/format";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const TH =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-100 px-4 py-[10px] text-[11px] font-medium text-sz-n-600";
const TD =
  "h-[46px] border-t border-sz-n-100 px-4 py-1.5 align-middle text-[12px] whitespace-nowrap group-first:border-t-0";
const SUB = "mt-[2px] block text-[11px] font-normal text-sz-n-500";

/** 시안 `.tcard.mt` 껍데기 */
function MetricCard(props: {
  title: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-sz-n-200 px-4 py-[10px]">
        <b className="text-[12px] text-sz-n-900">{props.title}</b>
        <span className="truncate text-[11px] text-sz-n-500">
          {props.caption}
        </span>
      </div>
      <table className="w-full table-fixed border-collapse">
        {props.children}
      </table>
    </div>
  );
}

/** 「플랫폼 수수료 수익(예상)」 → 이름 + 「예상」 배지(시안 K1) */
function MetricName(props: { row: MetricsRow }) {
  const { row } = props;
  if (!ESTIMATED_KEYS.has(row.key)) return <>{row.label}</>;
  return (
    <>
      {row.label.replace(/\s*\(예상\)$/, "")}{" "}
      <span className="ml-1 inline-block align-[1px] [&>span]:px-1.5 [&>span]:py-0 [&>span]:text-[10px]">
        <StatusBadge variant="neutral" hideDot>
          {METRICS_COPY.estimated}
        </StatusBadge>
      </span>
    </>
  );
}

/**
 * 요약 표(시안 왼쪽 `.tcard.mt`) — 지표 · 이번 기간 · 비교 기간 · 증감. 열 제목에 실제 날짜를 쓴다.
 * 작은 분모 지표는 비율 옆에 건수(「66.7% · 4/6」)를 함께 적는다(서버 `currentCount`).
 */
export function SummaryTable(props: {
  tab: MetricsTab;
  rows: Array<MetricsRow>;
  labels: { current: string; previous: string };
}) {
  const { tab, rows, labels } = props;
  const head = SUMMARY_HEAD[tab];
  // 공구 탭 — 「기간 중 하루라도 판매된 공구 · 8건」(진행한 공구 값)
  const run = rows.find((row) => row.key === "GROUP_BUYS_RUN")?.current;
  const caption =
    tab === "GROUP_BUY" && run != null
      ? `${head.caption} · ${run}건`
      : head.caption;
  return (
    <MetricCard title={head.title} caption={caption}>
      <thead>
        <tr>
          <td className={TH}>{METRICS_COPY.metricHeader}</td>
          <td className={cn(TH, "w-32 text-right")}>{labels.current}</td>
          <td className={cn(TH, "w-28 text-right")}>{labels.previous}</td>
          <td className={cn(TH, "w-[92px] text-right")}>
            {METRICS_COPY.deltaHeader}
          </td>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const delta = deltaView(row);
          return (
            <tr key={row.key} className="group">
              <td className={cn(TD, "whitespace-normal text-sz-n-700")}>
                <MetricName row={row} />
                {row.note && <span className={SUB}>{row.note}</span>}
              </td>
              <td
                className={cn(
                  TD,
                  "text-right text-[13px] font-semibold tabular-nums text-sz-n-900"
                )}
              >
                {formatMetricValue(
                  row,
                  row.current,
                  row.currentCount,
                  row.currentBreakdown
                )}
              </td>
              <td
                className={cn(
                  TD,
                  "text-right text-[11px] tabular-nums text-sz-n-500"
                )}
              >
                {formatMetricValue(
                  row,
                  row.previous,
                  row.previousCount,
                  row.previousBreakdown
                )}
              </td>
              <td className={cn(TD, "text-right tabular-nums")}>
                <span className={TONE_CLASS[delta.tone]}>{delta.text}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </MetricCard>
  );
}

/** 「5,120,000원」 같은 칸에서 숫자만 — 막대 길이 계산용 */
function numeric(text: string | undefined) {
  if (!text) return 0;
  const value = Number(text.replace(/[^0-9.]/g, ""));
  return Number.isFinite(value) ? value : 0;
}

function cellText(column: BreakdownColumn, raw: string | undefined) {
  if (raw == null || raw === "") return "—";
  if (column.amount) return raw.replace(/원$/, "");
  if (column.number && /^\d+$/.test(raw)) {
    return Number(raw).toLocaleString("ko-KR");
  }
  if (column.shortfall && raw.includes("미달")) {
    return (
      <span className="font-medium text-sz-danger-text">
        {raw.replace(/\s*·\s*미달$/, "")}
      </span>
    );
  }
  return raw;
}

/**
 * 분해 표(시안 오른쪽 `.tcard.mt`) — 서버 열을 이름으로 골라 시안 칸으로 다시 묶는다.
 * 이름 칸 = 이름 + 보조줄 + 막대(`.hb` · 기준 열 값 ÷ 표 안 최댓값).
 */
export function BreakdownTable(props: {
  tab: MetricsTab;
  breakdown: MetricsBreakdown;
}) {
  const { tab, breakdown } = props;
  const config = BREAKDOWN[tab];
  const indexOf = (source: string) => breakdown.columns.indexOf(source);
  const nameIndex = indexOf(config.name) === -1 ? 0 : indexOf(config.name);
  const subIndex = config.sub ? indexOf(config.sub) : -1;
  const barIndex = indexOf(config.bar);
  const max = Math.max(
    0,
    ...breakdown.rows.map((row) => numeric(row[barIndex]))
  );
  return (
    <MetricCard title={config.title} caption={config.caption}>
      <thead>
        <tr>
          <td className={TH}>{config.nameHeader}</td>
          {config.columns.map((column) => (
            <td
              key={column.source}
              className={cn(TH, "text-right")}
              style={{ width: column.width }}
            >
              {column.header}
            </td>
          ))}
        </tr>
      </thead>
      <tbody>
        {breakdown.rows.length === 0 ? (
          <tr>
            <td
              colSpan={config.columns.length + 1}
              className="px-4 py-10 text-center text-[12px] text-sz-n-500"
            >
              이 기간에 집계된 항목이 없습니다.
            </td>
          </tr>
        ) : (
          breakdown.rows.map((row, rowIndex) => {
            const width =
              barIndex === -1 || max === 0
                ? 0
                : (numeric(row[barIndex]) / max) * 100;
            return (
              <tr key={`${row[nameIndex]}-${rowIndex}`} className="group">
                <td className={cn(TD, "whitespace-normal text-sz-n-900")}>
                  {row[nameIndex]}
                  {subIndex !== -1 && row[subIndex] && (
                    <span className={SUB}>{row[subIndex]}</span>
                  )}
                  {barIndex !== -1 && (
                    <span className="mt-[5px] block h-[5px] overflow-hidden rounded-[3px] bg-sz-n-100">
                      <i
                        className="block h-full rounded-[3px] bg-sz-accent-500"
                        style={{ width: `${width}%` }}
                      />
                    </span>
                  )}
                </td>
                {config.columns.map((column) => (
                  <td
                    key={column.source}
                    className={cn(TD, "text-right tabular-nums")}
                  >
                    {cellText(column, row[indexOf(column.source)])}
                  </td>
                ))}
              </tr>
            );
          })
        )}
      </tbody>
    </MetricCard>
  );
}

/**
 * 핵심 탭 4칸(시안 `.kq`) — 네 묶음(공급 · 공구 · 수요 · 신뢰)에서 하나씩. 대표 지표가 왜 움직였는지 한 줄로 읽힌다.
 * 보조줄은 비율이면 건수(「6/8」), 아니면 서버 설명.
 */
export function CoreCards(props: { cards: Array<MetricsRow> }) {
  return (
    <div className="mb-4 grid grid-cols-4 rounded-[8px] border border-sz-n-200 bg-white">
      {props.cards.map((card) => {
        const delta = deltaView(card);
        return (
          <div
            key={card.key}
            className="border-l border-sz-n-100 px-4 py-[11px] first:border-l-0"
          >
            <div className="text-[11px] text-sz-n-600">{card.label}</div>
            <div className="mt-[3px] text-[16px] font-semibold tabular-nums text-sz-n-900">
              {formatMetricValue(card, card.current, null, null)}
            </div>
            <div className="mt-[2px] text-[11px] tabular-nums">
              <span className={TONE_CLASS[delta.tone]}>{delta.text}</span>{" "}
              <span className="text-sz-n-500">
                · {card.currentCount ?? card.note}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
