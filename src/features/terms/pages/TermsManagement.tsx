import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/common/constants";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import { createTermsListColumns } from "@/features/terms/constants/columns";
import {
  TERMS_INITIAL_PARAMS,
  TERMS_PAGE_SIZES,
  TERMS_TYPE_TABS,
} from "@/features/terms/constants/params";
import { useGetTermsList } from "@/features/terms/hooks/useTermsQueries";
import type {
  TermsListParams,
  TermsTypeFilter,
} from "@/features/terms/types/terms";
import { PlusIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export const TERMS_LIST_PATH = "/settings/terms";

/**
 * C1 — 약관 및 정책 관리 목록.
 *
 * 앞선 정적 콘텐츠 화면과 결정적으로 다르다 — **원문 수정이 불가하고, 내리는 경로도
 * 없다.** 개정은 새 버전 등록뿐이고 과거 버전은 영구 보관된다. 동의 기록이 "동의한
 * 버전"을 참조하므로 원문이 바뀌면 누가 무엇에 동의했는지가 무너지기 때문이다.
 *
 * 그래서 이 화면에는 수정·삭제 버튼이 하나도 없다. 나중에 추가하지 말 것.
 */
export default function TermsManagement() {
  const navigate = useNavigate();
  const {
    params,
    localParams,
    update,
    updateParam,
    updateParams,
    updateLocalParam,
  } = useParams<TermsListParams>(TERMS_INITIAL_PARAMS);

  const { data: termsList, isLoading } = useGetTermsList(params);

  const pageInfo = usePaginationInfo({
    data: termsList?.pageInfo,
    onPageChange: (page) => {
      updateParam("page", page);
    },
  });

  const handleTypeChange = useCallback(
    (type: TermsTypeFilter) => {
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

  const columns = useMemo(
    () =>
      createTermsListColumns({
        onRegisterVersion: (document) =>
          navigate(
            `${TERMS_LIST_PATH}/${document.documentId}/versions/register`
          ),
      }),
    [navigate]
  );

  const emptyState = useMemo(() => {
    if (params.keyword) {
      return (
        <div className="px-6 py-[72px] text-center">
          <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">⌕</div>
          <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
            검색 결과가 없습니다
          </div>
          <div className="text-[12px] text-sz-n-500">
            다른 문서명으로 검색해 보세요.
          </div>
        </div>
      );
    }

    return (
      <div className="px-6 py-[72px] text-center">
        <div className="mb-2.5 text-[28px] leading-none text-sz-n-300">＋</div>
        <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
          등록된 문서가 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          약관·정책 문서를 등록하면 시행일부터 소비자 화면에 노출됩니다.
        </div>
      </div>
    );
  }, [params.keyword]);

  return (
    <ListViewWrapper>
      <div className="mb-4 flex shrink-0 items-center justify-end">
        <button
          type="button"
          onClick={() => navigate(`${TERMS_LIST_PATH}/register`)}
          className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-sz-accent-500 px-3.5 text-[12px] font-medium text-white hover:bg-sz-accent-600"
        >
          <PlusIcon className="size-3.5" />
          문서 등록
        </button>
      </div>

      <div className="mb-4 flex shrink-0 items-center justify-between gap-4 rounded-[8px] border border-sz-n-200 bg-white px-4 py-3">
        <div className="flex flex-wrap">
          {TERMS_TYPE_TABS.map((tab) => {
            const isActive = params.type === tab.value;
            const count = termsList?.typeCounts[tab.value];
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTypeChange(tab.value)}
                className={`mr-5 flex items-center gap-1.5 whitespace-nowrap border-b-2 px-0.5 py-1.5 text-[12px] ${
                  isActive
                    ? "border-sz-accent-500 font-medium text-sz-accent-500"
                    : "border-transparent text-sz-n-500 hover:text-sz-n-700"
                }`}
              >
                {tab.label}
                {count !== undefined && (
                  <span
                    className={`rounded-lg px-1.5 text-[10px] ${
                      isActive
                        ? "bg-sz-accent-50 text-sz-accent-600"
                        : "bg-sz-n-100 text-sz-n-600"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 gap-1.5">
          <input
            type="text"
            value={localParams.keyword}
            onChange={(event) =>
              updateLocalParam("keyword", event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                update();
              }
            }}
            placeholder="문서명 검색"
            className="h-8 w-[200px] rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          />
          <button
            type="button"
            onClick={update}
            className="inline-flex h-8 items-center rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100"
          >
            검색
          </button>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
          <span className="text-[12px] text-sz-n-600">
            총 <b className="text-sz-n-900">{pageInfo.totalResults}</b>건
            {!!termsList?.scheduledCount && (
              <>
                {" · 시행 예정 "}
                <b className="text-sz-n-900">{termsList.scheduledCount}</b>건
              </>
            )}
            {!!termsList?.supersededCount && (
              <>
                {" · 구버전 "}
                <b className="text-sz-n-900">{termsList.supersededCount}</b>건
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
            {TERMS_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}건씩
              </option>
            ))}
          </select>
        </div>

        <Table
          columns={columns}
          data={termsList?.content ?? []}
          pageInfo={pageInfo}
          isLoading={isLoading}
          // 구버전 문서도 상세는 볼 수 있다 — 조회 전용이라는 뜻이지 접근 불가가 아니다
          onRowClick={(record) =>
            navigate(`${TERMS_LIST_PATH}/${record.documentId}`)
          }
          emptyState={emptyState}
          fitWidth
          autoHeight
          maxRows={14}
          bodyClassName="overflow-hidden whitespace-nowrap"
          headerClassName="whitespace-nowrap"
        />
      </div>
    </ListViewWrapper>
  );
}
