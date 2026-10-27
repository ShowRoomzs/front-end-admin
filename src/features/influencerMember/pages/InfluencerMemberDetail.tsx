import { usePageSubtitle } from "@/common/components/MainLayout/usePageSubtitle";
import { usePaginationInfo } from "@/common/hooks/usePaginationInfo";
import {
  InfluencerActivityCard,
  InfluencerConnectionsCard,
  InfluencerContractsCard,
  InfluencerOperationsCard,
  InfluencerSettlementsCard,
} from "@/features/influencerMember/components/InfluencerBottomCards";
import {
  InfluencerStatusCard,
  UnmaskModal,
} from "@/features/influencerMember/components/InfluencerRail";
import { InfluencerTopCards } from "@/features/influencerMember/components/InfluencerTopCards";
import {
  INFLUENCER_APPROVE_WARNING,
  INFLUENCER_MEMO_HELP,
  INFLUENCER_REJECT_INFO,
  INFLUENCER_SUSPEND_WARNING,
} from "@/features/influencerMember/constants/copy";
import {
  BRAND_DETAIL_PATH,
  CHANGE_REQUEST_PATH,
  CONTRACT_PATH,
  GROUP_BUY_POST_MONITOR_PATH,
  INFLUENCER_MEMBER_LIST_PATH,
  INFLUENCER_MEMBER_QUERY_KEYS,
  SETTLEMENT_PATH,
} from "@/features/influencerMember/constants/params";
import {
  useGetInfluencerHistories,
  useGetInfluencerMemberDetail,
  useGetInfluencerReasonOptions,
  useInfluencerBottomCards,
  useInfluencerMemberActions,
} from "@/features/influencerMember/hooks/useInfluencerMember";
import { adminCreatorService } from "@/features/influencerMember/services/adminCreatorService";
import type { AdminCreatorHistoryItem } from "@/features/influencerMember/types";
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
import { WithdrawalReviewCard } from "@/features/memberShared/components/detail/RailBlocks";
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
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
} from "react-router-dom";

type ModalKind = "suspend" | "release" | "approve" | "reject" | "unmask" | null;

function toEntry(
  item: AdminCreatorHistoryItem,
  index: number
): MemberHistoryEntry {
  return {
    key: `${item.historyId ?? item.eventType}-${item.occurredAt}-${index}`,
    label: item.label,
    tone: item.tone,
    // 서버가 인플루언서 본인 행은 「인플루언서 본인」으로 내린다
    actorText: item.actorType === "SYSTEM" ? "시스템" : item.actorName,
    detail: item.detail,
    occurredAt: item.occurredAt,
  };
}

function ConditionCount(props: { label: string; value: number | undefined }) {
  const { label, value } = props;
  return (
    <span className={cn(value ? "text-sz-warning-text" : "")}>
      {label} <b>{value ?? 0}건</b>
    </span>
  );
}

/**
 * 18 인플루언서 상세(rev.2) — 좌측 사실 조회(상단 4카드 + 하단 운영 현황 · 정산 · 계약 · 연결 · 활동 · 메모) ·
 * 우측 sticky 레일(현재 상태 · 탈퇴 신청 심사 · 처리 이력).
 * A1 활성 · A1-u 마스킹 해제 · A1-b/c 하단 · B1 탈퇴 승인 대기 · C1 정지 · D1 탈퇴(파기) · M1~M4.
 */
export default function InfluencerMemberDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { creatorId: rawId } = useRouteParams<{ creatorId: string }>();
  const creatorId = Number(rawId);

  const {
    data: detail,
    isLoading,
    isError,
  } = useGetInfluencerMemberDetail(creatorId);
  const { data: reasons } = useGetInfluencerReasonOptions();
  const bottom = useInfluencerBottomCards(creatorId, !!detail);
  const actions = useInfluencerMemberActions(creatorId);

  const [modal, setModal] = useState<ModalKind>(null);
  const [historyPage, setHistoryPage] = useState<number | null>(null);
  const [showAllMemos, setShowAllMemos] = useState(false);

  const histories = useGetInfluencerHistories(
    creatorId,
    historyPage ?? 1,
    HISTORY_PAGE_SIZE,
    historyPage !== null
  );
  // 인플루언서 이력 페이지는 `{ total, page, size }` 모양이라 공용 페이지 정보로 옮긴다(렌더마다 새 객체면 훅이 계속 갱신된다)
  const historyData = histories.data;
  const historyPageData = useMemo(
    () =>
      historyData
        ? {
            currentPage: historyData.page,
            totalPages: Math.max(
              1,
              Math.ceil(historyData.total / historyData.size)
            ),
            totalResults: historyData.total,
            limit: historyData.size,
            hasNext: historyData.page * historyData.size < historyData.total,
          }
        : undefined,
    [historyData]
  );
  const historyPageInfo = usePaginationInfo({
    data: historyPageData,
    onPageChange: setHistoryPage,
  });

  usePageSubtitle(
    detail
      ? `인플루언서 / ${detail.basic.showroomName ?? detail.memberNo}`
      : null
  );

  /*
    마스킹 해제는 「이 인플루언서 1건 · 이 세션 한정」 — 다른 회원으로 가거나 화면을 떠나면 바로 잠근다
    (서버도 10분 뒤 만료하지만, 떠난 화면에 실값이 남아 있을 이유가 없다).
  */
  const unmaskedRef = useRef(false);
  useEffect(() => {
    unmaskedRef.current = !!detail?.unmask.unmasked;
  }, [detail]);
  useEffect(
    () => () => {
      if (unmaskedRef.current) {
        unmaskedRef.current = false;
        adminCreatorService.lock(creatorId).catch(() => undefined);
      }
    },
    [creatorId]
  );

  const handleMaskExpired = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [INFLUENCER_MEMBER_QUERY_KEYS.DETAIL, creatorId],
    });
  }, [queryClient, creatorId]);

  const goToList = useCallback(
    () =>
      navigate({
        pathname: INFLUENCER_MEMBER_LIST_PATH,
        search: location.search,
      }),
    [navigate, location.search]
  );
  const goToCreator = (id: number) => {
    setShowAllMemos(false);
    navigate({
      pathname: `${INFLUENCER_MEMBER_LIST_PATH}/${id}`,
      search: location.search,
    });
  };
  const openThread = (threadId: number) =>
    navigate(`${THREAD_PATH}?threadId=${threadId}`);

  const handleError = (cause: unknown) => {
    const { code } = readMemberApiError(cause);
    if (code && MEMBER_STALE_CODES.includes(code)) setModal(null);
  };

  if (isLoading) return <DetailLoading />;
  if (isError || !detail) {
    return (
      <DetailError title="인플루언서를 찾을 수 없습니다" onList={goToList} />
    );
  }

  const rail = detail.rail;
  const review = rail.withdrawalReview;
  const withdrawn = detail.status === "WITHDRAWN";
  const name = detail.basic.showroomName ?? detail.memberNo;
  const memos = bottom.memos.data;
  const memoItems = memos
    ? showAllMemos
      ? memos.content
      : memos.content.slice(0, 1)
    : [];

  return (
    <div className="leading-[1.6] text-sz-n-900">
      {/* 시안 18은 제목 옆에 상태 배지를 두지 않는다(상태는 레일 「현재 상태」) */}
      <DetailHeader
        title={name}
        memberNo={detail.memberNo}
        onList={goToList}
        onPrev={
          detail.navigation?.previousId
            ? () => goToCreator(detail.navigation?.previousId as number)
            : undefined
        }
        onNext={
          detail.navigation?.nextId
            ? () => goToCreator(detail.navigation?.nextId as number)
            : undefined
        }
      />

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex min-w-0 flex-col gap-4">
          <InfluencerTopCards
            detail={detail}
            onUnmask={() => setModal("unmask")}
            onLock={() => actions.lock.mutate()}
            onMaskExpired={handleMaskExpired}
            onOpenChangeRequest={(id) =>
              navigate(`${CHANGE_REQUEST_PATH}/${id}`)
            }
          />
          <InfluencerOperationsCard overview={bottom.overview.data} />
          <InfluencerSettlementsCard
            data={bottom.settlements.data}
            onOpen={(settlementId) =>
              navigate(`${SETTLEMENT_PATH}/${settlementId}`)
            }
            onOpenList={() =>
              navigate(`${SETTLEMENT_PATH}?keyword=${encodeURIComponent(name)}`)
            }
          />
          <InfluencerContractsCard
            data={bottom.contracts.data}
            onOpen={(contractId) => navigate(`${CONTRACT_PATH}/${contractId}`)}
          />
          <InfluencerConnectionsCard
            data={bottom.connections.data}
            onOpenBrand={(marketId) =>
              navigate(`${BRAND_DETAIL_PATH}/${marketId}`)
            }
          />
          <InfluencerActivityCard
            overview={bottom.overview.data}
            onOpenPostHistory={() => navigate(GROUP_BUY_POST_MONITOR_PATH)}
          />
          <MemoCard
            audience="인플루언서"
            help={INFLUENCER_MEMO_HELP}
            items={memoItems}
            total={memos?.total ?? 0}
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

        <div className="sticky top-0 flex flex-col gap-4">
          <InfluencerStatusCard
            detail={detail}
            onSuspend={() => setModal("suspend")}
            onRelease={() => setModal("release")}
            onOpenThread={openThread}
          />
          {review && (
            <WithdrawalReviewCard
              requestedAt={review.requestedAt}
              elapsedDays={review.elapsedDays}
              reasonText={review.reasonText}
              disabled={withdrawn}
              onApprove={() => setModal("approve")}
              onReject={() => setModal("reject")}
            />
          )}
          <HistoryCard
            entries={rail.recentHistories.map(toEntry)}
            total={rail.historyTotal}
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

      {modal === "unmask" && (
        <UnmaskModal
          maskedName={detail.identity.name ?? name}
          reasons={reasons?.privacyUnmaskReasons ?? []}
          lastReason={detail.unmask.lastReason}
          isPending={actions.unmask.isPending}
          onClose={() => setModal(null)}
          onSubmit={(reason) =>
            actions.unmask.mutate(reason, {
              onSuccess: () => setModal(null),
              onError: handleError,
            })
          }
        />
      )}

      {modal === "suspend" && (
        <SuspendModal
          onClose={() => setModal(null)}
          reasons={reasons?.suspensionReasons ?? []}
          term={reasons?.suspensionTerm ?? undefined}
          warning={INFLUENCER_SUSPEND_WARNING}
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
          name={name}
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
              <b>{name}</b>({detail.memberNo}) 인플루언서의 탈퇴를 <b>승인</b>
              합니다.
            </>
          }
          summary={
            <>
              신청{" "}
              <span className="tabular-nums">
                {eventDateTime(review.requestedAt)}
              </span>{" "}
              · 경과{" "}
              <span className="tabular-nums">{review.elapsedDays}일</span>
              <br />
              <ConditionCount
                label="끝나지 않은 공구"
                value={review.conditions?.unfinishedGroupBuys}
              />
              {" · "}
              <ConditionCount
                label="계약"
                value={review.conditions?.unfinishedContracts}
              />
              {" · "}
              <ConditionCount
                label="미정산"
                value={review.conditions?.unsettled}
              />
              {review.reasonText && (
                <>
                  <br />
                  탈퇴 사유 — {review.reasonText}
                </>
              )}
            </>
          }
          warning={INFLUENCER_APPROVE_WARNING}
          confirmVariant="primary"
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
              <b>{name}</b>({detail.memberNo}) 인플루언서의 탈퇴 신청을{" "}
              <b>반려</b>합니다.
            </>
          }
          reasons={reasons?.withdrawalRejectReasons ?? []}
          noteLabel="인플루언서에게 전달할 안내"
          info={INFLUENCER_REJECT_INFO}
          confirmVariant="dangerOutline"
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
