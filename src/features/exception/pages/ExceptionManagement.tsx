import Pagination from "@/common/components/Pagination/Pagination";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import ExceptionFilter, {
  type TypeOption,
} from "@/features/exception/components/list/ExceptionFilter";
import ExceptionToolbar from "@/features/exception/components/list/ExceptionToolbar";
import ExceptionTable from "@/features/exception/components/shared/ExceptionTable";
import { BTN_SECONDARY } from "@/features/exception/components/shared/styles";
import {
  DELAY_COLUMNS,
  DELIVERY_COLUMNS,
} from "@/features/exception/constants/columns";
import { EXCEPTION_KINDS } from "@/features/exception/constants/labels";
import { EXCEPTION_INITIAL_PARAMS } from "@/features/exception/constants/params";
import {
  useGetExceptionList,
  useGetExceptionSummary,
} from "@/features/exception/hooks/useExceptionQueries";
import type {
  ExceptionItem,
  ExceptionKindFilter,
  ExceptionListParams,
  ExceptionTab,
} from "@/features/exception/types";
import { openPath } from "@/features/exception/utils/format";
import { normalizeExceptionParams } from "@/features/exception/utils/params";
import { Loader2Icon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const EMPTY_TEXT: Record<ExceptionTab, { title: string; description: string }> =
  {
    DELAY: {
      title: "처리 지연 건이 없습니다",
      description: "당사자가 기한을 넘긴 건이 생기면 이 목록에 표시됩니다.",
    },
    DELIVERY: {
      title: "배송 예외 건이 없습니다",
      description: "택배 추적 이상이 감지되면 이 목록에 표시됩니다.",
    },
  };

/** 행 키 — 한 주문의 하위주문 여럿이 같은 주문번호로 올 수 있어 대상번호만으로는 겹친다 */
const rowKey = (row: ExceptionItem) =>
  `${row.kind}-${row.deliveryGroupId}-${row.claimId ?? ""}`;

/**
 * A1·A2 — 어드민 예외 관리(거래 관리 · `/v1/admin/order-exceptions`).
 *
 * 처리 지연(당사자 기한 경과)과 배송 예외(택배·추적 이상)를 탭 둘로 합친 **모니터 화면**이다 —
 * 둘 다 운영자가 지켜보다가 필요할 때만 대행하므로 MVP에서 페이지를 나눌 이유가 없다.
 * 기본 진입은 처리 지연: 운영자가 실제로 개입할 수 있는 유일한 탭이다.
 * 이 화면에는 실행 버튼이 없다 — 관리 열은 [열기]뿐이고 대행(송장 대행 · 직권 취소)은 주문 상세에서 한다.
 * 독촉 버튼도 없다(기한 경과 알림은 시스템 자동, 횟수만 보여준다).
 *
 * 제목 「예외 관리」는 셸(MainLayout)이 그린다 — 시안에도 제목 아래 설명 줄이 없다.
 */
export default function ExceptionManagement() {
  const navigate = useNavigate();
  const {
    params: rawParams,
    localParams,
    updateParam,
    updateParams,
    updateLocalParam,
  } = useParams<ExceptionListParams>(EXCEPTION_INITIAL_PARAMS);
  // 주소의 값을 그대로 쓰면 ?tab=foo는 빈 상태 문구에서, ?keyword=null은 .trim()에서 터진다 —
  // 조회와 화면 모두 바로잡은 값만 본다
  const params = useMemo(
    () => normalizeExceptionParams(rawParams),
    [rawParams]
  );
  const localKeyword =
    typeof localParams.keyword === "string" ? localParams.keyword : "";

  const {
    data: list,
    isLoading,
    isError,
    refetch,
  } = useGetExceptionList(params);
  const { data: summary } = useGetExceptionSummary();

  const pageInfo = usePaginationInfo({
    data: list?.page.pageInfo,
    onPageChange: (page) => updateParam("page", page),
  });

  // 목적지는 서버 `link`가 정한다 — ORDER는 주문 상세, CLAIM은 반품·교환 상세
  const handleRowClick = useCallback(
    (row: ExceptionItem) => navigate(openPath(row.link)),
    [navigate]
  );

  // 탭마다 유형 집합이 달라 탭을 바꾸면 유형은 비운다(다른 탭 유형은 서버 400)
  const handleTabChange = useCallback(
    (tab: ExceptionTab) => updateParams({ tab, kind: "", page: 1 }),
    [updateParams]
  );

  // 유형은 고르는 즉시 적용한다 — 입력 중이던 검색어도 함께 확정한다
  const handleKindChange = useCallback(
    (kind: ExceptionKindFilter) =>
      updateParams({ kind, keyword: localKeyword.trim(), page: 1 }),
    [updateParams, localKeyword]
  );

  const handleSearch = useCallback(
    () => updateParams({ keyword: localKeyword.trim(), page: 1 }),
    [updateParams, localKeyword]
  );

  // 초기화는 필터만 되돌린다 — 보고 있던 탭은 그대로 둔다
  const handleReset = useCallback(
    () => updateParams({ kind: "", keyword: "", page: 1 }),
    [updateParams]
  );

  // 유형 셀렉트 — 서버 enum 순서대로 고른 탭의 유형만, 건수는 요약 `kindCounts`(0건 포함)
  const typeOptions = useMemo<TypeOption[]>(
    () =>
      EXCEPTION_KINDS.filter((kind) => kind.tab === params.tab).map((kind) => ({
        value: kind.value,
        label: kind.label,
        count: summary?.kindCounts[kind.value],
      })),
    [params.tab, summary]
  );

  const rows = list?.page.content ?? [];
  const isFiltered = Boolean(params.kind || params.keyword);

  const body = (() => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12 text-sz-n-400">
          <Loader2Icon className="animate-spin" />
        </div>
      );
    }
    if (isError) {
      return (
        <div className="px-6 py-[72px] text-center">
          <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
            목록을 불러오지 못했습니다
          </div>
          <div className="text-[12px] text-sz-n-500">
            잠시 후 다시 시도해 주세요.
          </div>
          <button
            type="button"
            className={`${BTN_SECONDARY} mt-4`}
            onClick={() => refetch()}
          >
            다시 시도
          </button>
        </div>
      );
    }
    if (rows.length === 0) {
      return (
        <div className="px-6 py-[72px] text-center">
          <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
            {isFiltered ? "검색 결과가 없습니다" : EMPTY_TEXT[params.tab].title}
          </div>
          <div className="text-[12px] text-sz-n-500">
            {isFiltered
              ? "주문번호 · 접수번호 · 브랜드명 중 하나로 검색됩니다. 조건을 바꿔 다시 검색해 보세요."
              : EMPTY_TEXT[params.tab].description}
          </div>
          {isFiltered && (
            <button
              type="button"
              className={`${BTN_SECONDARY} mt-4`}
              onClick={handleReset}
            >
              검색 초기화
            </button>
          )}
        </div>
      );
    }
    return (
      <ExceptionTable
        columns={params.tab === "DELAY" ? DELAY_COLUMNS : DELIVERY_COLUMNS}
        rows={rows}
        rowKey={rowKey}
        onRowClick={handleRowClick}
      />
    );
  })();

  return (
    <div className="flex shrink-0 flex-col">
      <ExceptionFilter
        tab={params.tab}
        tabCounts={summary?.tabCounts}
        onTabChange={handleTabChange}
        typeValue={params.kind}
        typeOptions={typeOptions}
        onTypeChange={handleKindChange}
        keyword={localKeyword}
        onKeywordChange={(keyword) => updateLocalParam("keyword", keyword)}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        <ExceptionToolbar
          tab={params.tab}
          total={list?.page.pageInfo.totalResults}
          actOnBehalfCount={summary?.actOnBehalfCount}
          size={params.size}
          onSizeChange={(size) => updateParams({ size, page: 1 })}
        />

        {/* 1280px 노트북에서 다음 단계 열이 잘리지 않게 최소 폭을 두고, 그보다 좁으면 카드 안에서만 가로 스크롤 */}
        <div className="overflow-x-auto">
          <div className="min-w-[960px]">{body}</div>
        </div>

        {pageInfo.totalPages > 1 && !isLoading && (
          <div className="flex justify-center border-t border-sz-n-100 py-[11px]">
            <Pagination {...pageInfo} />
          </div>
        )}
      </div>
    </div>
  );
}
