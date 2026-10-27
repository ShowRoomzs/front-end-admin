/*
  13 소비자 상세 DEV 목업 — 개발 서버(`pnpm dev`) 전용. 서비스가 `DEV_MOCK_ENABLED` 가드 뒤에서
  동적 import()로만 불러 배포 번들에 들어가지 않는다. **백엔드(origin/main) 배포 후 삭제**
  (약관 동의 내역만은 서버 API가 생길 때까지 남는다).

  모양은 `UserAdminControllerDocs` 예시 · `AdminUserDto`를 그대로 따른다. 개인정보는 전부 가짜 값이다.
  날짜 문자열은 서버처럼 UTC 벽시계(시안 KST − 9시간)로 둔다 — 화면은 `parseServerDateTime`으로 읽는다.
  정지 기간 · 기한(term)만 KST 벽시계다.

  해제 · 잠금 · 정지 · 해제 · 메모 기입/수정/삭제는 모듈 안 상태를 바꿔 실제 흐름처럼 돌아간다.
*/
import type {
  ConsumerDetail,
  ConsumerHistoryItem,
  ConsumerMemo,
  ConsumerReasonOptions,
  ConsumerStatusResult,
  ConsumerSuspendRequest,
  ConsumerTermsAgreement,
  UserPrivacyAccessReason,
  UserReleaseReason,
} from "@/features/consumer/types/consumerDetail";
import dayjs from "dayjs";

const OPERATOR = "김운영";

const SUSPENSION_LABELS = {
  ABUSIVE_LANGUAGE: "욕설·비방",
  RETURN_ABUSE: "반품 남용",
  FRAUDULENT_ORDER_SUSPECTED: "부정 주문 의심",
  PAYMENT_FRAUD_SUSPECTED: "결제 도용 의심",
  MULTIPLE_REPORTS: "신고 다수 접수",
  OTHER: "기타(직접 입력)",
} as const;

const RELEASE_LABELS: Record<UserReleaseReason, string> = {
  RESOLVED: "소명 확인 완료",
  MISTAKE: "오처리 정정",
  TERM_ENDED: "제재 기간 종료",
};

const UNMASK_LABELS: Record<UserPrivacyAccessReason, string> = {
  CS_RESPONSE: "CS 응대",
  DELIVERY_ACCIDENT: "배송 사고",
  PAYMENT_RETURN_DISPUTE: "결제·반품 분쟁",
  INVESTIGATION_COOPERATION: "수사기관 협조",
};

/** 지금 시각을 서버처럼 UTC 벽시계 문자열로 */
function utcNow() {
  return dayjs()
    .subtract(dayjs().utcOffset(), "minute")
    .format("YYYY-MM-DDTHH:mm:ss");
}

/** 오늘(KST)부터 영업일(주말만 건너뜀) n일 뒤 23:59:59 — 목업용 근사 */
function businessDaysLater(n: number) {
  let day = dayjs();
  let left = n;
  while (left > 0) {
    day = day.add(1, "day");
    if (day.day() !== 0 && day.day() !== 6) left -= 1;
  }
  return `${day.format("YYYY-MM-DD")}T23:59:59`;
}

export function mockReasonOptions(): ConsumerReasonOptions {
  return {
    suspensionReasons: (
      Object.keys(SUSPENSION_LABELS) as Array<keyof typeof SUSPENSION_LABELS>
    ).map((code) => ({
      code,
      label: SUSPENSION_LABELS[code],
      detailRequired: code === "OTHER",
      holdsPayout: null,
    })),
    releaseReasons: (
      Object.keys(RELEASE_LABELS) as Array<UserReleaseReason>
    ).map((code) => ({
      code,
      label: RELEASE_LABELS[code],
      detailRequired: false,
      holdsPayout: null,
    })),
    privacyUnmaskReasons: (
      Object.keys(UNMASK_LABELS) as Array<UserPrivacyAccessReason>
    ).map((code) => ({
      code,
      label: UNMASK_LABELS[code],
      detailRequired: false,
      holdsPayout: null,
    })),
    suspensionTerm: {
      appealBusinessDays: 3,
      appealDeadlineAt: businessDaysLater(3),
      appealReviewBusinessDays: null,
    },
  };
}

// ── 시나리오별 원본 ───────────────────────────────────────────────

type Persona = "active" | "suspended" | "withdrawn";

interface MockState {
  detail: ConsumerDetail;
  /** 실값(해제 시 보여 줄 가짜 원문) */
  plain: { name: string; birthday: string; age: number; phone: string };
  /** 해제 세션 만료 시각(ms) — 없으면 마스킹 */
  unmaskUntil: number | null;
  unmaskedAt: string | null;
  lastReason: UserPrivacyAccessReason | null;
  memos: Array<ConsumerMemo>;
  histories: Array<ConsumerHistoryItem>;
  nextId: number;
}

const stores = new Map<string, MockState>();

function history(
  partial: Partial<ConsumerHistoryItem> &
    Pick<ConsumerHistoryItem, "eventType" | "label" | "tone" | "occurredAt">
): ConsumerHistoryItem {
  return {
    historyId: null,
    detail: null,
    actorType: "ADMIN",
    actorName: OPERATOR,
    refType: null,
    refId: null,
    ...partial,
  };
}

function order(
  orderId: number,
  orderNumber: string,
  product: string,
  brand: string,
  amount: number,
  paidAt: string,
  claimLabel: string | null
): ConsumerDetail["recentOrders"]["content"][number] {
  return {
    orderId,
    orderNumber,
    paidAt,
    totalAmount: amount,
    groups: [
      {
        deliveryGroupId: orderId * 10,
        subOrderNumber: `${orderNumber}-01`,
        brandName: brand,
        status: "CONFIRMED",
        statusLabel: "배송완료",
        statusTone: "SUCCESS",
        itemSummary: product,
        claim: claimLabel
          ? {
              claimId: orderId * 100,
              claimNumber: `CLM-${orderId}`,
              result: "DONE",
              label: claimLabel,
              count: 1,
            }
          : null,
      },
    ],
  };
}

function activePersona(userId: number): MockState {
  const detail: ConsumerDetail = {
    userId,
    memberNo: "CST-88231",
    navigation: { previousId: userId - 1, nextId: userId + 1 },
    nickname: "홍길동",
    providerType: "KAKAO",
    status: "NORMAL",
    birthday: "1990.**.**",
    gender: "FEMALE",
    defaultAddress: "서울특별시 마포구",
    createdAt: "2026-02-01T01:20:00",
    lastLoginAt: "2026-08-14T00:41:00",
    lastLoginDevice: "IPHONE",
    notification: {
      destroyed: false,
      appPushOn: true,
      deviceRegistered: true,
      toggles: [
        {
          toggle: "FOLLOW_GROUP_BUY",
          label: "팔로우 쇼룸 새 공구",
          on: true,
          agreedAt: "2026-02-01T01:23:00",
        },
        {
          toggle: "FOLLOW_POST",
          label: "팔로우 쇼룸 새 게시물",
          on: false,
          agreedAt: null,
        },
        {
          toggle: "GROUP_BUY_ENDING",
          label: "공구 마감 임박",
          on: false,
          agreedAt: null,
        },
        {
          toggle: "BENEFIT",
          label: "혜택 · 이벤트",
          on: true,
          agreedAt: "2026-02-01T01:23:00",
        },
      ],
      marketingAgree: true,
      marketingAgreeChangedAt: "2026-02-01T01:23:00",
    },
    identity: {
      destroyed: false,
      unmasked: false,
      name: "홍*동",
      birthday: "1990.**.**",
      age: null,
      gender: "FEMALE",
      genderLabel: "여성",
      nationality: null,
      phone: "010-****-1234",
      carrier: null,
      firstVerifiedAt: "2026-02-01T01:22:00",
      renewedAt: null,
    },
    unmask: {
      allowed: true,
      unmasked: false,
      operatorName: null,
      unmaskedAt: null,
      expiresAt: null,
      remainingSeconds: null,
      lastReason: null,
    },
    marketingAgree: true,
    profileImageUrl: null,
    statusCard: {
      status: "NORMAL",
      sanction: null,
      withdrawal: null,
      actions: { canSuspend: true, canRelease: false },
    },
    memos: { total: 0, content: [] },
    histories: { total: 0, content: [] },
    totalPurchaseAmount: 842000,
    thisMonthPurchaseAmount: 68000,
    totalOrderCount: 14,
    thisMonthOrderCount: 1,
    averageOrderAmount: 60142,
    lastOrderDate: "2026-08-12T02:10:00",
    productWishlistCount: 128,
    followedShowroomCount: 9,
    writtenReviewCount: 7,
    inquiryCount: 3,
    recentOrders: {
      total: 14,
      content: [
        order(
          1184,
          "ORD-20260812-1184",
          "글로우 세럼 앰플 30ml",
          "글로우랩",
          68000,
          "2026-08-12T02:10:00",
          null
        ),
        order(
          977,
          "ORD-20260731-0977",
          "라이스 브라이트닝 크림 50ml",
          "무드코스메틱",
          52000,
          "2026-07-31T03:00:00",
          "반품완료"
        ),
        order(
          812,
          "ORD-20260714-0812",
          "수분 진정 토너 200ml",
          "글로우랩",
          34000,
          "2026-07-14T05:30:00",
          null
        ),
        order(
          655,
          "ORD-20260702-0655",
          "데일리 선쿠션 SPF50+",
          "무드코스메틱",
          41000,
          "2026-07-02T06:00:00",
          "교환완료"
        ),
        order(
          511,
          "ORD-20260620-0511",
          "클렌징 오일 150ml",
          "퓨어랩",
          29000,
          "2026-06-20T07:12:00",
          null
        ),
      ],
    },
    recentInquiries: {
      total: 3,
      content: [
        {
          kind: "ONE_TO_ONE",
          kindLabel: "1:1",
          inquiryId: 41,
          inquiryNumber: "INQ-20260813-041",
          typeLabel: "배송",
          title: "세럼 배송이 언제 오나요?",
          status: "WAITING",
          statusLabel: "답변 대기",
          createdAt: "2026-08-13T02:00:00",
        },
        {
          kind: "PRODUCT",
          kindLabel: "상품",
          inquiryId: 118,
          inquiryNumber: "QNA-20260722-118",
          typeLabel: "사용법",
          title: "토너를 화장솜 없이 써도 되나요?",
          status: "ANSWERED",
          statusLabel: "답변 완료",
          createdAt: "2026-07-22T03:00:00",
        },
        {
          kind: "ONE_TO_ONE",
          kindLabel: "1:1",
          inquiryId: 9,
          inquiryNumber: "INQ-20260801-009",
          typeLabel: "반품·교환",
          title: "크림 반품 회수가 안 와요",
          status: "ANSWERED",
          statusLabel: "답변 완료",
          createdAt: "2026-08-01T04:00:00",
        },
      ],
    },
    addresses: {
      destroyed: false,
      total: 3,
      content: [
        {
          addressId: 5,
          defaultAddress: true,
          address: "서울특별시 마포구",
          detailAddress: null,
          zipCode: null,
          recipientName: "홍*동",
          phoneNumber: "010-****-1234",
          lastUsedOrderAt: null,
        },
        {
          addressId: 6,
          defaultAddress: false,
          address: "서울특별시 강남구",
          detailAddress: null,
          zipCode: null,
          recipientName: "홍*동",
          phoneNumber: "010-****-1234",
          lastUsedOrderAt: null,
        },
        {
          addressId: 7,
          defaultAddress: false,
          address: "경기도 고양시 일산동구",
          detailAddress: null,
          zipCode: null,
          recipientName: "김*순",
          phoneNumber: "010-****-7788",
          lastUsedOrderAt: null,
        },
      ],
    },
    pendingChips: [
      {
        key: "OPEN_INQUIRY",
        label: "열린 문의",
        tone: "WARNING",
        count: 1,
        target: "INQUIRIES",
        links: [
          {
            target: "INQUIRIES",
            query: { status: "WAITING", userId: String(userId) },
            count: 1,
          },
        ],
      },
      {
        key: "SHIPPING",
        label: "배송중",
        tone: "NEUTRAL",
        count: 1,
        target: "ORDERS",
        links: [
          {
            target: "ORDERS",
            query: { status: "SHIPPING", userId: String(userId) },
            count: 1,
          },
        ],
      },
    ],
    judgement: {
      orderCount: 14,
      purchaseAmount: 842000,
      claimOrderCount: 2,
      claimRate: 14.3,
      sanctions: { count: 0, last: null },
      sinceJoined: { months: 6, days: 13, totalDays: 196 },
    },
  };

  return {
    detail,
    plain: {
      name: "홍길동",
      birthday: "1990.03.17",
      age: 36,
      phone: "010-2841-1234",
    },
    unmaskUntil: null,
    unmaskedAt: null,
    lastReason: null,
    memos: [
      {
        memoId: 2,
        authorName: OPERATOR,
        content:
          "반품 2건 모두 단순 변심. 반복 패턴은 아니라 조치하지 않고 기록만 남깁니다.",
        createdAt: "2026-08-14T01:20:00",
        modifiedAt: null,
        editable: true,
      },
      {
        memoId: 1,
        authorName: "이지원",
        content: "배송 지연 관련 문의 시 응대 태도 정중함. 특이사항 없음.",
        createdAt: "2026-06-02T06:41:00",
        modifiedAt: null,
        editable: false,
      },
    ],
    histories: [
      history({
        historyId: 3,
        eventType: "MEMO_CREATED",
        label: "관리자 메모 기입",
        tone: "NEUTRAL",
        refType: "MEMO",
        refId: 2,
        occurredAt: "2026-08-14T01:20:00",
      }),
      history({
        eventType: "SIGNED_UP",
        label: "가입",
        tone: "NEUTRAL",
        actorType: "CONSUMER",
        actorName: "소비자 본인",
        occurredAt: "2026-02-01T01:20:00",
      }),
    ],
    nextId: 100,
  };
}

function suspendedPersona(userId: number): MockState {
  const base = activePersona(userId);
  const detail: ConsumerDetail = {
    ...base.detail,
    memberNo: "CST-88164",
    nickname: "서준맘",
    status: "SUSPENDED",
    gender: "MALE",
    createdAt: "2025-12-14T10:38:00",
    lastLoginAt: "2026-08-01T13:07:00",
    lastLoginDevice: "ANDROID",
    notification: {
      destroyed: false,
      appPushOn: false,
      deviceRegistered: false,
      toggles: base.detail.notification.toggles.map((toggle) => ({
        ...toggle,
        on: false,
        agreedAt: null,
      })),
      marketingAgree: false,
      marketingAgreeChangedAt: null,
    },
    identity: {
      ...base.detail.identity,
      name: "한*준",
      birthday: "1988.**.**",
      gender: "MALE",
      genderLabel: "남성",
      phone: "010-****-5590",
      firstVerifiedAt: "2025-12-14T10:40:00",
    },
    marketingAgree: false,
    statusCard: {
      status: "SUSPENDED",
      sanction: {
        sanctionId: 17,
        reason: "RETURN_ABUSE",
        reasonLabel: "반품 남용",
        reasonDetail:
          "최근 3개월 반품 5건 중 4건이 단순 변심이며, 응대 과정에서 무상 회수를 반복 요구했습니다.",
        suspendedAt: "2026-08-02T06:10:00",
        suspendedByName: OPERATOR,
        appealInquiries: [
          {
            inquiryId: 27,
            inquiryNumber: "INQ-20260810-027",
            answered: true,
            createdAt: "2026-08-10T01:00:00",
          },
        ],
        term: {
          endsOn: "2026-08-31",
          autoReleaseAt: "2026-09-01T00:00:00",
          periodDays: 30,
          appealDeadlineAt: "2026-08-05T23:59:59",
          appealReviewBusinessDays: null,
        },
      },
      withdrawal: null,
      actions: { canSuspend: false, canRelease: true },
    },
    totalPurchaseAmount: 214000,
    totalOrderCount: 7,
    productWishlistCount: 46,
    followedShowroomCount: 4,
    inquiryCount: 11,
    recentOrders: {
      total: 7,
      content: [
        order(
          941,
          "ORD-20260728-0941",
          "비타민 C 앰플 20ml",
          "퓨어랩",
          44000,
          "2026-07-28T02:00:00",
          "반품완료"
        ),
        order(
          836,
          "ORD-20260715-0836",
          "수분 크림 80ml",
          "무드코스메틱",
          58000,
          "2026-07-15T02:00:00",
          "반품완료"
        ),
        order(
          702,
          "ORD-20260703-0702",
          "클렌징 폼 200ml",
          "글로우랩",
          22000,
          "2026-07-03T02:00:00",
          "교환완료"
        ),
        order(
          588,
          "ORD-20260621-0588",
          "선스틱 SPF50+",
          "퓨어랩",
          27000,
          "2026-06-21T02:00:00",
          "반품완료"
        ),
        order(
          433,
          "ORD-20260604-0433",
          "아이 크림 30ml",
          "무드코스메틱",
          63000,
          "2026-06-04T02:00:00",
          null
        ),
      ],
    },
    recentInquiries: {
      total: 11,
      content: [
        {
          kind: "ONE_TO_ONE",
          kindLabel: "1:1",
          inquiryId: 27,
          inquiryNumber: "INQ-20260810-027",
          typeLabel: "계정 이용 정지",
          title: "정지 사유를 확인하고 싶습니다",
          status: "ANSWERED",
          statusLabel: "답변 완료",
          createdAt: "2026-08-10T01:00:00",
        },
        {
          kind: "ONE_TO_ONE",
          kindLabel: "1:1",
          inquiryId: 118,
          inquiryNumber: "INQ-20260731-118",
          typeLabel: "반품·교환",
          title: "반품 왜 안 받아주나요",
          status: "ANSWERED",
          statusLabel: "답변 완료",
          createdAt: "2026-07-31T01:00:00",
        },
        {
          kind: "ONE_TO_ONE",
          kindLabel: "1:1",
          inquiryId: 44,
          inquiryNumber: "INQ-20260720-044",
          typeLabel: "기타",
          title: "상담원 응대가 불친절합니다",
          status: "ANSWERED",
          statusLabel: "답변 완료",
          createdAt: "2026-07-20T01:00:00",
        },
      ],
    },
    addresses: {
      destroyed: false,
      total: 2,
      content: [
        {
          addressId: 8,
          defaultAddress: true,
          address: "경기도 성남시 분당구",
          detailAddress: null,
          zipCode: null,
          recipientName: "한*준",
          phoneNumber: "010-****-5590",
          lastUsedOrderAt: null,
        },
        {
          addressId: 9,
          defaultAddress: false,
          address: "서울특별시 송파구",
          detailAddress: null,
          zipCode: null,
          recipientName: "한*준",
          phoneNumber: "010-****-5590",
          lastUsedOrderAt: null,
        },
      ],
    },
    pendingChips: [
      {
        key: "RETURN_EXCHANGE",
        label: "반품·교환",
        tone: "NEUTRAL",
        count: 1,
        target: "CLAIMS",
        links: [
          {
            target: "CLAIMS",
            query: { tab: "ALL", openOnly: "true", userId: String(userId) },
            count: 1,
          },
        ],
      },
    ],
    judgement: {
      orderCount: 7,
      purchaseAmount: 214000,
      claimOrderCount: 5,
      claimRate: 71.4,
      sanctions: {
        count: 2,
        last: {
          sanctionId: 9,
          reason: "RETURN_ABUSE",
          reasonLabel: "반품 남용",
          suspendedAt: "2026-05-03T02:00:00",
          releasedAt: "2026-05-20T02:00:00",
        },
      },
      sinceJoined: { months: 8, days: 0, totalDays: 243 },
    },
  };

  return {
    ...base,
    detail,
    plain: {
      name: "한서준",
      birthday: "1988.11.02",
      age: 37,
      phone: "010-7731-5590",
    },
    memos: [
      {
        memoId: 3,
        authorName: OPERATOR,
        content:
          "정지 후 이의 문의 없음. 반품 패턴 재발 여부를 9월까지 관찰합니다.",
        createdAt: "2026-08-14T00:30:00",
        modifiedAt: null,
        editable: true,
      },
      {
        memoId: 2,
        authorName: OPERATOR,
        content:
          "반품 4건째. 아직 정지 기준(6건)에 못 미쳐 조치하지 않고 관찰합니다.",
        createdAt: "2026-07-21T01:08:00",
        modifiedAt: "2026-07-21T02:00:00",
        editable: false,
      },
      {
        memoId: 1,
        authorName: "이지원",
        content: "무상 회수 요구 2회. 규정 안내 후 종료.",
        createdAt: "2026-06-18T05:22:00",
        modifiedAt: null,
        editable: false,
      },
    ],
    histories: [
      history({
        historyId: 9,
        eventType: "MEMO_CREATED",
        label: "관리자 메모 기입",
        tone: "NEUTRAL",
        refType: "MEMO",
        refId: 3,
        occurredAt: "2026-08-14T00:30:00",
      }),
      history({
        eventType: "APPEAL_RECEIVED",
        label: "정지 소명 문의 접수",
        tone: "NEUTRAL",
        actorType: "CONSUMER",
        actorName: "소비자 본인",
        refType: "INQUIRY",
        refId: 27,
        occurredAt: "2026-08-10T01:00:00",
      }),
      history({
        historyId: 8,
        eventType: "SUSPENDED",
        label: "계정 이용 정지",
        tone: "DANGER",
        detail: "반품 남용 — 최근 3개월 반품 5건 중 4건이 단순 변심",
        refType: "SANCTION",
        refId: 17,
        occurredAt: "2026-08-02T06:10:00",
      }),
      history({
        historyId: 5,
        eventType: "SUSPENSION_RELEASED",
        label: "정지 해제",
        tone: "INFO",
        detail: "소명 확인 완료",
        refType: "SANCTION",
        refId: 9,
        occurredAt: "2026-05-20T02:00:00",
      }),
      history({
        historyId: 4,
        eventType: "SUSPENDED",
        label: "계정 이용 정지",
        tone: "DANGER",
        detail: "반품 남용",
        refType: "SANCTION",
        refId: 9,
        occurredAt: "2026-05-03T02:00:00",
      }),
      history({
        eventType: "SIGNED_UP",
        label: "가입",
        tone: "NEUTRAL",
        actorType: "CONSUMER",
        actorName: "소비자 본인",
        occurredAt: "2025-12-14T10:38:00",
      }),
    ],
  };
}

function withdrawnPersona(userId: number): MockState {
  const base = activePersona(userId);
  const detail: ConsumerDetail = {
    ...base.detail,
    memberNo: "CST-88118",
    nickname: "도현",
    providerType: "NAVER",
    status: "WITHDRAWN",
    birthday: null,
    gender: null,
    defaultAddress: null,
    createdAt: "2025-11-09T05:02:00",
    lastLoginAt: null,
    lastLoginDevice: null,
    notification: {
      destroyed: true,
      appPushOn: null,
      deviceRegistered: null,
      toggles: [],
      marketingAgree: null,
      marketingAgreeChangedAt: null,
    },
    identity: {
      destroyed: true,
      unmasked: false,
      name: null,
      birthday: null,
      age: null,
      gender: null,
      genderLabel: null,
      nationality: null,
      phone: null,
      carrier: null,
      firstVerifiedAt: null,
      renewedAt: null,
    },
    unmask: { ...base.detail.unmask, allowed: false },
    marketingAgree: false,
    statusCard: {
      status: "WITHDRAWN",
      sanction: null,
      withdrawal: { withdrawnAt: "2026-07-19T11:02:00" },
      actions: { canSuspend: false, canRelease: false },
    },
    totalPurchaseAmount: 0,
    totalOrderCount: 0,
    inquiryCount: 1,
    recentOrders: { total: 0, content: [] },
    recentInquiries: {
      total: 1,
      content: [
        {
          kind: "ONE_TO_ONE",
          kindLabel: "1:1",
          inquiryId: 15,
          inquiryNumber: "INQ-20260702-015",
          typeLabel: "탈퇴",
          title: "탈퇴하면 주문 내역은 어떻게 되나요?",
          status: "ANSWERED",
          statusLabel: "답변 완료",
          createdAt: "2026-07-02T01:00:00",
        },
      ],
    },
    addresses: { destroyed: true, total: 0, content: [] },
    pendingChips: [],
    judgement: {
      orderCount: null,
      purchaseAmount: null,
      claimOrderCount: null,
      claimRate: null,
      sanctions: { count: 0, last: null },
      sinceJoined: { months: 8, days: 10, totalDays: 252 },
    },
  };

  return {
    ...base,
    detail,
    memos: [
      {
        memoId: 1,
        authorName: OPERATOR,
        content: "탈퇴 직전 결제 문의 1건. 환불 완료 확인했습니다.",
        createdAt: "2026-07-20T00:15:00",
        modifiedAt: null,
        editable: false,
      },
    ],
    histories: [
      history({
        historyId: 2,
        eventType: "MEMO_CREATED",
        label: "관리자 메모 기입",
        tone: "NEUTRAL",
        refType: "MEMO",
        refId: 1,
        occurredAt: "2026-07-20T00:15:00",
      }),
      history({
        eventType: "WITHDRAWN",
        label: "탈퇴",
        tone: "NEUTRAL",
        actorType: "CONSUMER",
        actorName: "소비자 본인",
        occurredAt: "2026-07-19T11:02:00",
      }),
      history({
        eventType: "SIGNED_UP",
        label: "가입",
        tone: "NEUTRAL",
        actorType: "CONSUMER",
        actorName: "소비자 본인",
        occurredAt: "2025-11-09T05:02:00",
      }),
    ],
  };
}

/**
 * 시나리오 → 시작 상태. 값 목록은 서비스 파일 상단 주석에 있다.
 * 같은 시나리오 · 같은 userId면 모듈 상태를 이어 쓴다(해제 · 메모 · 정지가 남는다).
 */
function stateFor(userId: number, scenario: string | null): MockState {
  const key = `${scenario ?? "active"}:${userId}`;
  const cached = stores.get(key);
  if (cached) return cached;

  const persona: Persona =
    scenario === "suspended"
      ? "suspended"
      : scenario === "withdrawn"
        ? "withdrawn"
        : "active";
  const state =
    persona === "suspended"
      ? suspendedPersona(userId)
      : persona === "withdrawn"
        ? withdrawnPersona(userId)
        : activePersona(userId);

  if (scenario === "unmasked" || scenario === "expiring") {
    // A2 · A3 — 이미 열린 세션(expiring은 8초 뒤 자동 잠김)
    state.unmaskUntil = Date.now() + (scenario === "expiring" ? 8 : 581) * 1000;
    state.unmaskedAt = utcNow();
    state.lastReason = "CS_RESPONSE";
    state.histories.unshift(
      history({
        historyId: 50,
        eventType: "PRIVACY_UNMASKED",
        label: "개인정보 열람 · 이름·생년월일·휴대폰",
        tone: "WARNING",
        detail: "CS 응대",
        refType: "PRIVACY_ACCESS",
        refId: 1,
        occurredAt: utcNow(),
      })
    );
  }
  if (scenario === "no-memo") {
    state.memos = [];
    state.histories = state.histories.filter(
      (item) => item.eventType === "SIGNED_UP"
    );
  }
  if (scenario === "no-permission") {
    state.detail.unmask = { ...state.detail.unmask, allowed: false };
  }
  if (scenario === "empty") {
    state.detail.recentOrders = { total: 0, content: [] };
    state.detail.recentInquiries = { total: 0, content: [] };
    state.detail.addresses = { destroyed: false, total: 0, content: [] };
    state.detail.pendingChips = [];
    state.detail.judgement = {
      ...state.detail.judgement,
      orderCount: 0,
      purchaseAmount: 0,
      claimOrderCount: 0,
      claimRate: null,
    };
  }

  stores.set(key, state);
  return state;
}

/** 지금 상태를 상세 응답으로 조립한다 — 해제 세션이 살아 있으면 실값 */
function compose(state: MockState): ConsumerDetail {
  const now = Date.now();
  if (state.unmaskUntil !== null && state.unmaskUntil <= now) {
    state.unmaskUntil = null;
  }
  const unmasked = state.unmaskUntil !== null;
  const { detail, plain } = state;
  const sortedHistories = state.histories;

  return {
    ...detail,
    identity: unmasked
      ? {
          ...detail.identity,
          unmasked: true,
          name: plain.name,
          birthday: plain.birthday,
          age: plain.age,
          phone: plain.phone,
        }
      : detail.identity,
    addresses: unmasked
      ? {
          ...detail.addresses,
          content: detail.addresses.content.map((address, index) => ({
            ...address,
            address: `${address.address} 월드컵로 ${12 + index}`,
            detailAddress: `${3 + index}층`,
            zipCode: `0392${5 + index}`,
            recipientName: index === 2 ? "김영순" : plain.name,
            phoneNumber: index === 2 ? "010-5512-7788" : plain.phone,
          })),
        }
      : detail.addresses,
    unmask: {
      ...detail.unmask,
      unmasked,
      operatorName: unmasked ? OPERATOR : null,
      unmaskedAt: unmasked ? state.unmaskedAt : null,
      expiresAt: unmasked
        ? dayjs(state.unmaskUntil ?? now)
            .subtract(dayjs().utcOffset(), "minute")
            .format("YYYY-MM-DDTHH:mm:ss")
        : null,
      remainingSeconds: unmasked
        ? Math.ceil(((state.unmaskUntil ?? now) - now) / 1000)
        : null,
      lastReason: state.lastReason,
    },
    memos: { total: state.memos.length, content: state.memos.slice(0, 3) },
    histories: {
      total: sortedHistories.length,
      content: sortedHistories.slice(0, 5),
    },
  };
}

// ── 어댑터 — 서비스가 부른다 ──────────────────────────────────────

export function mockGetDetail(userId: number, scenario: string | null) {
  return compose(stateFor(userId, scenario));
}

export function mockUnmask(
  userId: number,
  scenario: string | null,
  reason: UserPrivacyAccessReason
) {
  const state = stateFor(userId, scenario);
  if (scenario === "no-permission") {
    throw new Error("마스킹 해제 권한이 없습니다.");
  }
  if (state.unmaskUntil === null || state.unmaskUntil <= Date.now()) {
    state.unmaskUntil = Date.now() + 600 * 1000;
    state.unmaskedAt = utcNow();
    state.lastReason = reason;
    state.histories.unshift(
      history({
        historyId: state.nextId++,
        eventType: "PRIVACY_UNMASKED",
        label: "개인정보 열람 · 이름·생년월일·휴대폰",
        tone: "WARNING",
        detail: UNMASK_LABELS[reason],
        refType: "PRIVACY_ACCESS",
        refId: state.nextId,
        occurredAt: utcNow(),
      })
    );
  }
  return compose(state);
}

export function mockLock(userId: number, scenario: string | null) {
  stateFor(userId, scenario).unmaskUntil = null;
}

export function mockSuspend(
  userId: number,
  scenario: string | null,
  request: ConsumerSuspendRequest
): ConsumerStatusResult {
  const state = stateFor(userId, scenario);
  const label = SUSPENSION_LABELS[request.reason];
  const suspendedAt = utcNow();
  const sanctionId = state.nextId++;
  const endsOn = request.endsOn;
  state.detail.status = "SUSPENDED";
  state.detail.statusCard = {
    status: "SUSPENDED",
    sanction: {
      sanctionId,
      reason: request.reason,
      reasonLabel: label,
      reasonDetail: request.reasonDetail,
      suspendedAt,
      suspendedByName: OPERATOR,
      appealInquiries: [],
      term: {
        endsOn,
        autoReleaseAt: endsOn
          ? `${dayjs(endsOn).add(1, "day").format("YYYY-MM-DD")}T00:00:00`
          : null,
        periodDays: endsOn
          ? dayjs(endsOn).diff(dayjs().startOf("day"), "day") + 1
          : null,
        appealDeadlineAt: businessDaysLater(3),
        appealReviewBusinessDays: null,
      },
    },
    withdrawal: null,
    actions: { canSuspend: false, canRelease: true },
  };
  state.detail.judgement = {
    ...state.detail.judgement,
    sanctions: {
      ...state.detail.judgement.sanctions,
      count: state.detail.judgement.sanctions.count + 1,
    },
  };
  state.histories.unshift(
    history({
      historyId: state.nextId++,
      eventType: "SUSPENDED",
      label: "계정 이용 정지",
      tone: "DANGER",
      detail: request.reasonDetail
        ? `${label} — ${request.reasonDetail}`
        : label,
      refType: "SANCTION",
      refId: sanctionId,
      occurredAt: suspendedAt,
    })
  );
  const composed = compose(state);
  return { statusCard: composed.statusCard, histories: composed.histories };
}

export function mockRelease(
  userId: number,
  scenario: string | null,
  reason: UserReleaseReason
): ConsumerStatusResult {
  const state = stateFor(userId, scenario);
  const previous = state.detail.statusCard.sanction;
  const releasedAt = utcNow();
  state.detail.status = "NORMAL";
  state.detail.statusCard = {
    status: "NORMAL",
    sanction: null,
    withdrawal: null,
    actions: { canSuspend: true, canRelease: false },
  };
  if (previous) {
    state.detail.judgement = {
      ...state.detail.judgement,
      sanctions: {
        ...state.detail.judgement.sanctions,
        last: {
          sanctionId: previous.sanctionId,
          reason: previous.reason,
          reasonLabel: previous.reasonLabel,
          suspendedAt: previous.suspendedAt,
          releasedAt,
        },
      },
    };
  }
  state.histories.unshift(
    history({
      historyId: state.nextId++,
      eventType: "SUSPENSION_RELEASED",
      label: "정지 해제",
      tone: "INFO",
      detail: RELEASE_LABELS[reason],
      refType: "SANCTION",
      refId: previous?.sanctionId ?? null,
      occurredAt: releasedAt,
    })
  );
  const composed = compose(state);
  return { statusCard: composed.statusCard, histories: composed.histories };
}

export function mockGetMemos(userId: number, scenario: string | null) {
  const { memos } = stateFor(userId, scenario);
  return { total: memos.length, content: memos };
}

export function mockGetHistories(userId: number, scenario: string | null) {
  const { histories } = stateFor(userId, scenario);
  return { total: histories.length, page: 1, size: 100, content: histories };
}

export function mockCreateMemo(
  userId: number,
  scenario: string | null,
  content: string
): ConsumerMemo {
  const state = stateFor(userId, scenario);
  const memo: ConsumerMemo = {
    memoId: state.nextId++,
    authorName: OPERATOR,
    content,
    createdAt: utcNow(),
    modifiedAt: null,
    editable: true,
  };
  state.memos.unshift(memo);
  state.histories.unshift(
    history({
      historyId: state.nextId++,
      eventType: "MEMO_CREATED",
      label: "관리자 메모 기입",
      tone: "NEUTRAL",
      refType: "MEMO",
      refId: memo.memoId,
      occurredAt: memo.createdAt,
    })
  );
  return memo;
}

export function mockUpdateMemo(
  userId: number,
  scenario: string | null,
  memoId: number,
  content: string
): ConsumerMemo {
  const state = stateFor(userId, scenario);
  const memo = state.memos.find((item) => item.memoId === memoId);
  if (!memo) throw new Error("존재하지 않는 메모입니다.");
  memo.content = content;
  memo.modifiedAt = utcNow();
  state.histories.unshift(
    history({
      historyId: state.nextId++,
      eventType: "MEMO_UPDATED",
      label: "관리자 메모 수정",
      tone: "NEUTRAL",
      refType: "MEMO",
      refId: memoId,
      occurredAt: memo.modifiedAt,
    })
  );
  return { ...memo };
}

export function mockDeleteMemo(
  userId: number,
  scenario: string | null,
  memoId: number
) {
  const state = stateFor(userId, scenario);
  state.memos = state.memos.filter((item) => item.memoId !== memoId);
  state.histories.unshift(
    history({
      historyId: state.nextId++,
      eventType: "MEMO_DELETED",
      label: "관리자 메모 삭제",
      tone: "NEUTRAL",
      refType: "MEMO",
      refId: memoId,
      occurredAt: utcNow(),
    })
  );
}

/** 배포된 옛 서버의 상세 모양(8785b87c) — `?mock=outdated`로 배포본의 「준비 중」 처리를 본다 */
export function mockOutdatedDetail(userId: number) {
  return {
    userId,
    nickname: "홍길동",
    providerType: "KAKAO",
    status: "NORMAL",
    birthday: "1990-03-17",
    gender: "FEMALE",
    defaultAddress: "서울특별시 마포구 월드컵로 12",
    createdAt: "2026-02-01T01:20:00",
    marketingAgree: true,
    adminMemo: null,
    statusHistory: [],
  };
}

/** 【서버 없음】 약관 동의 내역 — 시안 A1 5종 */
export function mockTermsAgreements(
  scenario: string | null
): Array<ConsumerTermsAgreement> {
  const old = scenario === "suspended" || scenario === "withdrawn";
  return [
    {
      title: "이용약관",
      version: old ? "v1.2" : "v2.0",
      agreedAt: "2026-02-01T01:20:00",
    },
    {
      title: "개인정보 수집·이용",
      version: old ? "v1.1" : "v1.2",
      agreedAt: "2026-02-01T01:20:00",
    },
    {
      title: "고유식별정보 처리",
      version: "v1.0",
      agreedAt: "2026-02-01T01:22:00",
    },
    {
      title: "통신사 이용약관",
      version: "v1.0",
      agreedAt: "2026-02-01T01:22:00",
    },
    {
      title: "광고성 정보 수신",
      version: "v1.0",
      agreedAt: "2026-02-01T01:23:00",
    },
  ];
}
