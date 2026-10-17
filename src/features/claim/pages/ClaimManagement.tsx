import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import ClaimDetailModal from "@/features/claim/components/detail/ClaimDetailModal";
import ClaimFilterBar from "@/features/claim/components/list/ClaimFilterBar";
import ClaimTable from "@/features/claim/components/list/ClaimTable";
import {
  CLAIM_INITIAL_PARAMS,
  CLAIM_TAB_DEFAULT_SORT,
} from "@/features/claim/constants/params";
import {
  useGetClaimList,
  useGetClaimSummary,
} from "@/features/claim/hooks/useAdminClaimQueries";
import type {
  ClaimListItem,
  ClaimListParams,
  ClaimSort,
  ClaimTab,
} from "@/features/claim/types";
import {
  normalizeClaimParams,
  toClaimListQuery,
} from "@/features/claim/utils/params";
import Btn from "@/features/contract/components/shared/Btn";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

/** 다른 화면(06d 예외 관리 등)이 상세를 바로 열 때 싣는 주소 값 — `?claimId=3021` */
const CLAIM_ID_PARAM = "claimId";

function parseClaimId(value: string | null): number | null {
  const id = Number(value);
  return value && Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * 어드민 거래 관리 › 반품·교환 (시안 ui-admin-06b-claims rev.1 · `GET /v1/admin/claims`).
 *
 * 운영자가 실행하는 일은 상세의 **반려 이의 인용 · 검수 무응답 환불**(둘 다 운영자 사유 환불 편입)뿐이다 —
 * 회수·입고·검수·재발송은 소비자와 브랜드의 일이라 목록에도 액션이 없고, 행을 누르면 상세 모달이 열린다.
 * 페이지 제목 「반품·교환」은 셸(MainLayout)이 그린다 — 여기서 h1을 다시 그리지 않는다.
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
  const [searchParams, setSearchParams] = useSearchParams();

  // 주소의 값은 문자열이고 손으로 고칠 수 있다 — 조회·화면은 정리한 값만 쓴다
  const listParams = useMemo(() => normalizeClaimParams(params), [params]);
  const draft = normalizeClaimParams(localParams);
  const query = useMemo(() => toClaimListQuery(listParams), [listParams]);

  const { data: list, isLoading, isError } = useGetClaimList(query);
  const { data: summary } = useGetClaimSummary();

  // 주소의 `claimId`로 들어오면 그 건의 상세를 연다 — 화면에 머문 채 주소만 바뀌어도 따라간다
  const urlClaimId = parseClaimId(searchParams.get(CLAIM_ID_PARAM));
  const [selectedClaimId, setSelectedClaimId] = useState<number | null>(
    urlClaimId
  );
  const [seenUrlClaimId, setSeenUrlClaimId] = useState(urlClaimId);
  if (urlClaimId !== seenUrlClaimId) {
    setSeenUrlClaimId(urlClaimId);
    if (urlClaimId !== null) setSelectedClaimId(urlClaimId);
  }

  /** 선택한 건이 목록에서 마지막으로 보인 자리 — 조치로 탭에서 빠진 뒤에도 이웃을 찾는다 */
  const [anchor, setAnchor] = useState<{
    claimId: number;
    index: number;
  } | null>(null);

  const pageInfo = usePaginationInfo({
    data: list?.pageInfo,
    onPageChange: (page) => updateParam("page", page),
  });

  // 모달의 ‹ 이전 · 다음 › — 지금 보고 있는 목록(탭·검색·정렬)의 순서를 따른다
  const ids = useMemo(
    () => list?.content.map((item) => item.claim.claimId) ?? [],
    [list]
  );
  const index = selectedClaimId !== null ? ids.indexOf(selectedClaimId) : -1;
  // 렌더 중 갱신(React 문서의 「이전 렌더 값으로 state 조정」) — 자리가 바뀐 때만 부른다
  if (
    selectedClaimId !== null &&
    index >= 0 &&
    (anchor?.claimId !== selectedClaimId || anchor.index !== index)
  ) {
    setAnchor({ claimId: selectedClaimId, index });
  }
  const neighbors = useMemo(() => {
    if (index >= 0) {
      return { prev: ids[index - 1], next: ids[index + 1] };
    }
    // 인용·환불로 그 건이 탭을 떠나 indexOf가 -1이 되면 —
    // 버튼이 사라지지 않게 마지막으로 있던 자리를 기준으로 이웃을 잡는다(뒤 건이 그 자리로 당겨온다)
    if (selectedClaimId !== null && anchor?.claimId === selectedClaimId) {
      const at = Math.min(anchor.index, ids.length);
      return { prev: ids[at - 1], next: ids[at] };
    }
    return { prev: undefined, next: undefined };
  }, [ids, index, anchor, selectedClaimId]);

  // 탭을 옮기면 정렬도 그 탭의 기본으로 돌아간다 — 작업 탭과 조회 탭의 기본이 다르다
  const handleTabChange = useCallback(
    (tab: ClaimTab) => updateParams({ tab, sort: "", page: 1 }),
    [updateParams]
  );

  const handleDraftChange = useCallback(
    (key: "type" | "searchField" | "keyword", value: string) =>
      updateLocalParam(key, value),
    [updateLocalParam]
  );

  const handleRowClick = useCallback(
    (item: ClaimListItem) => setSelectedClaimId(item.claim.claimId),
    []
  );

  const handleClose = useCallback(() => {
    setSelectedClaimId(null);
    if (searchParams.has(CLAIM_ID_PARAM)) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete(CLAIM_ID_PARAM);
          return next;
        },
        { replace: true }
      );
    }
  }, [searchParams, setSearchParams]);

  const hasFilter = listParams.keyword !== "" || listParams.type !== "";
  const emptyState = (
    <>
      <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
        {hasFilter ? "검색 결과가 없습니다" : "해당하는 반품·교환이 없습니다"}
      </div>
      <div className="text-[12px] text-sz-n-500">
        {hasFilter
          ? "접수·주문번호는 정확히, 브랜드명 · 소비자는 일부만 입력해도 검색됩니다."
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
        tab={listParams.tab}
        draft={{
          type: draft.type,
          searchField: draft.searchField,
          keyword: localParams.keyword,
        }}
        counts={summary?.tabCounts}
        onTabChange={handleTabChange}
        onDraftChange={handleDraftChange}
        onSearch={update}
        onReset={reset}
      />

      <ClaimTable
        tab={listParams.tab}
        list={list}
        summary={summary}
        isLoading={isLoading}
        isError={isError}
        sort={listParams.sort || CLAIM_TAB_DEFAULT_SORT[listParams.tab]}
        size={listParams.size}
        pageInfo={pageInfo}
        emptyState={emptyState}
        onSortChange={(sort: ClaimSort) => updateParams({ sort, page: 1 })}
        onSizeChange={(size) => updateParams({ size, page: 1 })}
        onRowClick={handleRowClick}
      />

      {selectedClaimId !== null && (
        <ClaimDetailModal
          claimId={selectedClaimId}
          prevClaimId={neighbors.prev}
          nextClaimId={neighbors.next}
          onNavigate={setSelectedClaimId}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
