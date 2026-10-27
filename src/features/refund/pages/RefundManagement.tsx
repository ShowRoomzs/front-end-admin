import ListViewWrapper from "@/common/components/ListViewWrapper/ListViewWrapper";
import Table from "@/common/components/Table/Table";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import { useParams } from "@/common/hooks/useParams";
import RefundFilterCard from "@/features/refund/components/list/RefundFilterCard";
import RefundTableBar from "@/features/refund/components/list/RefundTableBar";
import ExecuteModal from "@/features/refund/components/modals/ExecuteModal";
import RetryModal from "@/features/refund/components/modals/RetryModal";
import TransferModal from "@/features/refund/components/modals/TransferModal";
import Btn from "@/features/refund/components/shared/Btn";
import { createRefundColumns } from "@/features/refund/constants/columns";
import { REFUND_INITIAL_PARAMS } from "@/features/refund/constants/params";
import {
  useCompleteTransfer,
  useExecuteRefund,
  useGetRefundList,
  useGetRefundSummary,
} from "@/features/refund/hooks/useAdminRefund";
import type {
  RefundDetail,
  RefundItem,
  RefundListParams,
  RefundRouteFilter,
  RefundSort,
  RefundTab,
} from "@/features/refund/types";
import { normalizeRefundParams } from "@/features/refund/utils/params";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * 다이얼로그 — 집행 재확인(M1) · 재시도(M2) · 계좌 송금 처리(M3). 모두 행 버튼에서만 연다.
 * M3는 송금액이 상세에 없어 목록 행을 함께 들고 간다.
 */
type Dialog =
  | { kind: "execute" | "retry"; refundId: number }
  | { kind: "transfer"; refundId: number; record: RefundItem }
  | null;

const EMPTY_COPY: Record<RefundTab, { title: string; description: string }> = {
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
    description: "PG 자동 환불과 운영자 사유 환불이 모두 여기에서 조회됩니다.",
  },
};

/**
 * 어드민 환불 관리 — 운영자 사유 환불의 집행 · PG 자동 환불 실패 재시도 · 전체 환불 조회.
 *
 * 환불은 자동이 기본이라 이 화면은 예외만 다룬다. 탭이 셋이다 — 집행 대기(경고) · 실패(위험) · 완료(성공).
 * 목록에는 행 상세가 없다: 돈이 움직이는 행동은 행 버튼 → 다이얼로그에서만 일어난다.
 * 집행과 재시도는 서버에서 같은 `POST /execute`다.
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

  const {
    data: list,
    isLoading,
    isPlaceholderData,
  } = useGetRefundList(listParams);
  const { data: summary } = useGetRefundSummary();
  const executeMutation = useExecuteRefund();
  const transferMutation = useCompleteTransfer();

  const pageInfo = usePaginationInfo({
    data: list?.pageInfo,
    onPageChange: (page) => updateParam("page", page),
  });

  const handleExecute = useCallback(
    (record: RefundItem) =>
      setDialog({ kind: "execute", refundId: record.refundTaskId }),
    []
  );
  const handleRetry = useCallback(
    (record: RefundItem) =>
      setDialog({ kind: "retry", refundId: record.refundTaskId }),
    []
  );
  const handleTransfer = useCallback(
    (record: RefundItem) =>
      setDialog({ kind: "transfer", refundId: record.refundTaskId, record }),
    []
  );
  const columns = useMemo(
    () =>
      createRefundColumns({
        onExecute: handleExecute,
        onRetry: handleRetry,
        onTransfer: handleTransfer,
      }),
    [handleExecute, handleRetry, handleTransfer]
  );

  const closeDialog = useCallback(() => setDialog(null), []);
  /**
   * 요청을 보낸 그 건의 다이얼로그일 때만 닫는다 — 응답이 오는 사이 다른 행의 다이얼로그가
   * 열려 있으면 그건 운영자가 아직 읽는 중이라 건드리지 않는다. 결과 토스트는 훅이 띄운다.
   */
  const closeDialogFor = useCallback(
    (refundId: number) =>
      setDialog((current) => (current?.refundId === refundId ? null : current)),
    []
  );

  /**
   * 결과(DONE · FAILED · UNKNOWN · SKIPPED)가 무엇이든 응답이 오면 닫는다 — 결과는 토스트로 알리고
   * 행은 서버가 정한 탭으로 옮겨진다. HTTP 실패(409 등)면 열어 둔 채 상세를 다시 읽는다.
   */
  const confirm = (detail: RefundDetail, retry: boolean) => {
    executeMutation.mutate(
      { refundTaskId: detail.refundTaskId, refundNo: detail.refundNo, retry },
      { onSuccess: () => closeDialogFor(detail.refundTaskId) }
    );
  };

  // 집행·재시도로 마지막 쪽이 비면 한 쪽 앞으로 옮긴다 — 서버가 쪽 번호를 맞춰 준다고 믿지 않는다.
  // 이전 결과를 들고 있는 동안(isPlaceholderData)은 그 쪽수가 지금 조건의 것이 아니라 보지 않는다.
  const totalPages = list?.pageInfo.totalPages;
  useEffect(() => {
    if (isPlaceholderData || totalPages === undefined) return;
    const lastPage = Math.max(1, totalPages);
    if (listParams.page > lastPage) {
      updateParam("page", lastPage);
    }
  }, [isPlaceholderData, totalPages, listParams.page, updateParam]);

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

  const pendingFor = (refundId: number) =>
    executeMutation.isPending &&
    executeMutation.variables?.refundTaskId === refundId;

  return (
    <ListViewWrapper>
      <RefundFilterCard
        tab={listParams.tab}
        tabs={summary?.tabs}
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
        <RefundTableBar
          tab={listParams.tab}
          stat={summary?.tabs[listParams.tab]}
          sort={listParams.sort}
          size={listParams.size}
          onSortChange={(sort: RefundSort) => updateParams({ sort, page: 1 })}
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
              rowKey="refundTaskId"
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
      </div>

      {dialog?.kind === "execute" && (
        <ExecuteModal
          refundId={dialog.refundId}
          isPending={pendingFor(dialog.refundId)}
          onClose={closeDialog}
          onConfirm={(detail) => confirm(detail, false)}
        />
      )}
      {dialog?.kind === "transfer" && (
        <TransferModal
          record={dialog.record}
          isPending={
            transferMutation.isPending &&
            transferMutation.variables?.refundTaskId === dialog.refundId
          }
          onClose={closeDialog}
          onConfirm={(body) =>
            transferMutation.mutate(
              {
                refundTaskId: dialog.refundId,
                refundNo: dialog.record.refundNo,
                body,
              },
              { onSuccess: () => closeDialogFor(dialog.refundId) }
            )
          }
        />
      )}
      {dialog?.kind === "retry" && (
        <RetryModal
          refundId={dialog.refundId}
          isPending={pendingFor(dialog.refundId)}
          onClose={closeDialog}
          onConfirm={(detail) => confirm(detail, true)}
        />
      )}
    </ListViewWrapper>
  );
}
