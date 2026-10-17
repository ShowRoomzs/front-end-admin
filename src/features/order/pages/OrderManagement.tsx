import NotReady from "@/common/components/NotReady/NotReady";
import Notice from "@/common/components/Notice/Notice";
import Pagination from "@/common/components/Pagination/Pagination";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import { DEV_MOCK_ENABLED } from "@/common/utils/devMock";
import OrderDetailModal from "@/features/order/components/detail/OrderDetailModal";
import OrderEmpty from "@/features/order/components/list/OrderEmpty";
import OrderFilter from "@/features/order/components/list/OrderFilter";
import OrderTable from "@/features/order/components/list/OrderTable";
import { SELECT_SM_CLASS } from "@/features/order/components/shared/styles";
import {
  ORDER_DEFAULT_SORT,
  ORDER_INITIAL_PARAMS,
  ORDER_PAGE_SIZES,
  ORDER_SORT_LABEL,
  ORDER_SORT_OPTIONS,
  SELECT_CHEVRON_STYLE,
} from "@/features/order/constants/params";
import {
  useGetOrderFilterOptions,
  useGetOrderList,
  useGetOrderSummary,
} from "@/features/order/hooks/useOrderQueries";
import { orderService } from "@/features/order/services/orderService";
import type {
  OrderListParams,
  OrderListQuery,
  OrderSort,
  OrderTab,
} from "@/features/order/types";
import { resolvePeriod } from "@/features/order/utils/period";
import { useCallback, useMemo, useState } from "react";

/**
 * 주문 조회 — 전 브랜드·전 공구 주문의 조회 입구(시안 ui-admin-06a-orders A1~A5).
 *
 * 단위는 주문(결제 1건)이고 목록에는 액션이 없다 — 체크박스도 일괄 처리도 없다. 송장 대행 ·
 * 배송완료일 정정 · 직권 취소 · 운영자 사유 환불 · 반품 대신 열기는 남의 거래에 개입하는 일이라
 * 행을 눌러 상세 모달 우측 레일에서 근거를 읽고 시작한다.
 * 제목 「주문 조회」는 셸(MainLayout)이 그린다 — 이 화면은 설명 줄이 없다.
 *
 * 백엔드 API가 아직 없다: 개발 서버에서는 목업(`?mock=empty|recall|error`)이 채우고,
 * 배포본에서는 화면 골격만 두고 데이터 자리를 「준비 중」으로 비운다.
 */
export default function OrderManagement() {
  const {
    params,
    localParams,
    updateParam,
    updateParams,
    updateLocalParam,
    update,
    reset,
  } = useParams<OrderListParams>(ORDER_INITIAL_PARAMS);

  const today = useMemo(() => orderService.getToday(), []);
  const range = useMemo(() => resolvePeriod(params, today), [params, today]);

  // 탭마다 정렬 선택지가 다르다 — 주소에서 들어온 값이 이 탭에 없으면 기본값으로 읽는다
  const sort: OrderSort = ORDER_SORT_OPTIONS[params.tab]?.includes(params.sort)
    ? params.sort
    : ORDER_DEFAULT_SORT[params.tab];

  const query = useMemo<OrderListQuery>(() => {
    const { period, from, to, ...rest } = params;
    void period;
    void from;
    void to;
    return {
      ...rest,
      sort,
      page: Number(params.page),
      size: Number(params.size),
      paidFrom: range.from,
      paidTo: range.to,
    };
  }, [params, range, sort]);

  const { data: list, isLoading, isError, refetch } = useGetOrderList(query);
  const { data: summary } = useGetOrderSummary();
  const { data: options } = useGetOrderFilterOptions();

  const pageInfo = usePaginationInfo({
    data: list?.pageInfo,
    onPageChange: (page) => updateParam("page", page),
  });

  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [selectedOrderNo, setSelectedOrderNo] = useState<string | null>(null);

  const handleChange = useCallback(
    (patch: Partial<OrderListParams>) => updateParams({ ...patch, page: 1 }),
    [updateParams]
  );

  const handleTabChange = useCallback(
    (tab: OrderTab) =>
      updateParams({
        tab,
        // 탭이 축을 바꾸면 그 축의 셀렉트도 바뀐다 — 이전 축의 값은 의미가 없다
        status: "",
        sort: ORDER_DEFAULT_SORT[tab],
        page: 1,
      }),
    [updateParams]
  );

  const handleToggle = useCallback((orderNo: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(orderNo)) {
        next.delete(orderNo);
      } else {
        next.add(orderNo);
      }
      return next;
    });
  }, []);

  const rows = useMemo(() => list?.content ?? [], [list]);
  const orderNos = useMemo(() => rows.map((row) => row.orderNo), [rows]);
  const hasChips = Boolean(
    params.brandId ||
    params.groupBuyId ||
    params.influencerId ||
    params.payMethod
  );
  const brandName = options?.brands.find((b) => b.id === params.brandId)?.name;
  const total = pageInfo.totalResults;

  return (
    <div className="leading-[1.6]">
      <OrderFilter
        params={params}
        keyword={localParams.keyword}
        onKeywordChange={(keyword) => updateLocalParam("keyword", keyword)}
        onSearch={update}
        summary={summary}
        options={options}
        range={range}
        onChange={handleChange}
        onTabChange={handleTabChange}
      />

      <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        {!DEV_MOCK_ENABLED ? (
          <NotReady title="주문 조회 화면은 준비 중입니다">
            주문 조회 API가 준비되면 이 자리에 주문 목록이 표시됩니다.
          </NotReady>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
              <div className="text-[12px] text-sz-n-600">
                {isError ? (
                  "—"
                ) : (
                  <>
                    총 <b className="text-sz-n-900">{total}</b>건
                  </>
                )}
                {total > 0 && params.brandId && (
                  <span className="text-[11px] text-sz-n-500">
                    {" "}
                    · 브랜드 {brandName ?? params.brandId}
                  </span>
                )}
                {total > 0 && list && (
                  <>
                    {params.tab === "ALL" ? (
                      <>
                        {" · 배송 이상 "}
                        <b className="text-sz-n-900">
                          {list.summary.anomalyCount}
                        </b>
                        {"건 · 처리 지연 "}
                        <b className="text-sz-n-900">
                          {list.summary.delayedCount}
                        </b>
                        건
                      </>
                    ) : (
                      list.summary.typeCounts.map((item) => (
                        <span key={item.label}>
                          {` · ${item.label} `}
                          <b className="text-sz-n-900">{item.count}</b>건
                        </span>
                      ))
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  aria-label="정렬"
                  className={SELECT_SM_CLASS}
                  style={SELECT_CHEVRON_STYLE}
                  value={sort}
                  onChange={(event) =>
                    handleChange({ sort: event.target.value as OrderSort })
                  }
                >
                  {ORDER_SORT_OPTIONS[params.tab].map((value) => (
                    <option key={value} value={value}>
                      {ORDER_SORT_LABEL[value]}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="표시 건수"
                  className={SELECT_SM_CLASS}
                  style={SELECT_CHEVRON_STYLE}
                  value={params.size}
                  onChange={(event) =>
                    handleChange({ size: Number(event.target.value) })
                  }
                >
                  {ORDER_PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}건씩
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isError ? (
              <div className="p-4">
                <Notice tone="danger">
                  주문 목록을 불러오지 못했습니다.{" "}
                  <button
                    type="button"
                    className="font-medium underline underline-offset-2"
                    onClick={() => refetch()}
                  >
                    다시 시도
                  </button>
                </Notice>
              </div>
            ) : isLoading ? (
              <div className="px-6 py-[72px] text-center text-[12px] text-sz-n-500">
                불러오는 중…
              </div>
            ) : rows.length === 0 ? (
              <OrderEmpty
                params={params}
                hasChips={hasChips}
                isAllPeriod={params.period === "ALL"}
                onResetAll={reset}
                onSearchAllPeriod={() => handleChange({ period: "ALL" })}
              />
            ) : (
              <div className="[&_tbody>tr:last-child>td]:border-b-0">
                <OrderTable
                  rows={rows}
                  expanded={expanded}
                  onToggle={handleToggle}
                  onRowClick={setSelectedOrderNo}
                />
              </div>
            )}

            {pageInfo.totalPages > 1 && (
              <div className="flex justify-center border-t border-sz-n-100 py-[11px]">
                <Pagination {...pageInfo} />
              </div>
            )}
          </>
        )}
      </div>

      {selectedOrderNo && (
        <OrderDetailModal
          orderNo={selectedOrderNo}
          orderNos={orderNos}
          onNavigate={setSelectedOrderNo}
          onClose={() => setSelectedOrderNo(null)}
        />
      )}
    </div>
  );
}
