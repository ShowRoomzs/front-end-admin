import type { MessageItem, MessageListResponse } from "@/features/thread/types";
import type { InfiniteData } from "@tanstack/react-query";

/** 전송에 성공한 메시지를 조회 캐시 맨 앞(= 최신)에 끼워 넣는다 — 이미 있으면 그대로 */
export function insertMessageIntoCache(
  current: InfiniteData<MessageListResponse> | undefined,
  item: MessageItem
) {
  if (!current || current.pages.length === 0) {
    return current;
  }
  const exists = current.pages.some((page) =>
    page.content.some((message) => message.messageId === item.messageId)
  );
  if (exists) {
    return current;
  }
  const [firstPage, ...restPages] = current.pages;
  return {
    ...current,
    pages: [
      { ...firstPage, content: [item, ...firstPage.content] },
      ...restPages,
    ],
  };
}
