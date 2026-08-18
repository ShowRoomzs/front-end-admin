import ThreadMessage from "@/common/components/ThreadMessage/ThreadMessage";
import type { InquiryThreadMessage } from "@/features/inquiry/types/inquiry";

interface InquiryThreadProps {
  messages: Array<InquiryThreadMessage>;
}

/** 문의 스레드 — 소비자 메시지(흰 배경) → 운영자 답변(액센트 배경). 서버가 시간순으로 내려준다 */
export default function InquiryThread(props: InquiryThreadProps) {
  const { messages } = props;

  return (
    <div className="flex flex-col gap-2.5 pt-2">
      {messages.map((message, index) => {
        const isOperator = message.role === "OPERATOR";
        return (
          <ThreadMessage
            key={`${message.role}-${message.sentAt}-${index}`}
            authorName={message.authorName}
            roleLabel={isOperator ? "운영자" : "소비자"}
            sentAt={message.sentAt}
            content={message.content}
            emphasized={isOperator}
            imageUrls={message.imageUrls}
          />
        );
      })}
    </div>
  );
}
