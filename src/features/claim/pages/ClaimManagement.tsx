import NotReady from "@/common/components/NotReady/NotReady";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import ClaimDetailModal from "@/features/claim/components/detail/ClaimDetailModal";
import ClaimFilterBar from "@/features/claim/components/list/ClaimFilterBar";
import ClaimTable from "@/features/claim/components/list/ClaimTable";
import { CLAIM_INITIAL_PARAMS } from "@/features/claim/constants/params";
import {
  CLAIM_API_AVAILABLE,
  useGetClaimList,
  useGetClaimSummary,
} from "@/features/claim/hooks/useAdminClaimQueries";
import type {
  ClaimListItem,
  ClaimListParams,
  ClaimSort,
  ClaimTab,
} from "@/features/claim/types";
import Btn from "@/features/contract/components/shared/Btn";
import { useCallback, useMemo, useState } from "react";

/**
 * 어드민 거래 관리 › 반품·교환 (시안 ui-admin-06b-claims rev.1).
 *
 * 운영자가 실행하는 일은 **반려 이의 인용(운영자 사유 환불) 하나**뿐이다 — 회수·입고·검수·재발송은
 * 소비자와 브랜드의 일이라 목록에도 액션이 없고, 행을 누르면 상세 모달이 열린다.
 * 페이지 제목 「반품·교환」은 셸(MainLayout)이 그린다 — 여기서 h1을 다시 그리지 않는다.
 *
 * 백엔드 API가 아직 없다: DEV는 목업, 배포본은 틀(탭·검색)만 두고 데이터 자리에 「준비 중」을 띄운다.
 */
export default function ClaimManagement() {
  const {
    params,
    localParams,
    updateParam,
    updateParams,
    updateLocalParam,
    update,
    reset,
  } = useParams<ClaimListParams>(CLAIM_INITIAL_PARAMS);

  const { data: list, isLoading, isError } = useGetClaimList(params);
  const { data: summary } = useGetClaimSummary();
  const [selectedClaimNo, setSelectedClaimNo] = useState<string | null>(null);

  const pageInfo = usePaginationInfo({
    data: list?.pageInfo,
    onPageChange: (page) => updateParam("page", page),
  });

  // 모달의 ‹ 이전 · 다음 › — 지금 보고 있는 목록(탭·검색·정렬)의 순서를 따른다
  const neighbors = useMemo(() => {
    const ids = list?.content.map((item) => item.claimNo) ?? [];
    const index = selectedClaimNo ? ids.indexOf(selectedClaimNo) : -1;
    return {
      prev: index > 0 ? ids[index - 1] : undefined,
      next: index >= 0 && index < ids.length - 1 ? ids[index + 1] : undefined,
    };
  }, [list, selectedClaimNo]);

  const handleTabChange = useCallback(
    (tab: ClaimTab) => updateParams({ tab, page: 1 }),
    [updateParams]
  );

  const handleDraftChange = useCallback(
    (key: "kind" | "keyword", value: string) => updateLocalParam(key, value),
    [updateLocalParam]
  );

  const handleRowClick = useCallback(
    (item: ClaimListItem) => setSelectedClaimNo(item.claimNo),
    []
  );

  const hasFilter = params.keyword !== "" || params.kind !== "";
  const emptyState = (
    <>
      <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
        {hasFilter ? "검색 결과가 없습니다" : "해당하는 반품·교환이 없습니다"}
      </div>
      <div className="text-[12px] text-sz-n-500">
        {hasFilter
          ? "접수번호 · 주문번호 · 브랜드명 · 소비자 중 하나로 검색됩니다. 철자를 확인해 주세요."
          : "소비자가 반품·교환을 신청하면 이 목록에 표시됩니다."}
      </div>
      {hasFilter && (
        <Btn variant="secondary" className="mt-4" onClick={reset}>
          검색 초기화
        </Btn>
      )}
    </>
  );

  return (
    <div>
      <ClaimFilterBar
        tab={params.tab}
        draft={{ kind: localParams.kind, keyword: localParams.keyword }}
        counts={summary?.tabCounts}
        onTabChange={handleTabChange}
        onDraftChange={handleDraftChange}
        onSearch={update}
        onReset={reset}
      />

      {CLAIM_API_AVAILABLE ? (
        <ClaimTable
          tab={params.tab}
          list={list}
          isLoading={isLoading}
          isError={isError}
          sort={params.sort}
          size={Number(params.size)}
          pageInfo={pageInfo}
          emptyState={emptyState}
          onSortChange={(sort: ClaimSort) => updateParams({ sort, page: 1 })}
          onSizeChange={(size) => updateParams({ size, page: 1 })}
          onRowClick={handleRowClick}
        />
      ) : (
        <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
          <NotReady title="반품·교환 화면은 준비 중입니다">
            반품·교환 API가 준비되면 이 자리에 접수 목록과 상세가 표시됩니다.
          </NotReady>
        </div>
      )}

      {CLAIM_API_AVAILABLE && selectedClaimNo && (
        <ClaimDetailModal
          claimNo={selectedClaimNo}
          prevClaimNo={neighbors.prev}
          nextClaimNo={neighbors.next}
          onNavigate={setSelectedClaimNo}
          onClose={() => setSelectedClaimNo(null)}
        />
      )}
    </div>
  );
}
