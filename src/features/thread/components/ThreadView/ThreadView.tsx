import { PreviewModal } from "@/common/components/PreviewModal/PreviewModal";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import VideoPlayerModal from "@/features/thread/components/Attachment/VideoPlayerModal";
import Composer from "@/features/thread/components/Composer/Composer";
import MessageList from "@/features/thread/components/Message/MessageList";
import type { SystemCardContext } from "@/features/thread/components/Message/SystemCard";
import ChannelInfoBar from "@/features/thread/components/ThreadView/ChannelInfoBar";
import IssuePanel from "@/features/thread/components/ThreadView/IssuePanel";
import {
  BUSINESS_TYPE_LABEL,
  TAB_ROLE_LABEL,
} from "@/features/thread/constants/params";
import { useMarkThreadRead } from "@/features/thread/hooks/useMarkThreadRead";
import { useOutgoingMessages } from "@/features/thread/hooks/useOutgoingMessages";
import { useRefreshInfoOnNewCard } from "@/features/thread/hooks/useRefreshInfoOnNewCard";
import { useResendNotice } from "@/features/thread/hooks/useResendNotice";
import { useGetThreadMessages } from "@/features/thread/hooks/useThreadQueries";
import type {
  AttachmentSummary,
  ChannelInfo,
  MessageItem,
} from "@/features/thread/types";
import { formatDateTime, formatDay } from "@/features/thread/utils/format";
import { toBadgeVariant } from "@/features/thread/utils/tone";
import { useCallback, useMemo, useState, type ReactNode } from "react";

interface ThreadViewProps {
  info: ChannelInfo;
  /** 열린 이슈 스레드 · 쌍 스레드 링크 — 같은 화면에서 그 스레드를 연다 */
  onOpenIssueThread: (threadId: number) => void;
  onOpenPairThread: (threadId: number) => void;
}

interface LightboxState {
  images: Array<AttachmentSummary>;
  index: number;
}

/** 시안 `.th-notice` — 스크롤과 무관하게 항상 보이는 고지 줄 */
function NoticeStrip(props: { children: ReactNode }) {
  return (
    <div className="shrink-0 bg-sz-n-100 px-4 py-[7px] text-center text-[11px] text-sz-n-600">
      {props.children}
    </div>
  );
}

/** 시안 `.th-closed` — 입력창 대신 놓이는 열람 전용 안내 바 */
function ReadOnlyStrip(props: { children: ReactNode }) {
  return (
    <div className="shrink-0 border-t border-sz-n-200 bg-sz-n-100 p-3.5 text-center text-[12px] text-sz-n-600">
      {props.children}
    </div>
  );
}

/** 상대 · 카드 중 가장 최근 메시지 — 운영팀 말풍선은 안 읽은 수에 들어가지 않는다 */
function findLatestIncomingId(messages: Array<MessageItem>) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (!messages[index].mine) {
      return messages[index].messageId;
    }
  }
  return null;
}

/** 로드된 제안 카드 중 가장 최근 회차 */
function findLatestProposalSeq(messages: Array<MessageItem>): number | null {
  let latest: number | null = null;
  for (const message of messages) {
    const seq = message.card?.detail?.adjustment?.seq;
    const type = message.card?.cardType;
    if (
      seq !== undefined &&
      (type === "SETTLEMENT_ADJUSTMENT_REQUEST" ||
        type === "SETTLEMENT_ADJUSTMENT_COUNTER")
    ) {
      latest = latest === null ? seq : Math.max(latest, seq);
    }
  }
  return latest;
}

/** 헤더 보조 줄 — 채널 · 이슈 · 쌍 스레드마다 다르다 */
function headerSubline(info: ChannelInfo) {
  if (info.issue) {
    const { issue } = info;
    const pair = `${issue.brand.name} × ${issue.influencer.name}`;
    if (issue.status === "OPEN") {
      return [
        pair,
        `합의 기한 ${formatDateTime(issue.deadlineAt)}`,
        issue.remainingBusinessDays !== null &&
          `D-${issue.remainingBusinessDays}`,
      ]
        .filter(Boolean)
        .join(" · ");
    }
    return [
      pair,
      issue.closedAt && `${formatDay(issue.closedAt)} 종결`,
      "읽기 전용",
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (info.pair) {
    return "브랜드–인플루언서 1:1 스레드 · 읽기 전용";
  }
  const isBrand = info.tab === "BRAND";
  const subLabel = isBrand
    ? info.profile?.managerName && `담당 ${info.profile.managerName}`
    : info.profile?.businessType &&
      BUSINESS_TYPE_LABEL[info.profile.businessType];
  return [
    isBrand ? TAB_ROLE_LABEL.BRAND : TAB_ROLE_LABEL.INFLUENCER,
    info.memberNo,
    subLabel,
    "운영팀 채널",
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * 가운데 스레드(+ 이슈 스레드면 우측 패널).
 *
 * - 운영팀 1:1 채널: 접이식 정보 바 · 운영팀 채널 고지 · 입력창(탈퇴 회원이면 닫는다)
 * - 이슈 스레드: 3자 고지 · 입력창 대신 열람 전용 안내 바 · 우측 이슈 패널
 * - 브랜드–인플루언서 1:1 스레드(이슈 패널에서 열람): 고지 · 열람 전용 안내 바
 */
export default function ThreadView(props: ThreadViewProps) {
  const { info, onOpenIssueThread, onOpenPairThread } = props;
  const threadId = info.threadId;
  const isOperatorChannel = info.tab === "BRAND" || info.tab === "INFLUENCER";

  const {
    messages,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useGetThreadMessages(threadId);
  const { outgoing, send, retry, cancel } = useOutgoingMessages(
    isOperatorChannel ? threadId : null
  );
  const resendNotice = useResendNotice(threadId);

  const latestIncomingId = useMemo(
    () => findLatestIncomingId(messages),
    [messages]
  );
  useMarkThreadRead(threadId, latestIncomingId);
  useRefreshInfoOnNewCard(threadId, messages);

  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [playingVideo, setPlayingVideo] = useState<AttachmentSummary | null>(
    null
  );
  const closeVideo = useCallback(() => setPlayingVideo(null), []);

  const { mutate: sendResendNotice } = resendNotice;
  const cardContext = useMemo<SystemCardContext>(
    () => ({
      issue: info.issue,
      latestProposalSeq: findLatestProposalSeq(messages),
      onResendNotice: (messageId) => sendResendNotice(messageId),
      resendingMessageId: resendNotice.isPending
        ? (resendNotice.variables ?? null)
        : null,
    }),
    [
      info.issue,
      messages,
      sendResendNotice,
      resendNotice.isPending,
      resendNotice.variables,
    ]
  );

  const currentImage = lightbox?.images[lightbox.index];

  return (
    <div className="flex min-w-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col bg-sz-n-50">
        <div className="flex h-[60px] shrink-0 items-center gap-3 border-b border-sz-n-200 bg-white px-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-sz-n-900">
              <span className="truncate">{info.name}</span>
              {info.issue && (
                <StatusBadge
                  variant={toBadgeVariant(info.issue.badgeTone)}
                  hideDot
                >
                  {info.issue.badgeLabel}
                </StatusBadge>
              )}
            </div>
            <div className="mt-0.5 truncate text-[11px] text-sz-n-500">
              {headerSubline(info)}
            </div>
          </div>
        </div>

        {isOperatorChannel && (
          <ChannelInfoBar info={info} onOpenIssueThread={onOpenIssueThread} />
        )}

        <NoticeStrip>
          {isOperatorChannel ? (
            <>
              SHOWROOMZ 운영팀 채널 — 상대에게는 <b>SHOWROOMZ 운영팀</b>으로만
              표시되고 담당자 이름은 보이지 않습니다.
            </>
          ) : info.issue ? (
            "3자 스레드 — 브랜드 · 인플루언서 · SHOWROOMZ 운영팀이 함께 봅니다. 모든 글과 첨부는 정산 근거로 보존됩니다."
          ) : (
            "브랜드–인플루언서 1:1 스레드 — 정산 조정 협의가 있었던 쌍의 대화를 열람합니다."
          )}
        </NoticeStrip>

        <MessageList
          messages={messages}
          outgoing={outgoing}
          isLoading={isLoading}
          hasOlderMessages={Boolean(hasNextPage)}
          isFetchingOlder={isFetchingNextPage}
          onLoadOlder={() => void fetchNextPage()}
          onRetry={retry}
          onCancel={cancel}
          onClickImage={(images, index) => setLightbox({ images, index })}
          onPlayVideo={setPlayingVideo}
          cardContext={cardContext}
        />

        {isOperatorChannel ? (
          <Composer
            onSend={send}
            disabledReason={
              info.writable
                ? null
                : "탈퇴한 회원의 채널입니다 — 메시지를 보낼 수 없고 열람만 할 수 있습니다."
            }
          />
        ) : info.issue ? (
          <ReadOnlyStrip>
            {info.issue.status === "OPEN" ? (
              <>
                운영팀은 <b>열람만</b> 합니다 — 금액은 <b>양측 합의로만</b>{" "}
                바뀌고, 합의가 되면 시스템이 즉시 반영합니다.
              </>
            ) : info.issue.status === "AGREED" ? (
              "종결된 이슈 스레드입니다 — 같은 사안으로 다시 요청할 수 없고, 새 이견은 다음 정산 확인 기간에 요청합니다."
            ) : (
              "종결된 이슈 스레드입니다 — 같은 사안으로 다시 요청할 수 없습니다."
            )}
          </ReadOnlyStrip>
        ) : (
          <ReadOnlyStrip>
            운영팀은 <b>열람만</b> 합니다 — 이 대화에는 글을 쓸 수 없습니다.
          </ReadOnlyStrip>
        )}
      </div>

      {info.issue && (
        <IssuePanel issue={info.issue} onOpenPairThread={onOpenPairThread} />
      )}

      <PreviewModal
        isOpen={Boolean(currentImage)}
        onOpenChange={(open) => {
          if (!open) {
            setLightbox(null);
          }
        }}
        imageUrl={currentImage?.fileUrl ?? ""}
        currentIndex={lightbox?.index ?? 0}
        fileLength={lightbox?.images.length ?? 0}
        onIndexChange={(index) =>
          setLightbox((current) => current && { ...current, index })
        }
      />
      <VideoPlayerModal attachment={playingVideo} onClose={closeVideo} />
    </div>
  );
}
