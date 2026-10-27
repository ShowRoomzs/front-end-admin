import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import { BRAND_MEMBER_LIST_PATH } from "@/features/brandMember/constants/params";
import { useGetBrandMemberList } from "@/features/brandMember/hooks/useBrandMember";
import type { AdminBrandListItem } from "@/features/brandMember/types";
import MemberListFilter from "@/features/memberShared/components/list/MemberListFilter";
import MemberListTable from "@/features/memberShared/components/list/MemberListTable";
import type { MemberListColumn } from "@/features/memberShared/components/list/MemberListTable";
import { MEMBER_LIST_INITIAL_PARAMS } from "@/features/memberShared/constants/params";
import {
  BTN_SECONDARY,
  T_MAIN_CLASS,
} from "@/features/memberShared/constants/styles";
import type { MemberListParams } from "@/features/memberShared/types";
import { eventDate, toneVariant } from "@/features/memberShared/utils/format";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/** 시안 `.tb-brd` 열 폭 — 브랜드명은 남은 폭 */
const COLUMNS: Array<MemberListColumn<AdminBrandListItem>> = [
  {
    key: "brandName",
    label: "브랜드명",
    render: (row) => <span className={T_MAIN_CLASS}>{row.brandName}</span>,
  },
  {
    key: "managerName",
    label: "담당자",
    width: 120,
    render: (row) => row.managerName ?? "—",
  },
  {
    key: "managerContact",
    label: "연락처",
    width: 170,
    render: (row) => (
      <span className="tabular-nums">{row.managerContact ?? "—"}</span>
    ),
  },
  {
    // 세 값 모두 정상 분류라 배지 없이 평문 — 배지를 씌우면 상태처럼 읽힌다
    key: "businessType",
    label: "사업자 구분",
    width: 150,
    render: (row) => row.businessType ?? "—",
  },
  {
    key: "joinedAt",
    label: "가입일",
    width: 140,
    render: (row) => (
      <span className="text-[11px] tabular-nums text-sz-n-500">
        {eventDate(row.joinedAt)}
      </span>
    ),
  },
  {
    key: "connectedCreatorCount",
    label: "연결 인플루언서",
    width: 160,
    render: (row) => (
      <span
        className={cn(
          "tabular-nums",
          row.connectedCreatorCount > 0 ? "font-semibold" : "text-sz-n-400"
        )}
      >
        {row.connectedCreatorCount}명
      </span>
    ),
  },
  {
    key: "listStatus",
    label: "상태",
    width: 150,
    render: (row) => (
      <StatusBadge variant={toneVariant(row.listStatusTone)}>
        {row.listStatusLabel}
      </StatusBadge>
    ),
  },
];

/**
 * 14 브랜드 목록(rev.7) — C1 전체(탈퇴 승인 대기 상단 고정 · 경고 배경) · C2 탈퇴 승인 대기 탭(고정 없음 · 최장 대기) ·
 * C3 승인 대기 0건(툴바에 「0건」을 남긴다). 고정 · 정렬 · 탭 건수는 서버가 정한다.
 * 제목(h1)은 셸이 메뉴 라벨로 그린다.
 */
export default function BrandMemberList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { params, localParams, update, updateParams, updateLocalParam, reset } =
    useParams<MemberListParams>(MEMBER_LIST_INITIAL_PARAMS);
  const { data, isLoading, isError } = useGetBrandMemberList(params);

  const pageInfo = usePaginationInfo({
    data: data?.pageInfo,
    onPageChange: (page) => updateParams({ page }),
  });

  const handleRowClick = useCallback(
    (row: AdminBrandListItem) =>
      // 목록 조건을 들고 간다 — 상세의 [목록]이 같은 탭 · 검색어 · 페이지로 돌아온다
      navigate({
        pathname: `${BRAND_MEMBER_LIST_PATH}/${row.marketId}`,
        search: location.search,
      }),
    [navigate, location.search]
  );

  const summary = data?.summary;
  const isPendingTab = params.tab === "WITHDRAWAL_PENDING";
  const toolbar = isPendingTab ? (
    <>
      탈퇴 승인 대기 <b className="text-sz-n-900">{pageInfo.totalResults}</b>건
      {summary?.longestPendingDays != null && (
        <>
          {" · "}최장 대기{" "}
          <b className="text-sz-n-900">{summary.longestPendingDays}일</b>
        </>
      )}
    </>
  ) : (
    <>
      총 <b className="text-sz-n-900">{pageInfo.totalResults}</b>건 ·{" "}
      <b className="text-sz-n-900">
        탈퇴 승인 대기 {summary?.withdrawalPending ?? 0}건
      </b>
    </>
  );

  return (
    <div className="text-sz-n-900">
      <MemberListFilter
        tab={params.tab}
        summary={summary}
        keyword={localParams.keyword}
        placeholder="브랜드명 검색"
        inputWidth={200}
        onTabChange={(tab) => updateParams({ tab, page: 1 })}
        onKeywordChange={(keyword) => updateLocalParam("keyword", keyword)}
        onSearch={update}
      />
      <MemberListTable
        columns={COLUMNS}
        rows={data?.content ?? []}
        rowKey={(row) => row.marketId}
        // 전체 탭에서만 — 대기 탭은 전부 같은 상태라 행 전체가 경고색이면 읽기 어렵다
        isPinned={(row) => params.tab === "ALL" && row.withdrawalPending}
        onRowClick={handleRowClick}
        toolbar={toolbar}
        size={Number(params.size)}
        onSizeChange={(size) => updateParams({ size, page: 1 })}
        pageInfo={pageInfo}
        isLoading={isLoading}
        emptyState={
          <div className="px-6 py-[72px] text-center">
            <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
              {isError
                ? "목록을 불러오지 못했습니다"
                : params.keyword
                  ? "검색 결과가 없습니다"
                  : "해당하는 브랜드가 없습니다"}
            </div>
            <div className="text-[12px] text-sz-n-500">
              {isError
                ? "잠시 뒤 다시 시도해 주세요."
                : params.keyword
                  ? "브랜드명 또는 회원번호(BRD-1042)로 검색됩니다."
                  : "이 상태의 브랜드 회원이 없습니다."}
            </div>
            {params.keyword && (
              <button
                type="button"
                className={cn(BTN_SECONDARY, "mt-4")}
                onClick={reset}
              >
                검색 초기화
              </button>
            )}
          </div>
        }
      />
    </div>
  );
}
