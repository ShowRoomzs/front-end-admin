import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import ApplicationTabFilter from "@/features/creator/components/ApplicationTabFilter/ApplicationTabFilter";
import { CREATOR_APPLICATION_COLUMNS } from "@/features/creator/constants/columns";
import { useGetCreatorApplicationList } from "@/features/creator/hooks/useGetCreatorApplicationList";
import type {
  CreatorApplicationInfo,
  CreatorApplicationParams,
  CreatorApplicationStatus,
} from "@/features/creator/services/creatorService";
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

const EMPTY_COUNTS = { all: 0, pending: 0, approved: 0, rejected: 0 };

const INITIAL_PARAMS: CreatorApplicationParams = {
  status: "PENDING",
  page: 1,
  size: 20,
  keyword: "",
};

export default function CreatorApplicationManagement() {
  const navigate = useNavigate();
  const { params, localParams, update, updateParam, updateLocalParam } =
    useParams<CreatorApplicationParams>(INITIAL_PARAMS);

  const { data: creatorApplicationList, isLoading } =
    useGetCreatorApplicationList(params);

  // 상태별 건수는 목록 응답에 함께 온다(별도 집계 호출 불필요)
  const counts = creatorApplicationList?.statusCounts ?? EMPTY_COUNTS;

  const pageInfo = usePaginationInfo({
    data: creatorApplicationList?.pageInfo,
    onPageChange: (page) => {
      updateParam("page", page);
    },
  });

  const handleRowClick = useCallback(
    (record: CreatorApplicationInfo) => {
      // 상세에서 이전/다음 이동을 계산하려면 현재 목록 컨텍스트가 필요하다
      const siblingIds = (creatorApplicationList?.content ?? []).map(
        (item) => item.applicationId
      );
      navigate(`/showroom/registration/${record.applicationId}`, {
        state: { siblingIds },
      });
    },
    [navigate, creatorApplicationList]
  );

  const handleStatusChange = useCallback(
    (status: CreatorApplicationStatus) => {
      updateParam("status", status);
    },
    [updateParam]
  );

  const emptyState = useMemo(
    () => (
      <div className="px-6 py-[72px] text-center">
        <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">⌕</div>
        <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
          검색 결과가 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          다른 계정 아이디로 검색하거나 필터를 변경해 보세요.
        </div>
      </div>
    ),
    []
  );

  return (
    <ListViewWrapper>
      <ApplicationTabFilter
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
          </span>
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

        <Table
          columns={CREATOR_APPLICATION_COLUMNS}
          data={creatorApplicationList?.content ?? []}
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
