import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import NotReady from "@/common/components/NotReady/NotReady";
import Table from "@/common/components/Table/Table";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import { DEV_MOCK_ENABLED } from "@/common/utils/devMock";
import RefundFilterCard from "@/features/refund/components/list/RefundFilterCard";
import RefundTableBar from "@/features/refund/components/list/RefundTableBar";
import ExecuteModal from "@/features/refund/components/modals/ExecuteModal";
import RetryModal from "@/features/refund/components/modals/RetryModal";
import Btn from "@/features/refund/components/shared/Btn";
import { createRefundColumns } from "@/features/refund/constants/columns";
import { REFUND_INITIAL_PARAMS } from "@/features/refund/constants/params";
import {
  useExecuteRefund,
  useGetRefundList,
  useGetRefundSummary,
  useRetryRefund,
} from "@/features/refund/hooks/useAdminRefund";
import type {
  RefundDetail,
  RefundListItem,
  RefundListParams,
  RefundRouteFilter,
  RefundSort,
  RefundStatus,
} from "@/features/refund/types";
import { formatWon } from "@/features/refund/utils/format";
import { normalizeRefundParams } from "@/features/refund/utils/params";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";

/** 다이얼로그 — 집행 재확인(M1) · 재시도(M2). 둘 다 행 버튼에서만 연다 */
type Dialog = { kind: "execute" | "retry"; refundId: number } | null;

const EMPTY_COPY: Record<RefundStatus, { title: string; description: string }> =
  {
    PENDING: {
      title: "집행 대기 중인 환불이 없습니다",
      description:
        "반품·교환 관리와 주문 조회에서 [환불 대기 편입]한 운영자 사유 환불이 여기에 모입니다.",
    },
    FAILED: {
      title: "실패한 환불이 없습니다",
      description: "PG 자동 환불이 재시도 후에도 실패하면 여기에 올라옵니다.",
    },
    DONE: {
      title: "완료된 환불이 없습니다",
      description:
        "PG 자동 환불과 운영자 사유 환불이 모두 여기에서 조회됩니다.",
    },
  };

/**
 * 어드민 환불 관리 — 운영자 사유 환불의 집행 · PG 자동 환불 실패 재시도 · 전체 환불 조회.
 *
 * 환불은 자동이 기본이라 이 화면은 예외만 다룬다. 탭이 셋이다 — 집행 대기(경고) · 실패(위험) · 완료(성공).
 * 목록에는 행 상세가 없다: 돈이 움직이는 행동은 행 버튼 → 다이얼로그에서만 일어난다.
 * 제목(h1)은 셸(MainLayout)이 그린다.
 */
export default function RefundManagement() {
  const {
    params,
    localParams,
    update,
    updateParam,
    updateParams,
    updateLocalParam,
  } = useParams<RefundListParams>(REFUND_INITIAL_PARAMS);
  const listParams = useMemo(() => normalizeRefundParams(params), [params]);
  const [dialog, setDialog] = useState<Dialog>(null);

  const { data: list, isLoading } = useGetRefundList(listParams);
  const { data: summary } = useGetRefundSummary();
  const executeMutation = useExecuteRefund();
  const retryMutation = useRetryRefund();

  const pageInfo = usePaginationInfo({
    data: list?.pageInfo,
    onPageChange: (page) => updateParam("page", page),
  });

  const handleExecute = useCallback(
    (record: RefundListItem) =>
      setDialog({ kind: "execute", refundId: record.refundId }),
    []
  );
  const handleRetry = useCallback(
    (record: RefundListItem) =>
      setDialog({ kind: "retry", refundId: record.refundId }),
    []
  );
  const columns = useMemo(
    () =>
      createRefundColumns({ onExecute: handleExecute, onRetry: handleRetry }),
    [handleExecute, handleRetry]
  );

  const closeDialog = useCallback(() => setDialog(null), []);

  const confirmExecute = (detail: RefundDetail) => {
    executeMutation.mutate(
      {
        refundId: detail.refundId,
        body: { confirmedAmount: detail.amount },
      },
      {
        onSuccess: () => {
          toast.success(
            `${formatWon(detail.amount)} 환불을 집행했습니다 — ${detail.refundNumber}`
          );
          closeDialog();
        },
        onError: (error) =>
          toast.error(error.message || "환불을 집행하지 못했습니다."),
      }
    );
  };

  const confirmRetry = (refundId: number) => {
    retryMutation.mutate(refundId, {
      onSuccess: (result) => {
        if (result.result === "SUCCEEDED") {
          toast.success("재시도했습니다 — PG 취소가 완료되었습니다.");
        } else {
          // 다시 실패하면 행은 실패 탭에 그대로 남는다
          toast.error(
            `${result.failureLabel ?? "PG 오류"}로 다시 실패했습니다. 잠시 후 다시 시도해 주세요.`
          );
        }
        closeDialog();
      },
      onError: (error) =>
        toast.error(error.message || "재시도하지 못했습니다."),
    });
  };

  const handleReset = useCallback(() => {
    // 탭은 지키고 검색 조건만 비운다 — 탭까지 바뀌면 보던 곳을 잃는다
    updateParams({ route: "", keyword: "", page: 1 });
  }, [updateParams]);

  const emptyState = useMemo(() => {
    const searching = listParams.keyword !== "" || listParams.route !== "";
    const copy = EMPTY_COPY[listParams.tab];
    return (
      <div className="px-6 py-[72px] text-center">
        <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
          {searching ? "검색 결과가 없습니다" : copy.title}
        </div>
        <div className="text-[12px] text-sz-n-500">
          {searching
            ? "환불번호 · 주문번호 · PG 거래번호 중 하나로 검색됩니다. 조건을 확인해 주세요."
            : copy.description}
        </div>
        {searching && (
          <Btn className="mt-4" onClick={handleReset}>
            검색 초기화
          </Btn>
        )}
      </div>
    );
  }, [listParams.keyword, listParams.route, listParams.tab, handleReset]);

  return (
    <ListViewWrapper>
      <RefundFilterCard
        tab={listParams.tab}
        counts={summary?.tabCounts}
        route={localParams.route}
        keyword={localParams.keyword}
        onTabChange={(tab) => updateParams({ tab, page: 1 })}
        onRouteChange={(route: RefundRouteFilter) =>
          updateLocalParam("route", route)
        }
        onKeywordChange={(keyword) => updateLocalParam("keyword", keyword)}
        onSearch={update}
        onReset={handleReset}
      />

      <div className="flex flex-col overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
        {DEV_MOCK_ENABLED ? (
          <>
            <RefundTableBar
              tab={listParams.tab}
              summary={list?.summary}
              sort={listParams.sort}
              size={listParams.size}
              onSortChange={(sort: RefundSort) =>
                updateParams({ sort, page: 1 })
              }
              onSizeChange={(size) => updateParams({ size, page: 1 })}
            />
            {/*
              1280px 노트북(본문 976px)에서도 [집행]·[재시도] 버튼이 가로 스크롤 뒤로 숨지 않아야 한다 —
              그래서 열을 비율로 줄이고(보조 문구는 셀 여백 안으로 번진다), 그보다 좁아질 때만 카드 안에서 가로로 민다.
            */}
            <div className="overflow-x-auto">
              <div className="min-w-[960px]">
                <Table
                  columns={columns}
                  data={list?.content ?? []}
                  // 시안은 한 페이지에 다 들어가 페이저를 그리지 않는다 — 쪽이 둘 이상일 때만 붙인다
                  pageInfo={pageInfo.totalPages > 1 ? pageInfo : undefined}
                  isLoading={isLoading}
                  emptyState={emptyState}
                  fitWidth
                  autoHeight
                  maxRows={14}
                  bodyClassName="whitespace-nowrap"
                  headerClassName="whitespace-nowrap"
                />
              </div>
            </div>
          </>
        ) : (
          <NotReady title="환불 관리 화면은 준비 중입니다">
            환불 API가 연결되면 집행 대기 · 실패 · 완료 환불이 이곳에
            표시됩니다.
          </NotReady>
        )}
      </div>

      {dialog?.kind === "execute" && (
        <ExecuteModal
          refundId={dialog.refundId}
          isPending={executeMutation.isPending}
          onClose={closeDialog}
          onConfirm={confirmExecute}
        />
      )}
      {dialog?.kind === "retry" && (
        <RetryModal
          refundId={dialog.refundId}
          isPending={retryMutation.isPending}
          onClose={closeDialog}
          onConfirm={confirmRetry}
        />
      )}
    </ListViewWrapper>
  );
}
