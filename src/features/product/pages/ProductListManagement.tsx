import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import ProductStatusFilter from "@/features/product/components/ProductStatusFilter/ProductStatusFilter";
import { PRODUCT_LIST_COLUMNS } from "@/features/product/constants/columns";
import { PRODUCT_SORT_OPTIONS } from "@/features/product/constants/params";
import { useGetProductList } from "@/features/product/hooks/useGetProductList";
import type {
  AdminProductListItem,
  AdminProductParams,
  ProductDisplayStatus,
  ProductGroupBuyStatus,
  ProductListSortType,
} from "@/features/product/services/productService";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE_OPTIONS = [20, 50, 100];

// Tailwind 임의값으로는 데이터 URI가 파싱되지 않아 인라인 스타일로 넣는다
const SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='9' height='5'><path d='M0 0L4.5 5L9 0Z' fill='%237B7F89'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
};

const EMPTY_DISPLAY_COUNTS = {
  all: 0,
  display: 0,
  hidden: 0,
  pendingReview: 0,
  hideRequest: 0,
};

const EMPTY_GROUP_BUY_COUNTS = {
  all: 0,
  preparing: 0,
  ready: 0,
  inProgress: 0,
  notConnected: 0,
};

const INITIAL_PARAMS: AdminProductParams = {
  displayStatus: null,
  groupBuyStatus: null,
  keyword: "",
  sortType: "CREATED_AT",
  page: 1,
  size: 20,
};

export default function ProductListManagement() {
  const navigate = useNavigate();
  const { params, localParams, update, updateParam, updateLocalParam, reset } =
    useParams<AdminProductParams>(INITIAL_PARAMS);

  const { data: productList, isLoading } = useGetProductList(params);

  // 상태별 건수는 목록 응답에 함께 온다(별도 집계 호출 불필요)
  const displayCounts = productList?.displayStatusCounts ?? EMPTY_DISPLAY_COUNTS;
  const groupBuyCounts =
    productList?.groupBuyStatusCounts ?? EMPTY_GROUP_BUY_COUNTS;

  const pageInfo = usePaginationInfo({
    data: productList?.pageInfo,
    onPageChange: (page) => {
      updateParam("page", page);
    },
  });

  const handleRowClick = useCallback(
    (record: AdminProductListItem) => {
      navigate(`/product/list/${record.productId}`);
    },
    [navigate]
  );

  const emptyState = useMemo(
    () => (
      <div className="px-6 py-[72px] text-center">
        <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">⌕</div>
        <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
          검색 결과가 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          다른 검색어로 찾거나 필터를 초기화해 보세요.
        </div>
      </div>
    ),
    []
  );

  return (
    <ListViewWrapper>
      <ProductStatusFilter
        displayStatus={params.displayStatus}
        onDisplayStatusChange={(status: ProductDisplayStatus | null) =>
          updateParam("displayStatus", status)
        }
        displayCounts={displayCounts}
        groupBuyStatus={params.groupBuyStatus}
        onGroupBuyStatusChange={(status: ProductGroupBuyStatus | null) =>
          updateParam("groupBuyStatus", status)
        }
        groupBuyCounts={groupBuyCounts}
        keyword={localParams.keyword}
        onKeywordChange={(keyword) => updateLocalParam("keyword", keyword)}
        onSearch={update}
        onReset={reset}
        searchPlaceholder="상품명 · 상품번호 · 브랜드상품코드 · 브랜드명 검색"
      />

      <div className="flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
          {/* "총 N건"에 flex를 걸면 텍스트 노드마다 gap이 생긴다(§4-5) — 순수 텍스트로 둔다 */}
          <span className="text-[12px] text-sz-n-600">
            총 <b className="text-sz-n-900">{pageInfo.totalResults}</b>건
          </span>
          <div className="flex items-center gap-2">
            <select
              value={params.sortType}
              onChange={(event) =>
                updateParam(
                  "sortType",
                  event.target.value as ProductListSortType
                )
              }
              style={SELECT_CHEVRON_STYLE}
              className="h-7 appearance-none rounded-[6px] border border-sz-n-300 bg-white pl-2 pr-[22px] text-[12px] text-sz-n-700 outline-none"
            >
              {PRODUCT_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={params.size}
              onChange={(event) =>
                updateParam("size", Number(event.target.value))
              }
              style={SELECT_CHEVRON_STYLE}
              className="h-7 appearance-none rounded-[6px] border border-sz-n-300 bg-white pl-2 pr-[22px] text-[12px] text-sz-n-700 outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}건
                </option>
              ))}
            </select>
          </div>
        </div>

        <Table
          columns={PRODUCT_LIST_COLUMNS}
          data={productList?.content ?? []}
          pageInfo={pageInfo}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          emptyState={emptyState}
          fitWidth
          autoHeight
          maxRows={14}
          bodyClassName="overflow-hidden whitespace-nowrap"
          headerClassName="whitespace-nowrap"
        />
      </div>
    </ListViewWrapper>
  );
}
