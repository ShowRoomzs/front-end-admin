import DetailCard from "@/common/components/DetailCard/DetailCard";
import HistoryList, {
  type HistoryItem,
} from "@/common/components/HistoryList/HistoryList";
import RecordNav from "@/common/components/RecordNav/RecordNav";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { queryClient } from "@/common/lib/queryClient";
import { formatDateTimeShort } from "@/common/utils/formatDate";
import { formatFileSize } from "@/common/utils/formatFileSize";
import ApprovalImpactCard from "@/features/changeRequest/components/ApprovalImpactCard/ApprovalImpactCard";
import ChangeDiffTable from "@/features/changeRequest/components/ChangeDiffTable/ChangeDiffTable";
import ChangeRequestApprovalModal from "@/features/changeRequest/components/ChangeRequestApprovalModal/ChangeRequestApprovalModal";
import ChangeRequestRejectionModal from "@/features/changeRequest/components/ChangeRequestRejectionModal/ChangeRequestRejectionModal";
import CompareCheckNote from "@/features/changeRequest/components/CompareCheckNote/CompareCheckNote";
import EvidencePreviewModal from "@/features/changeRequest/components/EvidencePreviewModal/EvidencePreviewModal";
import {
  CHANGE_REQUESTER_DETAIL_PATHS,
  CHANGE_REQUESTER_LABELS,
} from "@/features/changeRequest/constants/params";
import {
  CHANGE_REQUEST_DETAIL_QUERY_KEY,
  CHANGE_REQUEST_LIST_QUERY_KEY,
  CHANGE_REQUEST_SUMMARY_QUERY_KEY,
} from "@/features/changeRequest/constants/queryKey";
import { useGetChangeRequestDetail } from "@/features/changeRequest/hooks/useGetChangeRequestDetail";
import { useGetChangeRequestRejectReasons } from "@/features/changeRequest/hooks/useGetChangeRequestRejectReasons";
import {
  changeRequestService,
  type ChangeRequestDetailInfo,
  type ChangeRequestHistoryItem,
  type ChangeRequestProcessResponse,
  type ChangeRequestRequester,
  type ChangeRequestStatusFilter,
} from "@/features/changeRequest/services/changeRequestService";
import {
  getRequestPhrase,
  getTypeMetaLabel,
  isBusinessTypeChange,
  isCreatorType,
  resolveRequester,
} from "@/features/changeRequest/utils/requester";
import { getChangeRequestStatusBadge } from "@/features/changeRequest/utils/statusBadge";
import { useCallback, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
  useSearchParams,
} from "react-router-dom";

const LIST_PATH = "/market/change-requests";

const HISTORY_TONE: Record<
  ChangeRequestHistoryItem["event"],
  { label: string; tone: HistoryItem["tone"] }
> = {
  REQUESTED: { label: "변경 요청 접수", tone: "accent" },
  APPROVED: { label: "승인 처리", tone: "success" },
  REJECTED: { label: "반려 처리", tone: "muted" },
  CANCELED: { label: "요청 취소", tone: "muted" },
};

/**
 * C3 · C3a · C3b · C4 · C4b — 변경 요청 상세.
 *
 * 대조표의 "변경 요청 값"은 **요청자가 직접 입력한 값**이다. 운영자가 서류를 보고
 * 타이핑하지 않는다 — 오타와 책임 소재를 피하려고 파트너센터 rev.7에서 새 값 입력형으로
 * 바뀌었고, 그 값이 요청 레코드에 남아 분쟁 시 근거가 된다(§16-4).
 *
 * 인플루언서 요청(rev.7~8)도 같은 화면이다 — 사업자 전환 · 비사업자 전환(C3a · C3b)은 「승인하면」
 * 카드로 정산 영향을 승인 전에 보여주고, 계좌 변경(C4b · 기-22)은 브랜드 정산 계좌(C4)와 같은 흐름에
 * 대조 기준만 본인 실명으로 바뀐다.
 */
export default function ChangeRequestDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useRouteParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const requestId = Number(id);

  /*
    목록에서 보던 탭을 그대로 넘긴다. 서버가 이 범위 안에서 이전/다음을 계산하므로
    상세의 이동 순서가 목록 순서와 어긋날 수 없다.
  */
  const status = (searchParams.get("status") ??
    "PENDING") as ChangeRequestStatusFilter;

  const { data: detail, isLoading } = useGetChangeRequestDetail(
    requestId,
    status
  );

  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [isRejectionOpen, setIsRejectionOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: rejectReasons, isLoading: isReasonsLoading } =
    useGetChangeRequestRejectReasons(detail?.type, isRejectionOpen);

  const goToList = useCallback(() => {
    navigate({ pathname: LIST_PATH, search: location.search });
  }, [navigate, location.search]);

  /** 처리 후 목록·배지·상세를 모두 무효화한다 — 배지를 빼먹으면 GNB 숫자가 안 줄어든다 */
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [CHANGE_REQUEST_DETAIL_QUERY_KEY, requestId],
    });
    queryClient.invalidateQueries({
      queryKey: [CHANGE_REQUEST_LIST_QUERY_KEY],
    });
    queryClient.invalidateQueries({
      queryKey: [CHANGE_REQUEST_SUMMARY_QUERY_KEY],
    });
  }, [requestId]);

  const isPending = detail?.status === "PENDING";

  const handleApprove = useCallback(async () => {
    // 다른 운영자가 먼저 처리한 캐시로 버튼이 살아 있을 수 있다
    if (!detail || !isPending || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await changeRequestService.approveChangeRequest(
        detail.requestId
      );
      invalidateAll();
      setIsApprovalOpen(false);
      // C10 — 「글로우랩 정산 계좌 변경 요청을 승인했습니다.」
      toast.success(
        `${processedName(result, detail)} ${getRequestPhrase(result.type)}을 승인했습니다.`
      );
      goToList();
    } finally {
      // 실패해도 모달은 닫지 않는다 — 사유 토스트는 인터셉터가 이미 띄웠고, 재시도가 가능해야 한다
      setIsSubmitting(false);
    }
  }, [detail, isPending, isSubmitting, invalidateAll, goToList]);

  const handleReject = useCallback(
    async (reasonType: string, reasonDetail: string) => {
      if (!detail || !isPending || isSubmitting) {
        return;
      }
      setIsSubmitting(true);
      try {
        const result = await changeRequestService.rejectChangeRequest(
          detail.requestId,
          {
            reasonType,
            reasonDetail: reasonDetail || undefined,
          }
        );
        invalidateAll();
        setIsRejectionOpen(false);
        toast.success(
          `${processedName(result, detail)} ${getRequestPhrase(result.type)}을 반려했습니다.`
        );
        goToList();
      } finally {
        setIsSubmitting(false);
      }
    },
    [detail, isPending, isSubmitting, invalidateAll, goToList]
  );

  if (isLoading || !detail) {
    return (
      <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
        {isLoading ? "불러오는 중…" : "변경 요청을 찾을 수 없습니다."}
      </div>
    );
  }

  const requester = resolveRequester(detail);
  const isCreator = isCreatorType(detail.type);
  const { variant, label } = getChangeRequestStatusBadge(
    detail.status,
    detail.slaExceeded,
    true
  );
  const showImpact =
    isPending &&
    isBusinessTypeChange(detail.type) &&
    Boolean(detail.approvalImpact);

  // HistoryList는 최신순으로 받는다(정렬은 호출부 책임).
  // 서버가 새 이벤트를 추가해도 상세 화면 전체가 죽지 않도록 매핑에 없는 값은 그대로 흘린다.
  const historyItems: Array<HistoryItem> = [...detail.history]
    .reverse()
    .map((item) => {
      const mapped = HISTORY_TONE[item.event];
      return {
        label: mapped?.label ?? item.event,
        tone: mapped?.tone ?? "muted",
        processedAt: item.occurredAt,
        processorName: item.actorLabel,
      };
    });

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-[20px] font-semibold text-sz-n-900">
            {requester.name}
            {/*
              우상단 버튼군은 "이 목록 안에서의 이동"이고 이건 다른 메뉴(회원 관리)로
              나가는 동작이라 성격이 달라 제목 옆 칩으로 뺐다(§16-2).
            */}
            <button
              type="button"
              onClick={() => navigate(requesterDetailPath(requester))}
              className="inline-flex items-center rounded-[10px] border border-sz-n-200 bg-sz-n-100 px-2.5 py-0.5 text-[11px] font-medium leading-[1.7] text-sz-n-600 hover:border-sz-accent-100 hover:bg-sz-accent-50 hover:text-sz-accent-600"
            >
              {CHANGE_REQUESTER_LABELS[requester.type] ?? "요청자"} 상세 ↗
            </button>
          </h1>
          <p className="mt-0.5 text-[12px] text-sz-n-600">
            {getRequestPhrase(detail.type)} · {detail.requestCode}
          </p>
        </div>

        <RecordNav
          onList={goToList}
          onPrev={
            detail.prevRequestId
              ? () =>
                  navigate({
                    pathname: `${LIST_PATH}/${detail.prevRequestId}`,
                    search: location.search,
                  })
              : undefined
          }
          onNext={
            detail.nextRequestId
              ? () =>
                  navigate({
                    pathname: `${LIST_PATH}/${detail.nextRequestId}`,
                    search: location.search,
                  })
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex flex-col gap-4">
          <DetailCard title="변경 대조" note="변경 항목만 강조 표시">
            <div className="pt-2">
              <ChangeDiffTable
                rows={detail.diff}
                type={detail.type}
                holderCheck={detail.holderCheck}
                approvalImpact={detail.approvalImpact}
              />
            </div>
          </DetailCard>

          <CompareCheckNote
            type={detail.type}
            changedFieldLabels={detail.changedFieldLabels}
            holderCheck={detail.holderCheck}
            compareItems={detail.compareItems}
          />

          <DetailCard
            title={
              isCreator
                ? "인플루언서가 작성한 변경 사유"
                : "브랜드가 작성한 변경 사유"
            }
          >
            <p className="whitespace-pre-wrap py-2 text-[12px] leading-relaxed text-sz-n-700">
              {detail.reason ?? (
                <span className="text-sz-n-500">
                  작성된 변경 사유가 없습니다.
                  {EMPTY_REASON_NOTES[detail.type] ?? ""}
                </span>
              )}
            </p>
          </DetailCard>

          <DetailCard title="첨부 증빙" note="1개 · 필수">
            <div className="flex items-center gap-2.5 rounded-[6px] border border-sz-n-200 px-3 py-2.5">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-sz-accent-50 text-[9px] font-bold text-sz-accent-600">
                {detail.evidence.extension.toUpperCase() || "FILE"}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12px] text-sz-n-900">
                {detail.evidence.fileName}
                <span className="ml-1 text-[11px] text-sz-n-500">
                  · {formatFileSize(detail.evidence.fileSizeBytes)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="inline-flex h-8 shrink-0 items-center rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100"
              >
                미리보기
              </button>
            </div>
          </DetailCard>
        </div>

        <div className="sticky top-0 flex flex-col gap-4">
          <DetailCard title="현재 상태">
            <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3 pt-2">
              <span className="text-[12px] text-sz-n-500">상태</span>
              <StatusBadge variant={variant}>{label}</StatusBadge>
            </div>

            <div className="pt-2">
              <MetaRow label="요청 번호" value={detail.requestCode} />
              <MetaRow
                label="요청 유형"
                value={getTypeMetaLabel(detail.type)}
              />
              <MetaRow
                label="요청일시"
                value={formatDateTimeShort(detail.requestedAt)}
              />
              <MetaRow
                label="요청자"
                value={requesterLabel(detail, requester)}
              />
              {detail.processedAt && (
                <MetaRow
                  label="처리일시"
                  value={formatDateTimeShort(detail.processedAt)}
                />
              )}
              {/* 경과는 검토 대기 건에서만 의미가 있다 — 처리된 건은 서버가 null을 준다 */}
              {isPending && detail.elapsedText && (
                <MetaRow
                  label="경과"
                  value={
                    <span
                      className={
                        detail.slaExceeded
                          ? "font-semibold text-sz-warning-text"
                          : ""
                      }
                    >
                      {detail.elapsedText}
                    </span>
                  }
                />
              )}
            </div>

            {isPending ? (
              <>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRejectionOpen(true)}
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-[6px] bg-sz-danger-text px-3.5 text-[12px] font-medium text-white hover:bg-[#8f2828]"
                  >
                    ✕ 반려
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsApprovalOpen(true)}
                    className="inline-flex h-9 flex-1 items-center justify-center rounded-[6px] bg-sz-accent-500 px-3.5 text-[12px] font-medium text-white hover:bg-sz-accent-600"
                  >
                    ✓ 승인
                  </button>
                </div>
                <p className="mb-2 mt-2.5 text-[11px] leading-relaxed text-sz-n-500">
                  {pendingHint(detail)}
                </p>
              </>
            ) : (
              <p className="mb-2 mt-4 text-[11px] leading-relaxed text-sz-n-500">
                처리가 완료된 건입니다. {isCreator ? "인플루언서" : "브랜드"}는
                대기기간 없이 다시 요청할 수 있으며, 재요청은 새 건으로
                접수됩니다.
              </p>
            )}
          </DetailCard>

          {showImpact && detail.approvalImpact && (
            <ApprovalImpactCard
              type={detail.type}
              impact={detail.approvalImpact}
            />
          )}

          <DetailCard title="처리 이력" flushBody>
            <HistoryList items={historyItems} />
          </DetailCard>
        </div>
      </div>

      <ChangeRequestApprovalModal
        open={isApprovalOpen}
        onOpenChange={setIsApprovalOpen}
        requesterName={requester.name}
        type={detail.type}
        approvalImpact={detail.approvalImpact}
        holderCheck={detail.holderCheck}
        isSubmitting={isSubmitting}
        onApprove={handleApprove}
      />

      <ChangeRequestRejectionModal
        open={isRejectionOpen}
        onOpenChange={setIsRejectionOpen}
        requesterName={requester.name}
        type={detail.type}
        reasons={rejectReasons ?? []}
        isReasonsLoading={isReasonsLoading}
        isSubmitting={isSubmitting}
        onReject={handleReject}
      />

      <EvidencePreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        evidence={detail.evidence}
        diffRows={detail.diff}
        referenceItems={detail.referenceItems}
        type={detail.type}
        holderCheck={detail.holderCheck}
        compareItems={detail.compareItems}
        approvalImpact={detail.approvalImpact}
      />
    </>
  );
}

/** 사유가 비었을 때 덧붙이는 안내 — 계좌 변경은 사유가 선택값이라 비는 게 정상이다(C4 · C4b) */
const EMPTY_REASON_NOTES: Partial<
  Record<ChangeRequestDetailInfo["type"], string>
> = {
  SETTLEMENT_ACCOUNT:
    " (정산 계좌 변경은 사유 입력이 필수가 아닙니다 — 증빙 첨부는 필수)",
  CREATOR_ACCOUNT:
    " (계좌 변경은 사유 입력이 필수가 아닙니다 — 통장 사본은 필수)",
};

/**
 * [브랜드 상세 ↗] · [인플루언서 상세 ↗] — 회원 관리 상세(15 · 18).
 * 옛 응답에서 marketId도 없으면 브랜드 회원 목록을 브랜드명으로 연다.
 */
function requesterDetailPath(requester: ChangeRequestRequester) {
  const base = CHANGE_REQUESTER_DETAIL_PATHS[requester.type];
  if (requester.id !== null) {
    return `${base}/${requester.id}`;
  }
  return `${base}?marketName=${encodeURIComponent(requester.name)}`;
}

/** 메타 「요청자」 — 브랜드는 담당자 이름 스냅샷, 인플루언서는 본인(시안 C3a · C4b 표기 그대로) */
function requesterLabel(
  detail: ChangeRequestDetailInfo,
  requester: ChangeRequestRequester
) {
  if (detail.type === "CREATOR_ACCOUNT") {
    return `${requester.name} (본인)`;
  }
  if (isCreatorType(detail.type)) {
    return "인플루언서 본인";
  }
  return detail.requesterName ?? "—";
}

/** 승인 · 반려 버튼 아래 안내(시안 `.st-hint`) — 유형마다 반영 대상과 지급 시점이 다르다 */
function pendingHint(detail: ChangeRequestDetailInfo): ReactNode {
  switch (detail.type) {
    case "SETTLEMENT_ACCOUNT":
      return (
        <>
          승인 시 새 계좌가 반영됩니다.{" "}
          <b>이미 확정된 정산 회차는 기존 계좌로 지급</b>
          되며, 다음 회차부터 새 계좌가 적용됩니다.
        </>
      );
    case "CREATOR_ACCOUNT":
      return (
        <>
          승인 시 새 계좌가 반영됩니다.{" "}
          <b>지급 요청이 이미 나간 정산은 기존 계좌로 지급</b>
          되며, 다음 지급부터 새 계좌가 적용됩니다.
        </>
      );
    case "TO_BUSINESS":
      return "승인하면 사업자 구분이 개인사업자로 바뀌고 스튜디오에 승인 배너가 표시됩니다. 결과는 이메일로도 통지됩니다.";
    case "TO_INDIVIDUAL":
      return detail.approvalImpact?.accountChangeRequired
        ? "승인하면 사업자 구분이 비사업자로 바뀌고 스튜디오에 「계좌 변경 필요」가 표시됩니다. 결과는 이메일로도 통지됩니다."
        : "승인하면 사업자 구분이 비사업자로 바뀌고 스튜디오에 승인 배너가 표시됩니다. 결과는 이메일로도 통지됩니다.";
    default:
      return "승인 시 변경 값이 브랜드 계정에 즉시 반영되고, 파트너센터에 승인 배너가 표시됩니다. 결과는 이메일로도 통지됩니다.";
  }
}

/** 처리 응답의 요청자 이름 — 옛 응답은 brandName만 주므로 상세에서 보던 이름으로 메운다 */
function processedName(
  result: ChangeRequestProcessResponse,
  detail: ChangeRequestDetailInfo
) {
  return (
    result.requester?.name ?? result.brandName ?? resolveRequester(detail).name
  );
}

interface MetaRowProps {
  label: string;
  value: ReactNode;
}

/** 시안 `.mrow` — 라벨 좌 · 값 우 정렬의 메타 정보 한 줄 */
function MetaRow(props: MetaRowProps) {
  const { label, value } = props;

  return (
    <div className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="text-sz-n-500">{label}</span>
      <span className="text-right font-medium text-sz-n-900">{value}</span>
    </div>
  );
}
