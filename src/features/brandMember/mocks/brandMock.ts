/*
  DEV 전용 목업 — 백엔드 배포 후 삭제.
  `/v1/admin/brands/**`는 origin/main에 있지만 개발 서버(api.showroomz.shop)에 아직 배포되지 않았다.
  값은 시안 ui-admin-14 · 15 rev.7과 `AdminBrandControllerDocs` 예시를 따르고, 모양은 `AdminBrandDto` 그대로다.
  개인정보는 시안의 가짜 값이다. 시각은 서버처럼 이벤트 = UTC 벽시계, 정지 종료일 · 기한 = KST 벽시계로 둔다.
  조치(정지 · 해제 · 승인 · 반려 · 메모)는 이 모듈 안의 상태를 바꿔 화면 흐름을 끝까지 볼 수 있게 한다.
*/
import type {
  AdminBrandConnectedCreator,
  AdminBrandConnectedCreatorPage,
  AdminBrandDetail,
  AdminBrandHistoryItem,
  AdminBrandHistoryPage,
  AdminBrandListItem,
  AdminBrandListResponse,
  AdminBrandMemoPage,
  AdminBrandReasonOptions,
  AdminBrandRail,
  BrandRecentInquiry,
} from "@/features/brandMember/types";
import type {
  MemberListParams,
  MemberListStatus,
  MemberMemo,
  MemberReleasePayload,
  MemberSuspendPayload,
  MemberWithdrawalRejectPayload,
} from "@/features/memberShared/types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/** 시안의 KST 시각 → 서버 이벤트 형식(UTC 벽시계 · 시간대 표기 없음) */
function at(kst: string): string {
  return dayjs(kst).subtract(9, "hour").format("YYYY-MM-DDTHH:mm:ss");
}

function nowUtc(): string {
  return dayjs().utc().format("YYYY-MM-DDTHH:mm:ss");
}

const REASON_OPTIONS: AdminBrandReasonOptions = {
  suspensionReasons: [
    {
      code: "SETTLEMENT_INFO_MISMATCH",
      label: "정산 정보 불일치",
      detailRequired: false,
      holdsPayout: true,
    },
    {
      code: "BUSINESS_INFO_FALSIFIED",
      label: "사업자 정보 허위 기재",
      detailRequired: false,
      holdsPayout: true,
    },
    {
      code: "PRODUCT_INFO_FALSIFIED",
      label: "상품 정보 허위·과장",
      detailRequired: false,
      holdsPayout: false,
    },
    {
      code: "REPEATED_SHIPPING_DELAY",
      label: "배송 지연 반복",
      detailRequired: false,
      holdsPayout: false,
    },
    {
      code: "CONSUMER_RESPONSE_NEGLECT",
      label: "소비자 응대 불이행",
      detailRequired: false,
      holdsPayout: false,
    },
    {
      code: "OTHER",
      label: "기타(직접 입력)",
      detailRequired: true,
      holdsPayout: false,
    },
  ],
  releaseReasons: [
    {
      code: "RESOLVED",
      label: "소명 · 시정 확인",
      detailRequired: false,
      holdsPayout: null,
    },
    {
      code: "MISTAKE",
      label: "오정지",
      detailRequired: false,
      holdsPayout: null,
    },
  ],
  withdrawalRejectReasons: [
    {
      code: "ACTIVE_GROUP_BUYS",
      label: "진행 중 공구 잔존",
      detailRequired: false,
      holdsPayout: null,
    },
    {
      code: "CONTRACT_IN_PROGRESS",
      label: "체결 전 계약 잔존",
      detailRequired: false,
      holdsPayout: null,
    },
    {
      code: "UNCLOSED_ORDERS",
      label: "미종결 주문 잔존",
      detailRequired: false,
      holdsPayout: null,
    },
    {
      code: "UNSETTLED",
      label: "진행 중 정산 잔존",
      detailRequired: false,
      holdsPayout: null,
    },
    {
      code: "OTHER",
      label: "기타(직접 입력)",
      detailRequired: true,
      holdsPayout: null,
    },
  ],
  suspensionTerm: {
    appealBusinessDays: 3,
    appealDeadlineAt: dayjs().add(3, "day").format("YYYY-MM-DDT23:59:59"),
    appealReviewBusinessDays: null,
  },
};

interface Seed {
  marketId: number;
  brandName: string;
  managerName: string;
  managerContact: string;
  email: string;
  siteUrl: string;
  businessType: string;
  companyName: string;
  representativeName: string;
  businessRegistrationNumber: string;
  mailOrderRegNumber: string;
  businessAddress: string;
  bankName: string;
  accountHolder: string;
  maskedAccountNumber: string;
  taxEmail: string;
  joinedAt: string;
  approvedAt: string;
  lastLoginAt: string;
  connected: number;
}

function history(
  type: string,
  label: string,
  tone: string,
  actorType: string,
  actorName: string,
  occurredAt: string,
  detail: string | null = null
): AdminBrandHistoryItem {
  return {
    type,
    label,
    tone,
    actorType,
    actorName,
    detail,
    refType: null,
    refId: null,
    occurredAt,
  };
}

const SHOWROOMS = [
  "하린의 뷰티랩",
  "소연 쇼룸",
  "다은의 화장대",
  "민재 셀렉트",
  "지우 코스메틱",
  "서준 셀렉트",
];

function creators(
  count: number,
  base: number
): Array<AdminBrandConnectedCreator> {
  return Array.from({ length: count }, (_, index) => ({
    creatorId: 3018 + ((base + index) % 6),
    showroomName: SHOWROOMS[(base + index) % 6],
    connectedAt: at(`2026-08-0${(index % 8) + 1} 10:00`),
    disconnectedAt: null,
    activeGroupBuyCount: Math.max(0, 3 - index),
    status: "CONNECTED",
    statusLabel: "연결중",
  }));
}

function makeDetail(seed: Seed): AdminBrandDetail {
  const histories = [
    history(
      "ONBOARDING_APPROVED",
      "입점 승인",
      "SUCCESS",
      "ADMIN",
      "김운영",
      seed.approvedAt
    ),
    history(
      "SIGNED_UP",
      "가입 신청",
      "INFO",
      "BRAND",
      seed.managerName,
      seed.joinedAt
    ),
  ];
  return {
    marketId: seed.marketId,
    brandNo: `BRD-${seed.marketId}`,
    brandName: seed.brandName,
    memberStatus: "ACTIVE",
    memberStatusLabel: "활성",
    withdrawalPending: false,
    purged: false,
    navigation: null,
    basicInfo: {
      managerName: seed.managerName,
      managerContact: seed.managerContact,
      email: seed.email,
      siteUrl: seed.siteUrl,
      joinedAt: seed.joinedAt,
      approvedAt: seed.approvedAt,
    },
    businessInfo: {
      businessType: seed.businessType,
      companyName: seed.companyName,
      representativeName: seed.representativeName,
      businessRegistrationNumber: seed.businessRegistrationNumber,
      mailOrderRegNumber: seed.mailOrderRegNumber,
      businessAddress: seed.businessAddress,
    },
    settlementInfo: {
      bankName: seed.bankName,
      accountHolder: seed.accountHolder,
      maskedAccountNumber: seed.maskedAccountNumber,
      taxEmail: seed.taxEmail,
      pendingChangeRequests: [],
    },
    deliveryPolicy: {
      defaultDeliveryFee: 3000,
      freeShippingThreshold: 50000,
      jejuSurcharge: 3000,
      remoteAreaSurcharge: 3000,
      shipLeadBusinessDays: 3,
      shipLeadText: "공구 마감 후 3영업일 이내 발송 (주말·공휴일 제외)",
      shipLeadLastChange: {
        changedAt: at("2026-08-20 10:00"),
        previousDays: 2,
        newDays: 3,
      },
      returnAddress: {
        recipientName: `${seed.brandName} 물류`,
        contact: "031-555-0142",
        address: "경기도 고양시 덕양구 백양로 21",
        detailAddress: "물류센터 3동",
      },
    },
    operations: {
      connectedCreatorCount: seed.connected,
      activeGroupBuyCount: seed.connected > 0 ? 2 : 0,
      settledAmountTotal: 12640000,
      unsettledAmount: 0,
      payoutHeld: false,
      contracts: { signing: 0, concluded: seed.connected },
      products: { selling: seed.connected > 0 ? 5 : 0, soldOut: 0 },
    },
    connectedCreators: {
      total: seed.connected,
      items: creators(Math.min(seed.connected, 3), seed.marketId),
    },
    operatorThread: {
      threadId: 800 + (seed.marketId % 100),
      unreadByOperator: 0,
      lastMessageAt: at("2026-08-12 16:00"),
    },
    rail: {
      currentStatus: {
        marketId: seed.marketId,
        memberStatus: "ACTIVE",
        label: "활성",
        tone: "SUCCESS",
        joinedAt: seed.joinedAt,
        approvedAt: seed.approvedAt,
        lastLoginAt: seed.lastLoginAt,
        sanction: null,
        withdrawal: null,
        actions: {
          canSuspend: true,
          canRelease: false,
          canReviewWithdrawal: false,
        },
      },
      pendingChips: [],
      withdrawalReview: null,
      histories: { items: histories, total: histories.length },
    },
    memos: { items: [], total: 0 },
  };
}

const SEEDS: Array<Seed> = [
  {
    marketId: 1042,
    brandName: "글로우랩",
    managerName: "이서연",
    managerContact: "010-2284-5510",
    email: "partner@glowlab.co.kr",
    siteUrl: "https://glowlab.co.kr",
    businessType: "법인사업자",
    companyName: "주식회사 글로우랩",
    representativeName: "이서연",
    businessRegistrationNumber: "214-88-40125",
    mailOrderRegNumber: "2026-서울강남-01847",
    businessAddress: "서울특별시 강남구 테헤란로 152, 8층",
    bankName: "신한은행",
    accountHolder: "글로우랩(주)",
    maskedAccountNumber: "110-****-3841",
    taxEmail: "tax@glowlab.co.kr",
    joinedAt: at("2026-07-28 16:04"),
    approvedAt: at("2026-08-01 11:30"),
    lastLoginAt: at("2026-08-14 08:12"),
    connected: 14,
  },
  {
    marketId: 1038,
    brandName: "데이지코스메틱",
    managerName: "정하늘",
    managerContact: "010-9931-4402",
    email: "cs@daisycos.kr",
    siteUrl: "https://daisycos.kr",
    businessType: "일반과세자",
    companyName: "데이지코스메틱",
    representativeName: "정하늘",
    businessRegistrationNumber: "120-31-55870",
    mailOrderRegNumber: "2026-서울마포-00921",
    businessAddress: "서울특별시 마포구 양화로 45, 5층",
    bankName: "국민은행",
    accountHolder: "정하늘",
    maskedAccountNumber: "604-****-1120",
    taxEmail: "tax@daisycos.kr",
    joinedAt: at("2026-06-14 10:20"),
    approvedAt: at("2026-06-18 14:00"),
    lastLoginAt: at("2026-08-13 19:40"),
    connected: 6,
  },
  {
    marketId: 1031,
    brandName: "포레스트뷰티",
    managerName: "김도윤",
    managerContact: "010-3308-7725",
    email: "hello@forestbeauty.kr",
    siteUrl: "https://forestbeauty.kr",
    businessType: "법인사업자",
    companyName: "주식회사 포레스트뷰티",
    representativeName: "김도윤",
    businessRegistrationNumber: "305-86-11204",
    mailOrderRegNumber: "2026-서울성동-00412",
    businessAddress: "서울특별시 성동구 왕십리로 83, 2층",
    bankName: "우리은행",
    accountHolder: "포레스트뷰티(주)",
    maskedAccountNumber: "1002-***-**7725",
    taxEmail: "tax@forestbeauty.kr",
    joinedAt: at("2026-05-02 09:30"),
    approvedAt: at("2026-05-07 10:10"),
    lastLoginAt: at("2026-08-12 11:02"),
    connected: 9,
  },
  {
    marketId: 1029,
    brandName: "벨라코스",
    managerName: "한지우",
    managerContact: "010-7719-6634",
    email: "help@bellacos.co.kr",
    siteUrl: "https://bellacos.co.kr",
    businessType: "법인사업자",
    companyName: "벨라코스 주식회사",
    representativeName: "한지우",
    businessRegistrationNumber: "305-81-77210",
    mailOrderRegNumber: "2026-서울성동-01120",
    businessAddress: "서울특별시 성동구 아차산로 88, 3층",
    bankName: "국민은행",
    accountHolder: "벨라코스(주)",
    maskedAccountNumber: "604-****-9902",
    taxEmail: "tax@bellacos.co.kr",
    joinedAt: at("2026-02-09 13:00"),
    approvedAt: at("2026-02-15 10:20"),
    lastLoginAt: at("2026-07-30 11:22"),
    connected: 3,
  },
  {
    marketId: 1024,
    brandName: "라온스킨",
    managerName: "오세림",
    managerContact: "010-5542-1180",
    email: "raon@raonskin.kr",
    siteUrl: "https://raonskin.kr",
    businessType: "간이과세자",
    companyName: "라온스킨",
    representativeName: "오세림",
    businessRegistrationNumber: "617-12-30981",
    mailOrderRegNumber: "2026-부산해운대-00233",
    businessAddress: "부산광역시 해운대구 센텀중앙로 79",
    bankName: "카카오뱅크",
    accountHolder: "오세림",
    maskedAccountNumber: "333*-**-**1180",
    taxEmail: "raon@raonskin.kr",
    joinedAt: at("2026-03-21 15:00"),
    approvedAt: at("2026-03-25 10:00"),
    lastLoginAt: at("2026-08-02 09:15"),
    connected: 0,
  },
  {
    marketId: 1017,
    brandName: "무드코스메틱",
    managerName: "박지훈",
    managerContact: "010-4471-2093",
    email: "biz@moodcos.kr",
    siteUrl: "https://moodcos.kr",
    businessType: "법인사업자",
    companyName: "주식회사 무드코스메틱",
    representativeName: "박지훈",
    businessRegistrationNumber: "214-87-22918",
    mailOrderRegNumber: "2026-서울서초-00317",
    businessAddress: "서울특별시 서초구 강남대로 311, 11층",
    bankName: "하나은행",
    accountHolder: "무드코스메틱(주)",
    maskedAccountNumber: "391-****-2093",
    taxEmail: "tax@moodcos.kr",
    joinedAt: at("2026-01-12 09:00"),
    approvedAt: at("2026-01-18 11:00"),
    lastLoginAt: at("2026-08-08 17:50"),
    connected: 0,
  },
  {
    marketId: 1012,
    brandName: "노바랩스",
    managerName: "서준호",
    managerContact: "010-8845-3021",
    email: "nova@novalabs.kr",
    siteUrl: "https://novalabs.kr",
    businessType: "간이과세자",
    companyName: "노바랩스",
    representativeName: "서준호",
    businessRegistrationNumber: "110-22-48810",
    mailOrderRegNumber: "2025-서울종로-00811",
    businessAddress: "서울특별시 종로구 율곡로 10",
    bankName: "농협은행",
    accountHolder: "서준호",
    maskedAccountNumber: "301-****-3021",
    taxEmail: "nova@novalabs.kr",
    joinedAt: at("2025-12-18 10:00"),
    approvedAt: at("2025-12-22 15:00"),
    lastLoginAt: at("2026-07-01 10:40"),
    connected: 0,
  },
  {
    marketId: 1008,
    brandName: "퓨어랩",
    managerName: "최유진",
    managerContact: "010-6620-8814",
    email: "pure@purelab.kr",
    siteUrl: "https://purelab.kr",
    businessType: "법인사업자",
    companyName: "주식회사 퓨어랩",
    representativeName: "최유진",
    businessRegistrationNumber: "220-81-90412",
    mailOrderRegNumber: "2025-서울강남-02210",
    businessAddress: "서울특별시 강남구 논현로 508, 4층",
    bankName: "신한은행",
    accountHolder: "퓨어랩(주)",
    maskedAccountNumber: "140-****-8814",
    taxEmail: "tax@purelab.kr",
    joinedAt: at("2025-11-03 14:00"),
    approvedAt: at("2025-11-07 10:00"),
    lastLoginAt: at("2026-08-10 21:30"),
    connected: 2,
  },
];

function requestWithdrawal(
  detail: AdminBrandDetail,
  requestedAtKst: string,
  reasonLabel: string,
  message: string
) {
  const requestedAt = at(requestedAtKst);
  detail.withdrawalPending = true;
  detail.rail.currentStatus.actions.canReviewWithdrawal = true;
  detail.rail.withdrawalReview = {
    requestId: detail.marketId + 30000,
    requestedAt,
    elapsedDays: Math.max(0, dayjs().diff(dayjs(requestedAtKst), "day")),
    requesterName: detail.basicInfo.managerName,
    reason: "BUSINESS_CLOSED",
    reasonLabel,
    message,
    conditions: {
      activeGroupBuys: 0,
      contractsBeforeConclusion: 0,
      unclosedOrders: 0,
      unsettled: 0,
    },
  };
  detail.rail.histories.items.unshift(
    history(
      "WITHDRAWAL_REQUESTED",
      "탈퇴 신청 접수",
      "WARNING",
      "BRAND",
      detail.basicInfo.managerName ?? "",
      requestedAt,
      `사유: ${reasonLabel}`
    )
  );
  detail.rail.histories.total += 1;
}

function memo(
  memoId: number,
  content: string,
  createdAtKst: string,
  editable: boolean
): MemberMemo {
  return {
    memoId,
    authorName: "김운영",
    content,
    createdAt: at(createdAtKst),
    modifiedAt: null,
    editable,
  };
}

function applySuspension(
  detail: AdminBrandDetail,
  reason: string,
  reasonDetail: string | null,
  endsOn: string | null,
  suspendedAt: string
) {
  const option = REASON_OPTIONS.suspensionReasons.find(
    (item) => item.code === reason
  );
  const status = detail.rail.currentStatus;
  detail.memberStatus = "SUSPENDED";
  detail.memberStatusLabel = "정지";
  status.memberStatus = "SUSPENDED";
  status.label = "정지";
  status.tone = "DANGER";
  status.actions.canSuspend = false;
  status.actions.canRelease = true;
  const start = dayjs(suspendedAt).add(9, "hour");
  status.sanction = {
    sanctionId: detail.marketId + 500,
    reason,
    reasonLabel: option?.label ?? reason,
    reasonDetail,
    payoutHeld: !!option?.holdsPayout,
    suspendedAt,
    suspendedByName: "김운영",
    threadId: detail.operatorThread?.threadId ?? null,
    term: {
      endsOn,
      autoReleaseAt: endsOn
        ? dayjs(endsOn).add(1, "day").format("YYYY-MM-DDT00:00:00")
        : null,
      periodDays: endsOn
        ? dayjs(endsOn).diff(start.startOf("day"), "day") + 1
        : null,
      appealDeadlineAt: start.add(3, "day").format("YYYY-MM-DDT23:59:59"),
      appealReviewBusinessDays: null,
    },
  };
  detail.operations.payoutHeld = !!option?.holdsPayout;
  detail.rail.histories.items.unshift(
    history(
      "SUSPENDED",
      "정지",
      "DANGER",
      "ADMIN",
      "김운영",
      suspendedAt,
      [option?.label, reasonDetail].filter(Boolean).join(" — ")
    )
  );
  detail.rail.histories.total += 1;
}

function applyWithdrawn(detail: AdminBrandDetail, approvedAtKst: string) {
  const review = detail.rail.withdrawalReview;
  const status = detail.rail.currentStatus;
  detail.memberStatus = "WITHDRAWN";
  detail.memberStatusLabel = "탈퇴";
  detail.withdrawalPending = false;
  detail.purged = true;
  status.memberStatus = "WITHDRAWN";
  status.label = "탈퇴";
  status.tone = "NEUTRAL";
  status.sanction = null;
  status.actions = {
    canSuspend: false,
    canRelease: false,
    canReviewWithdrawal: false,
  };
  status.withdrawal = {
    requestedAt: review?.requestedAt ?? null,
    reason: review?.reason ?? null,
    reasonLabel: review?.reasonLabel ?? null,
    message: review?.message ?? null,
    approvedAt: at(approvedAtKst),
    approvedByName: "김운영",
  };
  detail.rail.withdrawalReview = null;
  detail.rail.pendingChips = [];
  detail.basicInfo = {
    ...detail.basicInfo,
    managerName: null,
    managerContact: null,
    email: null,
    siteUrl: null,
  };
  detail.businessInfo = {
    businessType: null,
    companyName: null,
    representativeName: null,
    businessRegistrationNumber: null,
    mailOrderRegNumber: null,
    businessAddress: null,
  };
  detail.settlementInfo = {
    bankName: null,
    accountHolder: null,
    maskedAccountNumber: null,
    taxEmail: null,
    pendingChangeRequests: [],
  };
  detail.operations = {
    ...detail.operations,
    connectedCreatorCount: 0,
    activeGroupBuyCount: 0,
    unsettledAmount: 0,
    payoutHeld: false,
  };
  detail.connectedCreators = { total: 0, items: [] };
  detail.memos.items.forEach((item) => (item.editable = false));
  detail.rail.histories.items.unshift(
    history(
      "WITHDRAWAL_APPROVED",
      "탈퇴 승인 · 계정 해지",
      "NEUTRAL",
      "ADMIN",
      "김운영",
      at(approvedAtKst)
    )
  );
  detail.rail.histories.total += 1;
}

function buildStore(scenario: string): Map<number, AdminBrandDetail> {
  const store = new Map<number, AdminBrandDetail>();
  if (scenario === "brand-empty") return store;
  for (const seed of SEEDS) store.set(seed.marketId, makeDetail(seed));

  // A1 · A1-b 글로우랩 — 진행 중 칩 · 미정산액 경고색 · 메모
  const glow = store.get(1042);
  if (glow) {
    glow.operations = {
      ...glow.operations,
      activeGroupBuyCount: 6,
      settledAmountTotal: 48210000,
      unsettledAmount: 3180000,
      contracts: { signing: 1, concluded: 6 },
      products: { selling: 12, soldOut: 2 },
    };
    glow.connectedCreators.items = [
      {
        creatorId: 3021,
        showroomName: "하린의 뷰티랩",
        connectedAt: at("2026-08-02 10:00"),
        disconnectedAt: null,
        activeGroupBuyCount: 3,
        status: "CONNECTED",
        statusLabel: "연결중",
      },
      {
        creatorId: 3018,
        showroomName: "소연 쇼룸",
        connectedAt: at("2026-08-05 10:00"),
        disconnectedAt: null,
        activeGroupBuyCount: 2,
        status: "CONNECTED",
        statusLabel: "연결중",
      },
      {
        creatorId: 3015,
        showroomName: "다은의 화장대",
        connectedAt: at("2026-08-07 10:00"),
        disconnectedAt: null,
        activeGroupBuyCount: 1,
        status: "CONNECTED",
        statusLabel: "연결중",
      },
    ];
    glow.rail.pendingChips = [
      {
        key: "SHIP_OVERDUE",
        label: "발송 기한 경과",
        tone: "WARNING",
        count: 1,
        target: "ORDERS",
        threadId: null,
      },
      {
        key: "CANCEL_RESPONSE_PENDING",
        label: "취소 요청 응답 대기",
        tone: "NEUTRAL",
        count: 1,
        target: "ORDERS",
        threadId: null,
      },
      {
        key: "INSPECTION_PENDING",
        label: "검수 대기",
        tone: "NEUTRAL",
        count: 2,
        target: "CLAIMS",
        threadId: null,
      },
      {
        key: "PRODUCT_INQUIRY_UNANSWERED",
        label: "상품 문의 미답변",
        tone: "NEUTRAL",
        count: 3,
        target: "PRODUCT_INQUIRIES",
        threadId: null,
      },
      {
        key: "BRAND_TAX_INVOICE_PENDING",
        label: "세금계산서 발행 대기",
        tone: "NEUTRAL",
        count: 1,
        target: "SETTLEMENTS",
        threadId: null,
      },
    ];
    glow.memos = {
      items: [
        memo(
          9,
          "미정산액 318만 원. 8월 15일 정기 정산에 포함 예정이라 별도 조치 없습니다.",
          "2026-08-14 10:05",
          true
        ),
      ],
      total: 2,
    };
    glow.rail.histories.items.unshift(
      history(
        "MEMO_CREATED",
        "관리자 메모 기입",
        "NEUTRAL",
        "ADMIN",
        "김운영",
        at("2026-08-14 10:05")
      )
    );
    glow.rail.histories.total += 1;
  }

  // A3 · A3-b 벨라코스 — 정산 정보 불일치 정지(지급 정지) · 변경 요청 대기
  const bella = store.get(1029);
  if (bella) {
    applySuspension(
      bella,
      "SETTLEMENT_INFO_MISMATCH",
      "예금주명과 사업자등록증 상호가 일치하지 않아 계정을 정지했습니다.",
      dayjs().add(20, "day").format("YYYY-MM-DD"),
      at("2026-07-30 15:40")
    );
    bella.operations = {
      ...bella.operations,
      activeGroupBuyCount: 1,
      settledAmountTotal: 23880000,
      unsettledAmount: 1420000,
      payoutHeld: true,
      contracts: { signing: 0, concluded: 2 },
      products: { selling: 5, soldOut: 1 },
    };
    bella.settlementInfo.pendingChangeRequests = [
      {
        requestId: 15,
        requestCode: "CHG-2026-0071",
        type: "SETTLEMENT_ACCOUNT",
        typeLabel: "정산 계좌",
        requestedAt: at("2026-07-31 10:12"),
      },
    ];
    bella.connectedCreators = {
      total: 3,
      items: [
        {
          creatorId: 3012,
          showroomName: "지우 코스메틱",
          connectedAt: at("2026-03-01 10:00"),
          disconnectedAt: null,
          activeGroupBuyCount: 1,
          status: "CONNECTED",
          statusLabel: "연결중",
        },
        {
          creatorId: 3009,
          showroomName: "서준 셀렉트",
          connectedAt: at("2026-04-11 10:00"),
          disconnectedAt: null,
          activeGroupBuyCount: 0,
          status: "CONNECTED",
          statusLabel: "연결중",
        },
      ],
    };
    bella.rail.pendingChips = [
      {
        key: "OPERATOR_THREAD_UNREAD",
        label: "운영팀 스레드 미확인",
        tone: "WARNING",
        count: 1,
        target: "THREAD",
        threadId: bella.operatorThread?.threadId ?? null,
      },
      {
        key: "INSPECTION_PENDING",
        label: "검수 대기",
        tone: "NEUTRAL",
        count: 1,
        target: "CLAIMS",
        threadId: null,
      },
      {
        key: "BRAND_TAX_INVOICE_PENDING",
        label: "세금계산서 발행 대기",
        tone: "NEUTRAL",
        count: 1,
        target: "SETTLEMENTS",
        threadId: null,
      },
    ];
    bella.memos = {
      items: [
        memo(
          7,
          "수정된 통장 사본 수령. 상호 일치 확인되면 해제 예정.",
          "2026-08-14 09:15",
          true
        ),
      ],
      total: 2,
    };
    bella.rail.histories.items.unshift(
      history(
        "CHANGE_REQUEST_RECEIVED",
        "정산 계좌 변경 요청 접수",
        "INFO",
        "BRAND",
        "한지우",
        at("2026-07-31 10:12"),
        "정산 계좌"
      )
    );
    bella.rail.histories.total += 1;
  }

  // A2 · A2-b 무드코스메틱 · 퓨어랩 — 탈퇴 승인 대기(상단 고정)
  const mood = store.get(1017);
  if (mood) {
    requestWithdrawal(
      mood,
      "2026-08-08 17:44",
      "자사몰 집중",
      "자사몰 운영에 집중하기 위해 입점을 종료합니다."
    );
    mood.memos = {
      items: [
        memo(
          5,
          "반품 1건 수취 확인만 남았습니다. 확인되면 승인 처리 예정.",
          "2026-08-14 09:40",
          true
        ),
      ],
      total: 2,
    };
  }
  const pure = store.get(1008);
  if (pure)
    requestWithdrawal(
      pure,
      "2026-08-11 11:20",
      "사업 종료",
      "브랜드 운영을 종료합니다."
    );

  // A4 · A4-b 노바랩스 — 탈퇴 승인 끝(파기 표시)
  const nova = store.get(1012);
  if (nova) {
    requestWithdrawal(
      nova,
      "2026-07-01 10:30",
      "사업 종료",
      "사업을 정리하게 되어 탈퇴합니다."
    );
    nova.memos = {
      items: [
        memo(
          3,
          "반품 수취 확인 완료. 미정산액 0원 확인 후 승인했습니다.",
          "2026-07-05 16:20",
          false
        ),
      ],
      total: 2,
    };
    applyWithdrawn(nova, "2026-07-05 16:20");
  }

  if (scenario === "brand-no-pending") {
    store.delete(1017);
    store.delete(1008);
  }
  return store;
}

let currentScenario = "";
let store = new Map<number, AdminBrandDetail>();

function getStore(scenario: string) {
  if (scenario !== currentScenario) {
    currentScenario = scenario;
    store = buildStore(scenario);
  }
  return store;
}

const DETAIL_SCENARIOS: Record<string, number> = {
  "brand-a1": 1042,
  "brand-a2": 1017,
  "brand-a3": 1029,
  "brand-a4": 1012,
};

function listStatusOf(detail: AdminBrandDetail): MemberListStatus {
  if (detail.memberStatus === "WITHDRAWN") return "WITHDRAWN";
  if (detail.withdrawalPending) return "WITHDRAWAL_PENDING";
  return detail.memberStatus === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
}

const LIST_LABEL: Record<MemberListStatus, [string, string]> = {
  ACTIVE: ["활성", "SUCCESS"],
  SUSPENDED: ["정지", "DANGER"],
  WITHDRAWAL_PENDING: ["탈퇴 승인 대기", "WARNING"],
  WITHDRAWN: ["탈퇴", "NEUTRAL"],
};

function toListItem(detail: AdminBrandDetail): AdminBrandListItem {
  const listStatus = listStatusOf(detail);
  return {
    marketId: detail.marketId,
    brandNo: detail.brandNo,
    brandName: detail.brandName,
    managerName: detail.basicInfo.managerName,
    managerContact: detail.basicInfo.managerContact,
    businessType:
      detail.businessInfo.businessType ??
      (detail.purged
        ? (SEEDS.find((seed) => seed.marketId === detail.marketId)
            ?.businessType ?? null)
        : null),
    memberStatus: detail.memberStatus,
    memberStatusLabel: detail.memberStatusLabel,
    withdrawalPending: detail.withdrawalPending,
    withdrawalRequestedAt: detail.rail.withdrawalReview?.requestedAt ?? null,
    listStatus,
    listStatusLabel: LIST_LABEL[listStatus][0],
    listStatusTone: LIST_LABEL[listStatus][1],
    connectedCreatorCount: detail.operations.connectedCreatorCount,
    joinedAt: detail.basicInfo.joinedAt,
    lastLoginAt: detail.rail.currentStatus.lastLoginAt,
  };
}

export function mockBrandList(
  scenario: string,
  params: MemberListParams
): AdminBrandListResponse {
  const keyword = params.keyword.trim().toLowerCase();
  const all = [...getStore(scenario).values()]
    .filter(
      (detail) =>
        !keyword ||
        detail.brandName.toLowerCase().includes(keyword) ||
        detail.brandNo.toLowerCase() === keyword
    )
    .map(toListItem);
  const count = (status: MemberListStatus) =>
    all.filter((item) => item.listStatus === status).length;
  const tab = params.tab;
  const rows = all
    .filter((item) => tab === "ALL" || item.listStatus === tab)
    .sort((a, b) => {
      if (tab === "ALL" && a.withdrawalPending !== b.withdrawalPending)
        return a.withdrawalPending ? -1 : 1;
      return (b.joinedAt ?? "").localeCompare(a.joinedAt ?? "");
    });
  const pending = all.filter(
    (item) => item.withdrawalPending && item.withdrawalRequestedAt
  );
  const oldest = pending
    .map((item) => item.withdrawalRequestedAt as string)
    .sort()[0];
  const size = Number(params.size);
  const page = Number(params.page);
  return {
    content: rows.slice((page - 1) * size, page * size),
    pageInfo: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(rows.length / size)),
      totalResults: rows.length,
      limit: size,
      hasNext: page * size < rows.length,
    },
    summary: {
      total: all.length,
      active: count("ACTIVE"),
      suspended: count("SUSPENDED"),
      withdrawalPending: count("WITHDRAWAL_PENDING"),
      withdrawn: count("WITHDRAWN"),
      longestPendingDays:
        tab === "WITHDRAWAL_PENDING" && oldest
          ? dayjs().diff(dayjs(oldest), "day")
          : null,
    },
  };
}

function find(scenario: string, marketId: number): AdminBrandDetail {
  const current = getStore(scenario);
  const fixed = DETAIL_SCENARIOS[scenario];
  const detail =
    current.get(fixed ?? marketId) ?? current.values().next().value;
  if (!detail) throw new Error("목업 브랜드가 없습니다.");
  return detail;
}

export function mockBrandDetail(
  scenario: string,
  marketId: number
): AdminBrandDetail {
  const detail = find(scenario, marketId);
  const ids = [...getStore(scenario).keys()].sort((a, b) => a - b);
  const index = ids.indexOf(detail.marketId);
  detail.navigation = {
    previousMarketId: index > 0 ? ids[index - 1] : null,
    nextMarketId: index >= 0 && index < ids.length - 1 ? ids[index + 1] : null,
  };
  return detail;
}

export function mockBrandReasonOptions(): AdminBrandReasonOptions {
  return REASON_OPTIONS;
}

export function mockBrandSuspend(
  scenario: string,
  marketId: number,
  payload: MemberSuspendPayload
): AdminBrandRail {
  const detail = find(scenario, marketId);
  applySuspension(
    detail,
    payload.reason,
    payload.reasonDetail ?? null,
    payload.endsOn,
    nowUtc()
  );
  return detail.rail;
}

export function mockBrandRelease(
  scenario: string,
  marketId: number,
  payload: MemberReleasePayload
): AdminBrandRail {
  const detail = find(scenario, marketId);
  const status = detail.rail.currentStatus;
  detail.memberStatus = "ACTIVE";
  detail.memberStatusLabel = "활성";
  status.memberStatus = "ACTIVE";
  status.label = "활성";
  status.tone = "SUCCESS";
  status.sanction = null;
  status.actions.canSuspend = true;
  status.actions.canRelease = false;
  detail.operations.payoutHeld = false;
  const label =
    REASON_OPTIONS.releaseReasons.find((item) => item.code === payload.reason)
      ?.label ?? "소명 · 시정 확인";
  detail.rail.histories.items.unshift(
    history(
      "SUSPENSION_RELEASED",
      "정지 해제",
      "SUCCESS",
      "ADMIN",
      "김운영",
      nowUtc(),
      label
    )
  );
  detail.rail.histories.total += 1;
  return detail.rail;
}

export function mockBrandApprove(
  scenario: string,
  marketId: number
): AdminBrandRail {
  const detail = find(scenario, marketId);
  applyWithdrawn(detail, dayjs().format("YYYY-MM-DD HH:mm"));
  return detail.rail;
}

export function mockBrandReject(
  scenario: string,
  marketId: number,
  payload: MemberWithdrawalRejectPayload
): AdminBrandRail {
  const detail = find(scenario, marketId);
  const label =
    REASON_OPTIONS.withdrawalRejectReasons.find(
      (item) => item.code === payload.reason
    )?.label ?? payload.reason;
  detail.withdrawalPending = false;
  detail.rail.withdrawalReview = null;
  detail.rail.currentStatus.actions.canReviewWithdrawal = false;
  detail.rail.histories.items.unshift(
    history(
      "WITHDRAWAL_REJECTED",
      "탈퇴 신청 반려",
      "INFO",
      "ADMIN",
      "김운영",
      nowUtc(),
      label
    )
  );
  detail.rail.histories.total += 1;
  return detail.rail;
}

export function mockBrandHistories(
  scenario: string,
  marketId: number,
  page: number,
  size: number
): AdminBrandHistoryPage {
  const items = find(scenario, marketId).rail.histories.items;
  return {
    content: items.slice((page - 1) * size, page * size),
    pageInfo: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(items.length / size)),
      totalResults: items.length,
      limit: size,
      hasNext: page * size < items.length,
    },
  };
}

/** 메모 전체 — 상세에는 최신 1건만 있어 나머지 1건을 덧붙여 「전체 2건」을 맞춘다 */
const OLDER_MEMO = (memoId: number): MemberMemo => ({
  memoId,
  authorName: "박운영",
  content: "배송 지연 2회 — 다음 지연 시 정지 검토",
  createdAt: at("2026-07-02 13:00"),
  modifiedAt: at("2026-07-02 15:10"),
  editable: false,
});

export function mockBrandMemos(
  scenario: string,
  marketId: number
): AdminBrandMemoPage {
  const detail = find(scenario, marketId);
  const content = [...detail.memos.items];
  while (content.length < detail.memos.total)
    content.push(OLDER_MEMO(100 + content.length));
  return {
    content,
    pageInfo: {
      currentPage: 1,
      totalPages: 1,
      totalResults: content.length,
      limit: 100,
      hasNext: false,
    },
  };
}

export function mockBrandCreateMemo(
  scenario: string,
  marketId: number,
  content: string
): MemberMemo {
  const detail = find(scenario, marketId);
  const created: MemberMemo = {
    memoId: Date.now(),
    authorName: "김운영",
    content,
    createdAt: nowUtc(),
    modifiedAt: null,
    editable: true,
  };
  detail.memos = {
    items: [created, ...detail.memos.items],
    total: detail.memos.total + 1,
  };
  detail.rail.histories.items.unshift(
    history(
      "MEMO_CREATED",
      "관리자 메모 기입",
      "NEUTRAL",
      "ADMIN",
      "김운영",
      created.createdAt
    )
  );
  detail.rail.histories.total += 1;
  return created;
}

export function mockBrandUpdateMemo(
  scenario: string,
  marketId: number,
  memoId: number,
  content: string
): MemberMemo {
  const detail = find(scenario, marketId);
  const target = detail.memos.items.find((item) => item.memoId === memoId);
  if (!target) throw new Error("목업 메모가 없습니다.");
  target.content = content;
  target.modifiedAt = nowUtc();
  return target;
}

export function mockBrandDeleteMemo(
  scenario: string,
  marketId: number,
  memoId: number
) {
  const detail = find(scenario, marketId);
  detail.memos = {
    items: detail.memos.items.filter((item) => item.memoId !== memoId),
    total: Math.max(0, detail.memos.total - 1),
  };
}

export function mockBrandConnectedCreators(
  scenario: string,
  marketId: number
): AdminBrandConnectedCreatorPage {
  const detail = find(scenario, marketId);
  const content = [
    ...detail.connectedCreators.items,
    ...creators(
      Math.max(
        0,
        detail.connectedCreators.total - detail.connectedCreators.items.length
      ),
      detail.marketId + 3
    ),
  ];
  return {
    content,
    pageInfo: {
      currentPage: 1,
      totalPages: 1,
      totalResults: content.length,
      limit: 100,
      hasNext: false,
    },
  };
}

/** 최근 문의(서버 없음) — 시안 A1-b · A2-b · A3-b · A4-b 값 */
export function mockBrandRecentInquiries(
  scenario: string,
  marketId: number
): { items: Array<BrandRecentInquiry>; total: number } {
  const detail = find(scenario, marketId);
  if (detail.marketId === 1029) {
    return {
      total: 2,
      items: [
        {
          inquiryNumber: "PIQ-20260731-022",
          typeLabel: "계정 이용 정지",
          title: "통장 사본 다시 제출했습니다",
          statusLabel: "답변 대기",
          tone: "WARNING",
          createdAt: at("2026-07-31 09:10"),
        },
        {
          inquiryNumber: "PIQ-20260720-011",
          typeLabel: "정산",
          title: "예금주명 변경 가능한가요?",
          statusLabel: "답변 완료",
          tone: "SUCCESS",
          createdAt: at("2026-07-20 14:00"),
        },
      ],
    };
  }
  if (detail.withdrawalPending || detail.memberStatus === "WITHDRAWN") {
    return {
      total: 1,
      items: [
        {
          inquiryNumber: "PIQ-20260810-031",
          typeLabel: "탈퇴",
          title: "탈퇴 후 정산 내역 조회 가능한가요?",
          statusLabel: "답변 완료",
          tone: "SUCCESS",
          createdAt: at("2026-08-10 11:00"),
        },
      ],
    };
  }
  return {
    total: 3,
    items: [
      {
        inquiryNumber: "PIQ-20260812-014",
        typeLabel: "정산",
        title: "8월 정산 지급일이 언제인가요?",
        statusLabel: "답변 완료",
        tone: "SUCCESS",
        createdAt: at("2026-08-12 10:00"),
      },
      {
        inquiryNumber: "PIQ-20260805-007",
        typeLabel: "상품",
        title: "상품 대표 이미지 교체 방법",
        statusLabel: "답변 완료",
        tone: "SUCCESS",
        createdAt: at("2026-08-05 15:30"),
      },
    ],
  };
}
