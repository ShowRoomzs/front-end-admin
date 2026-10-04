import RecordNav from "@/common/components/RecordNav/RecordNav";
import Btn from "@/features/contract/components/shared/Btn";
import {
  ClosureCard,
  ExtensionCard,
  FulfillmentCard,
  InfoCard,
  ItemsCard,
  NoticeCard,
  OpenReviewCard,
  PostCard,
  RequestCard,
  SalesCard,
  SettlementCard,
} from "@/features/groupBuy/components/detail/AdminCards";
import {
  AdminHistoryCard,
  CurrentStateCard,
  DecisionBasisCard,
  OrderClosureCard,
  SettlementPreviewCard,
} from "@/features/groupBuy/components/detail/AdminRail";
import { GbBadge } from "@/features/groupBuy/components/shared/GbParts";
import {
  ApproveOpenModal,
  ConfirmSettlementModal,
  DecideRequestModal,
  EmergencyModal,
  ExecuteModal,
  HidePostModal,
  IssueModal,
  NoticeModal,
  RejectOpenModal,
  UnhidePostModal,
  WithdrawModal,
} from "@/features/groupBuy/components/modals/AdminModals";
import {
  GROUP_BUY_LIST_PATH,
  SETTLEMENT_PATH,
  THREAD_PATH,
} from "@/features/groupBuy/constants/params";
import {
  useApproveOpen,
  useConfirmSettlement,
  useDecideRequest,
  useEmergencySuspend,
  useExecuteSuspension,
  useGetAdminGroupBuyDetail,
  useHidePost,
  useNoticeSuspension,
  useOpenIssue,
  useRejectOpen,
  useUnhidePost,
  useWithdrawSuspension,
} from "@/features/groupBuy/hooks/useAdminGroupBuy";
import { adminGroupBuyService } from "@/features/groupBuy/services/adminGroupBuyService";
import { adminView } from "@/features/groupBuy/utils/view";
import { getApiErrorCode } from "@/features/contract/utils/apiError";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
} from "react-router-dom";

type ModalKind =
  | "approveOpen"
  | "rejectOpen"
  | "hide"
  | "unhide"
  | "notice"
  | "execute"
  | "withdraw"
  | "emergency"
  | "approveRequest"
  | "rejectRequest"
  | "issue"
  | "settlement"
  | null;

/**
 * `/group-buy/:id` — 어드민 공구 상세 B1~B6. 서버가 상태·요청·통지·권한을 판정해 내려주고
 * 화면은 그 값으로 판정 카드를 고른다. 모든 판정은 모달을 거친다.
 */
export default function GroupBuyDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useRouteParams<{ id: string }>();
  const groupBuyId = Number(id);

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
  } = useGetAdminGroupBuyDetail(groupBuyId, navParams);
  const [modal, setModal] = useState<ModalKind>(null);

  const approveOpen = useApproveOpen();
  const rejectOpen = useRejectOpen();
  const hidePost = useHidePost();
  const unhidePost = useUnhidePost();
  const noticeSuspension = useNoticeSuspension();
  const executeSuspension = useExecuteSuspension();
  const withdrawSuspension = useWithdrawSuspension();
  const emergencySuspend = useEmergencySuspend();
  const decideRequest = useDecideRequest();
  const openIssue = useOpenIssue();
  const confirmSettlement = useConfirmSettlement();

  const closeModal = useCallback(() => setModal(null), []);
  const done = useCallback(
    (message: string) => () => {
      setModal(null);
      toast.success(message);
    },
    []
  );

  const goToList = useCallback(() => {
    navigate({ pathname: GROUP_BUY_LIST_PATH, search: location.search });
  }, [navigate, location.search]);

  const goToRecord = useCallback(
    (targetId: number) => {
      navigate({
        pathname: `${GROUP_BUY_LIST_PATH}/${targetId}`,
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
          공구를 찾을 수 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          삭제되었거나 없는 공구입니다.
        </div>
        <Btn variant="secondary" onClick={() => navigate(GROUP_BUY_LIST_PATH)}>
          목록
        </Btn>
      </div>
    );
  }

  const view = adminView(detail);
  const prevId = detail.navigation?.prevGroupBuyId ?? null;
  const nextId = detail.navigation?.nextGroupBuyId ?? null;
  const openThread = (threadId: number) =>
    navigate(`${THREAD_PATH}?threadId=${threadId}`);
  const openProduct = (productId: number) =>
    window.open(`/product/list/${productId}`, "_blank");
  const goSales = () => navigate("/order/list");
  const openAttachment = async (attachmentId: number) => {
    const file = await adminGroupBuyService.getAppealAttachmentUrl(
      groupBuyId,
      attachmentId
    );
    window.open(file.url, "_blank");
  };

  const showSales =
    view === "selling" ||
    view === "extension" ||
    view === "hidden" ||
    view === "notice";

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-[20px] font-semibold text-sz-n-900">
            {detail.groupBuy.title}
            <GbBadge tone={detail.groupBuy.statusTone}>
              {detail.groupBuy.statusLabel}
            </GbBadge>
          </h1>
          <p className="mt-0.5 text-[12px] tabular-nums text-sz-n-600">
            {detail.groupBuy.groupBuyNumber}
          </p>
        </div>
        <RecordNav
          onList={goToList}
          onPrev={prevId !== null ? () => goToRecord(prevId) : undefined}
          onNext={nextId !== null ? () => goToRecord(nextId) : undefined}
        />
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex min-w-0 flex-col gap-4">
          {(view === "openReview" || view === "preparing") && (
            <OpenReviewCard
              detail={detail}
              onApprove={() => setModal("approveOpen")}
              onReject={() => setModal("rejectOpen")}
            />
          )}
          {view === "notice" && (
            <NoticeCard detail={detail} onOpenAttachment={openAttachment} />
          )}
          {view === "extension" && <ExtensionCard detail={detail} />}
          {view === "request" && <RequestCard detail={detail} />}
          {view === "ended" && (
            <>
              <SettlementCard detail={detail} />
              <FulfillmentCard
                detail={detail}
                onOpenIssue={() => setModal("issue")}
                onOpenThread={openThread}
                onGoSettlement={() => navigate(SETTLEMENT_PATH)}
              />
            </>
          )}
          {view === "suspended" && (
            <ClosureCard detail={detail} onGoSales={goSales} />
          )}

          {showSales && <SalesCard detail={detail} view={view} />}

          <PostCard
            detail={detail}
            view={view}
            onHide={() => setModal("hide")}
            onUnhide={() => setModal("unhide")}
            onOpenProduct={openProduct}
          />
          <InfoCard
            detail={detail}
            view={view}
            onOpenContract={() =>
              navigate(`/contract/${detail.contract.contractId}`)
            }
          />
          <ItemsCard detail={detail} onOpenProduct={openProduct} />
        </div>

        <div className="sticky top-0 flex flex-col gap-4">
          <CurrentStateCard
            detail={detail}
            view={view}
            actions={{
              onApproveOpen: () => setModal("approveOpen"),
              onRejectOpen: () => setModal("rejectOpen"),
              onNotice: () => setModal("notice"),
              onEmergency: () => setModal("emergency"),
              onUnhide: () => setModal("unhide"),
              onExecute: () => setModal("execute"),
              onWithdraw: () => setModal("withdraw"),
              onApproveRequest: () => setModal("approveRequest"),
              onRejectRequest: () => setModal("rejectRequest"),
              onConfirmSettlement: () => setModal("settlement"),
            }}
          />
          {view === "request" && <DecisionBasisCard detail={detail} />}
          {view === "ended" && (
            <>
              <OrderClosureCard detail={detail} />
              <SettlementPreviewCard detail={detail} />
            </>
          )}
          <AdminHistoryCard detail={detail} />
        </div>
      </div>

      {modal === "approveOpen" && (
        <ApproveOpenModal
          detail={detail}
          isPending={approveOpen.isPending}
          onClose={closeModal}
          onConfirm={() =>
            approveOpen.mutate(groupBuyId, {
              onSuccess: done("오픈 승인했습니다."),
            })
          }
        />
      )}
      {modal === "rejectOpen" && (
        <RejectOpenModal
          detail={detail}
          isPending={rejectOpen.isPending}
          onClose={closeModal}
          onConfirm={(body) =>
            rejectOpen.mutate(
              { groupBuyId, body },
              { onSuccess: done("오픈 승인을 반려했습니다.") }
            )
          }
        />
      )}
      {modal === "hide" && (
        <HidePostModal
          detail={detail}
          isPending={hidePost.isPending}
          onClose={closeModal}
          onConfirm={(body) =>
            hidePost.mutate(
              { groupBuyId, body },
              {
                onSuccess: (result) => {
                  setModal(null);
                  toast.success(
                    result.revisionAdvanced
                      ? "게시물을 숨겼습니다. 보고 있던 판본 이후 수정이 있었으니 최신 본문을 확인하세요."
                      : "게시물을 숨겼습니다."
                  );
                },
              }
            )
          }
        />
      )}
      {modal === "unhide" && (
        <UnhidePostModal
          detail={detail}
          isPending={unhidePost.isPending}
          onClose={closeModal}
          onConfirm={() =>
            unhidePost.mutate(
              {
                groupBuyId,
                expectedRevisionNo: detail.post.latestRevisionNo ?? 0,
              },
              {
                onSuccess: done(
                  "숨김을 해제했습니다. 게시물이 다시 노출됩니다."
                ),
                onError: (error) => {
                  if (
                    getApiErrorCode(error) ===
                    "GROUP_BUY_POST_CHANGED_SINCE_VIEW"
                  ) {
                    setModal(null);
                    toast.error(
                      "확인한 뒤 게시물이 다시 수정됐습니다. 최신 본문을 읽고 다시 해제하세요."
                    );
                  } else {
                    toast.error("숨김을 해제하지 못했습니다.");
                  }
                },
              }
            )
          }
        />
      )}
      {modal === "notice" && (
        <NoticeModal
          detail={detail}
          isPending={noticeSuspension.isPending}
          onClose={closeModal}
          onConfirm={(body) =>
            noticeSuspension.mutate(
              { groupBuyId, body },
              {
                onSuccess: (result) => {
                  setModal(null);
                  toast.success("직권 중단 사전 통지를 발송했습니다.");
                  if (result.clauseCaution === "C2_POST_ALTERATION") {
                    toast(
                      "게시물 변경을 사유로 삼은 3호 통지는 브랜드가 소명하기 어려운 사유입니다.",
                      { icon: "⚠️" }
                    );
                  }
                },
              }
            )
          }
        />
      )}
      {modal === "execute" && (
        <ExecuteModal
          detail={detail}
          isPending={executeSuspension.isPending}
          onClose={closeModal}
          onConfirm={(executionNote) =>
            executeSuspension.mutate(
              { groupBuyId, executionNote },
              { onSuccess: done("직권 중단을 집행했습니다.") }
            )
          }
        />
      )}
      {modal === "withdraw" && (
        <WithdrawModal
          detail={detail}
          isPending={withdrawSuspension.isPending}
          onClose={closeModal}
          onConfirm={(body) =>
            withdrawSuspension.mutate(
              { groupBuyId, body },
              { onSuccess: done("직권 중단을 철회했습니다.") }
            )
          }
        />
      )}
      {modal === "emergency" && (
        <EmergencyModal
          detail={detail}
          isPending={emergencySuspend.isPending}
          onClose={closeModal}
          onConfirm={(body) =>
            emergencySuspend.mutate(
              { groupBuyId, body },
              { onSuccess: done("긴급 직권 중단을 집행했습니다.") }
            )
          }
        />
      )}
      {(modal === "approveRequest" || modal === "rejectRequest") &&
        detail.activeRequest && (
          <DecideRequestModal
            detail={detail}
            decision={modal === "approveRequest" ? "approve" : "reject"}
            isPending={decideRequest.isPending}
            onClose={closeModal}
            onConfirm={(decisionReason) =>
              decideRequest.mutate(
                {
                  groupBuyId,
                  requestId: detail.activeRequest!.requestId,
                  decision: modal === "approveRequest" ? "approve" : "reject",
                  decisionReason,
                },
                {
                  onSuccess: done(
                    modal === "approveRequest"
                      ? "요청을 승인했습니다."
                      : "요청을 반려했습니다."
                  ),
                }
              )
            }
          />
        )}
      {modal === "issue" && (
        <IssueModal
          detail={detail}
          isPending={openIssue.isPending}
          onClose={closeModal}
          onConfirm={(body) =>
            openIssue.mutate(
              { groupBuyId, body },
              { onSuccess: done("이슈 스레드를 열었습니다.") }
            )
          }
        />
      )}
      {modal === "settlement" && (
        <ConfirmSettlementModal
          detail={detail}
          isPending={confirmSettlement.isPending}
          onClose={closeModal}
          onConfirm={() =>
            confirmSettlement.mutate(groupBuyId, {
              onSuccess: done("정산을 확인했습니다."),
            })
          }
        />
      )}
    </>
  );
}
