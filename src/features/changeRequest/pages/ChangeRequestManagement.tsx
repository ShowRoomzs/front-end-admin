import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import ChangeRequestTabFilter from "@/features/changeRequest/components/ChangeRequestTabFilter/ChangeRequestTabFilter";
import { CHANGE_REQUEST_COLUMNS } from "@/features/changeRequest/constants/columns";
import {
  CHANGE_REQUEST_EMPTY_COUNTS,
  CHANGE_REQUEST_INITIAL_PARAMS,
} from "@/features/changeRequest/constants/params";
import { useGetChangeRequestList } from "@/features/changeRequest/hooks/useGetChangeRequestList";
import type {
  ChangeRequestInfo,
  ChangeRequestParams,
  ChangeRequestStatusFilter,
} from "@/features/changeRequest/services/changeRequestService";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * C1·C2 — 변경 요청 목록.
 *
 * 정렬은 서버가 고정한다(검토 대기 우선 · 오래된 순 최상단, SLA 초과가 맨 위).
 * 정렬 셀렉트와 표시 건수 셀렉트를 두지 않는 건 rev.2·rev.4에서 의도적으로 제거한 사항이다.
 */
export default function ChangeRequestManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const { params, localParams, update, updateParam, updateParams, updateLocalParam } =
    useParams<ChangeRequestParams>(CHANGE_REQUEST_INITIAL_PARAMS);

  const { data: changeRequestList, isLoading } = useGetChangeRequestList(params);

  // 상태별 건수는 목록 응답에 함께 온다(별도 집계 호출 불필요)
  const counts = changeRequestList?.statusCounts ?? CHANGE_REQUEST_EMPTY_COUNTS;

  const pageInfo = usePaginationInfo({
    data: changeRequestList?.pageInfo,
    onPageChange: (page) => {
      updateParam("page", page);
    },
  });

  const handleRowClick = useCallback(
    (record: ChangeRequestInfo) => {
      /*
        목록의 쿼리스트링을 그대로 들고 간다. 상세는 여기서 status를 읽어
        이전/다음 계산 범위로 넘기고, [목록] 버튼은 같은 탭·페이지·검색어로 되돌아온다.
        (입점 심사처럼 location.state로 형제 id를 넘기지 않는다 — 서버가 계산해 준다)
      */
      navigate({
        pathname: `/market/change-requests/${record.requestId}`,
        search: location.search,
      });
    },
    [navigate, location.search]
  );

  const handleStatusChange = useCallback(
    (status: ChangeRequestStatusFilter) => {
      // 탭을 바꾸면 페이지도 1로 돌려야 한다 — 3페이지에서 건수가 적은 탭으로 옮기면 빈 목록이 뜬다
      updateParams({ status, page: 1 });
    },
    [updateParams]
  );

  /*
    빈 상태는 두 가지가 다른 의미다 — 검색이 빗나간 것과, 처리할 게 없다는 것.
    C2가 말하는 "0건이 명확히 보여야 한다"는 후자를 가리킨다.
  */
  const emptyState = useMemo(() => {
    if (params.keyword) {
      return (
        <div className="px-6 py-[72px] text-center">
          <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">⌕</div>
          <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
            검색 결과가 없습니다
          </div>
          <div className="text-[12px] text-sz-n-500">
            다른 브랜드명으로 검색해 보세요.
          </div>
        </div>
      );
    }

    if (params.status === "PENDING") {
      return (
        <div className="px-6 py-[72px] text-center">
          <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">✓</div>
          <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
            검토 대기 중인 변경 요청이 없습니다
          </div>
          <div className="text-[12px] text-sz-n-500">
            브랜드가 파트너센터에서 변경을 요청하면 이 목록에 표시됩니다.
          </div>
        </div>
      );
    }

    return (
      <div className="px-6 py-[72px] text-center">
        <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">⌕</div>
        <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
          변경 요청이 없습니다
        </div>
      </div>
    );
  }, [params.keyword, params.status]);

  return (
    <ListViewWrapper>
      <ChangeRequestTabFilter
        status={params.status}
        onStatusChange={handleStatusChange}
        counts={counts}
        keyword={localParams.keyword}
        onKeywordChange={(keyword) => updateLocalParam("keyword", keyword)}
        onSearch={update}
      />

      <div className="flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
          <span className="text-[12px] text-sz-n-600">
            총 <b className="text-sz-n-900">{pageInfo.totalResults}</b>건
            {counts.pending > 0 && (
              <>
                {" · 검토 대기 "}
                <b className="text-sz-n-900">{counts.pending}</b>건
              </>
            )}
          </span>
        </div>

        <Table
          columns={CHANGE_REQUEST_COLUMNS}
          data={changeRequestList?.content ?? []}
          pageInfo={pageInfo}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          emptyState={emptyState}
          fitWidth
          autoHeight
          maxRows={14}
          // 행 높이를 47px로 고정하려면 셀이 줄바꿈되지 않아야 한다(시안 tbody td)
          bodyClassName="overflow-hidden whitespace-nowrap"
          headerClassName="whitespace-nowrap"
        />
      </div>
    </ListViewWrapper>
  );
}
