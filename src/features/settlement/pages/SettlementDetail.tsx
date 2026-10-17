import { usePageSubtitle } from "@/common/components/MainLayout/usePageSubtitle";
import RecordNav from "@/common/components/RecordNav/RecordNav";
import Btn from "@/features/contract/components/shared/Btn";
import {
  AdjustmentCard,
  BreakdownCard,
  ClawbackAppliedCard,
  DistributionCard,
  EvidenceCard,
  FixedFeeCard,
  OverviewCard,
  StatementCard,
} from "@/features/settlement/components/detail/DetailCards";
import {
  CurrentStateCard,
  HistoryCard,
} from "@/features/settlement/components/detail/DetailRail";
import {
  BrandInvoiceModal,
  InvoiceVerifyModal,
  RedistributeModal,
  type BrandInvoiceErrors,
} from "@/features/settlement/components/modals/SettlementModals";
import { SETTLEMENT_LIST_PATH } from "@/features/settlement/constants/params";
import {
  useGetAdminSettlementDetail,
  useIssueBrandInvoice,
  useRedistribute,
  useSettlementNeighbors,
  useVerifyTaxInvoice,
} from "@/features/settlement/hooks/useAdminSettlement";
import { adminSettlementService } from "@/features/settlement/services/adminSettlementService";
import type { TaxDocument } from "@/features/settlement/types";
import {
  NETWORK_ERROR_MESSAGE,
  readApiError,
  saveBlob,
} from "@/features/settlement/utils/apiError";
import { normalizeListParams } from "@/features/settlement/utils/listParams";
import {
  hasEvidenceRows,
  hasOperatorEvidence,
  hasPendingEvidence,
  isBeforeConfirm,
} from "@/features/settlement/utils/view";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
} from "react-router-dom";

type ModalState =
  | { kind: "redistribute" }
  | { kind: "verify"; document: TaxDocument }
  | { kind: "register"; document: TaxDocument }
  | null;

const CONTRACT_LIST_PATH = "/contract";

/** 상태가 바뀌어 지금 조치가 맞지 않는다 — 모달을 닫고 최신 상세를 다시 읽는다 */
const STALE_CODES = [
  "SETTLEMENT_STATE_CHANGED",
  "SETTLEMENT_TAX_DOCUMENT_STATE_CHANGED",
  "SETTLEMENT_PAYOUT_RETRY_EXCEEDED",
  "SETTLEMENT_NOT_FOUND",
];

const NO_BRAND_ERRORS: BrandInvoiceErrors = {
  file: null,
  approvalNumber: null,
};

/**
 * `/settlement/group-buy/:id` — 공구 정산 상세(ui-admin-07b · D1~D7 · M3~M5 · `GET /v1/admin/settlements/{id}`).
 *
 * 좌측은 돈의 사실(개요 · 분해 · 차감/조정 · 3자 분배 · 증빙 · 고정 지급비 · 명세),
 * 우측 sticky 레일은 상태와 조치(현재 상태 · 처리 이력)다. 버튼 판정은 서버 `actions`가 정한다.
 */
export default function SettlementDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useRouteParams<{ id: string }>();
  const settlementId = Number(id);

  const query = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const listParams = useMemo(
    () => normalizeListParams(Object.fromEntries(query)),
    [query]
  );
  const fromList = query.has("tab");

  const {
    data: detail,
    isLoading,
    isError,
  } = useGetAdminSettlementDetail(settlementId);
  const neighbors = useSettlementNeighbors(
    settlementId,
    listParams,
    fromList && Boolean(detail)
  );
  const [modal, setModal] = useState<ModalState>(null);
  const [redistributeError, setRedistributeError] = useState<string | null>(
    null
  );
  const [brandErrors, setBrandErrors] =
    useState<BrandInvoiceErrors>(NO_BRAND_ERRORS);
  const [isDownloading, setIsDownloading] = useState(false);

  const redistribute = useRedistribute(settlementId);
  const verifyInvoice = useVerifyTaxInvoice(settlementId);
  const issueInvoice = useIssueBrandInvoice(settlementId);

  usePageSubtitle(
    detail ? `공구 정산 / ${detail.overview.groupBuyTitle}` : null
  );

  const goToList = useCallback(() => {
    navigate({ pathname: SETTLEMENT_LIST_PATH, search: location.search });
  }, [navigate, location.search]);

  const goToRecord = useCallback(
    (targetId: number, page: number) => {
      const search = new URLSearchParams(location.search);
      search.set("page", String(page));
      navigate({
        pathname: `${SETTLEMENT_LIST_PATH}/${targetId}`,
        search: search.toString(),
      });
    },
    [navigate, location.search]
  );

  const closeModal = useCallback(() => {
    setModal(null);
    setRedistributeError(null);
    setBrandErrors(NO_BRAND_ERRORS);
  }, []);

  /** 공통 실패 처리 — 상태가 바뀐 경우는 닫고 다시 읽는다. 나머지는 서버 문구를 토스트로 */
  const handleStale = useCallback(
    async (code: string | undefined, message: string | undefined) => {
      toast.error(message ?? NETWORK_ERROR_MESSAGE);
      if (code && STALE_CODES.includes(code)) {
        closeModal();
        await redistribute.refresh();
      }
    },
    [closeModal, redistribute]
  );

  if (isLoading) {
    return (
      <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
        불러오는 중…
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center">
        <div className="text-[13px] font-semibold text-sz-n-700">
          정산을 찾을 수 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          없는 정산 회차이거나 불러오지 못했습니다.
        </div>
        <Btn variant="secondary" onClick={goToList}>
          목록
        </Btn>
      </div>
    );
  }

  const downloadStatement = async () => {
    setIsDownloading(true);
    try {
      const blob = await adminSettlementService.downloadStatement(settlementId);
      // 서버 파일명 규칙 — 정산명세_{정산번호}.xlsx(CORS가 Content-Disposition을 숨긴다)
      saveBlob(blob, `정산명세_${detail.settlementNumber}.xlsx`);
    } catch (cause) {
      const { code, message } = await readApiError(cause);
      await handleStale(code, message);
    } finally {
      setIsDownloading(false);
    }
  };

  const openContract = (contractId: number) =>
    navigate(`${CONTRACT_LIST_PATH}/${contractId}`);

  const verifyTarget = detail.taxDocuments.find((doc) => doc.actions.canVerify);
  const registerTarget = detail.taxDocuments.find(
    (doc) => doc.actions.canRegister
  );

  /*
    「증빙 중심」 배치(07b D6 · D7) — 증빙 · 고정 지급비를 맨 위에 올리고 금액 분해를 그 아래에 둔다.
    운영자가 처리할 증빙이 남은 지급 예정 회차(D7)와, 세금계산서 2건이 증빙의 전부인
    사업자 지급 완료 회차(D6)가 대상이다.
  */
  const showEvidence =
    !isBeforeConfirm(detail.status) && hasEvidenceRows(detail);
  const evidenceFirst =
    showEvidence &&
    ((detail.status === "PAYOUT_SCHEDULED" &&
      hasOperatorEvidence(detail) &&
      hasPendingEvidence(detail)) ||
      (detail.status === "PAID" &&
        detail.overview.creatorBusinessType === "BUSINESS"));

  const evidenceCard = (
    <EvidenceCard
      detail={detail}
      onVerify={(document) => setModal({ kind: "verify", document })}
      onRegister={(document) => setModal({ kind: "register", document })}
    />
  );

  const fixedFeeCard = (
    <FixedFeeCard detail={detail} onOpenContract={openContract} />
  );

  return (
    // 시안 본문 행간 1.6 · 글자색 --n-900(앱 기본값은 1.5 · shadcn 전경색이라 화면 루트에서 맞춘다)
    <div className="leading-[1.6] text-sz-n-900">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-sz-n-900">
            {detail.overview.groupBuyTitle}
          </h1>
          <p className="mt-0.5 text-[12px] tabular-nums text-sz-n-600">
            {detail.settlementNumber}
          </p>
        </div>
        <RecordNav
          onList={goToList}
          onPrev={
            neighbors.prev
              ? () =>
                  goToRecord(
                    neighbors.prev?.settlementId ?? settlementId,
                    neighbors.prev?.page ?? listParams.page
                  )
              : undefined
          }
          onNext={
            neighbors.next
              ? () =>
                  goToRecord(
                    neighbors.next?.settlementId ?? settlementId,
                    neighbors.next?.page ?? listParams.page
                  )
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex min-w-0 flex-col gap-4">
          {evidenceFirst ? (
            <>
              {evidenceCard}
              {fixedFeeCard}
              <BreakdownCard detail={detail} />
              <OverviewCard detail={detail} />
            </>
          ) : (
            <>
              <OverviewCard detail={detail} />
              <BreakdownCard detail={detail} />
            </>
          )}
          {detail.adjustment && <AdjustmentCard detail={detail} />}
          {detail.clawbacksApplied.length > 0 && (
            <ClawbackAppliedCard detail={detail} />
          )}
          <DistributionCard detail={detail} />
          {!evidenceFirst && (
            <>
              {showEvidence && evidenceCard}
              {fixedFeeCard}
            </>
          )}
          <StatementCard
            detail={detail}
            isDownloading={isDownloading}
            onDownload={downloadStatement}
          />
        </div>

        <div className="sticky top-0 flex flex-col gap-4">
          <CurrentStateCard
            detail={detail}
            actions={{
              onRedistribute: () => setModal({ kind: "redistribute" }),
              onVerifyInvoice: () =>
                verifyTarget &&
                setModal({ kind: "verify", document: verifyTarget }),
              onRegisterInvoice: () =>
                registerTarget &&
                setModal({ kind: "register", document: registerTarget }),
              onDownloadStatement: downloadStatement,
              isDownloading,
            }}
          />
          <HistoryCard detail={detail} />
        </div>
      </div>

      {modal?.kind === "redistribute" && (
        <RedistributeModal
          detail={detail}
          isPending={redistribute.isPending}
          serverError={redistributeError}
          onClose={closeModal}
          onSubmit={(payload) => {
            setRedistributeError(null);
            redistribute.mutate(payload, {
              onSuccess: () => {
                closeModal();
                toast.success("PG에 재분배를 지시했습니다.");
              },
              onError: async (cause) => {
                const { code, message } = await readApiError(cause);
                // 계좌가 없으면 출처를 바꿔 다시 시도할 수 있게 모달에 남긴다
                if (code === "SETTLEMENT_ACCOUNT_MISSING") {
                  setRedistributeError(
                    `${message ?? "수취자의 등록 계좌가 없습니다."} 다른 계좌 출처를 고르거나 수취자에게 계좌 등록을 요청해 주세요.`
                  );
                  return;
                }
                await handleStale(code, message);
              },
            });
          }}
        />
      )}
      {modal?.kind === "verify" && (
        <InvoiceVerifyModal
          detail={detail}
          document={modal.document}
          isPending={verifyInvoice.isPending}
          onClose={closeModal}
          onSubmit={(result) =>
            verifyInvoice.mutate(
              { documentId: modal.document.documentId, result },
              {
                onSuccess: () => {
                  closeModal();
                  toast.success(
                    result === "MATCH"
                      ? "승인번호를 확인했습니다. 인플루언서 지급 보류가 풀렸습니다."
                      : "세금계산서를 반려했습니다."
                  );
                },
                onError: async (cause) => {
                  const { code, message } = await readApiError(cause);
                  await handleStale(code, message);
                },
              }
            )
          }
        />
      )}
      {modal?.kind === "register" && (
        <BrandInvoiceModal
          document={modal.document}
          isPending={issueInvoice.isPending}
          serverErrors={brandErrors}
          onClose={closeModal}
          onSubmit={(payload) => {
            setBrandErrors(NO_BRAND_ERRORS);
            issueInvoice.mutate(payload, {
              onSuccess: () => {
                closeModal();
                toast.success("발행본을 등록했습니다.");
              },
              onError: async (cause) => {
                const { code, message } = await readApiError(cause);
                // 형식 오류는 해당 칸 아래에 — 파일(PDF 아님 · 용량) · 승인번호
                if (code === "SETTLEMENT_TAX_INVOICE_NUMBER_INVALID") {
                  setBrandErrors({
                    file: null,
                    approvalNumber: message ?? null,
                  });
                  return;
                }
                if (code === "INVALID_INPUT") {
                  setBrandErrors({
                    file: message ?? null,
                    approvalNumber: null,
                  });
                  return;
                }
                await handleStale(code, message);
              },
            });
          }}
        />
      )}
    </div>
  );
}
