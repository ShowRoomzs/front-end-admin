import AttachmentBlock from "@/features/thread/components/Attachment/AttachmentBlock";
import type {
  AttachmentSummary,
  MessageItem,
  OutgoingMessage,
  ParticipantType,
} from "@/features/thread/types";
import { formatTime } from "@/features/thread/utils/format";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AttachmentHandlers {
  onClickImage: (images: Array<AttachmentSummary>, index: number) => void;
  onPlayVideo: (attachment: AttachmentSummary) => void;
}

/** 시안 `.rtag` — 상대 말풍선 이름 옆 역할 태그 */
function RoleTag(props: { senderType: ParticipantType }) {
  const { senderType } = props;
  if (senderType === "SELLER") {
    return (
      <span className="rounded-[6px] bg-sz-info-bg px-[5px] text-[10px] font-semibold leading-4 text-sz-info-text">
        브랜드
      </span>
    );
  }
  if (senderType === "CREATOR") {
    return (
      <span className="rounded-[6px] bg-sz-success-bg px-[5px] text-[10px] font-semibold leading-4 text-sz-success-text">
        인플루언서
      </span>
    );
  }
  return null;
}

/** 시안 `.autotag` — 정해진 문구의 자동 전송. 어드민에서만 보인다 */
function AutoNoticeTag() {
  return (
    <span className="rounded-[6px] bg-sz-n-100 px-[5px] text-[10px] font-semibold leading-4 text-sz-n-500">
      자동 안내
    </span>
  );
}

/** 시안 `.msg` 골격 — 이름 줄 · 말풍선 + 시각 · 그 아래 덧붙임 */
function BubbleFrame(props: {
  isMine: boolean;
  who: ReactNode;
  content: string | null;
  /** 상대 말풍선은 첨부를 말풍선 안에 넣는다(20b) — 운영팀 쪽은 말풍선 아래 */
  inner?: ReactNode;
  stamp: ReactNode;
  children?: ReactNode;
}) {
  const { isMine, who, content, inner, stamp, children } = props;
  const hasBubble = Boolean(content) || Boolean(inner);

  return (
    <div
      className={cn(
        "min-w-0 max-w-[74%] shrink-0",
        isMine ? "self-end" : "self-start"
      )}
    >
      <div
        className={cn(
          "mb-1 flex items-center gap-1.5 text-[11px] font-medium text-sz-n-600",
          isMine && "justify-end"
        )}
      >
        {who}
      </div>
      {hasBubble && (
        <div
          className={cn("flex items-end gap-1.5", isMine && "flex-row-reverse")}
        >
          <div className="min-w-0">
            <div
              className={cn(
                "inline-block max-w-full whitespace-pre-wrap break-words rounded-[12px] px-[13px] py-[9px] text-[13px] leading-[1.55]",
                isMine
                  ? "rounded-tr-[2px] bg-sz-accent-500 text-white"
                  : "rounded-tl-[2px] border border-sz-n-200 bg-white text-sz-n-900"
              )}
            >
              {content}
              {inner}
            </div>
          </div>
          <div className="shrink-0 whitespace-nowrap text-[11px] text-sz-n-400">
            {stamp}
          </div>
        </div>
      )}
      {children}
      {!hasBubble && (
        <div
          className={cn(
            "mt-1 text-[11px] text-sz-n-400",
            isMine && "text-right"
          )}
        >
          {stamp}
        </div>
      )}
    </div>
  );
}

/**
 * 서버 말풍선 — `mine`(운영팀 기준)이면 오른쪽 「운영팀 · {운영자}」, 아니면 왼쪽 「{이름} [역할]」.
 * 운영자 이름이 없으면(시스템 발신 · 가입 환영) 「운영팀」만 쓴다.
 */
export function MessageBubble(
  props: { message: MessageItem } & AttachmentHandlers
) {
  const { message, onClickImage, onPlayVideo } = props;
  const isMine = message.mine;
  const attachmentsInside = !isMine && Boolean(message.content);
  const attachmentBlock = (
    <AttachmentBlock
      attachments={message.attachments}
      alignEnd={isMine}
      onClickImage={onClickImage}
      onPlayVideo={onPlayVideo}
    />
  );

  const who = isMine ? (
    <>
      {message.autoNotice && <AutoNoticeTag />}
      <span>
        {message.operatorName ? `운영팀 · ${message.operatorName}` : "운영팀"}
      </span>
    </>
  ) : (
    <>
      <span>{message.senderName ?? "알 수 없음"}</span>
      <RoleTag senderType={message.senderType} />
    </>
  );

  return (
    <BubbleFrame
      isMine={isMine}
      who={who}
      content={message.content}
      inner={
        attachmentsInside && message.attachments.length > 0
          ? attachmentBlock
          : undefined
      }
      stamp={formatTime(message.createdAt)}
    >
      {!attachmentsInside && attachmentBlock}
    </BubbleFrame>
  );
}

/**
 * 아직 서버에 없는 운영자 메시지 — 업로드 진행률 · 전송 실패([재전송]/[취소])를 그린다.
 * 실패 사유는 문구 대신 툴팁으로만 남긴다(파트너센터 연결·소통과 같은 규칙).
 */
export function OutgoingBubble(props: {
  message: OutgoingMessage;
  onRetry: () => void;
  onCancel: () => void;
}) {
  const { message, onRetry, onCancel } = props;
  const isFailed = message.status === "failed";

  return (
    <BubbleFrame
      isMine
      who={<span>운영팀</span>}
      content={message.content}
      stamp={
        isFailed ? (
          <span
            title={message.error ?? "전송 실패"}
            className="flex size-4 items-center justify-center rounded-full bg-sz-danger-text text-[10px] font-bold leading-none text-white"
          >
            !
          </span>
        ) : (
          "전송 중…"
        )
      }
    >
      {message.attachments.map((attachment) => (
        <div
          key={attachment.localId}
          className="ml-auto mt-1.5 w-[260px] rounded-[6px] border border-sz-n-200 bg-white px-3 py-2"
        >
          <div className="flex justify-between gap-2 text-[12px]">
            <span className="truncate text-sz-n-900">
              {attachment.file.name}
            </span>
            <span className="shrink-0 font-semibold text-sz-accent-600">
              {attachment.progress}%
            </span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-sm bg-sz-n-200">
            <div
              className="h-full rounded-sm bg-sz-accent-500 transition-[width]"
              style={{ width: `${attachment.progress}%` }}
            />
          </div>
        </div>
      ))}
      {isFailed && (
        <div className="mt-1 flex items-center justify-end gap-[7px] text-[11px] font-medium text-sz-danger-text">
          <span title={message.error ?? "전송 실패"}>전송 실패</span>
          <button
            type="button"
            onClick={onRetry}
            className="text-sz-n-600 underline hover:text-sz-n-900"
          >
            재전송
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-sz-n-600 underline hover:text-sz-n-900"
          >
            취소
          </button>
        </div>
      )}
    </BubbleFrame>
  );
}
