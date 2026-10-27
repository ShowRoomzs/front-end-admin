/*
  DEV 전용 목업 — 백엔드 배포 후 삭제.
  1021 운영팀 채널 카드(계약 취소 · 해지 동의 확인 · 해지 결과 · 직권 중단 사전 통지 · 정지 · 정지 해제)와
  목록 `appealUnconfirmed` · 정보 바 `sanction` · `progress.groupBuySuspensionScheduled`는 origin/main에 있지만
  개발 서버(api.showroomz.shop)에 아직 배포되지 않아 실서버로는 이 상태를 볼 수 없다.
  모양은 `AdminThreadDto` · `MessageCardResponse`(origin/main) 그대로, 값은 시안 ui-admin-20a rev.9(A5 · A6-0 · A6 · A7 · A8)를 따른다.
  시각은 서버처럼 이벤트 = UTC 벽시계, 기한(소명 · 집행 예정 · 정지 종료 · 이의 신청) = KST 벽시계로 둔다.
  전송 · 재발송 알림 · 읽음은 이 모듈 안의 상태를 바꾼다(새로고침하면 처음으로).
*/
import type { PageResponse } from "@/common/types/page";
import type {
  AttachmentSummary,
  ChannelInfo,
  ChannelListItem,
  ChannelListQuery,
  MessageCard,
  MessageItem,
  MessageListResponse,
  ResendNoticeResponse,
  SendMessageRequest,
  ThreadSummary,
} from "@/features/thread/types";
import dayjs, { type Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const OPERATOR = "김운영";

/** 오늘 기준 KST 시각 — `daysFromToday`가 음수면 과거 */
function kst(daysFromToday: number, hour: number, minute = 0, second = 0) {
  return dayjs()
    .add(daysFromToday, "day")
    .hour(hour)
    .minute(minute)
    .second(second)
    .millisecond(0);
}

/** 서버 이벤트 시각 형식(UTC 벽시계 · 시간대 표기 없음) */
function event(time: Dayjs) {
  return time.utc().format("YYYY-MM-DDTHH:mm:ss");
}

/** 서버 기한 형식(KST 벽시계 · 시간대 표기 없음) */
function wall(time: Dayjs) {
  return time.format("YYYY-MM-DDTHH:mm:ss");
}

let nextMessageId = 98000;

function text(
  createdAt: Dayjs,
  content: string,
  from: { senderType: "SELLER" | "CREATOR"; senderName: string } | "ADMIN",
  extra?: Partial<MessageItem>
): MessageItem {
  const isAdmin = from === "ADMIN";
  return {
    messageId: nextMessageId++,
    messageType: "TEXT",
    senderType: isAdmin ? "ADMIN" : from.senderType,
    mine: isAdmin,
    senderName: isAdmin ? null : from.senderName,
    operatorName: isAdmin ? OPERATOR : null,
    autoNotice: false,
    content,
    attachments: [],
    card: null,
    createdAt: event(createdAt),
    ...extra,
  };
}

function system(createdAt: Dayjs, card: MessageCard): MessageItem {
  return {
    messageId: nextMessageId++,
    messageType: "SYSTEM",
    senderType: "ADMIN",
    mine: false,
    senderName: null,
    operatorName: null,
    autoNotice: false,
    content: card.title,
    attachments: [],
    card,
    createdAt: event(createdAt),
  };
}

const MOOD = { senderType: "SELLER", senderName: "무드코스메틱" } as const;
const PURE = { senderType: "SELLER", senderName: "퓨어랩" } as const;
const GLOW = { senderType: "SELLER", senderName: "글로우랩" } as const;
const SOYEON = { senderType: "CREATOR", senderName: "뷰티_소연" } as const;
const JIMIN = { senderType: "CREATOR", senderName: "글로우_지민" } as const;

const SUSPENSION_NOTICE_BODY =
  "게시물 문구가 화장품법 표시 · 광고 기준을 벗어나 공구를 직권 중단할 예정입니다.";

/** 직권 중단 사전 통지(A8 ①) — 양측 채널에 같은 사실 · 채널마다 상대 당사자만 다르다 */
function suspensionNoticeCard(counterparty: {
  type: "SELLER" | "CREATOR";
  name: string;
}): MessageCard {
  return {
    cardType: "GROUP_BUY_SUSPENSION_NOTICE",
    title: "직권 중단 사전 통지 · 소명 요청",
    tone: "NEUTRAL",
    contractId: 29,
    contractNumber: "CTR-20260725-029",
    groupBuyTitle: "헤어 에센스 공구",
    detail: {
      requestedAt: event(kst(-3, 15, 0)),
      reasonLabel: "1호 법령 위반",
      processedByName: OPERATOR,
      notice: {
        kind: "ADMIN_SUSPENSION",
        body: SUSPENSION_NOTICE_BODY,
        groupBuyId: 129,
        groupBuyNumber: "GB-20260731-029",
        reasonClause: "ART17_1_LAW",
        reasonClauseLabel: "1호 법령 위반",
        executeScheduledAt: wall(kst(2, 10, 0)),
        appealDeadlineAt: wall(kst(1, 23, 59, 59)),
        counterpartyNoticed: true,
        counterpartyType: counterparty.type,
        counterpartyName: counterparty.name,
      },
    },
    action: null,
  };
}

function resendCard(
  requester: string,
  requestedAt: Dayjs,
  done: { at: Dayjs; noticeMessageId: number } | null
): MessageCard {
  return {
    cardType: "CONTRACT_RESEND_REQUEST",
    title: "요청 · 서명 안내 다시 받기",
    tone: done ? "NEUTRAL" : "WARNING",
    contractId: 41,
    contractNumber: "CTR-20260813-041",
    groupBuyTitle: "겨울 리페어 크림 공구",
    detail: {
      requesterType: "CREATOR",
      requesterName: requester,
      requestedAt: event(requestedAt),
    },
    action: {
      type: "RESEND_NOTICE",
      state: done ? "DONE" : "PENDING",
      canExecute: !done,
      doneAt: done ? event(done.at) : null,
      doneByName: done ? OPERATOR : null,
      noticeMessageId: done?.noticeMessageId ?? null,
      resultLabel: null,
      respondable: false,
    },
  };
}

const RESEND_NOTICE_TEXT =
  "모두싸인에서 서명 안내를 다시 보내드렸습니다. 메일함(스팸함 포함)을 확인해 주세요.";

const MOOD_APPEAL_FILE: AttachmentSummary = {
  attachmentId: 97001,
  status: "UPLOADED",
  attachmentType: "DOCUMENT",
  fileUrl: null,
  originalName: "배송지연_경위서_무드코스메틱.pdf",
  extension: "pdf",
  sizeBytes: 412 * 1024,
  durationSeconds: null,
  sortOrder: 1,
};

interface MockThread {
  item: ChannelListItem;
  info: ChannelInfo;
  /** 오래된 것부터 */
  messages: Array<MessageItem>;
}

function channel(
  base: Pick<
    ChannelListItem,
    "threadId" | "tab" | "name" | "memberNo" | "memberId"
  > &
    Partial<ChannelListItem>
): ChannelListItem {
  return {
    imageUrl: null,
    managerName: null,
    businessType: null,
    memberStatus: "ACTIVE",
    lastMessagePreview: null,
    lastMessageByOperator: false,
    lastMessageAt: null,
    unreadCount: 0,
    writable: true,
    appealUnconfirmed: false,
    issue: null,
    ...base,
  };
}

function info(
  item: ChannelListItem,
  rest: Pick<ChannelInfo, "profile" | "progress"> & Partial<ChannelInfo>
): ChannelInfo {
  return {
    threadId: item.threadId,
    tab: item.tab,
    name: item.name,
    imageUrl: item.imageUrl,
    memberNo: item.memberNo,
    memberId: item.memberId,
    memberStatus: item.memberStatus,
    writable: item.writable,
    sanction: null,
    openIssueThreads: [],
    issue: null,
    pair: null,
    ...rest,
  };
}

function brandProfile(manager: string, contact: string, joinedAt: string) {
  return {
    managerName: manager,
    managerContact: contact,
    businessType: null,
    taxType: null,
    businessEmail: null,
    instagramUrl: null,
    joinedAt,
  };
}

function creatorProfile(
  businessType: "BUSINESS" | "INDIVIDUAL",
  email: string,
  joinedAt: string
) {
  return {
    managerName: null,
    managerContact: null,
    businessType,
    taxType: null,
    businessEmail: email,
    instagramUrl: "https://www.instagram.com/",
    joinedAt,
  };
}

function buildThreads(): Array<MockThread> {
  const threads: Array<MockThread> = [];

  // ── A7 무드코스메틱 — 계정 이용 정지 · 소명 접수(소명 미확인 · 맨 위 고정) ──
  {
    const suspendedAt = kst(-2, 16, 30);
    const endsOn = kst(12, 0);
    const appealDeadline = kst(1, 23, 59, 59);
    const item = channel({
      threadId: 9001,
      tab: "BRAND",
      name: "무드코스메틱",
      memberNo: "BRD-1017",
      memberId: 1017,
      managerName: "이현",
      memberStatus: "SUSPENDED",
      unreadCount: 2,
      appealUnconfirmed: true,
    });
    threads.push({
      item,
      info: info(item, {
        profile: brandProfile("이현", "010-4827-2231", "2026-03-04T10:00:00"),
        progress: {
          contractSigning: 1,
          contractConcluded: 2,
          groupBuyOngoing: 1,
          groupBuyEnded: null,
          groupBuySuspensionScheduled: 0,
          unsettledCount: 1,
          connectedBrandCount: null,
        },
        sanction: {
          reasonCode: "REPEATED_SHIPPING_DELAY",
          reasonLabel: "배송 지연 반복",
          reasonDetail: null,
          suspendedAt: event(suspendedAt),
          endsOn: endsOn.format("YYYY-MM-DD"),
          appealDeadlineAt: wall(appealDeadline),
        },
      }),
      messages: [
        system(suspendedAt, {
          cardType: "ACCOUNT_SUSPENDED",
          title: "계정 이용 정지",
          tone: "NEUTRAL",
          contractId: null,
          contractNumber: null,
          groupBuyTitle: null,
          detail: {
            reasonLabel: "배송 지연 반복",
            processedAt: event(suspendedAt),
            processedByName: OPERATOR,
            notifiedBothParties: true,
            sanction: {
              memberType: "BRAND",
              reasonCode: "REPEATED_SHIPPING_DELAY",
              reasonLabel: "배송 지연 반복",
              payoutHeld: false,
              endsOn: endsOn.format("YYYY-MM-DD"),
              autoReleaseAt: wall(endsOn.add(1, "day").hour(0)),
              periodDays: 15,
              appealDeadlineAt: wall(appealDeadline),
            },
          },
          action: null,
        }),
        text(
          kst(0, 14, 18),
          "9월 출고 지연은 물류센터 이전 때문이었습니다. 이전은 10월 2일에 끝났고, 이후 접수분은 모두 기한 안에 발송했습니다.",
          MOOD
        ),
        text(kst(0, 14, 20), "배송 지연 경위와 재발 방지안 첨부합니다.", MOOD, {
          attachments: [MOOD_APPEAL_FILE],
        }),
      ],
    });
  }

  // ── A8 ①(브랜드 쪽) 퓨어랩 — 직권 중단 사전 통지 · 상대 = 인플루언서(뷰티_소연) ──
  {
    const item = channel({
      threadId: 9002,
      tab: "BRAND",
      name: "퓨어랩",
      memberNo: "BRD-1008",
      memberId: 1008,
      managerName: "정우",
      unreadCount: 1,
    });
    threads.push({
      item,
      info: info(item, {
        profile: brandProfile("정우", "010-2231-7781", "2026-02-11T09:00:00"),
        progress: {
          contractSigning: 0,
          contractConcluded: 3,
          groupBuyOngoing: 1,
          groupBuyEnded: null,
          groupBuySuspensionScheduled: 1,
          unsettledCount: 0,
          connectedBrandCount: null,
        },
      }),
      messages: [
        system(
          kst(-3, 15, 0),
          suspensionNoticeCard({ type: "CREATOR", name: "뷰티_소연" })
        ),
        text(
          kst(-1, 11, 5),
          "문구는 오늘 안에 수정하겠습니다. 소명 자료는 공구 관리에서 제출할게요.",
          PURE
        ),
      ],
    });
  }

  // ── A5 글로우랩 — 계약 직권 취소 요청 → 처리 결과 카드 ──
  {
    const item = channel({
      threadId: 9003,
      tab: "BRAND",
      name: "글로우랩",
      memberNo: "BRD-1042",
      memberId: 1042,
      managerName: "박서진",
    });
    threads.push({
      item,
      info: info(item, {
        profile: brandProfile("박서진", "010-5521-0934", "2026-04-18T09:00:00"),
        progress: {
          contractSigning: 1,
          contractConcluded: 2,
          groupBuyOngoing: 1,
          groupBuyEnded: null,
          groupBuySuspensionScheduled: 0,
          unsettledCount: 1,
          connectedBrandCount: null,
        },
      }),
      messages: [
        text(
          kst(0, 10, 5),
          "여름 수분 세럼 공구 계약(CTR-20260813-034) 취소 요청드립니다. 인플루언서와 공구 기간을 다시 협의해야 해서요. 브랜드 서명은 이미 했습니다.",
          GLOW
        ),
        text(
          kst(0, 10, 12),
          "확인했습니다. 인플루언서 측도 같은 의견인지 먼저 확인한 뒤 처리하겠습니다.",
          "ADMIN"
        ),
        text(
          kst(0, 10, 20),
          "네, 소연 님과는 1:1 스레드에서 이미 얘기 나눴습니다.",
          GLOW
        ),
        system(kst(0, 10, 40), {
          cardType: "CONTRACT_ADMIN_CANCELED",
          title: "계약 직권 취소 처리됨",
          tone: "NEUTRAL",
          contractId: 34,
          contractNumber: "CTR-20260813-034",
          groupBuyTitle: "여름 수분 세럼 공구",
          detail: {
            reasonLabel: "당사자 요청 — 조건 재협의",
            processedAt: event(kst(0, 10, 40)),
            processedByName: OPERATOR,
            notifiedBothParties: true,
          },
          action: null,
        }),
        text(
          kst(0, 10, 41),
          "취소 처리했습니다. 조건 정리 후 새 계약으로 진행해 주세요.",
          "ADMIN"
        ),
      ],
    });
  }

  // ── 벨라코스 — 옛 정지 카드(사유 한 줄) → 정지 해제(기간 종료 · 시스템) → 계약 해지 결과 ──
  {
    const item = channel({
      threadId: 9004,
      tab: "BRAND",
      name: "벨라코스",
      memberNo: "BRD-1033",
      memberId: 1033,
      managerName: "한예진",
    });
    threads.push({
      item,
      info: info(item, {
        profile: brandProfile("한예진", "010-3392-1180", "2026-01-20T09:00:00"),
        progress: {
          contractSigning: 0,
          contractConcluded: 1,
          groupBuyOngoing: 0,
          groupBuyEnded: null,
          groupBuySuspensionScheduled: 0,
          unsettledCount: 0,
          connectedBrandCount: null,
        },
      }),
      messages: [
        system(kst(-20, 11, 0), {
          cardType: "ACCOUNT_SUSPENDED",
          title: "계정 이용 정지",
          tone: "NEUTRAL",
          contractId: null,
          contractNumber: null,
          groupBuyTitle: null,
          detail: {
            reasonLabel: "정산 정보 불일치 — 계좌 예금주 불일치",
            processedAt: event(kst(-20, 11, 0)),
            processedByName: OPERATOR,
            notifiedBothParties: true,
          },
          action: null,
        }),
        system(kst(-6, 0, 5), {
          cardType: "ACCOUNT_SUSPENSION_RELEASED",
          title: "정지 해제",
          tone: "NEUTRAL",
          contractId: null,
          contractNumber: null,
          groupBuyTitle: null,
          detail: {
            reasonLabel: "정지 기간 종료",
            processedAt: event(kst(-6, 0, 5)),
            notifiedBothParties: true,
            sanction: {
              memberType: "BRAND",
              reasonCode: "TERM_ENDED",
              reasonLabel: "정지 기간 종료",
            },
          },
          action: null,
        }),
        system(kst(-1, 15, 20), {
          cardType: "CONTRACT_TERMINATED",
          title: "계약 해지 처리됨",
          tone: "NEUTRAL",
          contractId: 52,
          contractNumber: "CTR-20260901-052",
          groupBuyTitle: "가을 립 틴트 공구",
          detail: {
            reasonLabel: "당사자 요청",
            processedAt: event(kst(-1, 15, 20)),
            processedByName: OPERATOR,
            notice: {
              kind: "TERMINATE",
              body: "양측 동의로 공구 오픈 전에 계약을 해지합니다.",
              groupBuyClosed: true,
              groupBuyId: 152,
            },
          },
          action: null,
        }),
      ],
    });
  }

  // ── A8 뷰티_소연 — 직권 중단 사전 통지(상대 = 브랜드 퓨어랩) + 계약 취소 동의 확인 → 동의 답글 ──
  {
    const item = channel({
      threadId: 9101,
      tab: "INFLUENCER",
      name: "뷰티_소연",
      memberNo: "INF-3018",
      memberId: 3018,
      businessType: "BUSINESS",
      unreadCount: 1,
    });
    threads.push({
      item,
      info: info(item, {
        profile: creatorProfile(
          "BUSINESS",
          "sy.beauty@gmail.com",
          "2026-02-14T09:00:00"
        ),
        progress: {
          contractSigning: 1,
          contractConcluded: 1,
          groupBuyOngoing: 1,
          groupBuyEnded: 2,
          groupBuySuspensionScheduled: 1,
          unsettledCount: 0,
          connectedBrandCount: 3,
        },
      }),
      messages: [
        system(
          kst(-3, 15, 0),
          suspensionNoticeCard({ type: "SELLER", name: "퓨어랩" })
        ),
        system(kst(0, 9, 40), {
          cardType: "CONTRACT_CLOSE_CONSENT_REQUEST",
          title: "계약 취소 · 해지 동의 확인",
          tone: "NEUTRAL",
          contractId: 34,
          contractNumber: "CTR-20260813-034",
          groupBuyTitle: "여름 수분 세럼 공구",
          detail: {
            requesterType: "SELLER",
            requesterName: "무드코스메틱",
            requestedAt: event(kst(0, 9, 40)),
            reasonLabel: "조건 재협의 필요",
            processedByName: OPERATOR,
            notice: {
              kind: "CANCEL",
              body: "조건 재협의 필요",
              groupBuyId: 134,
            },
          },
          action: null,
        }),
        text(
          kst(0, 10, 12),
          "네, 브랜드 쪽 요청에 동의합니다. 기간 다시 맞춰서 새로 계약할게요.",
          SOYEON
        ),
      ],
    });
  }

  // ── A6-0 하린의 뷰티랩 — 서명 안내 재발송 요청(처리 전) ──
  {
    const item = channel({
      threadId: 9102,
      tab: "INFLUENCER",
      name: "하린의 뷰티랩",
      memberNo: "INF-3014",
      memberId: 3014,
      businessType: "INDIVIDUAL",
      unreadCount: 1,
    });
    threads.push({
      item,
      info: info(item, {
        profile: creatorProfile(
          "INDIVIDUAL",
          "harin.lab@gmail.com",
          "2026-03-02T09:00:00"
        ),
        progress: {
          contractSigning: 1,
          contractConcluded: 0,
          groupBuyOngoing: 0,
          groupBuyEnded: 0,
          groupBuySuspensionScheduled: 0,
          unsettledCount: 0,
          connectedBrandCount: 1,
        },
      }),
      messages: [
        system(kst(0, 8, 50), resendCard("하린의 뷰티랩", kst(0, 8, 50), null)),
      ],
    });
  }

  // ── A6 글로우_지민 — 재발송 완료 알림 전송 후 ──
  {
    // 카드(다음 id) 바로 뒤에 붙는 자동 안내 말풍선의 id
    const noticeId = nextMessageId + 1;
    const item = channel({
      threadId: 9103,
      tab: "INFLUENCER",
      name: "글로우_지민",
      memberNo: "INF-3009",
      memberId: 3009,
      businessType: "BUSINESS",
    });
    threads.push({
      item,
      info: info(item, {
        profile: creatorProfile(
          "BUSINESS",
          "jimin.glow@gmail.com",
          "2026-02-14T09:00:00"
        ),
        progress: {
          contractSigning: 1,
          contractConcluded: 3,
          groupBuyOngoing: 0,
          groupBuyEnded: 3,
          groupBuySuspensionScheduled: 0,
          unsettledCount: 0,
          connectedBrandCount: 3,
        },
      }),
      messages: [
        system(
          kst(0, 8, 50),
          resendCard("글로우_지민", kst(0, 8, 50), {
            at: kst(0, 8, 55),
            noticeMessageId: noticeId,
          })
        ),
        text(kst(0, 8, 55), RESEND_NOTICE_TEXT, "ADMIN", { autoNotice: true }),
        text(
          kst(0, 9, 2),
          "메일 받았어요! 스팸함에 있었네요. 감사합니다.",
          JIMIN
        ),
        text(
          kst(0, 9, 4),
          "다행입니다. 서명 기한을 꼭 확인해 주세요.",
          "ADMIN"
        ),
      ],
    });
  }

  // ── 민재 셀렉트 — 계약 해지 동의 확인(브랜드 요청 · 사유 라벨 + 요청 메모) ──
  {
    const item = channel({
      threadId: 9104,
      tab: "INFLUENCER",
      name: "민재 셀렉트",
      memberNo: "INF-3031",
      memberId: 3031,
      businessType: "INDIVIDUAL",
    });
    threads.push({
      item,
      info: info(item, {
        profile: creatorProfile(
          "INDIVIDUAL",
          "minjae.select@gmail.com",
          "2026-05-09T09:00:00"
        ),
        progress: {
          contractSigning: 0,
          contractConcluded: 1,
          groupBuyOngoing: 0,
          groupBuyEnded: 1,
          groupBuySuspensionScheduled: 0,
          unsettledCount: 0,
          connectedBrandCount: 1,
        },
      }),
      messages: [
        system(kst(-1, 17, 30), {
          cardType: "CONTRACT_CLOSE_CONSENT_REQUEST",
          title: "계약 취소 · 해지 동의 확인",
          tone: "NEUTRAL",
          contractId: 61,
          contractNumber: "CTR-20260920-061",
          groupBuyTitle: "데일리 선크림 공구",
          detail: {
            requesterType: "SELLER",
            requesterName: "글로우랩",
            requestedAt: event(kst(-1, 17, 30)),
            reasonLabel: "공구 일정 변경",
            notice: {
              kind: "TERMINATE",
              body: "공구 시작 전 재고 확보가 어려워졌습니다.",
              groupBuyId: 161,
            },
          },
          action: null,
        }),
      ],
    });
  }

  // 목록 미리보기 · 마지막 시각을 마지막 메시지에서 맞춘다
  threads.forEach(syncPreview);
  return threads;
}

function syncPreview(thread: MockThread) {
  const last = thread.messages.at(-1);
  if (!last) {
    return;
  }
  thread.item.lastMessageAt = last.createdAt;
  thread.item.lastMessageByOperator = last.senderType === "ADMIN";
  thread.item.lastMessagePreview =
    last.card?.title ??
    last.content ??
    (last.attachments.length ? "파일" : null);
}

let store: Array<MockThread> | null = null;

function threads() {
  store ??= buildThreads();
  return store;
}

function requireThread(threadId: number) {
  const thread = threads().find((entry) => entry.item.threadId === threadId);
  if (!thread) {
    throw new Error(`목업에 없는 스레드입니다(${threadId}).`);
  }
  return thread;
}

export function mockChannelList(
  query: ChannelListQuery
): PageResponse<ChannelListItem> {
  const keyword = query.keyword?.trim().toLowerCase();
  const content =
    query.tab === "ISSUE"
      ? []
      : threads()
          .map((entry) => entry.item)
          .filter((item) => item.tab === query.tab)
          .filter(
            (item) =>
              !keyword ||
              item.name.toLowerCase().includes(keyword) ||
              item.memberNo?.toLowerCase() === keyword
          )
          // 서버와 같은 정렬 — 소명 미확인 맨 위, 그 안팎은 최근 메시지순
          .sort(
            (a, b) =>
              Number(b.appealUnconfirmed) - Number(a.appealUnconfirmed) ||
              (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? "")
          );
  return {
    content,
    pageInfo: {
      currentPage: 1,
      totalPages: 1,
      totalResults: content.length,
      limit: query.size,
      hasNext: false,
    },
  };
}

export function mockSummary(): ThreadSummary {
  const tabSummary = (tab: "BRAND" | "INFLUENCER") => {
    const inTab = threads().filter((entry) => entry.item.tab === tab);
    return {
      unreadCount: inTab.reduce(
        (sum, entry) => sum + entry.item.unreadCount,
        0
      ),
      pendingCardCount: inTab.reduce(
        (sum, entry) =>
          sum +
          entry.messages.filter(
            (message) =>
              message.card?.cardType === "CONTRACT_RESEND_REQUEST" &&
              message.card.action?.state === "PENDING"
          ).length,
        0
      ),
    };
  };
  return {
    brand: tabSummary("BRAND"),
    influencer: tabSummary("INFLUENCER"),
    issue: {
      unreadCount: 0,
      pendingCardCount: 0,
      openCount: 0,
      closedCount: 0,
    },
  };
}

export function mockInfo(threadId: number): ChannelInfo {
  const thread = requireThread(threadId);
  return { ...thread.info, memberStatus: thread.item.memberStatus };
}

export function mockMessages(threadId: number): MessageListResponse {
  return {
    content: [...requireThread(threadId).messages].reverse(),
    nextCursor: null,
    hasNext: false,
  };
}

export function mockSendMessage(
  threadId: number,
  request: SendMessageRequest
): MessageItem {
  const thread = requireThread(threadId);
  const message = text(dayjs(), request.content ?? "", "ADMIN");
  thread.messages.push(message);
  syncPreview(thread);
  return message;
}

/** 운영팀 공용 읽음 — 안 읽은 수와 「소명 미확인」 고정이 함께 풀린다 */
export function mockMarkRead(threadId: number) {
  const thread = requireThread(threadId);
  thread.item.unreadCount = 0;
  thread.item.appealUnconfirmed = false;
}

/** A6-0 → A6 — 카드가 「전송됨 · 시각 · 처리자」로 굳고 자동 안내 말풍선이 붙는다 */
export function mockResendNotice(
  threadId: number,
  messageId: number
): ResendNoticeResponse {
  const thread = requireThread(threadId);
  const index = thread.messages.findIndex(
    (message) => message.messageId === messageId
  );
  const target = thread.messages[index];
  if (!target?.card?.action) {
    throw new Error(`목업에 없는 카드입니다(${messageId}).`);
  }
  if (target.card.action.state === "DONE") {
    return { alreadyNotified: true, card: target, notice: null };
  }
  const now = dayjs();
  const notice = text(now, RESEND_NOTICE_TEXT, "ADMIN", { autoNotice: true });
  const card: MessageItem = {
    ...target,
    card: {
      ...target.card,
      tone: "NEUTRAL",
      action: {
        ...target.card.action,
        state: "DONE",
        canExecute: false,
        doneAt: event(now),
        doneByName: OPERATOR,
        noticeMessageId: notice.messageId,
      },
    },
  };
  thread.messages[index] = card;
  thread.messages.push(notice);
  syncPreview(thread);
  return { alreadyNotified: false, card, notice };
}
