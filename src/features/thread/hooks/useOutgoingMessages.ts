import { ADMIN_THREAD_QUERY_KEYS } from "@/features/thread/constants/queryKeys";
import { adminThreadService } from "@/features/thread/services/adminThreadService";
import { uploadAttachment } from "@/features/thread/services/attachmentUploader";
import type {
  MessageItem,
  MessageListResponse,
  OutgoingAttachment,
  OutgoingMessage,
} from "@/features/thread/types";
import { getLocalAttachmentType } from "@/features/thread/utils/attachment";
import { insertMessageIntoCache } from "@/features/thread/utils/messageCache";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const FALLBACK_SEND_ERROR = "메시지를 보내지 못했습니다.";

/**
 * 실패 사유 한 줄 + 토스트를 띄울지.
 * axios 오류는 apiInstance 인터셉터가 이미 토스트를 띄웠다 — S3 직접 업로드(XHR)만 아무도 알려주지 않는다.
 */
function describeSendError(error: unknown) {
  if (isAxiosError(error)) {
    return {
      message: error.response?.data?.message ?? FALLBACK_SEND_ERROR,
      shouldToast: false,
    };
  }
  return {
    message: error instanceof Error ? error.message : FALLBACK_SEND_ERROR,
    shouldToast: true,
  };
}

/**
 * 아직 서버에 없는 운영자 메시지들(파트너센터 연결·소통의 같은 훅을 어드민 엔드포인트로 옮겼다).
 *
 * 전송 버튼을 누르면 말풍선이 먼저 뜨고 첨부 업로드가 그 아래에서 진행된다. 전송 API는
 * complete까지 끝난 `attachmentId`를 요구하므로 업로드가 전부 끝난 뒤 실제 요청이 나간다.
 * 재전송은 **같은 clientMessageId**로 보낸다 — 응답을 못 받은 첫 요청이 저장됐어도 서버가
 * 기존 메시지를 200으로 돌려줘 중복 저장되지 않는다.
 */
export function useOutgoingMessages(threadId: number | null) {
  const queryClient = useQueryClient();
  const [outgoing, setOutgoing] = useState<Array<OutgoingMessage>>([]);
  const abortControllers = useRef(new Map<string, AbortController>());

  // 스레드를 바꾸면 이전 스레드의 전송 대기열은 화면에서 사라진다
  useEffect(() => {
    const controllers = abortControllers.current;
    controllers.forEach((controller) => controller.abort());
    controllers.clear();
    setOutgoing([]);
  }, [threadId]);

  const patchMessage = useCallback(
    (clientMessageId: string, patch: Partial<OutgoingMessage>) =>
      setOutgoing((prev) =>
        prev.map((message) =>
          message.clientMessageId === clientMessageId
            ? { ...message, ...patch }
            : message
        )
      ),
    []
  );

  const patchAttachment = useCallback(
    (
      clientMessageId: string,
      localId: string,
      patch: Partial<OutgoingAttachment>
    ) =>
      setOutgoing((prev) =>
        prev.map((message) =>
          message.clientMessageId === clientMessageId
            ? {
                ...message,
                attachments: message.attachments.map((attachment) =>
                  attachment.localId === localId
                    ? { ...attachment, ...patch }
                    : attachment
                ),
              }
            : message
        )
      ),
    []
  );

  const insertSentMessage = useCallback(
    (targetThreadId: number, sent: MessageItem) => {
      queryClient.setQueryData<InfiniteData<MessageListResponse>>(
        [ADMIN_THREAD_QUERY_KEYS.MESSAGES, targetThreadId],
        (current) => insertMessageIntoCache(current, sent)
      );
      // 목록의 미리보기(「운영팀: 」) · 정렬이 바뀐다
      void queryClient.invalidateQueries({
        queryKey: [ADMIN_THREAD_QUERY_KEYS.LIST],
      });
    },
    [queryClient]
  );

  /** 첨부 업로드 → 전송. 이미 올라간 첨부(`summary` 있음)는 재전송 때 다시 올리지 않는다 */
  const runSend = useCallback(
    async (targetThreadId: number, message: OutgoingMessage) => {
      const { clientMessageId } = message;
      const controller = new AbortController();
      abortControllers.current.set(clientMessageId, controller);

      try {
        const summaries = await Promise.all(
          message.attachments.map(async (attachment) => {
            if (attachment.summary) {
              return attachment.summary;
            }
            const summary = await uploadAttachment({
              threadId: targetThreadId,
              file: attachment.file,
              signal: controller.signal,
              onProgress: (progress) =>
                patchAttachment(clientMessageId, attachment.localId, {
                  progress,
                }),
            });
            // REJECTED는 오류가 아니라 200 응답의 값이다 — 그대로 보내면 원인 모를 400이 된다
            if (summary.status !== "UPLOADED") {
              throw new Error(
                `"${attachment.file.name}" 파일이 업로드 검증을 통과하지 못했습니다.`
              );
            }
            patchAttachment(clientMessageId, attachment.localId, {
              summary,
              progress: 100,
            });
            return summary;
          })
        );

        const sent = await adminThreadService.sendMessage(targetThreadId, {
          clientMessageId,
          content: message.content ?? undefined,
          attachmentIds:
            summaries.length > 0
              ? summaries.map((summary) => summary.attachmentId)
              : undefined,
        });

        insertSentMessage(targetThreadId, sent);
        setOutgoing((prev) =>
          prev.filter((item) => item.clientMessageId !== clientMessageId)
        );
      } catch (error) {
        // 취소는 실패가 아니다 — 이미 목록에서 지워졌다
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        const { message: reason, shouldToast } = describeSendError(error);
        if (shouldToast) {
          toast.error(reason);
        }
        patchMessage(clientMessageId, { status: "failed", error: reason });
      } finally {
        abortControllers.current.delete(clientMessageId);
      }
    },
    [insertSentMessage, patchAttachment, patchMessage]
  );

  const send = useCallback(
    (content: string, files: Array<File>) => {
      if (threadId === null) {
        return;
      }
      const message: OutgoingMessage = {
        clientMessageId: crypto.randomUUID(),
        content: content.trim() || null,
        attachments: files.map((file) => ({
          localId: crypto.randomUUID(),
          file,
          attachmentType: getLocalAttachmentType(file.name),
          progress: 0,
        })),
        status: "sending",
        createdAt: new Date().toISOString(),
      };
      setOutgoing((prev) => [...prev, message]);
      void runSend(threadId, message);
    },
    [runSend, threadId]
  );

  const retry = useCallback(
    (clientMessageId: string) => {
      if (threadId === null) {
        return;
      }
      const target = outgoing.find(
        (message) => message.clientMessageId === clientMessageId
      );
      if (!target) {
        return;
      }
      patchMessage(clientMessageId, { status: "sending", error: undefined });
      void runSend(threadId, {
        ...target,
        status: "sending",
        error: undefined,
      });
    },
    [outgoing, patchMessage, runSend, threadId]
  );

  const cancel = useCallback((clientMessageId: string) => {
    abortControllers.current.get(clientMessageId)?.abort();
    abortControllers.current.delete(clientMessageId);
    setOutgoing((prev) =>
      prev.filter((message) => message.clientMessageId !== clientMessageId)
    );
  }, []);

  return { outgoing, send, retry, cancel };
}
