import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import Btn from "@/features/contract/components/shared/Btn";
import { INPUT_CLASS } from "@/features/contract/components/shared/styles";
import ActionQueue from "@/features/contract/components/list/ActionQueue";
import ContractTabs from "@/features/contract/components/list/ContractTabs";
import { CONTRACT_COLUMNS } from "@/features/contract/constants/columns";
import {
  CONTRACT_INITIAL_PARAMS,
  CONTRACT_LIST_PATH,
  CONTRACT_PAGE_SIZES,
  CONTRACT_SORT_OPTIONS,
  SELECT_CHEVRON_STYLE,
} from "@/features/contract/constants/params";
import {
  useGetAdminContractList,
  useGetAdminContractSummary,
} from "@/features/contract/hooks/useAdminContractQueries";
import type {
  AdminContractListItem,
  AdminContractListParams,
  AdminContractQueue,
  AdminContractSort,
  AdminContractTab,
} from "@/features/contract/types";
import { cn } from "@/lib/utils";
import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const SELECT_SM_CLASS =
  "h-7 cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[26px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/**
 * A1·A2 — 어드민 계약 목록.
 *
 * 조치 큐(검토 대기 · 체결 처리 대기 · 만료 확인 · 재발송 요청)를 탭보다 위에 둔다 —
 * 운영자는 처리할 것을 찾으러 온다. 큐를 고르면 서버가 탭·정렬보다 큐를 우선한다.
 * 목록에는 액션이 없다: 승인·반려·체결은 근거를 읽고 누르는 판단이라 행 클릭으로만 들어간다.
 * 운영자는 계약을 만들지 않으므로 주 CTA도 없다.
 */
export default function ContractManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    params,
    localParams,
    update,
    updateParam,
    updateParams,
    updateLocalParam,
    reset,
  } = useParams<AdminContractListParams>(CONTRACT_INITIAL_PARAMS);

  const { data: contractList, isLoading } = useGetAdminContractList(params);
  const { data: summary } = useGetAdminContractSummary();

  const pageInfo = usePaginationInfo({
    data: contractList?.pageInfo,
    onPageChange: (page) => updateParam("page", page),
  });

  const handleRowClick = useCallback(
    (record: AdminContractListItem) => {
      // 목록 조건을 들고 간다 — 상세의 [목록]이 같은 탭·큐·검색어·페이지로 돌아온다
      navigate({
        pathname: `${CONTRACT_LIST_PATH}/${record.contractId}`,
        search: location.search,
      });
    },
    [navigate, location.search]
  );

  const handleTabChange = useCallback(
    (tab: AdminContractTab) => updateParams({ tab, queue: "", page: 1 }),
    [updateParams]
  );

  const handleQueueSelect = useCallback(
    (queue: AdminContractQueue | "") => updateParams({ queue, page: 1 }),
    [updateParams]
  );

  const emptyState = useMemo(
    () => (
      <div className="px-6 py-[72px] text-center">
        <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
          {params.keyword ? "검색 결과가 없습니다" : "해당하는 계약이 없습니다"}
        </div>
        <div className="text-[12px] text-sz-n-500">
          {params.keyword
            ? "공구명 · 브랜드명 · 쇼룸명 · 계약번호 중 하나로 검색됩니다. 철자를 확인해 주세요."
            : "브랜드가 검토를 요청하면 이 목록에 표시됩니다."}
        </div>
        {params.keyword && (
          <Btn variant="secondary" className="mt-4" onClick={reset}>
            검색 초기화
          </Btn>
        )}
      </div>
    ),
    [params.keyword, reset]
  );

  const actionRequired = summary?.actionRequiredCount ?? 0;

  return (
    <ListViewWrapper>
      {/* 셸이 아니라 화면이 제목을 그린다 — 설명 줄이 붙기 때문이다(MainLayout SELF_TITLED) */}
      <div className="mb-4 shrink-0">
        <h1 className="text-[20px] font-semibold text-sz-n-900">계약 관리</h1>
        <p className="mt-0.5 text-[12px] text-sz-n-600">
          브랜드가 제출한 계약을 검토하고, 모두싸인에서 확인한 서명 현황을
          갱신해 체결을 완료합니다.
        </p>
      </div>

      <ActionQueue
        summary={summary}
        selected={params.queue}
        onSelect={handleQueueSelect}
      />

      <ContractTabs
        tab={params.tab}
        counts={summary?.tabCounts}
        dimmed={params.queue !== ""}
        onTabChange={handleTabChange}
      />

      <div className="mb-4 flex items-center gap-1.5">
        <input
          className={cn(INPUT_CLASS, "h-8 w-[300px]")}
          placeholder="공구명 · 브랜드명 · 쇼룸명 · 계약번호 검색"
          value={localParams.keyword}
          onChange={(event) => updateLocalParam("keyword", event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              update();
            }
          }}
        />
        <Btn variant="secondary" onClick={update}>
          검색
        </Btn>
        <Btn variant="secondary" onClick={reset}>
          초기화
        </Btn>
      </div>

      <div className="flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
          <span className="text-[12px] text-sz-n-600">
            총 <b className="text-sz-n-900">{pageInfo.totalResults}</b>건
            {/* 시안 A2 — 결과가 0건이면 「총 0건」만 남긴다 */}
            {actionRequired > 0 && pageInfo.totalResults > 0 && (
              <span className="text-[11px] text-sz-n-500">
                {" · 조치 필요 "}
                <b className="text-sz-n-900">{actionRequired}</b>건
              </span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <select
              aria-label="정렬"
              className={SELECT_SM_CLASS}
              style={SELECT_CHEVRON_STYLE}
              value={params.sort}
              onChange={(event) =>
                updateParams({
                  sort: event.target.value as AdminContractSort,
                  page: 1,
                })
              }
            >
              {CONTRACT_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              aria-label="표시 건수"
              className={SELECT_SM_CLASS}
              style={SELECT_CHEVRON_STYLE}
              value={params.size}
              onChange={(event) =>
                updateParams({ size: Number(event.target.value), page: 1 })
              }
            >
              {CONTRACT_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}건씩
                </option>
              ))}
            </select>
          </div>
        </div>

        {/*
          공용 Table의 fitWidth는 좁아지면 모든 열을 같은 비율로 줄여 날짜 열(「2026.10.05 10:00 ~ …」)이
          잘린다. 최소 폭을 두고, 그보다 좁은 화면(1280px 노트북 등)에서는 카드 안에서만 가로 스크롤한다.
        */}
        <div className="overflow-x-auto">
          <div className="min-w-[1080px]">
            <Table
              columns={CONTRACT_COLUMNS}
              data={contractList?.content ?? []}
              pageInfo={pageInfo}
              isLoading={isLoading}
              onRowClick={handleRowClick}
              emptyState={emptyState}
              fitWidth
              // 카드 높이를 행 수에 맞춘다 — 없으면 0건일 때 카드가 헤더 높이로 접혀 빈 상태가 잘린다
              autoHeight
              maxRows={14}
              bodyClassName="overflow-hidden whitespace-nowrap"
              headerClassName="whitespace-nowrap"
            />
          </div>
        </div>
      </div>
    </ListViewWrapper>
  );
}
