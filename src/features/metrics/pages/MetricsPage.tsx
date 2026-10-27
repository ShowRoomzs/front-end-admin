import {
  MetricsTabs,
  PeriodSegment,
} from "@/features/metrics/components/MetricsControls";
import MetricsChart from "@/features/metrics/components/MetricsChart";
import {
  BreakdownTable,
  CoreCards,
  SummaryTable,
} from "@/features/metrics/components/MetricsTables";
import {
  DEFAULT_PRESET,
  METRICS_COPY,
  TAB_OPTIONS,
} from "@/features/metrics/constants/labels";
import {
  useGetAdminMetrics,
  useGetAdminMetricsTabs,
} from "@/features/metrics/hooks/useAdminMetrics";
import type {
  MetricsPeriodParams,
  MetricsPreset,
  MetricsTab,
} from "@/features/metrics/types";
import {
  columnLabels,
  periodDescription,
} from "@/features/metrics/utils/format";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const PRESETS: Array<MetricsPreset> = ["TODAY", "D7", "M1", "M6", "CUSTOM"];
const TABS = TAB_OPTIONS.map((option) => option.value);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** 주소 `?tab=&preset=&from=&to=` — 홈 「운영 지표 ›」 · 새로고침 · 공유에서 같은 화면을 연다 */
function useMetricsSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => {
    const rawTab = searchParams.get("tab") as MetricsTab | null;
    const rawPreset = searchParams.get("preset") as MetricsPreset | null;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const tab: MetricsTab = rawTab && TABS.includes(rawTab) ? rawTab : "CORE";
    const preset: MetricsPreset =
      rawPreset && PRESETS.includes(rawPreset) ? rawPreset : DEFAULT_PRESET;
    const period: MetricsPeriodParams =
      preset === "CUSTOM"
        ? {
            preset,
            from: from && DATE.test(from) ? from : undefined,
            to: to && DATE.test(to) ? to : undefined,
          }
        : { preset };
    return { tab, period };
  }, [searchParams]);

  const update = (next: { tab?: MetricsTab; period?: MetricsPeriodParams }) => {
    const tab = next.tab ?? state.tab;
    const period = next.period ?? state.period;
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    params.set("preset", period.preset);
    params.delete("from");
    params.delete("to");
    if (period.preset === "CUSTOM") {
      if (period.from) params.set("from", period.from);
      if (period.to) params.set("to", period.to);
    }
    setSearchParams(params, { replace: true });
  };
  return { ...state, update };
}

/**
 * 운영 지표(ui-admin-21-metrics rev.5) — SHOWROOMZ 구조(브랜드 × 인플루언서 연결 → 공구 판매 → 다시 열림)로 판단한다.
 * 탭 5(핵심 · 공급 · 공구 · 수요 · 운영) × 기간 5종. 기간 규칙 · 증감 판정 · 탭 배지는 서버가 확정한다.
 * 제목 줄 우측에 기간 세그먼트가 붙어 h1을 직접 그린다(MainLayout SELF_TITLED_PATHS에 "/metrics").
 */
export default function MetricsPage() {
  const { tab, period, update } = useMetricsSearchParams();
  const query = useMemo(() => ({ ...period, tab }), [period, tab]);
  const { data: metrics, isLoading, isError } = useGetAdminMetrics(query);
  const { data: badges } = useGetAdminMetricsTabs(period);
  const customIncomplete =
    period.preset === "CUSTOM" && !(period.from && period.to);

  // 응답이 늦게 와도 지금 고른 탭 기준으로 그린다(이전 탭 데이터를 다른 탭 칸에 섞지 않는다)
  const shownTab = (metrics?.tab as MetricsTab | undefined) ?? tab;
  const labels = metrics ? columnLabels(metrics) : null;

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-sz-n-900">
            {METRICS_COPY.title}
          </h1>
          {metrics && (
            <div className="mt-[2px] text-[12px] tabular-nums text-sz-n-600">
              {periodDescription(metrics)}
            </div>
          )}
        </div>
        <PeriodSegment
          value={period}
          onChange={(next) => update({ period: next })}
        />
      </div>

      <MetricsTabs
        value={tab}
        badges={badges}
        onChange={(next) => update({ tab: next })}
      />

      {!metrics || !labels ? (
        <div className="rounded-[8px] border border-sz-n-200 bg-white px-6 py-[72px] text-center text-[12px] text-sz-n-500">
          {customIncomplete
            ? "시작일과 종료일을 고르면 지표를 불러옵니다."
            : isLoading
              ? "불러오는 중…"
              : isError
                ? "지표를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
                : null}
        </div>
      ) : (
        <>
          <MetricsChart chart={metrics.chart} legend={labels.current} />
          {shownTab === "CORE" && metrics.cards && metrics.cards.length > 0 && (
            <CoreCards cards={metrics.cards} />
          )}
          <div className="grid grid-cols-2 gap-5">
            <SummaryTable tab={shownTab} rows={metrics.rows} labels={labels} />
            <BreakdownTable tab={shownTab} breakdown={metrics.breakdown} />
          </div>
        </>
      )}
    </div>
  );
}
