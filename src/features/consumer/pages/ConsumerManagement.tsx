import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/common/constants";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import ConsumerTabFilter from "@/features/consumer/components/ConsumerTabFilter/ConsumerTabFilter";
import { CONSUMER_COLUMNS } from "@/features/consumer/constants/columns";
import {
  CONSUMER_EMPTY_SUMMARY,
  CONSUMER_INITIAL_PARAMS,
  CONSUMER_PAGE_SIZES,
  CONSUMER_SORT_OPTIONS,
} from "@/features/consumer/constants/params";
import { useGetConsumerList } from "@/features/consumer/hooks/useGetConsumerList";
import type {
  ConsumerListParams,
  ConsumerProvider,
  ConsumerSort,
  ConsumerTab,
} from "@/features/consumer/types/consumer";
import { useCallback, useMemo } from "react";

/**
 * C1~C3 — 소비자 회원 목록 (§25-3).
 *
 * 이 화면의 골격은 **개인정보 열람 통제**다. 이름·휴대폰은 마스킹이 기본이고 목록에는
 * 해제 경로가 아예 없다 — 전체 값이 필요한 순간은 CS 대응 1건 단위라 상세에서만
 * 사유를 남기고 연다(§25-1). 여기에 해제 버튼을 추가하지 말 것.
 *
 * 마스킹은 서버가 끝내서 내려주므로 원본이 응답에 없다. 화면이 가리는 방식으로 바꾸면
 * 페이로드에 전체 값이 남아 통제가 무너진다.
 */
export default function ConsumerManagement() {
  const {
    params,
    localParams,
    update,
    updateParam,
    updateParams,
    updateLocalParam,
  } = useParams<ConsumerListParams>(CONSUMER_INITIAL_PARAMS);

  const { data: consumerList, isLoading } = useGetConsumerList(params);
  const summary = consumerList?.summary ?? CONSUMER_EMPTY_SUMMARY;

  const pageInfo = usePaginationInfo({
    data: consumerList?.pageInfo,
    onPageChange: (page) => {
      updateParam("page", page);
    },
  });

  // 탭·수단·정렬·표시 건수를 바꾸면 페이지도 1로 — 3페이지에서 건수 적은 조건으로 옮기면 빈 목록이 뜬다
  const handleTabChange = useCallback(
    (tab: ConsumerTab) => {
      updateParams({ tab, page: 1 });
    },
    [updateParams]
  );

  const handleProviderChange = useCallback(
    (providerType: ConsumerProvider | null) => {
      updateParams({ providerType, page: 1 });
    },
    [updateParams]
  );

  const handleSortChange = useCallback(
    (sort: ConsumerSort) => {
      updateParams({ sort, page: 1 });
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
    빈 상태는 조치할 일이 없는 화면이라 **버튼을 두지 않는다.** 대신 검색이 빗나갔을 때는
    문구가 검색 규칙(뒤 4자리)을 알려 준다 — 휴대폰 전체 번호로 찾다가 0건이 나오는 것이
    이 화면의 대표적인 실패다(§25-3 · 시안 C3).
  */
  const emptyState = useMemo(() => {
    if (params.keyword) {
      return (
        <div className="px-6 py-[72px] text-center">
          <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">?</div>
          <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
            검색 결과가 없습니다
          </div>
          <div className="text-[12px] leading-relaxed text-sz-n-500">
            휴대폰은 <b className="font-semibold text-sz-n-700">뒤 4자리</b>로
            검색합니다. 회원번호(CST-)와 닉네임은 전체 값이 일치해야 찾을 수
            있습니다.
          </div>
        </div>
      );
    }

    return (
      <div className="px-6 py-[72px] text-center">
        <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">⌕</div>
        <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
          해당하는 회원이 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          다른 탭이나 가입 수단으로 조회해 보세요.
        </div>
      </div>
    );
  }, [params.keyword]);

  return (
    <ListViewWrapper>
      <ConsumerTabFilter
        tab={params.tab}
        onTabChange={handleTabChange}
        summary={summary}
        providerType={params.providerType}
        onProviderChange={handleProviderChange}
        keyword={localParams.keyword}
        onKeywordChange={(keyword) => updateLocalParam("keyword", keyword)}
        onSearch={update}
      />

      <div className="flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-sz-n-200 px-4 py-2.5">
          <span className="min-w-0 truncate text-[12px] text-sz-n-600">
            {params.keyword ? (
              /* 검색 중에는 무엇으로 찾았는지 되짚는다 — 요약 줄이 지금 보는 범위를 말해야 한다 */
              <>
                검색: <b className="text-sz-n-900">“{params.keyword}”</b> · 결과{" "}
                <b className="text-sz-n-900">
                  {pageInfo.totalResults.toLocaleString()}
                </b>
                명
              </>
            ) : params.tab === "SUSPENDED" ? (
              /*
                정지 탭에서는 4분할 요약을 그대로 두지 않는다 — 지금 보고 있는 범위와
                어긋나기 때문이다. 서버가 이 탭에서만 최근 30일 값을 채워 준다.
              */
              <>
                정지{" "}
                <b className="text-sz-n-900">
                  {summary.suspended.toLocaleString()}
                </b>
                명
                {summary.newSuspendedIn30Days !== null && (
                  <>
                    {" · 최근 30일 신규 정지 "}
                    <b className="text-sz-n-900">
                      {summary.newSuspendedIn30Days.toLocaleString()}
                    </b>
                    명
                  </>
                )}
              </>
            ) : (
              <>
                총{" "}
                <b className="text-sz-n-900">
                  {summary.total.toLocaleString()}
                </b>
                명 · 활성{" "}
                <b className="text-sz-n-900">
                  {summary.active.toLocaleString()}
                </b>{" "}
                · 정지{" "}
                <b className="text-sz-n-900">
                  {summary.suspended.toLocaleString()}
                </b>{" "}
                · 탈퇴{" "}
                <b className="text-sz-n-900">
                  {summary.withdrawn.toLocaleString()}
                </b>
              </>
            )}
          </span>

          <div className="flex shrink-0 items-center gap-2">
            <select
              aria-label="정렬"
              value={params.sort}
              onChange={(event) =>
                handleSortChange(event.target.value as ConsumerSort)
              }
              style={MODAL_SELECT_CHEVRON_STYLE}
              className="h-7 appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[26px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
            >
              {CONSUMER_SORT_OPTIONS.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              aria-label="표시 건수"
              value={params.size}
              onChange={(event) => handleSizeChange(Number(event.target.value))}
              style={MODAL_SELECT_CHEVRON_STYLE}
              className="h-7 appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[26px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
            >
              {CONSUMER_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}건씩
                </option>
              ))}
            </select>
          </div>
        </div>

        {/*
          행 클릭으로 상세에 가는 것이 시안이지만 소비자 상세(§25-4)는 아직 개발 범위가
          아니다 — 서버 상세 응답이 구버전이라 마스킹 해제·본인확인 정보·배송지 목록이
          모두 비어 있다. 상세가 준비되면 여기에 `onRowClick`을 붙인다.
        */}
        <Table
          columns={CONSUMER_COLUMNS}
          data={consumerList?.content ?? []}
          pageInfo={pageInfo}
          isLoading={isLoading}
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
