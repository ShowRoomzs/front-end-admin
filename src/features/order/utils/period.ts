import { ORDER_PERIOD_PRESETS } from "@/features/order/constants/params";
import type { OrderListParams } from "@/features/order/types";
import dayjs from "dayjs";

/**
 * 결제일 필터를 yyyy-MM-dd 두 값으로 푼다. 빈 문자열은 전체 기간.
 * 1개월 = 오늘 − 30일(시안 2026.08.17 ~ 2026.09.16)로, 프리셋은 일수로 센다.
 */
export function resolvePeriod(
  params: Pick<OrderListParams, "period" | "from" | "to">,
  today: Date
) {
  if (params.period === "ALL") {
    return { from: "", to: "" };
  }
  if (params.period === "CUSTOM") {
    return { from: params.from, to: params.to };
  }
  const preset = ORDER_PERIOD_PRESETS.find((p) => p.value === params.period);
  const to = dayjs(today);
  return {
    from: to.subtract(preset?.days ?? 30, "day").format("YYYY-MM-DD"),
    to: to.format("YYYY-MM-DD"),
  };
}

/** 2026.08.17 ~ 2026.09.16 */
export function periodLabel(range: { from: string; to: string }) {
  if (!range.from && !range.to) {
    return "전체 기간";
  }
  return `${range.from.replaceAll("-", ".")} ~ ${range.to.replaceAll("-", ".")}`;
}
