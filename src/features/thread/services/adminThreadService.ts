import { apiInstance } from "@/common/lib/apiInstance";
import type { PageResponse } from "@/common/types/page";
import {
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock";
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

/*
  어드민 소통 스레드 API — 백엔드 `AdminThreadController`(origin/main)와 1:1. 배포본은 항상 실호출한다.

  ⚠ 백엔드 배포 후 삭제: 1021 운영팀 채널 카드 6종(계약 취소 · 해지 동의 확인 · 해지 결과 · 직권 중단 사전 통지 ·
  조정 철회 · 정지/해제)과 목록 `appealUnconfirmed` · 정보 바 `sanction` · `progress.groupBuySuspensionScheduled`는
  origin/main에 있지만 개발 서버(api.showroomz.shop)에 아직 없다. 그 상태를 로컬에서 보려고 DEV에서만
  `?mock=` 시나리오로 목업 어댑터(`mocks/threadMock.ts`, 동적 import)를 켠다. 시나리오가 없으면 DEV도 실서버를 부른다.

  DEV 목업 시나리오(`?mock=<값>` — 다섯 값 모두 같은 목업 채널 묶음을 켜고, `threadId`로 상태를 고른다):
  - `a7`   `/monitoring/threads?mock=a7&threadId=9001`  A7 무드코스메틱 — 정지 카드 · 소명 답글 · 「소명 미확인」 고정 · 정보 바 정지 사유
  - `a8`   `/monitoring/threads?mock=a8&threadId=9101`  A8 뷰티_소연 — 직권 중단 사전 통지(상대 브랜드) · 계약 취소 동의 확인 · 동의 답글
           `threadId=9002` 퓨어랩 — A8 ① 브랜드 쪽 카드(상대 인플루언서) · 요약 「중단 예정 1」
           `threadId=9104` 민재 셀렉트 — 계약 해지 동의 확인(사유 라벨 + 요청 메모)
  - `a5`   `threadId=9003` 글로우랩 — A5 직권 취소 요청 대화 → 처리 결과 카드
           `threadId=9004` 벨라코스 — 옛 정지 카드(사유 한 줄) → 정지 해제(기간 종료 · 시스템) → 계약 해지 결과
  - `a6-0` `threadId=9102` 하린의 뷰티랩 — A6-0 재발송 요청(처리 전). [재발송 완료 알림 보내기]를 누르면 A6로 넘어간다
  - `a6`   `threadId=9103` 글로우_지민 — A6 재발송 완료 알림 전송 후
  이슈 탭은 목업에서 비어 있다(20b는 실서버로 본다). 첨부 업로드 · 다운로드는 목업이 없어 실서버를 부른다.
*/
const THREAD_MOCK_SCENARIOS = ["a5", "a6-0", "a6", "a7", "a8"];

function threadMock(): boolean {
  if (!DEV_MOCK_ENABLED) return false;
  const scenario = mockScenario();
  return scenario !== null && THREAD_MOCK_SCENARIOS.includes(scenario);
}

async function loadMock() {
  // 배포 빌드에서 목업 모듈이 청크로 남지 않게 상수 조건으로 막는다(번들러가 이 분기를 지운다)
  if (!import.meta.env.DEV) throw new Error("mock disabled");
  return import("../mocks/threadMock");
}

export const adminThreadService = {
  /** 탭별 운영팀 채널 · 이슈 스레드 목록. `tab`은 필수(없으면 400) */
  getList: async (query: ChannelListQuery) => {
    if (threadMock()) {
      const { mockChannelList } = await loadMock();
      return mockDelay(mockChannelList(query));
    }
    const { data } = await apiInstance.get<PageResponse<ChannelListItem>>(
      "/admin/connections/threads",
      { params: query }
    );
    return data;
  },

  /** 탭 배지 — 파라미터 없음 · 폴링 대상 */
  getSummary: async () => {
    if (threadMock()) {
      const { mockSummary } = await loadMock();
      return mockDelay(mockSummary());
    }
    const { data } = await apiInstance.get<ThreadSummary>(
      "/admin/connections/summary"
    );
    return data;
  },

  /** 헤더 · 접이식 정보 바 · 이슈 패널 · 쌍 헤더 */
  getInfo: async (threadId: number) => {
    if (threadMock()) {
      const { mockInfo } = await loadMock();
      return mockDelay(mockInfo(threadId));
    }
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
    if (threadMock()) {
      const { mockMessages } = await loadMock();
      return mockDelay(mockMessages(threadId));
    }
    const { data } = await apiInstance.get<MessageListResponse>(
      `/admin/threads/${threadId}/messages`,
      { params }
    );
    return data;
  },

  /** 201(새로 저장) · 200(같은 clientMessageId 재전송) 모두 성공이다 */
  sendMessage: async (threadId: number, request: SendMessageRequest) => {
    if (threadMock()) {
      const { mockSendMessage } = await loadMock();
      return mockDelay(mockSendMessage(threadId, request));
    }
    const { data } = await apiInstance.post<MessageItem>(
      `/admin/threads/${threadId}/messages`,
      request
    );
    return data;
  },

  /** 운영팀 공용 읽음 위치를 최신 메시지로 — 멱등 · 204 */
  markRead: async (threadId: number) => {
    if (threadMock()) {
      const { mockMarkRead } = await loadMock();
      mockMarkRead(threadId);
      return;
    }
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
    if (threadMock()) {
      const { mockResendNotice } = await loadMock();
      return mockDelay(mockResendNotice(threadId, messageId));
    }
    const { data } = await apiInstance.post<ResendNoticeResponse>(
      `/admin/threads/${threadId}/cards/${messageId}/resend-notice`
    );
    return data;
  },
};
