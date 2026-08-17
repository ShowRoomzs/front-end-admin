import { formatDateTimeShort } from "@/common/utils/formatDate";
import AttachmentStrip from "@/features/inquiry/components/InquiryThread/AttachmentStrip";
import type { InquiryThreadMessage } from "@/features/inquiry/types/inquiry";

interface InquiryThreadProps {
  messages: Array<InquiryThreadMessage>;
}

/**
 * 문의 스레드 — 소비자 메시지(흰 배경) → 운영자 답변(액센트 배경).
 *
 * 채팅처럼 좌우로 나누지 않고 배경색으로만 구분한다. 최대 2건(문의 1 + 답변 1)이라
 * 좌우 정렬은 폭만 낭비하고, 답변이 소비자에게 그대로 나가는 원문이므로 본문을
 * 넓게 읽히는 쪽이 오타를 잡는 데 유리하다.
 */
export default function InquiryThread(props: InquiryThreadProps) {
  const { messages } = props;

  return (
    <div className="flex flex-col gap-2.5 pt-2">
      {messages.map((message, index) => {
        const isOperator = message.role === "OPERATOR";
        return (
          <div
            key={`${message.role}-${message.sentAt}-${index}`}
            className={`rounded-[6px] border px-3.5 py-3 text-[12px] leading-[1.75] text-sz-n-700 ${
              isOperator
                ? "border-sz-accent-100 bg-sz-accent-50"
                : "border-sz-n-200 bg-white"
            }`}
          >
            <div className="mb-[5px] flex items-center gap-1.5 text-[11px] font-semibold text-sz-n-700">
              {message.authorName}
              <span className="font-normal text-sz-n-500">
                {isOperator ? "운영자" : "소비자"} ·{" "}
                {formatDateTimeShort(message.sentAt)}
              </span>
            </div>
            {/* 소비자가 줄바꿈으로 정리해 쓴 내용이 한 덩어리로 뭉치지 않게 한다 */}
            <p className="m-0 whitespace-pre-wrap">{message.content}</p>
            <AttachmentStrip imageUrls={message.imageUrls ?? []} />
          </div>
        );
      })}
    </div>
  );
}
