import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/common/constants";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import InquiryTabFilter from "@/features/inquiry/components/InquiryTabFilter/InquiryTabFilter";
import { INQUIRY_COLUMNS } from "@/features/inquiry/constants/columns";
import {
  INQUIRY_EMPTY_COUNTS,
  INQUIRY_INITIAL_PARAMS,
  INQUIRY_PAGE_SIZES,
} from "@/features/inquiry/constants/params";
import { useGetInquiryList } from "@/features/inquiry/hooks/useGetInquiryList";
import { useGetInquiryTypes } from "@/features/inquiry/hooks/useGetInquiryTypes";
import type {
  CsCategoryCode,
  InquiryListItem,
  InquiryListParams,
  InquiryStatusFilter,
} from "@/features/inquiry/types/inquiry";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * A1·A2 — 1:1 문의 목록.
 *
 * 심사 화면과 성격이 다르다. 승인/반려 **판정**이 아니라 답변 작성 1회로 끝나는
 * 단일 액션 화면이고, 관리 지표는 응답 속도(SLA) 하나뿐이다 — 그래서 이 목록에는
 * 상태를 바꾸는 인라인 버튼이 없고, 행 클릭으로 상세에 들어가 답변만 쓴다.
 */
export default function InquiryManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    params,
    localParams,
    update,
    updateParam,
    updateParams,
    updateLocalParam,
  } = useParams<InquiryListParams>(INQUIRY_INITIAL_PARAMS);

  const { data: inquiryList, isLoading } = useGetInquiryList(params);
  const { data: types } = useGetInquiryTypes();

  // 상태별 건수는 목록 응답에 함께 온다(별도 집계 호출 불필요)
  const counts = inquiryList?.statusCounts ?? INQUIRY_EMPTY_COUNTS;

  const pageInfo = usePaginationInfo({
    data: inquiryList?.pageInfo,
    onPageChange: (page) => {
      updateParam("page", page);
    },
  });

  const handleRowClick = useCallback(
    (record: InquiryListItem) => {
      /*
        목록의 쿼리스트링을 그대로 들고 간다. 상세는 여기서 status·type·keyword를 읽어
        이전/다음 계산 범위로 넘기고, [목록] 버튼은 같은 탭·페이지·검색어로 되돌아온다.
      */
      navigate({
        pathname: `/support/inquiry/${record.inquiryId}`,
        search: location.search,
      });
    },
    [navigate, location.search]
  );

  // 탭·유형·표시 건수를 바꾸면 페이지도 1로 — 3페이지에서 건수 적은 조건으로 옮기면 빈 목록이 뜬다
  const handleStatusChange = useCallback(
    (status: InquiryStatusFilter) => {
      updateParams({ status, page: 1 });
    },
    [updateParams]
  );

  const handleTypeChange = useCallback(
    (type: CsCategoryCode | null) => {
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

  /*
    빈 상태는 세 가지가 서로 다른 의미다 — 검색이 빗나간 것, 처리할 게 없는 것,
    아직 아무 문의도 없는 것. §17-2가 말하는 "0건이 명확히 보여야 한다"는 두 번째다.
  */
  const emptyState = useMemo(() => {
    if (params.keyword || params.type) {
      return (
        <div className="px-6 py-[72px] text-center">
          <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">⌕</div>
          <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
            검색 결과가 없습니다
          </div>
          <div className="text-[12px] text-sz-n-500">
            다른 작성자·내용으로 검색하거나 유형 필터를 풀어 보세요.
          </div>
        </div>
      );
    }

    if (params.status === "WAITING") {
      return (
        <div className="px-6 py-[72px] text-center">
          <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">✓</div>
          <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
            새로 접수된 문의가 없습니다
          </div>
          <div className="text-[12px] text-sz-n-500">
            소비자가 앱에서 1:1 문의를 남기면 이 목록에 표시됩니다.
          </div>
        </div>
      );
    }

    return (
      <div className="px-6 py-[72px] text-center">
        <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">⌕</div>
        <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
          문의가 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          소비자가 앱에서 1:1 문의를 남기면 이 목록에 표시됩니다.
        </div>
      </div>
    );
  }, [params.keyword, params.status, params.type]);

  return (
    <ListViewWrapper>
      <InquiryTabFilter
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
            {/* 미답변 0건이면 문구를 붙이지 않는다 — "미답변 0건"은 읽을 이유가 없다 */}
            {counts.waiting > 0 && (
              <>
                {" · 미답변 "}
                <b className="text-sz-n-900">{counts.waiting}</b>건
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
            {INQUIRY_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}건씩
              </option>
            ))}
          </select>
        </div>

        <Table
          columns={INQUIRY_COLUMNS}
          data={inquiryList?.content ?? []}
          pageInfo={pageInfo}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          emptyState={emptyState}
          fitWidth
          autoHeight
          maxRows={14}
          // 행 높이를 50px로 고정하려면 셀이 줄바꿈되지 않아야 한다(시안 tbody td)
          bodyClassName="overflow-hidden whitespace-nowrap"
          headerClassName="whitespace-nowrap"
        />
      </div>
    </ListViewWrapper>
  );
}
