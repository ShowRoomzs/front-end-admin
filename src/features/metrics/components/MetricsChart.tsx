import { UNIT_PREFIX } from "@/features/metrics/constants/labels";
import type { AdminMetrics } from "@/features/metrics/types";
import {
  chartDeltaView,
  chartUnit,
  compactValue,
  formatNumber,
  niceMax,
  TONE_CLASS,
} from "@/features/metrics/utils/format";
import { cn } from "@/lib/utils";

/** 칸 높이 128px · 눈금 37.5px 간격(시안 `.ch`) */
const GRID_STYLE = {
  background:
    "repeating-linear-gradient(to top, var(--sz-n-100) 0 1px, transparent 1px 37.5px)",
};

/** x축 글자 간격 — 16칸이면 3칸마다, 30칸이면 5칸마다(시안 K1 · K6), 마지막 칸은 늘 적는다 */
function labelStep(count: number) {
  if (count <= 8) return 1;
  if (count <= 16) return 3;
  if (count <= 31) return 5;
  return Math.ceil(count / 6);
}

/**
 * 대표 지표 막대 차트(시안 `.cc`) — 저장소에 차트 라이브러리가 없어 시안의 div 막대를 그대로 옮겼다.
 * 서버 응답에는 이번 기간 점만 있다(`chart.points`) — 시안의 비교 기간 회색 막대 · 범례는 그릴 값이 없어 뺐다(백엔드 요청).
 * 막대가 적으면(주별 계약 체결 3칸) 시안 K2처럼 넓은 막대로 그린다.
 */
export default function MetricsChart(props: {
  chart: AdminMetrics["chart"];
  legend: string;
}) {
  const { chart, legend } = props;
  const points = chart.points;
  const max = niceMax(Math.max(0, ...points.map((point) => point.value)));
  const wide = points.length <= 6;
  const step = labelStep(points.length);
  const columns = {
    gridTemplateColumns: `repeat(${Math.max(points.length, 1)}, minmax(0, 1fr))`,
    columnGap: wide ? 48 : 6,
  };
  const delta = chartDeltaView(chart);
  const prefix =
    UNIT_PREFIX[chart.unit as keyof typeof UNIT_PREFIX] ?? UNIT_PREFIX.DAY;
  const unit = chartUnit(chart.metricKey);

  return (
    <div className="mb-4 rounded-[8px] border border-sz-n-200 bg-white px-[18px] pt-3.5 pb-2.5">
      <div className="flex items-baseline gap-3">
        <span className="text-[12px] font-semibold text-sz-n-700">
          {prefix} {chart.label}
        </span>
        <span className="text-[24px] font-semibold tracking-[-0.02em] tabular-nums text-sz-n-900">
          {formatNumber(chart.total)}
          <small className="ml-0.5 text-[13px] font-medium tracking-normal text-sz-n-600">
            {unit}
          </small>
        </span>
        <span
          className={cn("text-[12px] tabular-nums", TONE_CLASS[delta.tone])}
        >
          {delta.text}
        </span>
        <span className="ml-auto flex gap-3.5 text-[11px] text-sz-n-600">
          <span>
            <i className="mr-[5px] inline-block h-2.5 w-2.5 rounded-[2px] bg-sz-accent-500 align-[-1px]" />
            {legend}
          </span>
        </span>
      </div>
      <div
        className="relative mt-3 grid h-32 items-end border-b border-sz-n-300 pt-1"
        style={{ ...GRID_STYLE, ...columns }}
      >
        <span className="absolute top-[-2px] left-0 bg-white pr-1 text-[10px] leading-none tabular-nums text-sz-n-500">
          {compactValue(max, chart.metricKey)}
        </span>
        {points.map((point) => (
          <div
            key={point.bucket}
            className="flex h-full items-end justify-center"
            title={`${point.label} · ${formatNumber(point.value)}${unit}`}
          >
            <i
              className={cn(
                "block rounded-t-[2px] bg-sz-accent-500",
                wide ? "w-9" : "w-[42%] max-w-[14px]"
              )}
              style={{ height: `${(point.value / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div
        className="mt-[5px] grid text-center text-[10px] tabular-nums text-sz-n-500"
        style={columns}
      >
        {points.map((point, index) => (
          <span key={point.bucket}>
            {index % step === 0 || index === points.length - 1
              ? point.label
              : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
