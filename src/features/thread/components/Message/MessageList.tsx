import {
  MessageBubble,
  OutgoingBubble,
} from "@/features/thread/components/Message/MessageBubble";
import SystemCard, {
  type SystemCardContext,
} from "@/features/thread/components/Message/SystemCard";
import type {
  AttachmentSummary,
  MessageItem,
  OutgoingMessage,
} from "@/features/thread/types";
import { dayKey, formatDayMark } from "@/features/thread/utils/format";
import { useCallback, useEffect, useRef } from "react";

interface MessageListProps {
  messages: Array<MessageItem>;
  outgoing: Array<OutgoingMessage>;
  isLoading: boolean;
  hasOlderMessages: boolean;
  isFetchingOlder: boolean;
  onLoadOlder: () => void;
  onRetry: (clientMessageId: string) => void;
  onCancel: (clientMessageId: string) => void;
  onClickImage: (images: Array<AttachmentSummary>, index: number) => void;
  onPlayVideo: (attachment: AttachmentSummary) => void;
  cardContext: SystemCardContext;
}

/**
 * 스레드 본문(시안 `.th-body`) — 날짜 구분선 · 말풍선 · 시스템 카드.
 *
 * 오래된 메시지는 위로 스크롤하면 이어 불러온다. 붙인 직후 `scrollHeight` 차이만큼 위치를
 * 보정해 읽던 자리가 밀리지 않게 한다. 새 메시지는 이미 맨 아래를 보고 있을 때만 따라간다 —
 * 과거 대화를 읽는 중에 폴링으로 끌어내리면 읽던 자리를 잃는다.
 */
export default function MessageList(props: MessageListProps) {
  const {
    messages,
    outgoing,
    isLoading,
    hasOlderMessages,
    isFetchingOlder,
    onLoadOlder,
    onRetry,
    onCancel,
    onClickImage,
    onPlayVideo,
    cardContext,
  } = props;

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  /** 맨 아래를 보고 있는가 — 정보 바를 펼치거나 첨부 이미지가 늦게 커져도 맨 아래에 붙어 있게 한다 */
  const isPinnedToBottom = useRef(true);
  const previousScrollHeight = useRef<number | null>(null);
  const hasScrolledToBottom = useRef(false);
  const lastMessageId = messages.at(-1)?.messageId ?? null;

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || previousScrollHeight.current !== null) {
      return;
    }
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    if (!hasScrolledToBottom.current || distanceFromBottom < 120) {
      element.scrollTop = element.scrollHeight;
      hasScrolledToBottom.current = messages.length > 0;
    }
  }, [lastMessageId, outgoing.length, messages.length]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || previousScrollHeight.current === null || isFetchingOlder) {
      return;
    }
    element.scrollTop = element.scrollHeight - previousScrollHeight.current;
    previousScrollHeight.current = null;
  }, [isFetchingOlder, messages.length]);

  useEffect(() => {
    const element = scrollRef.current;
    const content = contentRef.current;
    if (!element || !content) {
      return;
    }
    const observer = new ResizeObserver(() => {
      if (isPinnedToBottom.current && previousScrollHeight.current === null) {
        element.scrollTop = element.scrollHeight;
      }
    });
    observer.observe(element);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    isPinnedToBottom.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < 120;
    if (!hasOlderMessages || isFetchingOlder) {
      return;
    }
    if (element.scrollTop < 80) {
      previousScrollHeight.current = element.scrollHeight;
      onLoadOlder();
    }
  }, [hasOlderMessages, isFetchingOlder, onLoadOlder]);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="min-h-0 flex-1 overflow-y-auto"
    >
      <div
        ref={contentRef}
        className="flex min-h-full flex-col gap-3.5 px-5 py-4"
      >
        {/* 메시지가 적으면 아래로 붙인다(시안 `justify-content:flex-end`) — 스크롤과 함께 쓰려고 여백으로 민다 */}
        <div className="mt-auto" />

        {isFetchingOlder && (
          <div className="shrink-0 self-center text-[11px] text-sz-n-400">
            이전 메시지를 불러오는 중…
          </div>
        )}

        {isLoading && (
          <div className="shrink-0 self-center text-[12px] text-sz-n-400">
            메시지를 불러오는 중…
          </div>
        )}

        {!isLoading && messages.length === 0 && outgoing.length === 0 && (
          <div className="shrink-0 self-center text-[12px] text-sz-n-400">
            아직 주고받은 메시지가 없습니다.
          </div>
        )}

        {messages.map((message, index) => {
          const showDayMark =
            index === 0 ||
            dayKey(message.createdAt) !== dayKey(messages[index - 1].createdAt);
          return (
            <div key={message.messageId} className="contents">
              {showDayMark && (
                <div className="shrink-0 self-center text-[11px] text-sz-n-400">
                  {formatDayMark(message.createdAt)}
                </div>
              )}
              {message.messageType === "SYSTEM" ? (
                <SystemCard message={message} context={cardContext} />
              ) : (
                <MessageBubble
                  message={message}
                  onClickImage={onClickImage}
                  onPlayVideo={onPlayVideo}
                />
              )}
            </div>
          );
        })}

        {outgoing.map((message) => (
          <OutgoingBubble
            key={message.clientMessageId}
            message={message}
            onRetry={() => onRetry(message.clientMessageId)}
            onCancel={() => onCancel(message.clientMessageId)}
          />
        ))}
      </div>
    </div>
  );
}
