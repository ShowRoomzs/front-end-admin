import { usePageSubtitle } from "@/common/components/MainLayout/usePageSubtitle";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import {
  BrandConnectedCreatorsCard,
  BrandInfoCards,
  BrandOperationsCard,
  BrandRecentInquiryCard,
} from "@/features/brandMember/components/BrandCards";
import {
  BrandPendingCard,
  BrandStatusCard,
  BrandWithdrawalReviewCard,
} from "@/features/brandMember/components/BrandRail";
import {
  BRAND_APPROVE_WARNING,
  BRAND_MEMO_HELP,
  BRAND_REJECT_INFO,
  BRAND_SUSPEND_WARNING,
} from "@/features/brandMember/constants/copy";
import {
  BRAND_CHIP_PATHS,
  BRAND_MEMBER_LIST_PATH,
  CHANGE_REQUEST_PATH,
  CONTRACT_PATH,
  INFLUENCER_DETAIL_PATH,
  INQUIRY_PATH,
  PRODUCT_PATH,
} from "@/features/brandMember/constants/params";
import {
  useBrandMemberActions,
  useGetBrandConnectedCreators,
  useGetBrandHistories,
  useGetBrandMemberDetail,
  useGetBrandMemos,
  useGetBrandReasonOptions,
  useGetBrandRecentInquiries,
} from "@/features/brandMember/hooks/useBrandMember";
import type {
  AdminBrandHistoryItem,
  AdminBrandPendingChip,
} from "@/features/brandMember/types";
import {
  DetailError,
  DetailHeader,
  DetailLoading,
} from "@/features/memberShared/components/detail/DetailHeader";
import {
  HistoryCard,
  HistoryModal,
} from "@/features/memberShared/components/detail/HistoryCard";
import { MemoCard } from "@/features/memberShared/components/detail/MemoCard";
import {
  ReleaseModal,
  WithdrawalApproveModal,
  WithdrawalRejectModal,
} from "@/features/memberShared/components/modals/ActionModals";
import { SuspendModal } from "@/features/memberShared/components/modals/SuspendModal";
import {
  HISTORY_PAGE_SIZE,
  THREAD_PATH,
} from "@/features/memberShared/constants/params";
import type { MemberHistoryEntry } from "@/features/memberShared/types";
import {
  MEMBER_STALE_CODES,
  readMemberApiError,
} from "@/features/memberShared/utils/apiError";
import { eventDateTime } from "@/features/memberShared/utils/format";
import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
} from "react-router-dom";

type ModalKind = "suspend" | "release" | "approve" | "reject" | null;

function toEntry(
  item: AdminBrandHistoryItem,
  index: number
): MemberHistoryEntry {
  return {
    key: `${item.type}-${item.occurredAt}-${index}`,
    label: item.label,
    tone: item.tone,
    // 시안 「브랜드 본인」 — 브랜드가 한 일은 담당자 이름 대신 주체로 적는다
    actorText:
      item.actorType === "BRAND"
        ? "브랜드 본인"
        : item.actorType === "SYSTEM"
          ? "시스템"
          : item.actorName,
    detail: item.detail,
    occurredAt: item.occurredAt,
  };
}

/** 조건 건수 한 칸 — 0이 아니면 경고색(승인하면 서버가 409로 막는다) */
function ConditionCount(props: { label: string; value: number | undefined }) {
  const { label, value } = props;
  return (
    <span className={cn(value ? "font-semibold text-sz-warning-text" : "")}>
      {label} {value ?? 0}건
    </span>
  );
}

/**
 * 15 브랜드 상세(rev.7) — 좌측 사실 조회 · 우측 sticky 레일(판단과 조치).
 * A1 활성 · A2 탈퇴 승인 대기 · A3 정지 · A4 탈퇴(파기 표시)와 M1 정지 · M2 승인 · M3 반려.
 * 시안의 상단/하단 2장은 한 페이지를 스크롤한 두 장면이다.
 */
export default function BrandMemberDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { marketId: rawId } = useRouteParams<{ marketId: string }>();
  const marketId = Number(rawId);

  const {
    data: detail,
    isLoading,
    isError,
  } = useGetBrandMemberDetail(marketId);
  const { data: reasons } = useGetBrandReasonOptions();
  const inquiries = useGetBrandRecentInquiries(marketId);
  const actions = useBrandMemberActions(marketId);

  const [modal, setModal] = useState<ModalKind>(null);
  const [historyPage, setHistoryPage] = useState<number | null>(null);
  const [showAllMemos, setShowAllMemos] = useState(false);
  const [showAllCreators, setShowAllCreators] = useState(false);

  const histories = useGetBrandHistories(
    marketId,
    historyPage ?? 1,
    HISTORY_PAGE_SIZE,
    historyPage !== null
  );
  const memos = useGetBrandMemos(marketId, showAllMemos);
  const creators = useGetBrandConnectedCreators(marketId, showAllCreators);
  const historyPageInfo = usePaginationInfo({
    data: histories.data?.pageInfo,
    onPageChange: setHistoryPage,
  });

  usePageSubtitle(detail ? `브랜드 / ${detail.brandName}` : null);

  const goToList = useCallback(
    () =>
      navigate({ pathname: BRAND_MEMBER_LIST_PATH, search: location.search }),
    [navigate, location.search]
  );
  const goToBrand = (id: number) => {
    // 다른 회원으로 가면 펼친 목록은 접는다
    setShowAllMemos(false);
    setShowAllCreators(false);
    navigate({
      pathname: `${BRAND_MEMBER_LIST_PATH}/${id}`,
      search: location.search,
    });
  };
  const openThread = (threadId: number) =>
    navigate(`${THREAD_PATH}?threadId=${threadId}`);

  /** 409(상태가 이미 바뀜)면 모달을 닫는다 — 상세는 onSettled에서 다시 읽고, 서버 문구는 공용 토스트가 띄운다 */
  const handleError = (cause: unknown) => {
    const { code } = readMemberApiError(cause);
    if (code && MEMBER_STALE_CODES.includes(code)) setModal(null);
  };

  if (isLoading) return <DetailLoading />;
  if (isError || !detail) {
    return <DetailError title="브랜드를 찾을 수 없습니다" onList={goToList} />;
  }

  const rail = detail.rail;
  const review = rail.withdrawalReview;
  const withdrawn = rail.currentStatus.memberStatus === "WITHDRAWN";
  const headerBadge = withdrawn
    ? { tone: "NEUTRAL", text: "탈퇴" }
    : detail.withdrawalPending
      ? { tone: "WARNING", text: "탈퇴 승인 대기" }
      : rail.currentStatus.memberStatus === "SUSPENDED"
        ? { tone: "DANGER", text: "정지" }
        : null;

  const openChip = (chip: AdminBrandPendingChip) => {
    switch (chip.target) {
      case "THREAD":
        if (chip.threadId !== null) openThread(chip.threadId);
        return;
      case "ORDERS":
        navigate(`${BRAND_CHIP_PATHS.ORDERS}?marketId=${detail.marketId}`);
        return;
      case "CLAIMS":
      case "PRODUCT_INQUIRIES":
      case "SETTLEMENTS":
        navigate(
          `${BRAND_CHIP_PATHS[chip.target]}?keyword=${encodeURIComponent(detail.brandName)}`
        );
        return;
    }
  };

  const conditions = review?.conditions;
  const memoItems =
    showAllMemos && memos.data ? memos.data.content : detail.memos.items;

  return (
    // 시안 본문 행간 1.6 · 글자색 --n-900
    <div className="leading-[1.6] text-sz-n-900">
      <DetailHeader
        title={detail.brandName}
        memberNo={detail.brandNo}
        badge={headerBadge}
        onList={goToList}
        onPrev={
          detail.navigation?.previousMarketId
            ? () => goToBrand(detail.navigation?.previousMarketId as number)
            : undefined
        }
        onNext={
          detail.navigation?.nextMarketId
            ? () => goToBrand(detail.navigation?.nextMarketId as number)
            : undefined
        }
      />

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex min-w-0 flex-col gap-4">
          <BrandInfoCards
            detail={detail}
            onOpenChangeRequest={(requestId) =>
              navigate(`${CHANGE_REQUEST_PATH}/${requestId}`)
            }
          />
          <BrandOperationsCard
            detail={detail}
            onOpenContracts={() =>
              navigate(
                `${CONTRACT_PATH}?keyword=${encodeURIComponent(detail.brandName)}`
              )
            }
            onOpenProducts={() => navigate(PRODUCT_PATH)}
          />
          <BrandConnectedCreatorsCard
            detail={detail}
            allItems={showAllCreators ? creators.data?.content : undefined}
            onShowAll={() => setShowAllCreators(true)}
            onOpenCreator={(creatorId) =>
              navigate(`${INFLUENCER_DETAIL_PATH}/${creatorId}`)
            }
          />
          <BrandRecentInquiryCard
            data={inquiries.data}
            isError={inquiries.isError}
            withdrawn={withdrawn}
            onOpenThread={
              detail.operatorThread
                ? () =>
                    detail.operatorThread &&
                    openThread(detail.operatorThread.threadId)
                : undefined
            }
            onOpenInquiries={() => navigate(INQUIRY_PATH)}
          />
          <MemoCard
            audience="브랜드"
            help={BRAND_MEMO_HELP}
            items={memoItems}
            total={detail.memos.total}
            showingAll={showAllMemos}
            onToggleAll={() => setShowAllMemos((value) => !value)}
            readOnly={withdrawn}
            isSaving={
              actions.createMemo.isPending ||
              actions.updateMemo.isPending ||
              actions.deleteMemo.isPending
            }
            onCreate={(content) => actions.createMemo.mutateAsync(content)}
            onUpdate={(memoId, content) =>
              actions.updateMemo.mutateAsync({ memoId, content })
            }
            onDelete={(memoId) => actions.deleteMemo.mutateAsync(memoId)}
          />
        </div>

        {/* sticky 레일 — 좌측을 길게 내려도 조치와 그 근거(처리 이력)가 따라온다 */}
        <div className="sticky top-0 flex flex-col gap-4">
          <BrandStatusCard
            detail={detail}
            onSuspend={() => setModal("suspend")}
            onRelease={() => setModal("release")}
            onOpenThread={openThread}
          />
          <BrandWithdrawalReviewCard
            detail={detail}
            onApprove={() => setModal("approve")}
            onReject={() => setModal("reject")}
          />
          {!(review && rail.pendingChips.length === 0) && (
            <BrandPendingCard chips={rail.pendingChips} onOpen={openChip} />
          )}
          <HistoryCard
            entries={rail.histories.items.map(toEntry)}
            total={rail.histories.total}
            withdrawn={withdrawn}
            onShowAll={() => setHistoryPage(1)}
          />
        </div>
      </div>

      <HistoryModal
        isOpen={historyPage !== null}
        onClose={() => setHistoryPage(null)}
        entries={(histories.data?.content ?? []).map(toEntry)}
        isLoading={histories.isLoading}
        pageInfo={historyPageInfo}
      />

      {modal === "suspend" && (
        <SuspendModal
          onClose={() => setModal(null)}
          reasons={reasons?.suspensionReasons ?? []}
          term={reasons?.suspensionTerm ?? undefined}
          payoutLabel="브랜드 몫 지급"
          warning={BRAND_SUSPEND_WARNING}
          isPending={actions.suspend.isPending}
          onSubmit={(payload) =>
            actions.suspend.mutate(payload, {
              onSuccess: () => {
                setModal(null);
                toast.success("계정 이용을 정지했습니다.");
              },
              onError: handleError,
            })
          }
        />
      )}

      {modal === "release" && (
        <ReleaseModal
          onClose={() => setModal(null)}
          name={detail.brandName}
          reasons={reasons?.releaseReasons ?? []}
          isPending={actions.release.isPending}
          onSubmit={(payload) =>
            actions.release.mutate(payload, {
              onSuccess: () => {
                setModal(null);
                toast.success("계정 이용 정지를 해제했습니다.");
              },
              onError: handleError,
            })
          }
        />
      )}

      {modal === "approve" && review && (
        <WithdrawalApproveModal
          onClose={() => setModal(null)}
          intro={
            <>
              <b>{detail.brandName}</b>의 탈퇴를 승인합니다.
            </>
          }
          summary={
            <>
              신청{" "}
              <span className="tabular-nums">
                {eventDateTime(review.requestedAt)}
              </span>{" "}
              · 경과 <b className="tabular-nums">{review.elapsedDays}일</b>
              <br />
              <ConditionCount
                label="진행 중 공구"
                value={conditions?.activeGroupBuys}
              />
              {" · "}
              <ConditionCount
                label="체결 전 계약"
                value={conditions?.contractsBeforeConclusion}
              />
              {" · "}
              <ConditionCount
                label="미종결 주문"
                value={conditions?.unclosedOrders}
              />
              {" · "}
              <ConditionCount
                label="진행 중 정산"
                value={conditions?.unsettled}
              />
            </>
          }
          warning={BRAND_APPROVE_WARNING}
          confirmVariant="danger"
          isPending={actions.approve.isPending}
          onConfirm={() =>
            actions.approve.mutate(review.requestId, {
              onSuccess: () => {
                setModal(null);
                toast.success("탈퇴를 승인했습니다.");
              },
              onError: handleError,
            })
          }
        />
      )}

      {modal === "reject" && review && (
        <WithdrawalRejectModal
          onClose={() => setModal(null)}
          intro={
            <>
              <b>{detail.brandName}</b>의 탈퇴 신청을 반려합니다.
            </>
          }
          reasons={reasons?.withdrawalRejectReasons ?? []}
          noteLabel="브랜드에 전달할 안내"
          info={BRAND_REJECT_INFO}
          confirmVariant="primary"
          isPending={actions.reject.isPending}
          onSubmit={(payload) =>
            actions.reject.mutate(
              { requestId: review.requestId, payload },
              {
                onSuccess: () => {
                  setModal(null);
                  toast.success("탈퇴 신청을 반려했습니다.");
                },
                onError: handleError,
              }
            )
          }
        />
      )}
    </div>
  );
}
