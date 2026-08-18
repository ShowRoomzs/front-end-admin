import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/common/constants";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import ProductInquiryTabFilter from "@/features/productInquiry/components/ProductInquiryTabFilter/ProductInquiryTabFilter";
import { PRODUCT_INQUIRY_COLUMNS } from "@/features/productInquiry/constants/columns";
import {
  PRODUCT_INQUIRY_EMPTY_COUNTS,
  PRODUCT_INQUIRY_INITIAL_PARAMS,
  PRODUCT_INQUIRY_PAGE_SIZES,
} from "@/features/productInquiry/constants/params";
import { useGetProductInquiryList } from "@/features/productInquiry/hooks/useGetProductInquiryList";
import { useGetProductInquiryTypes } from "@/features/productInquiry/hooks/useGetProductInquiryTypes";
import type {
  ProductInquiryListItem,
  ProductInquiryListParams,
  ProductInquiryStatusFilter,
  ProductInquiryTypeCode,
} from "@/features/productInquiry/types/productInquiry";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * C1 — 상품 문의 모니터링 목록.
 *
 * **운영자는 답변하지 않는다.** 상품 문의의 답변 주체는 브랜드고, 운영자는 부적절
 * 게시물을 걸러내는 역할만 한다(§18 성격). 그래서 이 화면 어디에도 운영자 입력란이
 * 없고, 운영자가 봐야 할 수치는 **삭제 요청 건수** 하나다.
 */
export default function ProductInquiryManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    params,
    localParams,
    update,
    updateParam,
    updateParams,
    updateLocalParam,
  } = useParams<ProductInquiryListParams>(PRODUCT_INQUIRY_INITIAL_PARAMS);

  const { data: inquiryList, isLoading } = useGetProductInquiryList(params);
  const { data: types } = useGetProductInquiryTypes();

  const counts = inquiryList?.statusCounts ?? PRODUCT_INQUIRY_EMPTY_COUNTS;

  const pageInfo = usePaginationInfo({
    data: inquiryList?.pageInfo,
    onPageChange: (page) => {
      updateParam("page", page);
    },
  });

  const handleRowClick = useCallback(
    (record: ProductInquiryListItem) => {
      // 목록 쿼리스트링을 그대로 넘긴다 — 서버가 이 범위로 이전/다음을 계산한다
      navigate({
        pathname: `/support/product-inquiry/${record.inquiryId}`,
        search: location.search,
      });
    },
    [navigate, location.search]
  );

  // 탭·유형·표시 건수를 바꾸면 페이지도 1로 되돌린다
  const handleStatusChange = useCallback(
    (status: ProductInquiryStatusFilter) => {
      updateParams({ status, page: 1 });
    },
    [updateParams]
  );

  const handleTypeChange = useCallback(
    (type: ProductInquiryTypeCode | null) => {
      updateParams({ type, page: 1 });
    },
    [updateParams]
  );

  const handleSizeChange = useCallback(
    (size: number) => {
      updateParams({ size, page: 1 });
    },
    [updateParams]
  );

  const emptyState = useMemo(() => {
    if (params.keyword || params.type) {
      return (
        <div className="px-6 py-[72px] text-center">
          <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">⌕</div>
          <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
            검색 결과가 없습니다
          </div>
          <div className="text-[12px] text-sz-n-500">
            다른 상품명·브랜드·질문으로 검색하거나 유형 필터를 풀어 보세요.
          </div>
        </div>
      );
    }

    if (params.status === "DELETE_REQUESTED") {
      return (
        <div className="px-6 py-[72px] text-center">
          <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">✓</div>
          <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
            검토할 삭제 요청이 없습니다
          </div>
          <div className="text-[12px] text-sz-n-500">
            브랜드가 문의 삭제를 요청하면 이 목록에 표시됩니다.
          </div>
        </div>
      );
    }

    return (
      <div className="px-6 py-[72px] text-center">
        <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">⌕</div>
        <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
          상품 문의가 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          소비자가 상품 상세에서 문의를 남기면 이 목록에 표시됩니다.
        </div>
      </div>
    );
  }, [params.keyword, params.status, params.type]);

  return (
    <ListViewWrapper>
      <ProductInquiryTabFilter
        status={params.status}
        onStatusChange={handleStatusChange}
        counts={counts}
        types={types ?? []}
        type={params.type}
        onTypeChange={handleTypeChange}
        keyword={localParams.keyword}
        onKeywordChange={(keyword) => updateLocalParam("keyword", keyword)}
        onSearch={update}
      />

      <div className="flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
          <span className="text-[12px] text-sz-n-600">
            총 <b className="text-sz-n-900">{pageInfo.totalResults}</b>건
            {/*
              탭·필터와 무관한 전체 삭제 요청 건수다(statusCounts 쪽이 아니다) —
              "지금 처리해야 할 총량"이라 유형 필터를 걸어도 값이 흔들리면 안 된다.
            */}
            {!!inquiryList?.deleteRequestedCount && (
              <>
                {" · 삭제 요청 "}
                <b className="text-sz-warning-text">
                  {inquiryList.deleteRequestedCount}
                </b>
                건
              </>
            )}
          </span>
          <select
            aria-label="표시 건수"
            value={params.size}
            onChange={(event) => handleSizeChange(Number(event.target.value))}
            style={MODAL_SELECT_CHEVRON_STYLE}
            className="h-7 appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[26px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          >
            {PRODUCT_INQUIRY_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}건씩
              </option>
            ))}
          </select>
        </div>

        <Table
          columns={PRODUCT_INQUIRY_COLUMNS}
          data={inquiryList?.content ?? []}
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
