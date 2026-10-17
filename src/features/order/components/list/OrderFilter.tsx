import {
  ORDER_ANOMALY_OPTIONS,
  ORDER_CANCEL_OPTIONS,
  ORDER_PERIOD_PRESETS,
  ORDER_SEARCH_TYPES,
  ORDER_STATUS_OPTIONS,
  ORDER_TABS,
  SELECT_CHEVRON_STYLE,
} from "@/features/order/constants/params";
import {
  INPUT_CLASS,
  SELECT_SM_CLASS,
} from "@/features/order/components/shared/styles";
import OrderBtn from "@/features/order/components/shared/OrderBtn";
import type {
  OrderFilterOptions,
  OrderListParams,
  OrderPeriod,
  OrderSearchType,
  OrderTab,
  OrderTabSummary,
} from "@/features/order/types";
import { periodLabel } from "@/features/order/utils/period";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface OrderFilterProps {
  params: OrderListParams;
  /** 검색어는 [검색]·Enter를 눌러야 적용된다 — 입력 중인 값 */
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  onSearch: () => void;
  summary: OrderTabSummary | undefined;
  options: OrderFilterOptions | undefined;
  range: { from: string; to: string };
  onChange: (patch: Partial<OrderListParams>) => void;
  onTabChange: (tab: OrderTab) => void;
}

const FLAB = "mr-0.5 text-[11px] font-semibold text-sz-n-500";
const QMORE =
  "ml-auto inline-flex cursor-pointer items-center gap-1 text-[11px] text-sz-accent-500 hover:underline";

/**
 * 시안 `.filter.two` — 탭 · 상태 셀렉트 · 검색(1줄), 결제일 프리셋 · 적용됨 칩 · 상세 조건(2줄),
 * 접힘을 열면 3줄이 같은 카드 안에서 늘어난다(별도 패널·드로어 없음).
 * 접힘은 조건을 숨기는 장치가 아니라 자리를 아끼는 장치라, 걸린 조건은 접어도 칩으로 남는다.
 */
export default function OrderFilter(props: OrderFilterProps) {
  const {
    params,
    keyword,
    onKeywordChange,
    onSearch,
    summary,
    options,
    range,
    onChange,
    onTabChange,
  } = props;
  const [expanded, setExpanded] = useState(false);

  const brandName = options?.brands.find((b) => b.id === params.brandId)?.name;
  const groupBuyTitle = options?.groupBuys.find(
    (g) => g.id === params.groupBuyId
  )?.title;
  const influencerName = options?.influencers.find(
    (i) => i.id === params.influencerId
  )?.name;
  const payMethodLabel = options?.payMethods.find(
    (p) => p.value === params.payMethod
  )?.label;

  const chips: Array<{ key: string; label: string; clear: () => void }> = [];
  if (params.brandId) {
    chips.push({
      key: "brand",
      label: `브랜드 ${brandName ?? params.brandId}`,
      // 공구는 브랜드에 종속이라 브랜드를 지우면 공구도 함께 풀린다
      clear: () => onChange({ brandId: "", groupBuyId: "" }),
    });
  }
  if (params.groupBuyId) {
    chips.push({
      key: "groupBuy",
      label: `공구 ${groupBuyTitle ?? params.groupBuyId}`,
      clear: () => onChange({ groupBuyId: "" }),
    });
  }
  if (params.influencerId) {
    chips.push({
      key: "influencer",
      label: `인플루언서 ${influencerName ?? params.influencerId}`,
      clear: () => onChange({ influencerId: "" }),
    });
  }
  if (params.payMethod) {
    chips.push({
      key: "payMethod",
      label: `결제수단 ${payMethodLabel ?? params.payMethod}`,
      clear: () => onChange({ payMethod: "" }),
    });
  }

  // 건수는 서버가 내려준 값만 보인다 — 불러오기 전·API가 없는 배포본에서는 가짜 0을 그리지 않는다
  const tabCount = (tab: OrderTab) => summary?.tabCounts[tab];
  const withCount = (label: string, count: number | undefined) =>
    count === undefined ? label : `${label} ${count}`;
  const groupBuys = (options?.groupBuys ?? []).filter(
    (g) => g.brandId === params.brandId
  );

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3">
      <div className="flex">
        {ORDER_TABS.map((tab) => {
          const isActive = tab.value === params.tab;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              className={cn(
                "mr-5 flex cursor-pointer items-center gap-1.5 border-b-2 px-0.5 py-1.5 text-[12px]",
                isActive
                  ? "border-sz-accent-500 font-medium text-sz-accent-500"
                  : "border-transparent text-sz-n-500 hover:text-sz-n-700"
              )}
            >
              {tab.label}
              {tabCount(tab.value) !== undefined && (
                <span
                  className={cn(
                    "rounded-[8px] px-[5px] text-[10px]",
                    isActive
                      ? "bg-sz-accent-50 text-sz-accent-600"
                      : "bg-sz-n-100 text-sz-n-600"
                  )}
                >
                  {tabCount(tab.value)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-start gap-1.5">
        {/* 탭이 축을 바꾸면 같은 자리의 셀렉트가 따라 바뀐다 — 상태 → 이상 유형 → 취소 유형 */}
        <select
          aria-label={
            params.tab === "ANOMALY"
              ? "이상 유형"
              : params.tab === "CANCELED"
                ? "취소 유형"
                : "상태"
          }
          className={cn(
            SELECT_SM_CLASS,
            params.tab === "ANOMALY" ? "w-[152px]" : "w-[134px]"
          )}
          style={SELECT_CHEVRON_STYLE}
          value={params.status}
          onChange={(event) => onChange({ status: event.target.value })}
        >
          {params.tab === "ALL" && (
            <>
              <option value="">상태 전체</option>
              {ORDER_STATUS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {withCount(item.label, summary?.statusCounts[item.value])}
                </option>
              ))}
            </>
          )}
          {params.tab === "ANOMALY" && (
            <>
              <option value="">이상 유형 전체</option>
              {ORDER_ANOMALY_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {withCount(item.label, summary?.anomalyCounts[item.value])}
                </option>
              ))}
            </>
          )}
          {params.tab === "CANCELED" && (
            <>
              <option value="">취소 유형 전체</option>
              {ORDER_CANCEL_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {withCount(item.label, summary?.cancelCounts[item.value])}
                </option>
              ))}
            </>
          )}
        </select>
        <select
          aria-label="검색 기준"
          className={cn(SELECT_SM_CLASS, "w-[104px]")}
          style={SELECT_CHEVRON_STYLE}
          value={params.searchType}
          onChange={(event) =>
            onChange({ searchType: event.target.value as OrderSearchType })
          }
        >
          {ORDER_SEARCH_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <input
          className={cn(INPUT_CLASS, "w-[200px]")}
          placeholder="검색어 입력"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearch();
            }
          }}
        />
        <OrderBtn variant="secondary" onClick={onSearch}>
          검색
        </OrderBtn>
      </div>

      <div className="mt-[11px] flex w-full items-center gap-2 border-t border-sz-n-100 pt-[11px]">
        <span className={FLAB}>결제일</span>
        <div className="flex overflow-hidden rounded-[6px] border border-sz-n-300 bg-white">
          {ORDER_PERIOD_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() =>
                onChange({
                  period: preset.value as OrderPeriod,
                  // 직접 입력은 지금 보이는 기간에서 출발한다
                  ...(preset.value === "CUSTOM"
                    ? {
                        from: params.from || range.from,
                        to: params.to || range.to,
                      }
                    : {}),
                })
              }
              className={cn(
                "flex h-[30px] cursor-pointer items-center border-r border-sz-n-200 px-[11px] text-[11px] last:border-r-0",
                params.period === preset.value
                  ? "bg-sz-accent-50 font-medium text-sz-accent-600"
                  : "text-sz-n-600 hover:bg-sz-n-50"
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {params.period === "CUSTOM" ? (
          <span className="flex items-center gap-1.5 text-[11px] text-sz-n-500">
            <input
              type="date"
              aria-label="결제일 시작"
              className={cn(SELECT_SM_CLASS, "w-[128px] pr-2")}
              value={params.from}
              max={params.to || undefined}
              onChange={(event) => onChange({ from: event.target.value })}
            />
            ~
            <input
              type="date"
              aria-label="결제일 종료"
              className={cn(SELECT_SM_CLASS, "w-[128px] pr-2")}
              value={params.to}
              min={params.from || undefined}
              onChange={(event) => onChange({ to: event.target.value })}
            />
          </span>
        ) : (
          <span className="text-[11px] tabular-nums tracking-[-0.1px] text-sz-n-500">
            {periodLabel(range)}
          </span>
        )}

        {chips.length > 0 && (
          <>
            <span className={cn(FLAB, "ml-3.5")}>적용됨</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {chips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-sz-accent-100 bg-sz-accent-50 px-[9px] py-[3px] text-[11px] font-medium text-sz-accent-600"
                >
                  {chip.label}
                  <button
                    type="button"
                    aria-label={`${chip.label} 조건 지우기`}
                    onClick={chip.clear}
                    className="cursor-pointer text-sz-accent-500 opacity-70 hover:opacity-100"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </>
        )}

        <button
          type="button"
          className={QMORE}
          onClick={() => setExpanded((prev) => !prev)}
        >
          상세 조건
          <span className="text-[8px]">{expanded ? "▴" : "▾"}</span>
          {expanded && " 접기"}
        </button>
      </div>

      {expanded && (
        <div className="mt-[11px] flex w-full items-center gap-2 border-t border-sz-n-100 pt-[11px]">
          <span className={FLAB}>브랜드</span>
          <select
            aria-label="브랜드"
            className={cn(SELECT_SM_CLASS, "w-[150px]")}
            style={SELECT_CHEVRON_STYLE}
            value={params.brandId}
            onChange={(event) =>
              onChange({ brandId: event.target.value, groupBuyId: "" })
            }
          >
            <option value="">브랜드 전체</option>
            {(options?.brands ?? []).map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          <span className={cn(FLAB, "ml-2.5")}>공구</span>
          <select
            aria-label="공구"
            // 공구는 브랜드에 종속 — 브랜드를 고르기 전에는 고를 수 없다
            disabled={!params.brandId}
            className={cn(
              SELECT_SM_CLASS,
              "w-[186px] disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-400"
            )}
            style={SELECT_CHEVRON_STYLE}
            value={params.groupBuyId}
            onChange={(event) => onChange({ groupBuyId: event.target.value })}
          >
            <option value="">공구 전체</option>
            {groupBuys.map((groupBuy) => (
              <option key={groupBuy.id} value={groupBuy.id}>
                {groupBuy.title}
              </option>
            ))}
          </select>
          <span className={cn(FLAB, "ml-2.5")}>인플루언서</span>
          <select
            aria-label="인플루언서"
            className={cn(SELECT_SM_CLASS, "w-[160px]")}
            style={SELECT_CHEVRON_STYLE}
            value={params.influencerId}
            onChange={(event) => onChange({ influencerId: event.target.value })}
          >
            <option value="">인플루언서 전체</option>
            {(options?.influencers ?? []).map((influencer) => (
              <option key={influencer.id} value={influencer.id}>
                {influencer.name}
              </option>
            ))}
          </select>
          <span className={cn(FLAB, "ml-2.5")}>결제수단</span>
          <select
            aria-label="결제수단"
            className={cn(SELECT_SM_CLASS, "w-[128px]")}
            style={SELECT_CHEVRON_STYLE}
            value={params.payMethod}
            onChange={(event) => onChange({ payMethod: event.target.value })}
          >
            <option value="">결제수단 전체</option>
            {(options?.payMethods ?? []).map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={cn(QMORE, "text-sz-n-600")}
            onClick={() =>
              onChange({
                brandId: "",
                groupBuyId: "",
                influencerId: "",
                payMethod: "",
              })
            }
          >
            조건 초기화
          </button>
        </div>
      )}
    </div>
  );
}
