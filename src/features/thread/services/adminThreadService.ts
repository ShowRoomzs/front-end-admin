import { apiInstance } from "@/common/lib/apiInstance";
import type { PageResponse } from "@/common/types/page";
import type {
  AttachmentDownloadResponse,
  AttachmentSummary,
  ChannelInfo,
  ChannelListItem,
  ChannelListQuery,
  MessageItem,
  MessageListResponse,
  PresignRequest,
  PresignResponse,
  ResendNoticeResponse,
  SendMessageRequest,
  ThreadSummary,
} from "@/features/thread/types";

/** 어드민 소통 스레드 API — 백엔드 `AdminThreadController`와 1:1 */
export const adminThreadService = {
  /** 탭별 운영팀 채널 · 이슈 스레드 목록. `tab`은 필수(없으면 400) */
  getList: async (query: ChannelListQuery) => {
    const { data } = await apiInstance.get<PageResponse<ChannelListItem>>(
      "/admin/connections/threads",
      { params: query }
    );
    return data;
  },

  /** 탭 배지 — 파라미터 없음 · 폴링 대상 */
  getSummary: async () => {
    const { data } = await apiInstance.get<ThreadSummary>(
      "/admin/connections/summary"
    );
    return data;
  },

  /** 헤더 · 접이식 정보 바 · 이슈 패널 · 쌍 헤더 */
  getInfo: async (threadId: number) => {
    const { data } = await apiInstance.get<ChannelInfo>(
      `/admin/threads/${threadId}/info`
    );
    return data;
  },

  /** 최신순 커서 페이징 — 조회는 읽음 처리를 하지 않는다 */
  getMessages: async (
    threadId: number,
    params: { cursor?: number; size?: number }
  ) => {
    const { data } = await apiInstance.get<MessageListResponse>(
      `/admin/threads/${threadId}/messages`,
      { params }
    );
    return data;
  },

  /** 201(새로 저장) · 200(같은 clientMessageId 재전송) 모두 성공이다 */
  sendMessage: async (threadId: number, request: SendMessageRequest) => {
    const { data } = await apiInstance.post<MessageItem>(
      `/admin/threads/${threadId}/messages`,
      request
    );
    return data;
  },

  /** 운영팀 공용 읽음 위치를 최신 메시지로 — 멱등 · 204 */
  markRead: async (threadId: number) => {
    await apiInstance.post(`/admin/threads/${threadId}/read`, undefined, {
      // 실패해도 운영자가 할 일이 없다 — 다음 진입에서 다시 시도된다
      suppressErrorToast: true,
    });
  },

  createPresignedUpload: async (threadId: number, request: PresignRequest) => {
    const { data } = await apiInstance.post<PresignResponse>(
      `/admin/threads/${threadId}/attachments/presign`,
      request
    );
    return data;
  },

  completeUpload: async (
    attachmentId: number,
    request: { durationSeconds?: number }
  ) => {
    const { data } = await apiInstance.patch<AttachmentSummary>(
      `/admin/attachments/${attachmentId}/complete`,
      request
    );
    return data;
  },

  /**
   * 저장 직전에 부른다 — URL이 5분 뒤 만료된다. 파일 하나든 전체 다운로드든 한 번에,
   * 요청한 ID 순서대로 발급된다(하나라도 안 되면 전부 실패).
   */
  getDownloadUrls: async (attachmentIds: Array<number>) => {
    const { data } = await apiInstance.post<Array<AttachmentDownloadResponse>>(
      "/admin/attachments/download",
      { attachmentIds }
    );
    return data;
  },

  /** 재발송 요청 카드의 [재발송 완료 알림 보내기] — 굳은 카드 + 자동 안내 말풍선 */
  sendResendNotice: async (threadId: number, messageId: number) => {
    const { data } = await apiInstance.post<ResendNoticeResponse>(
      `/admin/threads/${threadId}/cards/${messageId}/resend-notice`
    );
    return data;
  },
};
