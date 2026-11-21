import {
  PRESET_OPTIONS,
  TAB_OPTIONS,
} from "@/features/metrics/constants/labels";
import type {
  MetricsPeriodParams,
  MetricsPreset,
  MetricsTab,
  MetricsTabBadge,
} from "@/features/metrics/types";
import {
  DATE_INPUT_CLASS,
  SEG_CLASS,
  SEG_ITEM_CLASS,
  SEG_ITEM_ON_CLASS,
  TAB_CLASS,
  TAB_ON_CLASS,
} from "@/common/constants/dsStyle";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";

/**
 * 직접 선택 날짜 칸 — DS 입력 32px · 13px · n-900. 같은 줄의 기간 세그먼트(바깥 32px)와 높이가 같다(세 앱 합의 11-21).
 */
const DATE_INPUT = cn(DATE_INPUT_CLASS, "w-[136px]");

/**
 * 기간 세그먼트(시안 `.seg`) — 오늘 · 7일 · 한 달(기본) · 6개월 · 직접 선택.
 * 직접 선택은 버튼 안에 고른 기간을 적고(K6 「직접 선택 · 09.01 ~ 09.30」), 옆에 시작 · 종료일 입력을 둔다.
 * 서버 규칙: from ≤ to · 최대 1년 · 어제까지(오늘은 「오늘」 프리셋).
 */
export function PeriodSegment(props: {
  value: MetricsPeriodParams;
  onChange: (next: MetricsPeriodParams) => void;
}) {
  const { value, onChange } = props;
  const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
  const customLabel =
    value.preset === "CUSTOM" && value.from && value.to
      ? ` · ${dayjs(value.from).format("MM.DD")} ~ ${dayjs(value.to).format("MM.DD")}`
      : "";

  const select = (preset: MetricsPreset) => {
    if (preset !== "CUSTOM") {
      onChange({ preset });
      return;
    }
    // 처음 고르면 지난달 전체를 채워 둔다 — 시안 K6 「지난 달은 직접 선택으로 고른다」
    const lastMonth = dayjs().subtract(1, "month");
    onChange({
      preset,
      from: value.from ?? lastMonth.startOf("month").format("YYYY-MM-DD"),
      to: value.to ?? lastMonth.endOf("month").format("YYYY-MM-DD"),
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      {value.preset === "CUSTOM" && (
        <span className="flex items-center gap-1.5 text-[11px] text-sz-n-500">
          <input
            type="date"
            aria-label="시작일"
            className={DATE_INPUT}
            value={value.from ?? ""}
            max={value.to ?? yesterday}
            min={
              value.to
                ? dayjs(value.to)
                    .subtract(1, "year")
                    .add(1, "day")
                    .format("YYYY-MM-DD")
                : undefined
            }
            onChange={(event) =>
              onChange({ ...value, from: event.target.value || undefined })
            }
          />
          ~
          <input
            type="date"
            aria-label="종료일"
            className={DATE_INPUT}
            value={value.to ?? ""}
            min={value.from}
            max={yesterday}
            onChange={(event) =>
              onChange({ ...value, to: event.target.value || undefined })
            }
          />
        </span>
      )}
      <div className={SEG_CLASS}>
        {PRESET_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => select(option.value)}
            className={cn(
              SEG_ITEM_CLASS,
              value.preset === option.value && SEG_ITEM_ON_CLASS
            )}
          >
            {option.label}
            {option.value === "CUSTOM" && (
              <span className="tabular-nums">{customLabel}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * 탭(시안 `.filter > .tabs`) — 탭 옆 빨간 숫자 = 그 탭에서 나빠진 지표 수(핵심은 4칸 포함 · 0이면 숨김).
 * 숫자는 서버가 센다(`GET /v1/admin/metrics/tabs`). 사이드바가 아니라 이 화면 안의 탭이다.
 */
export function MetricsTabs(props: {
  value: MetricsTab;
  badges: Array<MetricsTabBadge> | undefined;
  onChange: (tab: MetricsTab) => void;
}) {
  const { value, badges, onChange } = props;
  return (
    <div className="mb-4 flex items-center rounded-[8px] border border-sz-n-200 bg-white px-4 py-3">
      {TAB_OPTIONS.map((option) => {
        const worsened =
          badges?.find((badge) => badge.tab === option.value)?.worsenedCount ??
          0;
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              TAB_CLASS,
              "flex items-center gap-1.5",
              active && TAB_ON_CLASS
            )}
          >
            {option.label}
            {worsened > 0 && (
              <span className="rounded-[8px] bg-sz-danger-bg px-[5px] text-[10px] text-sz-danger-text">
                {worsened}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
