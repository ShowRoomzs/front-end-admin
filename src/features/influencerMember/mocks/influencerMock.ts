/*
  DEV 전용 목업 — 백엔드 배포 후 삭제.
  `/v1/admin/creators/**`는 origin/main에 있지만 개발 서버(api.showroomz.shop)에 아직 배포되지 않았다.
  값은 시안 ui-admin-16 rev.7 · 18 rev.2와 `AdminCreatorControllerDocs` 예시를 따르고, 모양은 `AdminCreatorDto` 그대로다.
  본인확인 정보 원문은 시안의 가짜 값이다. 시각은 이벤트 = UTC 벽시계, 기한 · 정지 종료일 = KST 벽시계.
*/
import type {
  AdminCreatorConnectionList,
  AdminCreatorContractPage,
  AdminCreatorContractRow,
  AdminCreatorDetail,
  AdminCreatorHistoryItem,
  AdminCreatorHistoryPage,
  AdminCreatorListItem,
  AdminCreatorListResponse,
  AdminCreatorMemoPage,
  AdminCreatorOverview,
  AdminCreatorReasonOptions,
  AdminCreatorSettlementList,
  CreatorBusinessType,
  CreatorPrivacyAccessReason,
} from "@/features/influencerMember/types";
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

function at(kst: string): string {
  return dayjs(kst).subtract(9, "hour").format("YYYY-MM-DDTHH:mm:ss");
}

function nowUtc(): string {
  return dayjs().utc().format("YYYY-MM-DDTHH:mm:ss");
}

const REASON_OPTIONS: AdminCreatorReasonOptions = {
  suspensionReasons: [
    {
      code: "AD_DISCLOSURE_OMITTED_REPEATED",
      label: "협찬 표기 누락 반복",
      detailRequired: false,
      holdsPayout: false,
    },
    {
      code: "AD_LAW_VIOLATION_REPEATED",
      label: "표시광고법 위반 문구 반복",
      detailRequired: false,
      holdsPayout: false,
    },
    {
      code: "GROUP_BUY_NONPERFORMANCE",
      label: "공구 진행 불이행",
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
      code: "SETTLEMENT_INFO_MISMATCH",
      label: "정산 정보 불일치",
      detailRequired: false,
      holdsPayout: true,
    },
    {
      code: "FALSE_INFORMATION",
      label: "허위 기재",
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
      code: "GROUP_BUY_REMAINING",
      label: "끝나지 않은 공구 남음",
      detailRequired: false,
      holdsPayout: null,
    },
    {
      code: "UNFINISHED_CONTRACTS",
      label: "끝나지 않은 계약 남음",
      detailRequired: false,
      holdsPayout: null,
    },
    {
      code: "SETTLEMENT_IN_PROGRESS",
      label: "미정산 남음",
      detailRequired: false,
      holdsPayout: null,
    },
    {
      code: "DISPUTE_IN_PROGRESS",
      label: "분쟁·신고 처리 중",
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
  privacyUnmaskReasons: [
    {
      code: "CS_RESPONSE",
      label: "CS 응대",
      detailRequired: false,
      holdsPayout: null,
    },
    {
      code: "SETTLEMENT_WITHHOLDING_CHECK",
      label: "정산·원천징수 확인",
      detailRequired: false,
      holdsPayout: null,
    },
    {
      code: "CONTRACT_DISPUTE",
      label: "계약·분쟁 대응",
      detailRequired: false,
      holdsPayout: null,
    },
    {
      code: "INVESTIGATION_COOPERATION",
      label: "수사기관 협조",
      detailRequired: false,
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
  creatorId: number;
  showroomName: string;
  handle: string;
  email: string;
  businessType: CreatorBusinessType;
  joinedAt: string;
  approvedAt: string;
  lastLoginAt: string;
  device: "IPHONE" | "ANDROID";
  connected: number;
  /** 시안의 가짜 본인확인 값 — 마스킹 / 해제 */
  masked: { name: string; birthday: string; phone: string };
  real: { name: string; birthday: string; age: number; phone: string };
  bank: { name: string; holder: string; number: string };
}

interface Bundle {
  detail: AdminCreatorDetail;
  real: Seed["real"];
  masked: Seed["masked"];
  unmaskedUntil: number | null;
  overview: AdminCreatorOverview;
  settlements: AdminCreatorSettlementList;
  contracts: Array<AdminCreatorContractRow>;
  connections: AdminCreatorConnectionList;
  histories: Array<AdminCreatorHistoryItem>;
  memos: Array<MemberMemo>;
}

function history(
  eventType: string,
  label: string,
  tone: string,
  actorType: string,
  actorName: string,
  occurredAt: string,
  detail: string | null = null
): AdminCreatorHistoryItem {
  return {
    historyId: Math.floor(Math.random() * 100000),
    eventType,
    label,
    tone,
    detail,
    actorType,
    actorName,
    refType: null,
    refId: null,
    occurredAt,
  };
}

const SEEDS: Array<Seed> = [
  {
    creatorId: 3018,
    showroomName: "소연 쇼룸",
    handle: "soyeon_showroom",
    email: "contact@soyeonshowroom.kr",
    businessType: "BUSINESS",
    joinedAt: at("2026-03-11 14:08"),
    approvedAt: at("2026-03-15 11:02"),
    lastLoginAt: at("2026-09-08 09:24"),
    device: "IPHONE",
    connected: 3,
    masked: { name: "김*연", birthday: "1994.**.**", phone: "010-****-8842" },
    real: {
      name: "김소연",
      birthday: "1994.06.02",
      age: 32,
      phone: "010-3391-8842",
    },
    bank: { name: "카카오뱅크", holder: "김*연", number: "333*-**-**8842" },
  },
  {
    creatorId: 3015,
    showroomName: "다은의 화장대",
    handle: "daeun_desk",
    email: "daeun.desk@gmail.com",
    businessType: "INDIVIDUAL",
    joinedAt: at("2026-07-11 10:00"),
    approvedAt: at("2026-07-14 10:00"),
    lastLoginAt: at("2026-09-07 20:11"),
    device: "ANDROID",
    connected: 2,
    masked: { name: "정*은", birthday: "1998.**.**", phone: "010-****-2207" },
    real: {
      name: "정다은",
      birthday: "1998.11.20",
      age: 27,
      phone: "010-5120-2207",
    },
    bank: { name: "토스뱅크", holder: "정*은", number: "100*-**-**2207" },
  },
  {
    creatorId: 3012,
    showroomName: "지우 코스메틱",
    handle: "jiwoo_cosmetic",
    email: "jiwoo.cosmetic@gmail.com",
    businessType: "INDIVIDUAL",
    joinedAt: at("2026-03-01 09:00"),
    approvedAt: at("2026-03-04 15:00"),
    lastLoginAt: at("2026-09-02 13:40"),
    device: "IPHONE",
    connected: 0,
    masked: { name: "오*우", birthday: "2000.**.**", phone: "010-****-6610" },
    real: {
      name: "오지우",
      birthday: "2000.02.14",
      age: 26,
      phone: "010-7731-6610",
    },
    bank: { name: "국민은행", holder: "오*우", number: "604***-**-6610" },
  },
  {
    creatorId: 3010,
    showroomName: "서준 셀렉트",
    handle: "seojun_select",
    email: "seojun.select@naver.com",
    businessType: "BUSINESS",
    joinedAt: at("2026-01-18 11:00"),
    approvedAt: at("2026-01-21 10:00"),
    lastLoginAt: at("2026-09-01 08:20"),
    device: "ANDROID",
    connected: 1,
    masked: { name: "한*준", birthday: "1996.**.**", phone: "010-****-4410" },
    real: {
      name: "한서준",
      birthday: "1996.04.09",
      age: 30,
      phone: "010-6620-4410",
    },
    bank: { name: "신한은행", holder: "한*준", number: "110***-**-4410" },
  },
  {
    creatorId: 3009,
    showroomName: "민재 셀렉트",
    handle: "minjae_select",
    email: "minjae.select@kakao.com",
    businessType: "INDIVIDUAL",
    joinedAt: at("2026-01-08 10:00"),
    approvedAt: at("2026-01-12 10:00"),
    lastLoginAt: at("2026-08-30 18:55"),
    device: "IPHONE",
    connected: 1,
    masked: { name: "이*재", birthday: "1999.**.**", phone: "010-****-4471" },
    real: {
      name: "이민재",
      birthday: "1999.08.15",
      age: 27,
      phone: "010-2209-4471",
    },
    bank: { name: "국민은행", holder: "이*재", number: "604***-**-4471" },
  },
  {
    creatorId: 3021,
    showroomName: "하린의 뷰티랩",
    handle: "harin_beauty",
    email: "harin.beauty@gmail.com",
    businessType: "BUSINESS",
    joinedAt: at("2026-02-14 13:00"),
    approvedAt: at("2026-02-19 10:00"),
    lastLoginAt: at("2026-09-05 21:03"),
    device: "ANDROID",
    connected: 0,
    masked: { name: "박*린", birthday: "1997.**.**", phone: "010-****-3018" },
    real: {
      name: "박하린",
      birthday: "1997.03.27",
      age: 29,
      phone: "010-8812-3018",
    },
    bank: { name: "신한은행", holder: "박*린", number: "110***-**3018" },
  },
  {
    creatorId: 2990,
    showroomName: "예린 뷰티",
    handle: "yerin_beauty",
    email: "yerin.beauty@naver.com",
    businessType: "INDIVIDUAL",
    joinedAt: at("2025-10-30 10:00"),
    approvedAt: at("2025-11-03 10:00"),
    lastLoginAt: at("2026-09-04 22:00"),
    device: "IPHONE",
    connected: 1,
    masked: { name: "최*린", birthday: "2001.**.**", phone: "010-****-0912" },
    real: {
      name: "최예린",
      birthday: "2001.09.12",
      age: 25,
      phone: "010-4418-0912",
    },
    bank: { name: "카카오뱅크", holder: "최*린", number: "333*-**-**0912" },
  },
  {
    creatorId: 3004,
    showroomName: "라온 뷰티노트",
    handle: "raon_note",
    email: "raon.note@gmail.com",
    businessType: "INDIVIDUAL",
    joinedAt: at("2025-11-20 10:00"),
    approvedAt: at("2025-11-24 10:00"),
    lastLoginAt: at("2026-07-02 13:31"),
    device: "ANDROID",
    connected: 0,
    masked: { name: "윤*온", birthday: "1995.**.**", phone: "010-****-7781" },
    real: {
      name: "윤라온",
      birthday: "1995.12.01",
      age: 30,
      phone: "010-9902-7781",
    },
    bank: { name: "우리은행", holder: "윤*온", number: "1002-***-**7781" },
  },
];

const BRANDS = [
  { marketId: 1042, name: "글로우랩" },
  { marketId: 1017, name: "무드코스메틱" },
  { marketId: 1029, name: "벨라코스" },
  { marketId: 1008, name: "퓨어랩" },
];

function makeBundle(seed: Seed): Bundle {
  const business = seed.businessType === "BUSINESS";
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
      "CREATOR",
      "인플루언서 본인",
      seed.joinedAt
    ),
  ];
  return {
    real: seed.real,
    masked: seed.masked,
    unmaskedUntil: null,
    detail: {
      creatorId: seed.creatorId,
      memberNo: `INF-${seed.creatorId}`,
      status: "ACTIVE",
      statusLabel: "활성",
      statusTone: "SUCCESS",
      navigation: null,
      basic: {
        showroomName: seed.showroomName,
        profileImageUrl: null,
        showroomAddress: seed.handle,
        showroomUrl: `https://showroomz.kr/${seed.handle}`,
        showroomPublic: true,
        instagramUrl: `https://instagram.com/${seed.handle}`,
        businessEmail: seed.email,
        joinedAt: seed.joinedAt,
        onboardingApprovedAt: seed.approvedAt,
        lastLoginAt: seed.lastLoginAt,
        lastLoginDevice: seed.device,
      },
      identity: {
        destroyed: false,
        unmasked: false,
        name: seed.masked.name,
        birthday: seed.masked.birthday,
        age: null,
        phone: seed.masked.phone,
        carrier: null,
        firstVerifiedAt: seed.joinedAt,
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
      business: {
        destroyed: false,
        businessType: seed.businessType,
        businessTypeLabel: business ? "개인사업자" : "개인 (비사업자)",
        businessRegistrationNumber: business ? "128-31-90447" : null,
        businessLicenseImageUrl: business
          ? "https://placehold.co/600x800?text=license"
          : null,
        residentNumberRegistered: business ? null : true,
        withholdingType: business ? "TAX_INVOICE" : "WITHHOLDING_3_3",
        withholdingLabel: business ? "세금계산서 발행" : "원천징수 3.3%",
      },
      settlementAccount: {
        destroyed: false,
        bankName: seed.bank.name,
        accountHolder: seed.bank.holder,
        accountNumber: seed.bank.number,
        lastChange: null,
        pendingBusinessTypeChange: null,
      },
      rail: {
        currentStatus: {
          status: "ACTIVE",
          label: "활성",
          tone: "SUCCESS",
          joinedAt: seed.joinedAt,
          onboardingApprovedAt: seed.approvedAt,
          lastLoginAt: seed.lastLoginAt,
          suspension: null,
          withdrawal: null,
        },
        operatorChannelThreadId: 900 + (seed.creatorId % 100),
        openAdjustments: [],
        withdrawalReview: null,
        recentHistories: histories.slice(0, 3),
        historyTotal: histories.length,
      },
    },
    overview: {
      operations: {
        connectedBrandCount: seed.connected,
        sellingGroupBuyCount: seed.connected > 0 ? 1 : 0,
        rewardInProgressAmount: seed.connected > 0 ? 102900 : 0,
        openAdjustmentCount: 0,
      },
      activity: {
        groupBuyPostCount: 8,
        reviewRejectCount: 0,
        hiddenCount: 0,
        generalPostCount: 21,
        followerCount: 3120,
        threadCount: 4,
        openThreadCount: 0,
      },
    },
    settlements: { total: 0, content: [] },
    contracts: [],
    connections: {
      total: seed.connected,
      content: BRANDS.slice(0, seed.connected).map((brand, index) => ({
        connectionId: seed.creatorId * 10 + index,
        marketId: brand.marketId,
        marketName: brand.name,
        connectedAt: at(`2026-0${7 + (index % 2)}-1${index} 10:00`),
        sellingGroupBuyCount: index === 0 ? 1 : 0,
        status: "CONNECTED",
        disconnectedAt: null,
      })),
    },
    histories,
    memos: [],
  };
}

function sync(bundle: Bundle) {
  bundle.detail.rail.recentHistories = bundle.histories.slice(
    0,
    bundle.detail.rail.withdrawalReview ? 2 : 3
  );
  bundle.detail.rail.historyTotal = bundle.histories.length;
}

function addHistory(bundle: Bundle, item: AdminCreatorHistoryItem) {
  bundle.histories.unshift(item);
  sync(bundle);
}

function requestWithdrawal(
  bundle: Bundle,
  requestedAtKst: string,
  reasonText: string
) {
  bundle.detail.rail.withdrawalReview = {
    requestId: bundle.detail.creatorId + 40000,
    requestedAt: at(requestedAtKst),
    elapsedDays: Math.max(0, dayjs().diff(dayjs(requestedAtKst), "day")),
    dueDate: dayjs(requestedAtKst).add(7, "day").format("YYYY-MM-DD"),
    reasonText,
    conditions: {
      unfinishedGroupBuys: 0,
      unfinishedContracts: 0,
      unsettled: 0,
    },
  };
  addHistory(
    bundle,
    history(
      "WITHDRAWAL_REQUESTED",
      "탈퇴 신청 접수",
      "WARNING",
      "CREATOR",
      "인플루언서 본인",
      at(requestedAtKst)
    )
  );
}

function applySuspension(
  bundle: Bundle,
  reason: string,
  reasonDetail: string | null,
  endsOn: string | null,
  suspendedAt: string
) {
  const option = REASON_OPTIONS.suspensionReasons.find(
    (item) => item.code === reason
  );
  const detail = bundle.detail;
  const start = dayjs(suspendedAt).add(9, "hour");
  detail.status = "SUSPENDED";
  detail.statusLabel = "정지";
  detail.statusTone = "DANGER";
  const status = detail.rail.currentStatus;
  status.status = "SUSPENDED";
  status.label = "정지";
  status.tone = "DANGER";
  status.suspension = {
    sanctionId: detail.creatorId + 700,
    reason,
    reasonLabel: option?.label ?? reason,
    reasonDetail,
    suspendedAt,
    operatorName: "김운영",
    payoutHeld: !!option?.holdsPayout,
    payoutNote: option?.holdsPayout
      ? "지급 정지 · 해제 다음 영업일 지급"
      : "유지 · 사유가 정산 정보와 무관",
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
  addHistory(
    bundle,
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
}

function applyWithdrawn(bundle: Bundle, approvedAtKst: string) {
  const detail = bundle.detail;
  const review = detail.rail.withdrawalReview;
  detail.status = "WITHDRAWN";
  detail.statusLabel = "탈퇴";
  detail.statusTone = "NEUTRAL";
  detail.basic = {
    ...detail.basic,
    showroomUrl: null,
    showroomPublic: false,
    instagramUrl: null,
  };
  detail.identity = {
    destroyed: true,
    unmasked: false,
    name: null,
    birthday: null,
    age: null,
    phone: null,
    carrier: null,
    firstVerifiedAt: null,
    renewedAt: null,
  };
  detail.unmask = {
    allowed: false,
    unmasked: false,
    operatorName: null,
    unmaskedAt: null,
    expiresAt: null,
    remainingSeconds: null,
    lastReason: null,
  };
  detail.business = {
    destroyed: true,
    businessType: null,
    businessTypeLabel: null,
    businessRegistrationNumber: null,
    businessLicenseImageUrl: null,
    residentNumberRegistered: null,
    withholdingType: null,
    withholdingLabel: null,
  };
  detail.settlementAccount = {
    destroyed: true,
    bankName: null,
    accountHolder: null,
    accountNumber: null,
    lastChange: null,
    pendingBusinessTypeChange: null,
  };
  const status = detail.rail.currentStatus;
  status.status = "WITHDRAWN";
  status.label = "탈퇴";
  status.tone = "NEUTRAL";
  status.suspension = null;
  status.withdrawal = {
    withdrawnAt: at(approvedAtKst),
    requestedAt: review?.requestedAt ?? null,
    operatorName: "김운영",
  };
  detail.rail.withdrawalReview = null;
  detail.rail.openAdjustments = [];
  bundle.unmaskedUntil = null;
  bundle.overview.operations = {
    connectedBrandCount: 0,
    sellingGroupBuyCount: 0,
    rewardInProgressAmount: 0,
    openAdjustmentCount: 0,
  };
  bundle.connections = {
    total: bundle.connections.total,
    content: bundle.connections.content.map((row) => ({
      ...row,
      status: "DISCONNECTED",
      disconnectedAt: row.disconnectedAt ?? at(approvedAtKst),
    })),
  };
  bundle.memos.forEach((item) => (item.editable = false));
  addHistory(
    bundle,
    history(
      "WITHDRAWAL_APPROVED",
      "탈퇴 승인 · 스튜디오 자격 해지",
      "NEUTRAL",
      "ADMIN",
      "김운영",
      at(approvedAtKst)
    )
  );
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

function buildStore(scenario: string): Map<number, Bundle> {
  const store = new Map<number, Bundle>();
  if (scenario === "influencer-empty") return store;
  for (const seed of SEEDS) store.set(seed.creatorId, makeBundle(seed));

  // A1 · A1-b · A1-c 소연 쇼룸 — 조정 협의 · 최근 정산 · 계약 · 계좌 변경 이력
  const soyeon = store.get(3018);
  if (soyeon) {
    const adjustment = {
      adjustmentId: 12,
      settlementId: 1006,
      settlementNumber: "STL-2609-006",
      deadlineAt: "2026-09-17T23:59:59",
      threadId: 930,
    };
    soyeon.detail.rail.openAdjustments = [adjustment];
    soyeon.detail.settlementAccount.lastChange = {
      changedAt: at("2026-08-29 14:02"),
      previousBankName: "신한",
      previousLast4: "3301",
    };
    soyeon.overview = {
      operations: {
        connectedBrandCount: 3,
        sellingGroupBuyCount: 2,
        rewardInProgressAmount: 253428,
        openAdjustmentCount: 1,
      },
      activity: {
        groupBuyPostCount: 12,
        reviewRejectCount: 1,
        hiddenCount: 0,
        generalPostCount: 34,
        followerCount: 8420,
        threadCount: 6,
        openThreadCount: 1,
      },
    };
    soyeon.settlements = {
      total: 2,
      content: [
        {
          settlementId: 1014,
          settlementNumber: "STL-2609-014",
          groupBuyId: 514,
          groupBuyTitle: "모이스처 토너 공구",
          marketName: "무드코스메틱",
          status: "PAYOUT_SCHEDULED",
          statusLabel: "지급 예정",
          tone: "NEUTRAL",
          rewardAmount: 102900,
          creatorPayoutStatus: "SCHEDULED",
          creatorPayoutStatusLabel: "지급 예정",
          payoutDueDate: "2026-09-18",
          paidAt: null,
          adjustment: null,
        },
        {
          settlementId: 1006,
          settlementNumber: "STL-2609-006",
          groupBuyId: 506,
          groupBuyTitle: "여름 수분 세럼 공구",
          marketName: "벨라코스",
          status: "ADJUSTING",
          statusLabel: "조정 협의",
          tone: "WARNING",
          rewardAmount: 150528,
          creatorPayoutStatus: "WAITING",
          creatorPayoutStatusLabel: "전액 보류",
          payoutDueDate: null,
          paidAt: null,
          adjustment,
        },
      ],
    };
    soyeon.contracts = [
      {
        contractId: 311,
        contractNumber: "CTR-20260902-011",
        marketName: "글로우랩",
        title: "가을 톤업 쿠션 공구",
        status: "SIGNING",
        statusLabel: "서명 진행중",
        tone: "INFO",
        fixedFeeAmount: 200000,
        fixedFeeTrigger: "GROUP_BUY_ENDED",
        fixedFeeTriggerLabel: "공구 종료 후",
        fixedFeeTriggerReachedAt: null,
        fixedFeePaidAt: null,
      },
      {
        contractId: 288,
        contractNumber: "CTR-20260805-028",
        marketName: "글로우랩",
        title: "수분 앰플 공구",
        status: "CONCLUDED",
        statusLabel: "계약 성립",
        tone: "SUCCESS",
        fixedFeeAmount: 300000,
        fixedFeeTrigger: "POST_REGISTERED",
        fixedFeeTriggerLabel: "공구 게시물 등록 후",
        fixedFeeTriggerReachedAt: at("2026-08-10 10:00"),
        fixedFeePaidAt: at("2026-08-16 10:00"),
      },
      {
        contractId: 297,
        contractNumber: "CTR-20260815-007",
        marketName: "무드코스메틱",
        title: "모이스처 토너 공구",
        status: "CONCLUDED",
        statusLabel: "계약 성립",
        tone: "SUCCESS",
        fixedFeeAmount: null,
        fixedFeeTrigger: null,
        fixedFeeTriggerLabel: null,
        fixedFeeTriggerReachedAt: null,
        fixedFeePaidAt: null,
      },
      {
        contractId: 274,
        contractNumber: "CTR-20260728-014",
        marketName: "벨라코스",
        title: "여름 수분 세럼 공구",
        status: "CONCLUDED",
        statusLabel: "계약 성립",
        tone: "SUCCESS",
        fixedFeeAmount: 250000,
        fixedFeeTrigger: "GROUP_BUY_ENDED",
        fixedFeeTriggerLabel: "공구 종료 후",
        fixedFeeTriggerReachedAt: at("2026-08-22 23:59"),
        fixedFeePaidAt: null,
      },
    ];
    soyeon.connections = {
      total: 4,
      content: [
        {
          connectionId: 1,
          marketId: 1042,
          marketName: "글로우랩",
          connectedAt: at("2026-08-05 10:00"),
          sellingGroupBuyCount: 2,
          status: "CONNECTED",
          disconnectedAt: null,
        },
        {
          connectionId: 2,
          marketId: 1017,
          marketName: "무드코스메틱",
          connectedAt: at("2026-07-18 10:00"),
          sellingGroupBuyCount: 0,
          status: "CONNECTED",
          disconnectedAt: null,
        },
        {
          connectionId: 3,
          marketId: 1029,
          marketName: "벨라코스",
          connectedAt: at("2026-07-10 10:00"),
          sellingGroupBuyCount: 0,
          status: "CONNECTED",
          disconnectedAt: null,
        },
        {
          connectionId: 4,
          marketId: 1008,
          marketName: "퓨어랩",
          connectedAt: at("2026-04-02 10:00"),
          sellingGroupBuyCount: 0,
          status: "DISCONNECTED",
          disconnectedAt: at("2026-06-30 10:00"),
        },
      ],
    };
    soyeon.memos = [
      memo(
        6,
        "벨라코스 고정 지급비 미지급 문의 — 계약서상 지급 시점(공구 종료 후)을 근거로 브랜드에 직접 확인하도록 안내함. 플랫폼은 지급을 보증하지 않음을 함께 고지.",
        "2026-09-08 10:12",
        true
      ),
    ];
    addHistory(
      soyeon,
      history(
        "SETTLEMENT_ACCOUNT_CHANGED",
        "정산 계좌 변경 · 신한 → 카카오뱅크",
        "WARNING",
        "CREATOR",
        "인플루언서 본인",
        at("2026-08-29 14:02"),
        "본인인증 후"
      )
    );
    addHistory(
      soyeon,
      history(
        "MEMO_CREATED",
        "관리자 메모 기입",
        "NEUTRAL",
        "ADMIN",
        "김운영",
        at("2026-09-08 10:12")
      )
    );
  }

  // B1 · B1-b 하린의 뷰티랩 · 예린 뷰티 — 탈퇴 승인 대기
  const harin = store.get(3021);
  if (harin) {
    harin.connections = {
      total: 2,
      content: [
        {
          connectionId: 5,
          marketId: 1029,
          marketName: "벨라코스",
          connectedAt: at("2026-03-02 10:00"),
          sellingGroupBuyCount: 0,
          status: "DISCONNECTED",
          disconnectedAt: at("2026-08-28 14:30"),
        },
        {
          connectionId: 6,
          marketId: 1008,
          marketName: "퓨어랩",
          connectedAt: at("2026-03-20 10:00"),
          sellingGroupBuyCount: 0,
          status: "DISCONNECTED",
          disconnectedAt: at("2026-07-12 10:00"),
        },
      ],
    };
    harin.overview.activity = {
      groupBuyPostCount: 21,
      reviewRejectCount: 0,
      hiddenCount: 0,
      generalPostCount: 58,
      followerCount: 12940,
      threadCount: 9,
      openThreadCount: 0,
    };
    harin.memos = [
      memo(
        4,
        "진행중 공구 · 진행 중 정산 모두 0. 사유가 활동 중단이고 분쟁 이력이 없어 승인 예정입니다.",
        "2026-09-06 09:30",
        true
      ),
    ];
    addHistory(
      harin,
      history(
        "CONNECTIONS_ENDED",
        "연결 종료 (벨라코스)",
        "NEUTRAL",
        "CREATOR",
        "인플루언서 본인",
        at("2026-08-28 14:30")
      )
    );
    requestWithdrawal(
      harin,
      "2026-09-05 21:10",
      "콘텐츠 활동을 중단하고 본업에 집중하려 합니다."
    );
  }
  const yerin = store.get(2990);
  if (yerin)
    requestWithdrawal(
      yerin,
      "2026-09-07 10:00",
      "개인 사정으로 쇼룸 운영을 마칩니다."
    );

  // C1 민재 셀렉트 — 협찬 표기 누락 반복 정지(리워드 지급 유지) · 비사업자
  const minjae = store.get(3009);
  if (minjae) {
    applySuspension(
      minjae,
      "AD_DISCLOSURE_OMITTED_REPEATED",
      "공구 게시물 3건에서 유료 광고 표기가 누락되어 시정 요청 후에도 반복됐습니다.",
      dayjs().add(14, "day").format("YYYY-MM-DD"),
      at("2026-08-30 19:20")
    );
    minjae.overview.activity.hiddenCount = 2;
  }

  // D1 라온 뷰티노트 — 탈퇴(파기 표시)
  const raon = store.get(3004);
  if (raon) {
    requestWithdrawal(raon, "2026-07-01 10:00", "활동 중단");
    applyWithdrawn(raon, "2026-07-05 10:02");
  }

  if (scenario === "influencer-no-pending") {
    store.delete(3021);
    store.delete(2990);
  }
  if (scenario === "influencer-noperm") {
    store.forEach((bundle) => {
      if (!bundle.detail.identity.destroyed)
        bundle.detail.unmask.allowed = false;
    });
  }
  return store;
}

let currentScenario = "";
let store = new Map<number, Bundle>();

function getStore(scenario: string) {
  if (scenario !== currentScenario) {
    currentScenario = scenario;
    store = buildStore(scenario);
    if (scenario === "influencer-a1u") {
      const soyeon = store.get(3018);
      if (soyeon) unmaskBundle(soyeon, "SETTLEMENT_WITHHOLDING_CHECK");
    }
  }
  return store;
}

const DETAIL_SCENARIOS: Record<string, number> = {
  "influencer-a1": 3018,
  "influencer-a1u": 3018,
  "influencer-b1": 3021,
  "influencer-c1": 3009,
  "influencer-d1": 3004,
};

function find(scenario: string, creatorId: number): Bundle {
  const current = getStore(scenario);
  const fixed = DETAIL_SCENARIOS[scenario];
  const bundle =
    current.get(fixed ?? creatorId) ?? current.values().next().value;
  if (!bundle) throw new Error("목업 인플루언서가 없습니다.");
  return bundle;
}

/** 10분 고정 만료 — 지나면 다시 마스킹(서버 `PrivacyAccessSession`과 같은 규칙) */
function refreshMask(bundle: Bundle) {
  const detail = bundle.detail;
  if (bundle.unmaskedUntil && Date.now() < bundle.unmaskedUntil) {
    detail.unmask.remainingSeconds = Math.round(
      (bundle.unmaskedUntil - Date.now()) / 1000
    );
    return;
  }
  if (bundle.unmaskedUntil) {
    bundle.unmaskedUntil = null;
    detail.identity = {
      ...detail.identity,
      unmasked: false,
      name: bundle.masked.name,
      birthday: bundle.masked.birthday,
      age: null,
      phone: bundle.masked.phone,
    };
    detail.unmask = {
      ...detail.unmask,
      unmasked: false,
      operatorName: null,
      unmaskedAt: null,
      expiresAt: null,
      remainingSeconds: null,
    };
  }
}

function unmaskBundle(bundle: Bundle, reason: CreatorPrivacyAccessReason) {
  const detail = bundle.detail;
  bundle.unmaskedUntil = Date.now() + 10 * 60 * 1000;
  detail.identity = {
    ...detail.identity,
    unmasked: true,
    name: bundle.real.name,
    birthday: bundle.real.birthday,
    age: bundle.real.age,
    phone: bundle.real.phone,
  };
  detail.unmask = {
    allowed: detail.unmask.allowed,
    unmasked: true,
    operatorName: "김운영",
    unmaskedAt: nowUtc(),
    expiresAt: dayjs(bundle.unmaskedUntil).utc().format("YYYY-MM-DDTHH:mm:ss"),
    remainingSeconds: 600,
    lastReason: reason,
  };
  const label =
    REASON_OPTIONS.privacyUnmaskReasons.find((item) => item.code === reason)
      ?.label ?? reason;
  addHistory(
    bundle,
    history(
      "PRIVACY_UNMASKED",
      "본인확인 정보 마스킹 해제",
      "WARNING",
      "ADMIN",
      "김운영",
      nowUtc(),
      label
    )
  );
}

function listStatusOf(bundle: Bundle): MemberListStatus {
  const detail = bundle.detail;
  if (detail.status === "WITHDRAWN") return "WITHDRAWN";
  if (detail.rail.withdrawalReview) return "WITHDRAWAL_PENDING";
  return detail.status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
}

const LIST_LABEL: Record<MemberListStatus, [string, string]> = {
  ACTIVE: ["활성", "SUCCESS"],
  SUSPENDED: ["정지", "DANGER"],
  WITHDRAWAL_PENDING: ["탈퇴 승인 대기", "WARNING"],
  WITHDRAWN: ["탈퇴", "NEUTRAL"],
};

function toListItem(bundle: Bundle): AdminCreatorListItem {
  const detail = bundle.detail;
  const listStatus = listStatusOf(bundle);
  const seed = SEEDS.find((item) => item.creatorId === detail.creatorId);
  const businessType =
    detail.business.businessType ?? seed?.businessType ?? null;
  return {
    creatorId: detail.creatorId,
    memberNo: detail.memberNo,
    showroomName: detail.basic.showroomName,
    instagramUrl: detail.basic.instagramUrl,
    businessEmail: detail.basic.businessEmail,
    businessType,
    businessTypeLabel: businessType === "BUSINESS" ? "사업자" : "비사업자",
    joinedAt: detail.basic.joinedAt,
    connectedBrandCount: bundle.connections.content.filter(
      (row) => row.status === "CONNECTED"
    ).length,
    status: detail.status,
    statusLabel: detail.statusLabel,
    listStatus,
    listStatusLabel: LIST_LABEL[listStatus][0],
    listStatusTone: LIST_LABEL[listStatus][1],
    withdrawalPending: listStatus === "WITHDRAWAL_PENDING",
    withdrawalRequestedAt: detail.rail.withdrawalReview?.requestedAt ?? null,
  };
}

export function mockInfluencerList(
  scenario: string,
  params: MemberListParams
): AdminCreatorListResponse {
  const keyword = params.keyword.trim().toLowerCase();
  const all = [...getStore(scenario).values()]
    .filter((bundle) => {
      if (!keyword) return true;
      const basic = bundle.detail.basic;
      return (
        bundle.detail.memberNo.toLowerCase() === keyword ||
        (basic.showroomName ?? "").toLowerCase().includes(keyword) ||
        (basic.businessEmail ?? "").toLowerCase().includes(keyword)
      );
    })
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
  const oldest = all
    .filter((item) => item.withdrawalRequestedAt)
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

export function mockInfluencerReasonOptions(): AdminCreatorReasonOptions {
  return REASON_OPTIONS;
}

export function mockInfluencerDetail(
  scenario: string,
  creatorId: number
): AdminCreatorDetail {
  const bundle = find(scenario, creatorId);
  refreshMask(bundle);
  const ids = [...getStore(scenario).keys()].sort((a, b) => a - b);
  const index = ids.indexOf(bundle.detail.creatorId);
  bundle.detail.navigation = {
    previousId: index > 0 ? ids[index - 1] : null,
    nextId: index >= 0 && index < ids.length - 1 ? ids[index + 1] : null,
  };
  return bundle.detail;
}

export function mockInfluencerOverview(
  scenario: string,
  creatorId: number
): AdminCreatorOverview {
  return find(scenario, creatorId).overview;
}

export function mockInfluencerSettlements(
  scenario: string,
  creatorId: number
): AdminCreatorSettlementList {
  return find(scenario, creatorId).settlements;
}

export function mockInfluencerContracts(
  scenario: string,
  creatorId: number
): AdminCreatorContractPage {
  const content = find(scenario, creatorId).contracts;
  return {
    content,
    pageInfo: {
      currentPage: 1,
      totalPages: 1,
      totalResults: content.length,
      limit: 20,
      hasNext: false,
    },
  };
}

export function mockInfluencerConnections(
  scenario: string,
  creatorId: number
): AdminCreatorConnectionList {
  return find(scenario, creatorId).connections;
}

export function mockInfluencerHistories(
  scenario: string,
  creatorId: number,
  page: number,
  size: number
): AdminCreatorHistoryPage {
  const items = find(scenario, creatorId).histories;
  return {
    total: items.length,
    page,
    size,
    content: items.slice((page - 1) * size, page * size),
  };
}

export function mockInfluencerMemos(
  scenario: string,
  creatorId: number
): AdminCreatorMemoPage {
  const memos = find(scenario, creatorId).memos;
  return { total: memos.length, content: memos };
}

export function mockInfluencerCreateMemo(
  scenario: string,
  creatorId: number,
  content: string
): MemberMemo {
  const bundle = find(scenario, creatorId);
  const created: MemberMemo = {
    memoId: Date.now(),
    authorName: "김운영",
    content,
    createdAt: nowUtc(),
    modifiedAt: null,
    editable: true,
  };
  bundle.memos.unshift(created);
  addHistory(
    bundle,
    history(
      "MEMO_CREATED",
      "관리자 메모 기입",
      "NEUTRAL",
      "ADMIN",
      "김운영",
      created.createdAt
    )
  );
  return created;
}

export function mockInfluencerUpdateMemo(
  scenario: string,
  creatorId: number,
  memoId: number,
  content: string
): MemberMemo {
  const target = find(scenario, creatorId).memos.find(
    (item) => item.memoId === memoId
  );
  if (!target) throw new Error("목업 메모가 없습니다.");
  target.content = content;
  target.modifiedAt = nowUtc();
  return target;
}

export function mockInfluencerDeleteMemo(
  scenario: string,
  creatorId: number,
  memoId: number
) {
  const bundle = find(scenario, creatorId);
  bundle.memos = bundle.memos.filter((item) => item.memoId !== memoId);
}

export function mockInfluencerUnmask(
  scenario: string,
  creatorId: number,
  reason: CreatorPrivacyAccessReason
): AdminCreatorDetail {
  const bundle = find(scenario, creatorId);
  unmaskBundle(bundle, reason);
  return bundle.detail;
}

export function mockInfluencerLock(scenario: string, creatorId: number) {
  const bundle = find(scenario, creatorId);
  if (bundle.unmaskedUntil) bundle.unmaskedUntil = Date.now() - 1;
  refreshMask(bundle);
}

export function mockInfluencerSuspend(
  scenario: string,
  creatorId: number,
  payload: MemberSuspendPayload
): AdminCreatorDetail {
  const bundle = find(scenario, creatorId);
  applySuspension(
    bundle,
    payload.reason,
    payload.reasonDetail ?? null,
    payload.endsOn,
    nowUtc()
  );
  return bundle.detail;
}

export function mockInfluencerRelease(
  scenario: string,
  creatorId: number,
  payload: MemberReleasePayload
): AdminCreatorDetail {
  const bundle = find(scenario, creatorId);
  const detail = bundle.detail;
  detail.status = "ACTIVE";
  detail.statusLabel = "활성";
  detail.statusTone = "SUCCESS";
  const status = detail.rail.currentStatus;
  status.status = "ACTIVE";
  status.label = "활성";
  status.tone = "SUCCESS";
  status.suspension = null;
  const label =
    REASON_OPTIONS.releaseReasons.find((item) => item.code === payload.reason)
      ?.label ?? "소명 · 시정 확인";
  addHistory(
    bundle,
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
  return detail;
}

export function mockInfluencerApprove(
  scenario: string,
  creatorId: number
): AdminCreatorDetail {
  const bundle = find(scenario, creatorId);
  applyWithdrawn(bundle, dayjs().format("YYYY-MM-DD HH:mm"));
  return bundle.detail;
}

export function mockInfluencerReject(
  scenario: string,
  creatorId: number,
  payload: MemberWithdrawalRejectPayload
): AdminCreatorDetail {
  const bundle = find(scenario, creatorId);
  const label =
    REASON_OPTIONS.withdrawalRejectReasons.find(
      (item) => item.code === payload.reason
    )?.label ?? payload.reason;
  bundle.detail.rail.withdrawalReview = null;
  addHistory(
    bundle,
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
  return bundle.detail;
}
