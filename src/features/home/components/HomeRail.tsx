import { HOME_COPY, TODAY_METRIC_UNIT } from "@/features/home/constants/labels";
import type {
  AdminHomeMetricsToday,
  AdminHomeScheduleItem,
} from "@/features/home/types";
import {
  formatNumber,
  serverClock,
  wallClock,
} from "@/features/home/utils/format";
import { Link } from "react-router-dom";

const CARD = "overflow-hidden rounded-[8px] border border-sz-n-200 bg-white";

/**
 * 오늘 일정(시안 `.card + .mrow`) — 누를 일은 아니지만 알고 있어야 할 시각. 서버가 시각순으로 내린다.
 * 자동 실행이라 버튼 · 행 이동이 없다(직권 중단 집행만 운영자 수동 — 서버 보조줄 「운영자 집행 필요」).
 */
export function TodaySchedule(props: { items: Array<AdminHomeScheduleItem> }) {
  const { items } = props;
  return (
    <div className={CARD}>
      <div className="flex items-center gap-2 border-b border-sz-n-200 px-4 py-3 text-[13px] font-semibold text-sz-n-900">
        {HOME_COPY.scheduleTitle}
        <span className="ml-auto text-[11px] font-normal text-sz-n-500">
          {HOME_COPY.scheduleRight}
        </span>
      </div>
      <div className="px-4 pt-[2px] pb-1">
        {items.length === 0 ? (
          <div className="py-6 text-center text-[12px] text-sz-n-500">
            오늘 예정된 일정이 없습니다.
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.kind}-${item.time}-${index}`}
              className="flex justify-between gap-2.5 border-b border-sz-n-100 py-1.5 text-[12px] last:border-b-0"
            >
              <span className="shrink-0 tabular-nums text-sz-n-500">
                {wallClock(item.time)}
              </span>
              <span className="text-right font-medium text-sz-n-900">
                {item.title}
                {item.detail && (
                  <span className="mt-[1px] block text-[11px] font-normal text-sz-n-500">
                    {item.detail}
                  </span>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const TH =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-100 px-3 py-1.5 text-[11px] font-medium text-sz-n-600";

/**
 * 오늘 지표 4줄(시안 `.tcard.kt`) — 오늘 00:00 ~ 지금 vs 어제 같은 시각. 홈은 오늘만 두고 증감 색을 쓰지 않는다.
 * 이번 달 · 추이 · 비교는 「운영 지표 ›」(21)로 보낸다.
 */
export function TodayMetrics(props: { metrics: AdminHomeMetricsToday }) {
  const { metrics } = props;
  return (
    <div className={CARD}>
      <div className="flex items-center justify-between border-b border-sz-n-200 px-4 py-[10px]">
        <b className="text-[12px] text-sz-n-900">{HOME_COPY.metricsTitle}</b>
        <Link
          to="/metrics"
          className="rounded-[10px] border border-sz-n-200 bg-sz-n-100 px-2.5 py-0.5 text-[11px] leading-[1.7] font-medium whitespace-nowrap text-sz-n-600 hover:border-sz-accent-100 hover:bg-sz-accent-50 hover:text-sz-accent-600"
        >
          {HOME_COPY.metricsLink}
        </Link>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <td className={TH} />
            <td className={`${TH} text-right`}>
              오늘 {serverClock(metrics.asOf)}까지
              <span className="mt-[1px] block text-[10px] font-normal text-sz-n-500">
                {HOME_COPY.metricsYesterday}
              </span>
            </td>
          </tr>
        </thead>
        <tbody>
          {metrics.items.map((item) => {
            const unit =
              TODAY_METRIC_UNIT[item.key as keyof typeof TODAY_METRIC_UNIT] ??
              "";
            return (
              <tr key={item.key}>
                <td className="h-11 border-t border-sz-n-100 px-3 text-[12px] text-sz-n-600">
                  {item.label}
                </td>
                <td className="h-11 border-t border-sz-n-100 px-3 text-right text-[12px] font-medium tabular-nums text-sz-n-900">
                  {formatNumber(item.today)}
                  {unit}
                  <span className="mt-[1px] block text-[10px] font-normal text-sz-n-500">
                    어제 {formatNumber(item.yesterdaySameTime)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
