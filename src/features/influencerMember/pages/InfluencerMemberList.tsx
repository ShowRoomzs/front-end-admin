import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import { INFLUENCER_MEMBER_LIST_PATH } from "@/features/influencerMember/constants/params";
import { useGetInfluencerMemberList } from "@/features/influencerMember/hooks/useInfluencerMember";
import type { AdminCreatorListItem } from "@/features/influencerMember/types";
import MemberListFilter from "@/features/memberShared/components/list/MemberListFilter";
import MemberListTable from "@/features/memberShared/components/list/MemberListTable";
import type { MemberListColumn } from "@/features/memberShared/components/list/MemberListTable";
import { MEMBER_LIST_INITIAL_PARAMS } from "@/features/memberShared/constants/params";
import {
  BTN_SECONDARY,
  T_MAIN_CLASS,
} from "@/features/memberShared/constants/styles";
import type { MemberListParams } from "@/features/memberShared/types";
import {
  eventDate,
  externalHref,
  toneVariant,
} from "@/features/memberShared/utils/format";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * 인스타 칩(`.igb`) — 외곽선 칩이라 누를 수 있다는 게 보인다. 플랫폼 브랜드색은 쓰지 않는다(상태색 체계와 경쟁).
 * 라벨은 주소가 아니라 「인스타」 한 단어 — 목적은 읽기가 아니라 여는 것이다. 행 클릭(상세 이동)과 겹치지 않게 막는다.
 */
function InstagramChip(props: { url: string }) {
  return (
    <a
      href={externalHref(props.url)}
      target="_blank"
      rel="noreferrer noopener"
      onClick={(event) => event.stopPropagation()}
      className="group/igb inline-flex h-[21px] shrink-0 items-center gap-1 whitespace-nowrap rounded-[10px] border border-sz-n-300 bg-white px-2 text-[11px] text-sz-n-600 hover:border-sz-accent-500 hover:text-sz-accent-600"
    >
      인스타
      <span className="text-[9px] text-sz-n-400 group-hover/igb:text-sz-accent-500">
        ↗
      </span>
    </a>
  );
}

/** 시안 `.tb-inf` 열 폭 — 쇼룸명은 남은 폭 */
const COLUMNS: Array<MemberListColumn<AdminCreatorListItem>> = [
  {
    key: "showroomName",
    label: "쇼룸명",
    render: (row) => (
      <div className="flex items-center gap-[7px]">
        <span className={cn(T_MAIN_CLASS, "truncate")}>
          {row.showroomName ?? row.memberNo}
        </span>
        {row.instagramUrl && <InstagramChip url={row.instagramUrl} />}
      </div>
    ),
  },
  {
    key: "businessEmail",
    label: "업무용 이메일",
    width: 250,
    render: (row) => (
      <span className="block truncate text-[12px] tabular-nums text-sz-n-700">
        {row.businessEmail ?? "—"}
      </span>
    ),
  },
  {
    // 사업자 · 비사업자는 분류라 점 없는 중립 배지(정산 원천징수 방식이 갈리는 지점)
    key: "businessType",
    label: "사업자 여부",
    width: 130,
    render: (row) =>
      row.businessTypeLabel ? (
        <StatusBadge variant="neutral" hideDot>
          {row.businessTypeLabel}
        </StatusBadge>
      ) : (
        "—"
      ),
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
    key: "connectedBrandCount",
    label: "연결 브랜드",
    width: 130,
    render: (row) => (
      <span
        className={cn(
          "tabular-nums",
          row.connectedBrandCount > 0 ? "font-semibold" : "text-sz-n-400"
        )}
      >
        {row.connectedBrandCount}개
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
 * 16 인플루언서 목록(rev.7) — 브랜드 목록(14)과 대칭: 탭 5종 · 탈퇴 승인 대기 상단 고정 · 툴바 두 수치.
 * 쇼룸명이 공개 식별자라 첫 열, 검색은 쇼룸명 · 업무용 이메일 2축. 제목(h1)은 셸이 메뉴 라벨로 그린다.
 */
export default function InfluencerMemberList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { params, localParams, update, updateParams, updateLocalParam, reset } =
    useParams<MemberListParams>(MEMBER_LIST_INITIAL_PARAMS);
  const { data, isLoading, isError } = useGetInfluencerMemberList(params);

  const pageInfo = usePaginationInfo({
    data: data?.pageInfo,
    onPageChange: (page) => updateParams({ page }),
  });

  const handleRowClick = useCallback(
    (row: AdminCreatorListItem) =>
      navigate({
        pathname: `${INFLUENCER_MEMBER_LIST_PATH}/${row.creatorId}`,
        search: location.search,
      }),
    [navigate, location.search]
  );

  const summary = data?.summary;
  const toolbar =
    params.tab === "WITHDRAWAL_PENDING" ? (
      <>
        탈퇴 승인 대기 <b className="text-sz-n-900">{pageInfo.totalResults}</b>
        건
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
        placeholder="쇼룸명 · 업무용 이메일 검색"
        inputWidth={240}
        onTabChange={(tab) => updateParams({ tab, page: 1 })}
        onKeywordChange={(keyword) => updateLocalParam("keyword", keyword)}
        onSearch={update}
      />
      <MemberListTable
        columns={COLUMNS}
        rows={data?.content ?? []}
        rowKey={(row) => row.creatorId}
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
                  : "해당하는 인플루언서가 없습니다"}
            </div>
            <div className="text-[12px] text-sz-n-500">
              {isError
                ? "잠시 뒤 다시 시도해 주세요."
                : params.keyword
                  ? "쇼룸명 · 업무용 이메일 또는 회원번호(INF-3018)로 검색됩니다."
                  : "이 상태의 인플루언서 회원이 없습니다."}
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
