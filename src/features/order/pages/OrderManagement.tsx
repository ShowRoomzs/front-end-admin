import Notice from "@/common/components/Notice/Notice";
import Pagination from "@/common/components/Pagination/Pagination";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import OrderDetailModal from "@/features/order/components/detail/OrderDetailModal";
import OrderEmpty from "@/features/order/components/list/OrderEmpty";
import OrderFilter from "@/features/order/components/list/OrderFilter";
import OrderTable from "@/features/order/components/list/OrderTable";
import { SELECT_SM_CLASS } from "@/features/order/components/shared/styles";
import {
  ORDER_DEFAULT_SORT,
  ORDER_INITIAL_PARAMS,
  ORDER_ISSUE_OPTIONS,
  ORDER_PAGE_SIZES,
  ORDER_SORT_LABEL,
  ORDER_SORT_OPTIONS,
  SELECT_CHEVRON_STYLE,
} from "@/features/order/constants/params";
import {
  useGetOrderBrandOptions,
  useGetOrderCreatorOptions,
  useGetOrderDelayCount,
  useGetOrderList,
  useGetOrderSummary,
} from "@/features/order/hooks/useOrderQueries";
import type {
  AdminOrderSort,
  AdminOrderTab,
  OrderListParams,
} from "@/features/order/types";
import {
  normalizeOrderParams,
  toListQuery,
  toSummaryQuery,
} from "@/features/order/utils/params";
import { resolvePeriod } from "@/features/order/utils/period";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

/**
 * 주문 조회 — 전 브랜드·전 공구 주문의 조회 입구(시안 ui-admin-06a-orders A1~A5 · `AdminOrderController`).
 *
 * 단위는 주문(결제 1건)이고 행 확장이 하위주문(브랜드)이다. 목록에는 액션이 없다 — 송장 대행 ·
 * 배송완료일 정정 · 직권 취소 · 운영자 사유 환불 · 반품 대신 열기는 상세 모달 우측 레일에서
 * 하위주문(`deliveryGroupId`) 단위로 시작하고, 버튼 노출은 서버 `actions`가 정한다.
 * `?orderId=`로 들어오면(예외 관리 · 반품·교환의 「열기」) 그 주문의 상세를 바로 연다.
 * 제목 「주문 조회」는 셸(MainLayout)이 그린다 — 이 화면은 설명 줄이 없다.
 */
export default function OrderManagement() {
  const {
    params: rawParams,
    localParams,
    updateParam,
    updateParams,
    updateLocalParam,
    update,
    reset,
  } = useParams<OrderListParams>(ORDER_INITIAL_PARAMS);

  // 주소에서 읽은 값은 한 번만 바로잡고 조회·필터·렌더 모두 이 값을 쓴다 — ?tab=foo 하나로 화면이 비면 안 된다
  const params = useMemo(() => normalizeOrderParams(rawParams), [rawParams]);

  const today = useMemo(() => new Date(), []);
  const range = useMemo(() => resolvePeriod(params, today), [params, today]);
  const listQuery = useMemo(() => toListQuery(params, range), [params, range]);
  const summaryQuery = useMemo(
    () => toSummaryQuery(params, range),
    [params, range]
  );

  const [filterExpanded, setFilterExpanded] = useState(false);
  const hasChips = Boolean(
    params.marketId ||
    params.groupBuyId ||
    params.creatorId ||
    params.paymentMethod
  );

  const {
    data: list,
    isLoading,
    isError,
    refetch,
  } = useGetOrderList(listQuery);
  const { data: summary } = useGetOrderSummary(summaryQuery);
  // 「처리 지연」은 필터와 무관한 06d 전체 숫자라 조건이 걸리지 않은 전체 탭에서만 보인다
  const showDelay = params.tab === "ALL" && !hasChips && !params.keyword;
  const { data: delayCount } = useGetOrderDelayCount(showDelay);
  // 브랜드 · 인플루언서 이름은 칩에도 쓰이므로 걸려 있으면 접혀 있어도 받는다
  const { data: brands } = useGetOrderBrandOptions(
    filterExpanded || Boolean(params.marketId)
  );
  const { data: creators } = useGetOrderCreatorOptions(
    filterExpanded || Boolean(params.creatorId)
  );

  const pageInfo = usePaginationInfo({
    data: list?.pageInfo,
    onPageChange: (page) => updateParam("page", page),
  });

  // 조치로 행이 빠져 마지막 페이지가 사라지면 빈 화면 대신 남은 마지막 페이지로 옮긴다
  const listPageInfo = list?.pageInfo;
  const listIsEmpty = list !== undefined && list.content.length === 0;
  useEffect(() => {
    if (!listPageInfo || !listIsEmpty || listPageInfo.totalResults === 0) {
      return;
    }
    const lastPage = Math.max(1, listPageInfo.totalPages);
    if (params.page > lastPage) {
      updateParam("page", lastPage);
    }
  }, [listPageInfo, listIsEmpty, params.page, updateParam]);

  const [expanded, setExpanded] = useState<ReadonlySet<number>>(new Set());
  const selectedOrderId = params.orderId ? Number(params.orderId) : null;
  const openOrder = useCallback(
    (orderId: number) => updateParam("orderId", String(orderId)),
    [updateParam]
  );
  const closeOrder = useCallback(
    () => updateParam("orderId", ""),
    [updateParam]
  );

  const handleChange = useCallback(
    (patch: Partial<OrderListParams>) => updateParams({ ...patch, page: 1 }),
    [updateParams]
  );

  const handleTabChange = useCallback(
    (tab: AdminOrderTab) =>
      updateParams({
        tab,
        // 탭이 축을 바꾸면 그 축의 셀렉트도 바뀐다 — 이전 축의 값은 의미가 없다
        status: "",
        sort: ORDER_DEFAULT_SORT[tab],
        page: 1,
      }),
    [updateParams]
  );

  const handleToggle = useCallback((orderId: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  const rows = useMemo(() => list?.content ?? [], [list]);
  const orderIds = useMemo(() => rows.map((row) => row.orderId), [rows]);
  const brandName = brands?.find((b) => b.id === params.marketId)?.name;
  const total = pageInfo.totalResults;

  return (
    <div className="leading-[1.6]">
      <OrderFilter
        params={params}
        keyword={localParams.keyword}
        onKeywordChange={(keyword) => updateLocalParam("keyword", keyword)}
        onSearch={update}
        summary={summary}
        brands={brands}
        creators={creators}
        expanded={filterExpanded}
        onExpandedChange={setFilterExpanded}
        range={range}
        onChange={handleChange}
        onTabChange={handleTabChange}
      />

      <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        <div className="flex items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
          <div className="text-[12px] text-sz-n-600">
            {isError ? (
              "—"
            ) : (
              <>
                총 <b className="text-sz-n-900">{total}</b>건
              </>
            )}
            {total > 0 && params.marketId && (
              <span className="text-[11px] text-sz-n-500">
                {" "}
                · 브랜드 {brandName ?? params.marketId}
              </span>
            )}
            {total > 0 && params.tab === "ALL" && summary && (
              <>
                {" · 배송 이상 "}
                <b className="text-sz-n-900">
                  {summary.tabCounts.DELIVERY_ISSUE}
                </b>
                건
              </>
            )}
            {/* 배송 이상 탭(A3) — 유형별 건수. 유형을 골랐으면 총 건수가 곧 그 유형이다 */}
            {total > 0 &&
              params.tab === "DELIVERY_ISSUE" &&
              !params.status &&
              summary &&
              ORDER_ISSUE_OPTIONS.map((item) => (
                <Fragment key={item.value}>
                  {` · ${item.label} `}
                  <b className="text-sz-n-900">
                    {summary.deliveryIssueCounts[item.value]}
                  </b>
                  건
                </Fragment>
              ))}
            {total > 0 && showDelay && delayCount !== undefined && (
              <>
                {" · 처리 지연 "}
                <b className="text-sz-n-900">{delayCount}</b>건
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="정렬"
              className={SELECT_SM_CLASS}
              style={SELECT_CHEVRON_STYLE}
              value={params.sort}
              onChange={(event) =>
                handleChange({ sort: event.target.value as AdminOrderSort })
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
              onRowClick={openOrder}
            />
          </div>
        )}

        {/* 오류 안내 아래에 지난 조회의 페이저가 남지 않게 한다 */}
        {!isError && pageInfo.totalPages > 1 && (
          <div className="flex justify-center border-t border-sz-n-100 py-[11px]">
            <Pagination {...pageInfo} />
          </div>
        )}
      </div>

      {selectedOrderId !== null && (
        <OrderDetailModal
          orderId={selectedOrderId}
          orderIds={orderIds}
          onNavigate={openOrder}
          onClose={closeOrder}
        />
      )}
    </div>
  );
}
