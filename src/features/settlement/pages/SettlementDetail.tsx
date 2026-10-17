import { usePageSubtitle } from "@/common/components/MainLayout/usePageSubtitle";
import NotReady from "@/common/components/NotReady/NotReady";
import RecordNav from "@/common/components/RecordNav/RecordNav";
import { DEV_MOCK_ENABLED } from "@/common/utils/devMock";
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
  InvoiceCheckModal,
  RedistributeModal,
} from "@/features/settlement/components/modals/SettlementModals";
import { SETTLEMENT_LIST_PATH } from "@/features/settlement/constants/params";
import {
  useCheckInfluencerInvoice,
  useGetAdminSettlementDetail,
  useRedistribute,
  useRegisterBrandInvoice,
  useRequestAccountCheck,
} from "@/features/settlement/hooks/useAdminSettlement";
import { adminSettlementService } from "@/features/settlement/services/adminSettlementService";
import {
  isBeforeConfirm,
  isPendingEvidence,
} from "@/features/settlement/utils/view";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
} from "react-router-dom";

type ModalKind = "redistribute" | "check" | "register" | null;

const CONTRACT_LIST_PATH = "/contract";

function showError(error: unknown) {
  toast.error(error instanceof Error ? error.message : "처리하지 못했습니다.");
}

/**
 * `/settlement/group-buy/:id` — 공구 정산 상세(ui-admin-07b · D1~D7 · M3~M5).
 *
 * 좌측은 돈의 사실(개요 · 분해 · 차감/조정 · 3자 분배 · 증빙 · 고정 지급비 · 명세),
 * 우측 sticky 레일은 상태와 조치(현재 상태 · 처리 이력)다. 배포본은 API가 없어 「준비 중」.
 */
export default function SettlementDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const goToList = useCallback(() => {
    navigate({ pathname: SETTLEMENT_LIST_PATH, search: location.search });
  }, [navigate, location.search]);

  if (!DEV_MOCK_ENABLED) {
    return (
      <div className="rounded-[8px] border border-sz-n-200 bg-white">
        <NotReady
          title="공구 정산 상세 화면은 준비 중입니다"
          action={
            <Btn variant="secondary" onClick={goToList}>
              목록
            </Btn>
          }
        />
      </div>
    );
  }
  return <SettlementDetailView onList={goToList} />;
}

function SettlementDetailView(props: { onList: () => void }) {
  const { onList } = props;
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useRouteParams<{ id: string }>();
  const settlementId = Number(id);

  const navParams = useMemo(() => {
    const query = new URLSearchParams(location.search);
    return {
      tab: query.get("tab") ?? undefined,
      keyword: query.get("keyword") || undefined,
      sort: query.get("sort") ?? undefined,
    };
  }, [location.search]);

  const {
    data: detail,
    isLoading,
    isError,
  } = useGetAdminSettlementDetail(settlementId, navParams);
  const [modal, setModal] = useState<ModalKind>(null);

  const redistribute = useRedistribute(settlementId);
  const accountCheck = useRequestAccountCheck(settlementId);
  const checkInvoice = useCheckInfluencerInvoice(settlementId);
  const registerInvoice = useRegisterBrandInvoice(settlementId);

  usePageSubtitle(detail ? `공구 정산 / ${detail.groupBuyTitle}` : null);

  const closeModal = useCallback(() => setModal(null), []);

  const goToRecord = useCallback(
    (targetId: number) => {
      navigate({
        pathname: `${SETTLEMENT_LIST_PATH}/${targetId}`,
        search: location.search,
      });
    },
    [navigate, location.search]
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
        <div className="text-[12px] text-sz-n-500">없는 정산 회차입니다.</div>
        <Btn variant="secondary" onClick={onList}>
          목록
        </Btn>
      </div>
    );
  }

  const downloadStatement = () => {
    adminSettlementService.downloadStatement().catch(showError);
  };
  const viewEvidence = () => {
    adminSettlementService.openEvidenceFile().catch(showError);
  };
  const openContract = () => {
    const contractId = detail.fixedFee?.contractId;
    if (contractId) {
      navigate(`${CONTRACT_LIST_PATH}/${contractId}`);
      return;
    }
    navigate(
      `${CONTRACT_LIST_PATH}?keyword=${encodeURIComponent(detail.groupBuyTitle)}`
    );
  };

  // 운영자가 처리할 증빙이 남은 회차는 증빙을 맨 위에 올린다(07b D7 「증빙 중심」)
  const operatorEvidencePending = detail.evidence.some(
    (item) => item.state === "CHECK_PENDING" || item.state === "ISSUE_PENDING"
  );
  const showEvidence = !isBeforeConfirm(detail) && detail.evidence.length > 0;
  const evidenceFirst =
    showEvidence &&
    detail.status === "SCHEDULED" &&
    operatorEvidencePending &&
    detail.evidence.some(isPendingEvidence);

  const evidenceCard = (
    <EvidenceCard
      detail={detail}
      onView={viewEvidence}
      onCheck={() => setModal("check")}
      onRegister={() => setModal("register")}
    />
  );

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-sz-n-900">
            {detail.groupBuyTitle}
          </h1>
          <p className="mt-0.5 text-[12px] tabular-nums text-sz-n-600">
            {detail.settlementNo}
          </p>
        </div>
        <RecordNav
          onList={onList}
          onPrev={
            detail.navigation.prevId !== null
              ? () => goToRecord(detail.navigation.prevId as number)
              : undefined
          }
          onNext={
            detail.navigation.nextId !== null
              ? () => goToRecord(detail.navigation.nextId as number)
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex min-w-0 flex-col gap-4">
          {evidenceFirst && evidenceCard}
          <OverviewCard detail={detail} />
          <BreakdownCard detail={detail} />
          {detail.adjustment && <AdjustmentCard detail={detail} />}
          {detail.clawbacksApplied.length > 0 && (
            <ClawbackAppliedCard detail={detail} />
          )}
          <DistributionCard detail={detail} />
          {showEvidence && !evidenceFirst && evidenceCard}
          <FixedFeeCard detail={detail} onOpenContract={openContract} />
          <StatementCard detail={detail} onDownload={downloadStatement} />
        </div>

        <div className="sticky top-0 flex flex-col gap-4">
          <CurrentStateCard
            detail={detail}
            actions={{
              onRedistribute: () => setModal("redistribute"),
              onAccountCheck: () =>
                accountCheck.mutate(undefined, {
                  onSuccess: () =>
                    toast.success("계좌 확인 요청을 남겼습니다."),
                  onError: showError,
                }),
              onCheckInvoice: () => setModal("check"),
              onRegisterInvoice: () => setModal("register"),
              onDownloadStatement: downloadStatement,
              accountCheckPending: accountCheck.isPending,
            }}
          />
          <HistoryCard detail={detail} />
        </div>
      </div>

      {modal === "redistribute" && (
        <RedistributeModal
          detail={detail}
          isPending={redistribute.isPending}
          onClose={closeModal}
          onSubmit={(payload) =>
            redistribute.mutate(payload, {
              onSuccess: () => {
                closeModal();
                toast.success("PG에 재분배를 지시했습니다.");
              },
              onError: showError,
            })
          }
        />
      )}
      {modal === "check" && (
        <InvoiceCheckModal
          detail={detail}
          isPending={checkInvoice.isPending}
          onClose={closeModal}
          onSubmit={(result) =>
            checkInvoice.mutate(result, {
              onSuccess: () => {
                closeModal();
                toast.success(
                  result === "MATCH"
                    ? "대조를 확인했습니다. 인플루언서 지급 보류가 풀렸습니다."
                    : "세금계산서를 반려했습니다."
                );
              },
              onError: showError,
            })
          }
        />
      )}
      {modal === "register" && (
        <BrandInvoiceModal
          detail={detail}
          isPending={registerInvoice.isPending}
          onClose={closeModal}
          onSubmit={(payload) =>
            registerInvoice.mutate(payload, {
              onSuccess: () => {
                closeModal();
                toast.success("브랜드 세금계산서 발행본을 등록했습니다.");
              },
              onError: showError,
            })
          }
        />
      )}
    </>
  );
}
