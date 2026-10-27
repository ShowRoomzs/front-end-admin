import RecordNav from "@/common/components/RecordNav/RecordNav";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import Btn from "@/features/contract/components/shared/Btn";
import PhotoViewer from "@/features/post/components/detail/PhotoViewer";
import {
  ActionRecordCard,
  AppealCard,
  DeletionCard,
  MetricsCard,
  PostBodyCard,
  ReportsCard,
} from "@/features/post/components/detail/PostCards";
import {
  HistoryCard,
  ProcessCard,
  type PostAction,
} from "@/features/post/components/detail/PostRail";
import {
  ConfirmNoteModal,
  RejectAppealModal,
  SuspendModal,
} from "@/features/post/components/modals/PostModals";
import {
  POST_LIST_PATH,
  consumerDetailPath,
  influencerDetailPath,
} from "@/features/post/constants/params";
import {
  useApproveAppeal,
  useCancelSuspension,
  useCloseReports,
  useGetAdminPostDetail,
  useRejectAppeal,
  useSetImageFlag,
  useSuspendPost,
} from "@/features/post/hooks/useAdminPost";
import type {
  AdminPostDetail,
  AdminPostImage,
  PostSuspensionReason,
} from "@/features/post/types";
import {
  currentSuspension,
  dLabel,
  daysLeft,
  originSuspension,
  postTitle,
} from "@/features/post/utils/view";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
} from "react-router-dom";

/** 제목 옆 배지 — 신고 접수 「신고 N건」 · 노출 중지 「기한 D-n」 · 심사 「심사 D-n」 · 삭제 「영구 삭제 · 비공개 보관」 */
function titleBadge(
  detail: AdminPostDetail,
  suspensionDeadline: string | null
): ReactNode {
  switch (detail.monitoringStatus) {
    case "REPORTED":
      return (
        <StatusBadge variant="warning">
          신고 {detail.reports?.pendingCount ?? 0}건
        </StatusBadge>
      );
    case "SUSPENDED":
      return (
        <StatusBadge variant="danger">
          기한 {dLabel(daysLeft(suspensionDeadline))}
        </StatusBadge>
      );
    case "UNDER_REVIEW":
      return (
        <StatusBadge variant="warning">
          심사 {dLabel(daysLeft(detail.appeal?.reviewDueAt))}
        </StatusBadge>
      );
    case "CLOSED":
      return (
        <StatusBadge variant="neutral">영구 삭제 · 비공개 보관</StatusBadge>
      );
    default:
      return null;
  }
}

/** 지표 카드 머리 부기 — 집계 상한이 상태마다 다르다(54 설계 6-1) */
function metricsNote(detail: AdminPostDetail): string {
  switch (detail.monitoringStatus) {
    case "REPORTED":
      return "중지 시 유지되며 재게시 승인 시 그대로 복원";
    case "SUSPENDED":
    case "UNDER_REVIEW":
      return "중지 시점까지 누적 · 승인 시 그대로 복원";
    case "CLOSED":
      return "삭제 시점 기준 동결 · 작성자 인사이트에서는 제외됨";
    default:
      return "조치 판단 참고 · 스튜디오 인사이트와 같은 집계";
  }
}

/** 신고를 받아 내릴 때 사유를 그대로 잇는다 — 대기 신고 중 가장 많은 사유 */
function topReportReason(detail: AdminPostDetail): PostSuspensionReason | null {
  const top = detail.reports?.countsByReason?.[0];
  return top && detail.reports && detail.reports.pendingCount > 0
    ? (top.reasonCode as PostSuspensionReason)
    : null;
}

/**
 * `/monitoring/posts/:id` — 게시물 상세 C2 · C3 · C5 · C6 · C8 · C10 + C11 원본 뷰어 · C4 · C7 모달.
 *
 * 서버가 상세 1회 호출로 모든 카드 재료를 내리고, 카드 배치는 FE가 `monitoringStatus`로 정한다
 * (신고 접수면 신고 카드가 원문 위 · 노출 중지면 조치 내역 최상단 · 심사 중이면 이의 신청 최상단).
 */
export default function PostDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useRouteParams<{ id: string }>();
  const postId = Number(id);

  const navParams = useMemo(() => {
    const query = new URLSearchParams(location.search);
    return {
      tab: query.get("tab") || undefined,
      sort: query.get("sort") || undefined,
      keyword: query.get("keyword") || undefined,
      showroomId: query.get("showroomId") || undefined,
    };
  }, [location.search]);

  const {
    data: detail,
    isLoading,
    isError,
  } = useGetAdminPostDetail(postId, navParams);
  const [modal, setModal] = useState<PostAction | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const suspendPost = useSuspendPost();
  const closeReports = useCloseReports();
  const cancelSuspension = useCancelSuspension();
  const approveAppeal = useApproveAppeal();
  const rejectAppeal = useRejectAppeal();
  const setImageFlag = useSetImageFlag();

  const closeModal = useCallback(() => setModal(null), []);
  const done = useCallback(
    (message: string) => () => {
      setModal(null);
      toast.success(message);
    },
    []
  );

  const goToList = useCallback(() => {
    navigate({ pathname: POST_LIST_PATH, search: location.search });
  }, [navigate, location.search]);

  const goToRecord = useCallback(
    (targetId: number) => {
      setViewerIndex(null);
      navigate({
        pathname: `${POST_LIST_PATH}/${targetId}`,
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
          게시물을 찾을 수 없습니다
        </div>
        <div className="text-[12px] text-sz-n-500">
          없는 게시물이거나 보관 기간이 지나 파기된 게시물입니다.
        </div>
        <Btn variant="secondary" onClick={goToList}>
          목록
        </Btn>
      </div>
    );
  }

  const status = detail.monitoringStatus;
  const title = postTitle(detail.content);
  const suspension = currentSuspension(detail);
  const origin = originSuspension(detail);
  const images = [...(detail.images ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
  const reports = detail.reports;
  const hasReports = Boolean(reports && (reports.items ?? []).length > 0);
  const prevId = detail.navigation?.previousPostId ?? null;
  const nextId = detail.navigation?.nextPostId ?? null;

  const authorId = detail.author?.showroomId ?? null;
  const openAuthor =
    authorId !== null
      ? () => navigate(influencerDetailPath(authorId))
      : undefined;
  const openReporter = (userId: number) => navigate(consumerDetailPath(userId));

  const toggleFlag = (image: AdminPostImage) =>
    setImageFlag.mutate({
      postId: detail.postId,
      imageId: image.imageId,
      flagged: !image.reportFlagged,
    });

  const reportsCard = hasReports && reports && (
    <ReportsCard reports={reports} onReporter={openReporter} />
  );
  const bodyCard = (
    <PostBodyCard
      detail={detail}
      onAuthor={openAuthor}
      onOpenPhoto={setViewerIndex}
    />
  );
  const metricsCard = detail.metrics && (
    <MetricsCard metrics={detail.metrics} note={metricsNote(detail)} />
  );

  // 카드 순서 — 무엇을 문제 삼았는지 읽고 원문을 보는 순서(시안 C2~C10)
  let cards: ReactNode;
  switch (status) {
    case "REPORTED":
      cards = (
        <>
          {reportsCard}
          {bodyCard}
          {metricsCard}
        </>
      );
      break;
    case "SUSPENDED":
      // C5 — 조치 내역 최상단 · 신고 내역은 이력 성격이라 원문 아래(시안에 지표 카드 없음)
      cards = (
        <>
          {suspension && <ActionRecordCard suspension={suspension} />}
          {bodyCard}
          {reportsCard}
        </>
      );
      break;
    case "UNDER_REVIEW":
      // C6 — 신청 내용과 근거 규정을 나란히 비교한다
      cards = (
        <>
          {detail.appeal && (
            <AppealCard appeal={detail.appeal} policy={detail.policy} />
          )}
          {suspension && <ActionRecordCard suspension={suspension} />}
          {bodyCard}
          {metricsCard}
          {reportsCard}
        </>
      );
      break;
    case "CLOSED":
      cards = (
        <>
          {bodyCard}
          <DeletionCard detail={detail} origin={origin} />
          {metricsCard}
        </>
      );
      break;
    default:
      // C2 게시중 — 신고 종결로 돌아온 게시물은 지난 신고를 원문 아래에 둔다
      cards = (
        <>
          {bodyCard}
          {metricsCard}
          {reportsCard}
        </>
      );
  }

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <h1 className="flex min-w-0 items-center gap-2.5 text-[20px] font-semibold text-sz-n-900">
          <span className="truncate">{title}</span>
          {titleBadge(detail, suspension?.appealDeadline ?? null)}
        </h1>
        <RecordNav
          onList={goToList}
          onPrev={prevId !== null ? () => goToRecord(prevId) : undefined}
          onNext={nextId !== null ? () => goToRecord(nextId) : undefined}
        />
      </div>

      <div className="grid grid-cols-[1fr_320px] items-start gap-4">
        <div className="flex min-w-0 flex-col gap-4">{cards}</div>
        <div className="sticky top-0 flex flex-col gap-4">
          <ProcessCard
            detail={detail}
            suspension={suspension}
            origin={origin}
            onAction={setModal}
            onAuthor={openAuthor}
          />
          <HistoryCard detail={detail} />
        </div>
      </div>

      {viewerIndex !== null && images.length > 0 && (
        <PhotoViewer
          images={images}
          index={Math.min(viewerIndex, images.length - 1)}
          caption={[title, detail.author?.showroomName]
            .filter(Boolean)
            .join(" · ")}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
          onToggleFlag={toggleFlag}
          isFlagPending={setImageFlag.isPending}
        />
      )}

      {modal === "suspend" && (
        <SuspendModal
          initialReason={topReportReason(detail)}
          policy={detail.policy}
          isPending={suspendPost.isPending}
          onClose={closeModal}
          onSubmit={(body) =>
            suspendPost.mutate(
              { postId: detail.postId, body },
              { onSuccess: done("노출을 중지했습니다.") }
            )
          }
        />
      )}

      {modal === "closeReports" && (
        <ConfirmNoteModal
          title="신고 종결"
          confirmLabel="신고 종결"
          message={
            <>
              <b className="font-semibold text-sz-n-900">{title}</b> 게시물의
              대기 신고 {reports?.pendingCount ?? 0}건을 조치 없이 종결합니다.
              게시물은 게시중으로 남고, 작성자 · 신고자에게 알리지 않습니다.
              신고 이력은 처리 이력에 남습니다.
            </>
          }
          isPending={closeReports.isPending}
          onClose={closeModal}
          onSubmit={(note) =>
            closeReports.mutate(
              { postId: detail.postId, body: note ? { note } : {} },
              { onSuccess: done("신고를 종결했습니다.") }
            )
          }
        />
      )}

      {modal === "cancelSuspension" && (
        <ConfirmNoteModal
          title="조치 취소 · 재게시"
          confirmLabel="조치 취소 · 재게시"
          message={
            <>
              <b className="font-semibold text-sz-n-900">{title}</b> 게시물의
              노출 중지를 거두고 다시 게시합니다. 좋아요 · 인사이트는 그대로
              복원되고, 작성자에게 조치 취소 알림이 갑니다.
            </>
          }
          note={{
            label: "작성자에게 전달할 메모",
            hint: "작성자 알림에 함께 실립니다.",
            maxLength: 200,
          }}
          isPending={cancelSuspension.isPending}
          onClose={closeModal}
          onSubmit={(note) =>
            cancelSuspension.mutate(
              { postId: detail.postId, body: note ? { note } : {} },
              { onSuccess: done("조치를 취소하고 재게시했습니다.") }
            )
          }
        />
      )}

      {modal === "approveAppeal" && detail.appeal && (
        <ConfirmNoteModal
          title="이의 신청 승인"
          confirmLabel="승인 · 재게시"
          message={
            <>
              <b className="font-semibold text-sz-n-900">{title}</b> 게시물의
              이의 신청을 승인하고 다시 게시합니다. 좋아요 · 인사이트는 그대로
              복원됩니다. 신청은 게시물당 1회라 이 판단이 최종입니다.
            </>
          }
          note={{
            label: "심사 의견",
            hint: "작성자 알림에 함께 실립니다.",
            maxLength: 500,
          }}
          isPending={approveAppeal.isPending}
          onClose={closeModal}
          onSubmit={(comment) =>
            approveAppeal.mutate(
              {
                appealId: detail.appeal?.appealId as number,
                body: comment ? { comment } : {},
              },
              { onSuccess: done("이의 신청을 승인하고 재게시했습니다.") }
            )
          }
        />
      )}

      {modal === "rejectAppeal" && detail.appeal && (
        <RejectAppealModal
          postTitle={title}
          policy={detail.policy}
          isPending={rejectAppeal.isPending}
          onClose={closeModal}
          onSubmit={(comment) =>
            rejectAppeal.mutate(
              {
                appealId: detail.appeal?.appealId as number,
                body: { comment },
              },
              { onSuccess: done("이의 신청을 반려했습니다.") }
            )
          }
        />
      )}
    </>
  );
}
