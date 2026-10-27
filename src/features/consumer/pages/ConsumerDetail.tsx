import { usePageSubtitle } from "@/common/components/MainLayout/usePageSubtitle";
import NotReady from "@/common/components/NotReady/NotReady";
import RecordNav from "@/common/components/RecordNav/RecordNav";
import {
  AccountCard,
  ActivityCard,
  AddressCard,
  IdentityCard,
  TermsCard,
} from "@/features/consumer/components/detail/InfoCards";
import MemoCard from "@/features/consumer/components/detail/MemoCard";
import {
  HistoryCard,
  JudgementCard,
  PendingCard,
  StatusCard,
} from "@/features/consumer/components/detail/RailCards";
import {
  RecentInquiriesCard,
  RecentOrdersCard,
} from "@/features/consumer/components/detail/RecordCards";
import {
  MemoDeleteModal,
  ReleaseModal,
  SuspendModal,
  UnmaskModal,
} from "@/features/consumer/components/modals/ConsumerModals";
import {
  CONSUMER_LIST_PATH,
  consumerDetailPath,
} from "@/features/consumer/constants/detail";
import {
  useConsumerDetail,
  useConsumerDetailMutations,
  useConsumerHistories,
  useConsumerMemos,
} from "@/features/consumer/hooks/useConsumerDetail";
import { useUnmaskSession } from "@/features/consumer/hooks/useUnmaskSession";
import { ConsumerDetailOutdatedError } from "@/features/consumer/services/consumerDetailService";
import type {
  ConsumerMemo,
  UserPrivacyAccessReason,
} from "@/features/consumer/types/consumerDetail";
import dayjs from "dayjs";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
} from "react-router-dom";

type OpenModal = "suspend" | "release" | "unmask" | null;

/**
 * B-4 · 13 — 소비자 상세(ui-admin-13 rev.7).
 *
 * 좌측은 **사실 조회**(계정 · 본인확인 · 최근 주문 · 최근 문의 · 콘텐츠 활동 · 배송지 · 약관 동의 ·
 * 관리자 메모)를 한 열로 세우고 본문을 스크롤한다. 우측 레일은 **판단과 조치**(상태 → 진행 중 →
 * 판단 메타 → 처리 이력)이며 sticky라 어디까지 내려가도 따라온다.
 *
 * 개인정보는 **서버가 마스킹을 끝내서** 내린다. 해제는 이 소비자 1건 · 이 운영자 · 10분 고정 만료이고
 * 화면을 떠나면(다른 소비자 · 목록 · 새로고침) 다시 잠근다(`useUnmaskSession`).
 */
export default function ConsumerDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId: userIdParam } = useRouteParams<{ userId: string }>();
  const userId = Number(userIdParam);

  const { data: detail, isLoading, error } = useConsumerDetail(userId);
  const mutations = useConsumerDetailMutations(userId);

  // 상세는 메모 최신 3건 · 이력 최신 5건만 싣는다 — 넘칠 때만 전체를 부른다
  const memoOverflow = detail
    ? detail.memos.total > detail.memos.content.length
    : false;
  const historyOverflow = detail
    ? detail.histories.total > detail.histories.content.length
    : false;
  const { data: allMemos } = useConsumerMemos(userId, memoOverflow);
  const { data: allHistories } = useConsumerHistories(userId, historyOverflow);

  const session = useUnmaskSession(userId, detail);

  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const [suspendToday, setSuspendToday] = useState("");
  const [deletingMemo, setDeletingMemo] = useState<ConsumerMemo | null>(null);

  usePageSubtitle(detail ? `소비자 / ${detail.nickname}` : null);

  // 목록에서 보던 탭 · 페이지 · 검색어를 그대로 들고 다닌다(1:1 문의 목록 → 상세와 같은 방식)
  const goTo = useCallback(
    (pathname: string) => navigate({ pathname, search: location.search }),
    [navigate, location.search]
  );

  const handleUnmaskSubmit = useCallback(
    async (reason: UserPrivacyAccessReason) => {
      try {
        await session.unmask(reason);
        setOpenModal(null);
      } catch {
        // 403(권한 없음) · 409(파기) 사유는 인터셉터 토스트 — 모달은 열어 둔다
      }
    },
    [session]
  );

  if (error instanceof ConsumerDetailOutdatedError) {
    return (
      <div className="rounded-[8px] border border-sz-n-200 bg-white">
        <NotReady title="소비자 상세는 준비 중입니다.">
          서버 업데이트가 배포되면 이 화면에서 상세 정보를 확인할 수 있습니다.
        </NotReady>
      </div>
    );
  }

  if (isLoading || !detail) {
    return (
      <div className="rounded-[8px] border border-sz-n-200 bg-white px-5 py-10 text-center text-[12px] text-sz-n-500">
        {isLoading ? "불러오는 중…" : "회원을 찾을 수 없습니다."}
      </div>
    );
  }

  const withdrawn = detail.status === "WITHDRAWN";
  const memos = allMemos?.content ?? detail.memos.content;
  const histories = allHistories?.content ?? detail.histories.content;
  const { previousId, nextId } = detail.navigation;

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-sz-n-900">
            {detail.nickname}
          </h1>
          <p className="mt-0.5 text-[12px] tabular-nums text-sz-n-600">
            {detail.memberNo}
          </p>
        </div>
        {/* 이전 · 다음은 회원번호 순 인접 소비자(서버 navigation · 목록 필터와 무관) */}
        <RecordNav
          onList={() => goTo(CONSUMER_LIST_PATH)}
          onPrev={
            previousId ? () => goTo(consumerDetailPath(previousId)) : undefined
          }
          onNext={nextId ? () => goTo(consumerDetailPath(nextId)) : undefined}
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-4">
        <div className="flex min-w-0 flex-col gap-4">
          <AccountCard detail={detail} />
          <IdentityCard
            detail={detail}
            remainingSeconds={session.remainingSeconds}
            autoRelocked={session.autoRelocked}
            onUnmask={() => setOpenModal("unmask")}
            onLock={session.lockNow}
            isLocking={session.isLocking}
          />
          <RecentOrdersCard detail={detail} />
          <RecentInquiriesCard detail={detail} />
          <ActivityCard detail={detail} />
          <AddressCard detail={detail} />
          <TermsCard userId={userId} />
          <MemoCard
            memos={memos}
            total={detail.memos.total}
            withdrawn={withdrawn}
            isSaving={
              mutations.createMemo.isPending || mutations.updateMemo.isPending
            }
            onCreate={(content) => mutations.createMemo.mutateAsync(content)}
            onUpdate={(memoId, content) =>
              mutations.updateMemo.mutateAsync({ memoId, content })
            }
            onRequestDelete={setDeletingMemo}
          />
        </div>

        <div className="sticky top-0 flex flex-col gap-4 self-start">
          <StatusCard
            detail={detail}
            onSuspend={() => {
              // 정지 시작일은 오늘(KST) 고정 — 모달을 여는 순간의 날짜로 잡는다
              setSuspendToday(dayjs().format("YYYY-MM-DD"));
              setOpenModal("suspend");
            }}
            onRelease={() => setOpenModal("release")}
          />
          <PendingCard chips={detail.pendingChips} />
          <JudgementCard detail={detail} />
          <HistoryCard items={histories} />
        </div>
      </div>

      <SuspendModal
        isOpen={openModal === "suspend"}
        today={suspendToday}
        isSubmitting={mutations.suspend.isPending}
        onClose={() => setOpenModal(null)}
        onSubmit={async (body) => {
          try {
            await mutations.suspend.mutateAsync(body);
            setOpenModal(null);
            toast.success("계정 이용을 정지했습니다.");
          } catch {
            // 사유는 인터셉터 토스트 — 입력을 지키려고 모달을 닫지 않는다
          }
        }}
      />
      <ReleaseModal
        isOpen={openModal === "release"}
        detail={detail}
        isSubmitting={mutations.release.isPending}
        onClose={() => setOpenModal(null)}
        onSubmit={async (reason) => {
          try {
            await mutations.release.mutateAsync({ reason });
            setOpenModal(null);
            toast.success("정지를 해제했습니다.");
          } catch {
            // 사유는 인터셉터 토스트
          }
        }}
      />
      <UnmaskModal
        isOpen={openModal === "unmask"}
        maskedName={detail.identity.name}
        prefill={session.autoRelocked ? detail.unmask.lastReason : null}
        isSubmitting={session.isUnmasking}
        onClose={() => setOpenModal(null)}
        onSubmit={handleUnmaskSubmit}
      />
      <MemoDeleteModal
        memo={deletingMemo}
        isSubmitting={mutations.deleteMemo.isPending}
        onClose={() => setDeletingMemo(null)}
        onConfirm={async (memo) => {
          try {
            await mutations.deleteMemo.mutateAsync(memo.memoId);
            setDeletingMemo(null);
          } catch {
            // 사유는 인터셉터 토스트(작성자 아님 · 24시간 경과)
          }
        }}
      />
    </>
  );
}
