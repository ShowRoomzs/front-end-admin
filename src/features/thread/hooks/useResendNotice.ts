import { ADMIN_THREAD_QUERY_KEYS } from "@/features/thread/constants/queryKeys";
import { adminThreadService } from "@/features/thread/services/adminThreadService";
import type { MessageListResponse } from "@/features/thread/types";
import { insertMessageIntoCache } from "@/features/thread/utils/messageCache";
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import toast from "react-hot-toast";

/**
 * 재발송 요청 카드의 [재발송 완료 알림 보내기].
 *
 * 응답의 굳은 카드(`card`)로 화면의 카드를 바꾸고 자동 안내 말풍선(`notice`)을 붙인다.
 * 다른 운영자가 먼저 눌렀으면(`alreadyNotified`) 서버는 아무것도 보내지 않고 현재 상태를 준다 —
 * 오류가 아니라 같은 결과로 수렴하는 것이라 안내만 한다.
 *
 * 끝나면 성공 · 실패와 상관없이 목록 · 요약(재발송 요청 수)을 다시 읽는다. 실패(409 계약이 서명
 * 단계를 벗어남)면 메시지도 다시 읽어 카드가 CLOSED로 바뀐 것을 보여 준다.
 * 실패 토스트는 apiInstance 인터셉터가 서버 문구로 띄운다.
 */
export function useResendNotice(threadId: number) {
  const queryClient = useQueryClient();
  const messagesKey = [ADMIN_THREAD_QUERY_KEYS.MESSAGES, threadId];

  return useMutation({
    mutationFn: (messageId: number) =>
      adminThreadService.sendResendNotice(threadId, messageId),
    onSuccess: (data) => {
      queryClient.setQueryData<InfiniteData<MessageListResponse>>(
        messagesKey,
        (current) => {
          const replaced = current && {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              content: page.content.map((message) =>
                message.messageId === data.card.messageId ? data.card : message
              ),
            })),
          };
          return data.notice
            ? insertMessageIntoCache(replaced, data.notice)
            : replaced;
        }
      );
      if (data.alreadyNotified) {
        toast("다른 운영자가 이미 재발송 완료 알림을 보냈습니다.");
      } else {
        toast.success("재발송 완료 알림을 보냈습니다.");
      }
    },
    onError: () => queryClient.invalidateQueries({ queryKey: messagesKey }),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: [ADMIN_THREAD_QUERY_KEYS.LIST],
        }),
        queryClient.invalidateQueries({
          queryKey: [ADMIN_THREAD_QUERY_KEYS.SUMMARY],
        }),
      ]),
  });
}
