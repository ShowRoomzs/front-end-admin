import type {
  Breakdown,
  Clawback,
  Distribution,
  DistributionRow,
  EvidenceItem,
  SettlementDetail,
  SettlementHistoryEntry,
  Statement,
  StatementRow,
  Tone,
} from "@/features/settlement/types";
import dayjs from "dayjs";

/*
  개발 서버 전용 목업 — `adminSettlementService.ts`만 이 파일을 읽는다.

  값은 시안 ui-admin-07a(rev.2) · 07b(rev.1)의 더미 수치를 그대로 옮겼다(07a 합계 행 22,731,600 …
  탭 건수 9 · 1 · 1 · 1 · 5 · 3 · GNB 6). 시안끼리 어긋난 값은 요구사항 §46 D항목의 정정 방향을 따랐다:
  리워드 부가세 반영 후 브랜드 수취액(D-8 · D-21) · 자동 확정 주체는 시스템(D-18) · 지급 예정 회차의
  분배 행은 「지급 예정」(D-21) · 플랫폼 몫 = 비사업자 건의 리워드 부가세(§41-5 · 합계 = 확정 거래액 − 원천징수).
*/

export const MOCK_OPERATOR = "김운영";

const PG_RATE = 0.03;
const PG_RATE_LABEL = "3.0% 잠정";
const PLATFORM_RATE_LABEL = "베타 0% · 정상 2%";
const REWARD_VAT_RATE = 0.1;
const REWARD_VAT_LABEL = "10% · 별도 · 매입세액 공제";
const WITHHOLDING_RATE = 0.033;
const WITHHOLDING_LABEL = "3.3%";
const BIZ_VAT_LABEL = "10% · 세금계산서";

const BRAND_ACCOUNT = "신한 110-***-**4821";
const INFLUENCER_ACCOUNT = "카카오뱅크 3333-**-**8842";

/** 「해당 없음」 플랫폼 행 — 수수료 베타 0%이고 사업자 건이라 리워드 부가세도 인플루언서에게 간다 */
const PLATFORM_NONE_LABEL = "해당 없음 · 베타 0%";

function breakdownOf(input: {
  totalPayment: number;
  deductions: [number, number, number];
  reward: number;
  rewardRateLabel: string;
  business: boolean;
}): Breakdown {
  const [returned, exchanged, shipping] = input.deductions;
  const confirmedSales = input.totalPayment - returned - exchanged - shipping;
  const pgFee = Math.round(confirmedSales * PG_RATE);
  const platformFee = 0;
  const rewardVat = Math.round(input.reward * REWARD_VAT_RATE);
  const withholding = input.business
    ? 0
    : Math.floor(input.reward * WITHHOLDING_RATE);
  const vat = input.business ? rewardVat : 0;
  return {
    totalPayment: input.totalPayment,
    deductions: [
      { label: "반품 차감", amount: returned },
      { label: "교환 차감", amount: exchanged },
      { label: "배송비 차감", amount: shipping },
    ],
    confirmedSales,
    pgFee,
    pgRateLabel: PG_RATE_LABEL,
    platformFee,
    platformRateLabel: PLATFORM_RATE_LABEL,
    reward: input.reward,
    rewardRateLabel: input.rewardRateLabel,
    rewardVat,
    rewardVatLabel: REWARD_VAT_LABEL,
    brandPayout:
      confirmedSales - pgFee - platformFee - input.reward - rewardVat,
    influencer: {
      business: input.business,
      reward: input.reward,
      withholding,
      withholdingRateLabel: WITHHOLDING_LABEL,
      vat,
      vatLabel: BIZ_VAT_LABEL,
      payout: input.reward - withholding + vat,
    },
  };
}

const CONSUMERS = ["김**", "서**", "노**", "윤**", "한**"];
const QUANTITIES = [2, 1, 1, 3, 1];

/** 정산 명세 최근 5건 — 3번째는 반품(정산 반영액 0) · 5번째는 교환(반영) */
function statementOf(input: {
  itemName: string;
  unitPrice: number;
  orderNos: Array<string>;
  totalCount: number;
  returnCount: number;
  exchangeCount: number;
  breakdown: Breakdown;
}): Statement {
  const rate = input.breakdown.reward / input.breakdown.confirmedSales;
  const rows: Array<StatementRow> = input.orderNos.map((orderNo, index) => {
    const quantity = QUANTITIES[index];
    const payment = input.unitPrice * quantity;
    const returned = index === 2;
    const exchanged = index === 4;
    const status: { label: string; tone: Tone } = returned
      ? { label: "반품 완료", tone: "NEUTRAL" }
      : exchanged
        ? { label: "교환 완료", tone: "NEUTRAL" }
        : { label: "구매확정", tone: "SUCCESS" };
    const applied = returned ? 0 : payment;
    return {
      orderNo,
      consumerMasked: CONSUMERS[index],
      itemLabel: `${input.itemName} · ${quantity}개`,
      quantity,
      payment,
      statusLabel: status.label,
      statusTone: status.tone,
      applied,
      reward: Math.round(applied * rate),
    };
  });
  return {
    totalCount: input.totalCount,
    rows,
    totalPayment: input.breakdown.totalPayment,
    totalApplied: input.breakdown.confirmedSales,
    totalReward: input.breakdown.reward,
    returnCount: input.returnCount,
    exchangeCount: input.exchangeCount,
  };
}

function orderNos(base: number): Array<string> {
  return [0, 17, 46, 52, 67].map((offset) => `ORD-${base - offset}`);
}

function evidence(
  partial: Partial<EvidenceItem> &
    Pick<EvidenceItem, "kind" | "state" | "supply">
): EvidenceItem {
  return {
    vat: 0,
    withholding: 0,
    approvalNo: null,
    inputAt: null,
    dueAt: null,
    processedAt: null,
    processorName: null,
    rejectReason: null,
    ...partial,
  };
}

function h(
  label: string,
  at: string,
  actor: string,
  tone: Tone,
  note: string | null = null
): SettlementHistoryEntry {
  return { label, at, actor, note, tone };
}

const TAX_PARTIES_BASE = {
  platformName: "SHOWROOMZ(주)",
  platformBizNo: "000-00-00000",
};

/** 상세 원본 — 분배 표 · 내비게이션은 읽을 때 만든다(`toDetail`) */
export type MockRecord = Omit<SettlementDetail, "distribution" | "navigation">;

function buildRecords(): Array<MockRecord> {
  const b1 = breakdownOf({
    totalPayment: 6_840_000,
    deductions: [140_000, 380_000, 20_000],
    reward: 630_000,
    rewardRateLabel: "10%",
    business: false,
  });
  const b2 = breakdownOf({
    totalPayment: 712_000,
    deductions: [20_000, 0, 6_000],
    reward: 102_900,
    rewardRateLabel: "15%",
    business: false,
  });
  const b3 = breakdownOf({
    totalPayment: 6_180_000,
    deductions: [280_000, 210_000, 20_000],
    reward: 567_000,
    rewardRateLabel: "10%",
    business: false,
  });
  const b4 = breakdownOf({
    totalPayment: 4_530_000,
    deductions: [120_000, 270_000, 20_000],
    reward: 412_000,
    rewardRateLabel: "10%",
    business: true,
  });
  const b5 = breakdownOf({
    totalPayment: 2_380_000,
    deductions: [90_000, 40_000, 10_000],
    reward: 268_800,
    rewardRateLabel: "12%",
    business: false,
  });
  const b6 = breakdownOf({
    totalPayment: 1_024_000,
    deductions: [0, 20_480, 0],
    reward: 150_528,
    rewardRateLabel: "15%",
    business: false,
  });
  const b7 = breakdownOf({
    totalPayment: 6_020_000,
    deductions: [160_000, 350_000, 30_000],
    reward: 548_000,
    rewardRateLabel: "10%",
    business: false,
  });
  const b8 = breakdownOf({
    totalPayment: 4_530_000,
    deductions: [120_000, 270_000, 20_000],
    reward: 412_000,
    rewardRateLabel: "10%",
    business: true,
  });
  const b9 = breakdownOf({
    totalPayment: 432_000,
    deductions: [12_800, 0, 3_600],
    reward: 62_340,
    rewardRateLabel: "15%",
    business: false,
  });

  const base = (
    settlementId: number,
    settlementNo: string,
    groupBuyTitle: string,
    brandName: string,
    showroomName: string,
    breakdown: Breakdown
  ) => ({
    settlementId,
    settlementNo,
    groupBuyTitle,
    brandName,
    showroomName,
    influencerBusiness: breakdown.influencer.business,
    confirmedSales: breakdown.confirmedSales,
    brandPayout: breakdown.brandPayout,
    influencerPayout: breakdown.influencer.payout,
    breakdown,
    adjusted: false,
    adjustment: null,
    failure: null,
    clawbacksApplied: [],
    payoutStop: null,
    influencerPayoutAt: null,
  });

  return [
    // D2 — 정산 확인 중
    {
      ...base(
        1,
        "STL-2609-017",
        "하이드라 앰플 공구",
        "퓨어네이처",
        "하린_뷰티랩",
        b1
      ),
      periodStart: "2026-08-28",
      periodEnd: "2026-09-14",
      status: "CHECKING",
      schedule: { kind: "CHECK_DUE", date: "2026-09-24" },
      ordersClosedAt: "2026-09-18T00:00:00",
      lastPurchaseConfirmedAt: "2026-09-17T21:30:00",
      checkDueAt: "2026-09-24T23:59:00",
      confirmedAt: null,
      payoutAt: null,
      evidence: [],
      fixedFee: {
        amount: 300_000,
        timingLabel: "공구 종료 후",
        contractId: null,
      },
      statement: statementOf({
        itemName: "하이드라 앰플 30ml",
        unitPrice: 38_000,
        orderNos: orderNos(24_390),
        totalCount: 180,
        returnCount: 4,
        exchangeCount: 10,
        breakdown: b1,
      }),
      taxParties: {
        ...TAX_PARTIES_BASE,
        brandBizNoMasked: "105-87-·····",
        brandTaxEmail: "tax@purenature.kr",
      },
      history: [
        h(
          "정산 회차 생성 · 금액 공개",
          "2026-09-18T00:05:00",
          "시스템",
          "INFO",
          "주문 전부 종결"
        ),
        h("주문 전부 종결", "2026-09-18T00:00:00", "시스템", "NEUTRAL"),
        h("공구 종료", "2026-09-14T23:59:00", "시스템", "NEUTRAL"),
      ],
    },
    // 지급 예정 — 브랜드 세금계산서 발행 대기(지급 무관)
    {
      ...base(
        2,
        "STL-2609-014",
        "모이스처 토너 공구",
        "무드코스메틱",
        "소연_쇼룸",
        b2
      ),
      periodStart: "2026-08-20",
      periodEnd: "2026-09-05",
      status: "SCHEDULED",
      schedule: { kind: "PAYOUT_PLANNED", date: "2026-09-18" },
      ordersClosedAt: "2026-09-09T11:20:00",
      lastPurchaseConfirmedAt: "2026-09-09T11:20:00",
      checkDueAt: "2026-09-14T23:59:00",
      confirmedAt: "2026-09-15T00:00:00",
      payoutAt: "2026-09-18",
      evidence: [
        evidence({
          kind: "WITHHOLDING_RECEIPT",
          state: "NOT_YET",
          supply: b2.reward,
          withholding: b2.influencer.withholding,
        }),
        evidence({
          kind: "BRAND_INVOICE",
          state: "ISSUE_PENDING",
          supply: b2.reward,
          vat: b2.rewardVat,
          dueAt: "2026-10-10",
        }),
      ],
      fixedFee: null,
      statement: statementOf({
        itemName: "모이스처 토너 200ml",
        unitPrice: 24_000,
        orderNos: orderNos(24_020),
        totalCount: 31,
        returnCount: 1,
        exchangeCount: 0,
        breakdown: b2,
      }),
      taxParties: {
        ...TAX_PARTIES_BASE,
        brandBizNoMasked: "220-88-·····",
        brandTaxEmail: "tax@moodcos.kr",
      },
      history: [
        h(
          "자동 확정 · 세금계산서 발행 요청",
          "2026-09-15T00:00:00",
          "시스템",
          "INFO",
          "확인 기간 경과 · 조정 요청 없음"
        ),
        h(
          "정산 회차 생성 · 금액 공개",
          "2026-09-09T11:25:00",
          "시스템",
          "INFO",
          "주문 전부 종결"
        ),
        h("마지막 구매확정", "2026-09-09T11:20:00", "소비자", "NEUTRAL"),
      ],
    },
    // D3 · D3-b — 지급 예정(자동 확정) · 차감 반영 · 주민번호 미등록(L5)
    {
      ...base(
        3,
        "STL-2609-011",
        "데일리 선크림 공구",
        "데일리랩",
        "하린_뷰티랩",
        b3
      ),
      periodStart: "2026-08-14",
      periodEnd: "2026-08-31",
      status: "SCHEDULED",
      schedule: { kind: "PAYOUT_PLANNED", date: "2026-09-18" },
      ordersClosedAt: "2026-09-09T14:02:00",
      lastPurchaseConfirmedAt: "2026-09-09T14:02:00",
      checkDueAt: "2026-09-11T23:59:00",
      confirmedAt: "2026-09-12T00:00:00",
      payoutAt: "2026-09-18",
      clawbacksApplied: [
        {
          clawbackNo: "CLW-0006",
          productTitle: "데일리 선크림",
          orderNo: "ORD-23987",
          reason: "위해성 리콜 환불",
          originSettlementNo: "STL-2608-012",
          brandAmount: 13_920,
          rewardAmount: 1_600,
        },
      ],
      evidence: [
        evidence({
          kind: "WITHHOLDING_RECEIPT",
          state: "RRN_MISSING",
          supply: b3.reward,
          withholding: b3.influencer.withholding,
        }),
        evidence({
          kind: "BRAND_INVOICE",
          state: "ISSUE_PENDING",
          supply: b3.reward,
          vat: b3.rewardVat,
          dueAt: "2026-10-10",
        }),
      ],
      fixedFee: {
        amount: 250_000,
        timingLabel: "공구 게시물 등록 후",
        contractId: null,
      },
      statement: statementOf({
        itemName: "데일리 선크림 50ml",
        unitPrice: 18_900,
        orderNos: orderNos(24_210),
        totalCount: 318,
        returnCount: 15,
        exchangeCount: 11,
        breakdown: b3,
      }),
      taxParties: {
        ...TAX_PARTIES_BASE,
        brandBizNoMasked: "313-86-·····",
        brandTaxEmail: "tax@dailylab.kr",
      },
      history: [
        h(
          "자동 확정 · 세금계산서 발행 요청",
          "2026-09-12T00:00:00",
          "시스템",
          "INFO",
          "확인 기간 경과 · 조정 요청 없음"
        ),
        h(
          "정산 회차 생성 · 금액 공개",
          "2026-09-09T14:05:00",
          "시스템",
          "INFO",
          "주문 전부 종결 · 차감 CLW-0006 반영"
        ),
        h("마지막 구매확정", "2026-09-09T14:02:00", "소비자", "NEUTRAL"),
      ],
    },
    // D7 — 지급 예정 · 증빙 처리 필요(사업자)
    {
      ...base(
        4,
        "STL-2609-012",
        "클렌징 밤 앵콜 공구",
        "퓨어랩",
        "민재_셀렉트",
        b4
      ),
      periodStart: "2026-08-25",
      periodEnd: "2026-09-20",
      status: "SCHEDULED",
      schedule: { kind: "PAYOUT_PLANNED", date: "2026-10-13" },
      ordersClosedAt: "2026-09-30T16:10:00",
      lastPurchaseConfirmedAt: "2026-09-30T16:10:00",
      checkDueAt: "2026-10-06T23:59:00",
      confirmedAt: "2026-10-07T00:00:00",
      payoutAt: "2026-10-13",
      evidence: [
        evidence({
          kind: "INFLUENCER_INVOICE",
          state: "CHECK_PENDING",
          supply: b4.reward,
          vat: b4.influencer.vat,
          approvalNo: "20261009-41000000-0000-8817",
          inputAt: "2026-10-09T15:40:00",
        }),
        evidence({
          kind: "BRAND_INVOICE",
          state: "ISSUE_PENDING",
          supply: b4.reward,
          vat: b4.rewardVat,
          dueAt: "2026-11-10",
        }),
      ],
      fixedFee: {
        amount: 350_000,
        timingLabel: "공구 게시물 등록 후",
        contractId: null,
      },
      statement: statementOf({
        itemName: "클렌징 밤 100ml",
        unitPrice: 32_000,
        orderNos: orderNos(24_460),
        totalCount: 141,
        returnCount: 4,
        exchangeCount: 8,
        breakdown: b4,
      }),
      taxParties: {
        ...TAX_PARTIES_BASE,
        brandBizNoMasked: "214-81-·····",
        brandTaxEmail: "tax@purelab.kr",
      },
      history: [
        h(
          "세금계산서 승인번호 입력",
          "2026-10-09T15:40:00",
          "민재_셀렉트(쇼룸 스튜디오)",
          "INFO"
        ),
        h(
          "자동 확정 · 세금계산서 발행 요청",
          "2026-10-07T00:00:00",
          "시스템",
          "INFO",
          "확인 기간 경과 · 조정 요청 없음"
        ),
        h(
          "정산 회차 생성 · 금액 공개",
          "2026-09-30T16:15:00",
          "시스템",
          "INFO",
          "주문 전부 종결"
        ),
        h("마지막 구매확정", "2026-09-30T16:10:00", "소비자", "NEUTRAL"),
      ],
    },
    // D5 — 분배 실패
    {
      ...base(
        5,
        "STL-2609-009",
        "글로우 세럼 공구",
        "글로우랩",
        "하린_뷰티랩",
        b5
      ),
      periodStart: "2026-08-10",
      periodEnd: "2026-08-28",
      status: "FAILED",
      schedule: { kind: "PAID", date: "2026-09-12" },
      ordersClosedAt: "2026-09-06T10:30:00",
      lastPurchaseConfirmedAt: "2026-09-06T10:30:00",
      checkDueAt: "2026-09-08T23:59:00",
      confirmedAt: "2026-09-09T00:00:00",
      payoutAt: "2026-09-12",
      failure: {
        shareLabel: "인플루언서",
        recipientName: "하린_뷰티랩",
        amount: b5.influencer.payout,
        reason: "계좌 정보 불일치",
        returnedAt: "2026-09-12T09:04:00",
        elapsedDays: 6,
        account: INFLUENCER_ACCOUNT,
        updatedAccount: "국민 604***-**-4471",
        redistributionRequestedAt: null,
      },
      evidence: [
        evidence({
          kind: "WITHHOLDING_RECEIPT",
          state: "NOT_YET",
          supply: b5.reward,
          withholding: b5.influencer.withholding,
        }),
        evidence({
          kind: "BRAND_INVOICE",
          state: "ISSUED",
          supply: b5.reward,
          vat: b5.rewardVat,
          approvalNo: "20260915-41000000-0000-2231",
          processedAt: "2026-09-15T11:20:00",
          processorName: MOCK_OPERATOR,
        }),
      ],
      fixedFee: {
        amount: 200_000,
        timingLabel: "공구 게시물 등록 후",
        contractId: null,
      },
      statement: statementOf({
        itemName: "글로우 세럼 30ml",
        unitPrice: 29_800,
        orderNos: orderNos(24_150),
        totalCount: 79,
        returnCount: 3,
        exchangeCount: 1,
        breakdown: b5,
      }),
      taxParties: {
        ...TAX_PARTIES_BASE,
        brandBizNoMasked: "120-87-·····",
        brandTaxEmail: "tax@glowlab.kr",
      },
      history: [
        h(
          "브랜드 세금계산서 발행본 등록",
          "2026-09-15T11:20:00",
          `${MOCK_OPERATOR}(운영자)`,
          "SUCCESS"
        ),
        h(
          "분배 실패 — 인플루언서 몫 반환",
          "2026-09-12T09:04:00",
          "PG",
          "DANGER",
          "계좌 정보 불일치"
        ),
        h(
          "지급 완료 — 브랜드·플랫폼 몫",
          "2026-09-12T09:02:00",
          "PG 자동",
          "SUCCESS"
        ),
        h(
          "자동 확정 · 세금계산서 발행 요청",
          "2026-09-09T00:00:00",
          "시스템",
          "INFO",
          "확인 기간 경과 · 조정 요청 없음"
        ),
      ],
    },
    // D4 · D4-b — 조정 협의(전액 보류)
    {
      ...base(
        6,
        "STL-2609-006",
        "여름 수분 세럼 공구",
        "벨라코스",
        "소연_쇼룸",
        b6
      ),
      periodStart: "2026-08-05",
      periodEnd: "2026-08-22",
      status: "ADJUSTING",
      schedule: { kind: "AGREE_DUE", date: "2026-09-17" },
      ordersClosedAt: "2026-08-31T20:15:00",
      lastPurchaseConfirmedAt: "2026-08-31T20:15:00",
      checkDueAt: "2026-09-03T23:59:00",
      confirmedAt: null,
      payoutAt: null,
      adjusted: true,
      adjustment: {
        requesterName: "소연_쇼룸",
        requestedAt: "2026-09-03T14:10:00",
        originalReward: b6.reward,
        originalInfluencerPayout: b6.influencer.payout,
        originalBrandPayout: b6.brandPayout,
        requestedReward: 180_528,
        requestReason: "사전 제공 샘플 12개 미도착(반송) · 직접 구매",
        counter: {
          proposerName: "벨라코스",
          proposedAt: "2026-09-07T10:30:00",
          reward: 165_528,
          reason: "12개 중 6개 재발송 도착 · 절반 보전",
        },
        progressLabel: "소연_쇼룸 응답 대기",
        agreeDueAt: "2026-09-17T23:59:00",
      },
      evidence: [],
      fixedFee: {
        amount: 150_000,
        timingLabel: "공구 게시물 등록 후",
        contractId: null,
      },
      statement: statementOf({
        itemName: "여름 수분 세럼 50ml",
        unitPrice: 25_600,
        orderNos: orderNos(23_960),
        totalCount: 40,
        returnCount: 0,
        exchangeCount: 1,
        breakdown: b6,
      }),
      taxParties: {
        ...TAX_PARTIES_BASE,
        brandBizNoMasked: "511-86-·····",
        brandTaxEmail: "tax@bellacos.kr",
      },
      history: [
        h(
          "정산 조정 요청 · 이슈 스레드 개설 · 전액 보류",
          "2026-09-03T14:10:00",
          "시스템",
          "WARNING",
          `소연_쇼룸 요청 · 리워드 150,528 → 180,528원`
        ),
        h(
          "정산 회차 생성 · 금액 공개",
          "2026-08-31T20:20:00",
          "시스템",
          "INFO",
          "주문 전부 종결"
        ),
        h("마지막 구매확정", "2026-08-31T20:15:00", "소비자", "NEUTRAL"),
      ],
    },
    // D1 · D1-b — 지급 완료 · 비사업자
    {
      ...base(
        7,
        "STL-2608-021",
        "글로우 크림 앵콜 공구",
        "글로우랩",
        "글로우_지민",
        b7
      ),
      periodStart: "2026-08-01",
      periodEnd: "2026-08-25",
      status: "PAID",
      schedule: { kind: "PAID", date: "2026-08-31" },
      ordersClosedAt: "2026-08-25T18:40:00",
      lastPurchaseConfirmedAt: "2026-08-25T18:40:00",
      checkDueAt: "2026-08-27T23:59:00",
      confirmedAt: "2026-08-28T00:00:00",
      payoutAt: "2026-08-31",
      evidence: [
        evidence({
          kind: "WITHHOLDING_RECEIPT",
          state: "ISSUED",
          supply: b7.reward,
          withholding: b7.influencer.withholding,
          processedAt: "2026-08-31T09:05:00",
          processorName: "시스템",
        }),
        evidence({
          kind: "BRAND_INVOICE",
          state: "ISSUED",
          supply: b7.reward,
          vat: b7.rewardVat,
          approvalNo: "20260905-41000000-0000-1184",
          processedAt: "2026-09-05T10:12:00",
          processorName: MOCK_OPERATOR,
        }),
      ],
      fixedFee: {
        amount: 400_000,
        timingLabel: "공구 게시물 등록 후",
        contractId: null,
      },
      statement: statementOf({
        itemName: "글로우 크림 50ml",
        unitPrice: 27_200,
        orderNos: [
          "ORD-24118",
          "ORD-24101",
          "ORD-24072",
          "ORD-24066",
          "ORD-24051",
        ],
        totalCount: 212,
        returnCount: 6,
        exchangeCount: 12,
        breakdown: b7,
      }),
      taxParties: {
        ...TAX_PARTIES_BASE,
        brandBizNoMasked: "120-87-·····",
        brandTaxEmail: "tax@glowlab.kr",
      },
      history: [
        h(
          "브랜드 세금계산서 발행본 등록",
          "2026-09-05T10:12:00",
          `${MOCK_OPERATOR}(운영자)`,
          "SUCCESS"
        ),
        h("원천징수영수증 발급", "2026-08-31T09:05:00", "시스템", "NEUTRAL"),
        h(
          "지급 완료 — 3자 분배 정상",
          "2026-08-31T09:02:00",
          "PG 자동",
          "SUCCESS"
        ),
        h(
          "자동 확정 · 세금계산서 발행 요청",
          "2026-08-28T00:00:00",
          "시스템",
          "INFO",
          "확인 기간 경과 · 조정 요청 없음"
        ),
        h("마지막 구매확정", "2026-08-25T18:40:00", "소비자", "NEUTRAL"),
      ],
    },
    // D6 — 지급 완료 · 사업자
    {
      ...base(8, "STL-2608-015", "클렌징 밤 공구", "퓨어랩", "민재_셀렉트", b8),
      periodStart: "2026-07-18",
      periodEnd: "2026-08-12",
      status: "PAID",
      schedule: { kind: "PAID", date: "2026-08-18" },
      ordersClosedAt: "2026-08-12T13:00:00",
      lastPurchaseConfirmedAt: "2026-08-12T13:00:00",
      checkDueAt: "2026-08-14T23:59:00",
      confirmedAt: "2026-08-15T00:00:00",
      payoutAt: "2026-08-18",
      clawbacksApplied: [
        {
          clawbackNo: "CLW-0003",
          productTitle: "퓨어랩 립밤",
          orderNo: "ORD-23410",
          reason: "확정 후 하자 반품",
          originSettlementNo: "STL-2607-008",
          brandAmount: 11_238,
          rewardAmount: 0,
        },
      ],
      evidence: [
        evidence({
          kind: "INFLUENCER_INVOICE",
          state: "CHECKED",
          supply: b8.reward,
          vat: b8.influencer.vat,
          approvalNo: "20260814-41000000-0000-5520",
          inputAt: "2026-08-14T14:22:00",
          processedAt: "2026-08-16T10:30:00",
          processorName: MOCK_OPERATOR,
        }),
        evidence({
          kind: "BRAND_INVOICE",
          state: "ISSUED",
          supply: b8.reward,
          vat: b8.rewardVat,
          approvalNo: "20260820-41000000-0000-0912",
          processedAt: "2026-08-20T15:00:00",
          processorName: MOCK_OPERATOR,
        }),
      ],
      fixedFee: {
        amount: 350_000,
        timingLabel: "공구 게시물 등록 후",
        contractId: null,
      },
      statement: statementOf({
        itemName: "클렌징 밤 100ml",
        unitPrice: 32_000,
        orderNos: orderNos(23_880),
        totalCount: 141,
        returnCount: 4,
        exchangeCount: 8,
        breakdown: b8,
      }),
      taxParties: {
        ...TAX_PARTIES_BASE,
        brandBizNoMasked: "214-81-·····",
        brandTaxEmail: "tax@purelab.kr",
      },
      history: [
        h(
          "브랜드 세금계산서 발행본 등록",
          "2026-08-20T15:00:00",
          `${MOCK_OPERATOR}(운영자)`,
          "SUCCESS"
        ),
        h(
          "지급 완료 — 3자 분배 정상",
          "2026-08-18T09:02:00",
          "PG 자동",
          "SUCCESS"
        ),
        h(
          "세금계산서 대조 확인",
          "2026-08-16T10:30:00",
          `${MOCK_OPERATOR}(운영자)`,
          "SUCCESS"
        ),
        h(
          "자동 확정 · 세금계산서 발행 요청",
          "2026-08-15T00:00:00",
          "시스템",
          "INFO",
          "확인 기간 경과 · 조정 요청 없음 · 차감 CLW-0003 반영"
        ),
        h(
          "세금계산서 승인번호 입력",
          "2026-08-14T14:22:00",
          "민재_셀렉트(쇼룸 스튜디오)",
          "INFO"
        ),
      ],
    },
    // 지급 완료 · 비사업자(고정 지급비 없는 계약)
    {
      ...base(
        9,
        "STL-2607-008",
        "퓨어랩 립밤 공구",
        "퓨어랩",
        "라온_뷰티노트",
        b9
      ),
      periodStart: "2026-07-01",
      periodEnd: "2026-07-18",
      status: "PAID",
      schedule: { kind: "PAID", date: "2026-07-28" },
      ordersClosedAt: "2026-07-22T09:10:00",
      lastPurchaseConfirmedAt: "2026-07-22T09:10:00",
      checkDueAt: "2026-07-24T23:59:00",
      confirmedAt: "2026-07-25T00:00:00",
      payoutAt: "2026-07-28",
      evidence: [
        evidence({
          kind: "WITHHOLDING_RECEIPT",
          state: "ISSUED",
          supply: b9.reward,
          withholding: b9.influencer.withholding,
          processedAt: "2026-07-28T09:05:00",
          processorName: "시스템",
        }),
        evidence({
          kind: "BRAND_INVOICE",
          state: "ISSUED",
          supply: b9.reward,
          vat: b9.rewardVat,
          approvalNo: "20260803-41000000-0000-0457",
          processedAt: "2026-08-03T14:40:00",
          processorName: MOCK_OPERATOR,
        }),
      ],
      fixedFee: null,
      statement: statementOf({
        itemName: "퓨어랩 립밤 4g",
        unitPrice: 8_900,
        orderNos: orderNos(23_520),
        totalCount: 48,
        returnCount: 2,
        exchangeCount: 0,
        breakdown: b9,
      }),
      taxParties: {
        ...TAX_PARTIES_BASE,
        brandBizNoMasked: "214-81-·····",
        brandTaxEmail: "tax@purelab.kr",
      },
      history: [
        h(
          "브랜드 세금계산서 발행본 등록",
          "2026-08-03T14:40:00",
          `${MOCK_OPERATOR}(운영자)`,
          "SUCCESS"
        ),
        h("원천징수영수증 발급", "2026-07-28T09:05:00", "시스템", "NEUTRAL"),
        h(
          "지급 완료 — 3자 분배 정상",
          "2026-07-28T09:02:00",
          "PG 자동",
          "SUCCESS"
        ),
        h(
          "자동 확정 · 세금계산서 발행 요청",
          "2026-07-25T00:00:00",
          "시스템",
          "INFO",
          "확인 기간 경과 · 조정 요청 없음"
        ),
        h("마지막 구매확정", "2026-07-22T09:10:00", "소비자", "NEUTRAL"),
      ],
    },
  ];
}

function buildClawbacks(): Array<Clawback> {
  return [
    {
      clawbackId: 7,
      clawbackNo: "CLW-0007",
      originSettlementNo: "STL-2609-003",
      originSettlementId: null,
      productTitle: "글로우 세럼",
      orderNo: "ORD-24112",
      brandName: "글로우코스",
      showroomName: "하린_뷰티랩",
      reason: "확정 후 하자 반품(운영자 개설)",
      occurredAt: "2026-10-02T15:20:00",
      brand: { amount: 38_250, state: "PENDING", appliedSettlementNo: null },
      reward: { amount: 5_400, state: "PENDING", appliedSettlementNo: null },
      status: "PENDING",
      appliedSettlementNo: null,
      unrecoveredReason: null,
    },
    {
      clawbackId: 6,
      clawbackNo: "CLW-0006",
      originSettlementNo: "STL-2608-012",
      originSettlementId: null,
      productTitle: "데일리 선크림",
      orderNo: "ORD-23987",
      brandName: "데일리랩",
      showroomName: "하린_뷰티랩",
      reason: "위해성 리콜 환불",
      occurredAt: "2026-09-05T11:00:00",
      brand: {
        amount: 13_920,
        state: "APPLIED",
        appliedSettlementNo: "STL-2609-011",
      },
      reward: {
        amount: 1_600,
        state: "APPLIED",
        appliedSettlementNo: "STL-2609-011",
      },
      status: "APPLIED",
      appliedSettlementNo: "STL-2609-011",
      unrecoveredReason: null,
    },
    {
      clawbackId: 3,
      clawbackNo: "CLW-0003",
      originSettlementNo: "STL-2607-008",
      originSettlementId: 9,
      productTitle: "퓨어랩 립밤",
      orderNo: "ORD-23410",
      brandName: "퓨어랩",
      showroomName: "라온_뷰티노트",
      reason: "확정 후 하자 반품",
      occurredAt: "2026-08-10T16:45:00",
      brand: {
        amount: 11_238,
        state: "APPLIED",
        appliedSettlementNo: "STL-2608-015",
      },
      reward: {
        amount: 2_094,
        state: "UNRECOVERED",
        appliedSettlementNo: null,
      },
      status: "UNRECOVERED",
      appliedSettlementNo: null,
      unrecoveredReason: "인플루언서 탈퇴",
    },
  ];
}

/** 개발 서버 시나리오 — 서비스 파일 상단 주석 참고 */
export function buildMockStore(scenario: string | null): {
  records: Array<MockRecord>;
  clawbacks: Array<Clawback>;
} {
  if (scenario === "settlement-empty") {
    return { records: [], clawbacks: [] };
  }
  const records = buildRecords();
  if (scenario === "settlement-evidence-done") {
    for (const record of records) {
      record.evidence = record.evidence.map((item) => {
        if (item.state === "ISSUE_PENDING") {
          return {
            ...item,
            state: "ISSUED",
            approvalNo: "20261010-41000000-0000-0001",
            processedAt: "2026-10-10T10:00:00",
            processorName: MOCK_OPERATOR,
          };
        }
        if (item.state === "CHECK_PENDING") {
          return {
            ...item,
            state: "CHECKED",
            processedAt: "2026-10-10T10:00:00",
            processorName: MOCK_OPERATOR,
          };
        }
        if (item.state === "RRN_MISSING") {
          return { ...item, state: "NOT_YET" };
        }
        return item;
      });
    }
  }
  if (scenario === "settlement-payout-stop") {
    const target = records.find((record) => record.settlementId === 2);
    if (target) target.payoutStop = { party: "BRAND" };
  }
  return { records, clawbacks: buildClawbacks() };
}

// ── 읽을 때 만드는 값 ────────────────────────────────

export function influencerHeld(record: MockRecord): boolean {
  return record.evidence.some(
    (item) =>
      item.state === "CHECK_PENDING" ||
      item.state === "REJECTED" ||
      item.state === "RRN_MISSING"
  );
}

/** 3자 분배 표 — 정산 확인 중은 「자동 확정 후 표시」라 null */
export function distributionOf(record: MockRecord): Distribution | null {
  if (record.status === "CHECKING") return null;
  const { breakdown } = record;
  const platformAmount =
    breakdown.platformFee +
    (breakdown.influencer.business ? 0 : breakdown.rewardVat);

  const shareStatus = (
    role: "BRAND" | "INFLUENCER" | "PLATFORM"
  ): DistributionRow["status"] => {
    if (role === "PLATFORM" && platformAmount === 0) {
      return { kind: "BADGE", label: PLATFORM_NONE_LABEL, tone: "NEUTRAL" };
    }
    if (record.payoutStop && record.payoutStop.party === role) {
      return { kind: "BADGE", label: "지급 정지", tone: "WARNING" };
    }
    switch (record.status) {
      case "ADJUSTING":
        return { kind: "BADGE", label: "보류 — 지급 정지", tone: "WARNING" };
      case "SCHEDULED":
        if (role === "INFLUENCER" && influencerHeld(record)) {
          return { kind: "BADGE", label: "지급 보류", tone: "WARNING" };
        }
        return { kind: "BADGE", label: "지급 예정", tone: "NEUTRAL" };
      case "FAILED":
        if (role === "INFLUENCER") {
          return record.failure?.redistributionRequestedAt
            ? { kind: "BADGE", label: "재분배 요청 — PG 처리 중", tone: "INFO" }
            : { kind: "BADGE", label: "분배 실패", tone: "DANGER" };
        }
        return { kind: "BADGE", label: "지급 완료", tone: "SUCCESS" };
      default:
        return { kind: "BADGE", label: "지급 완료", tone: "SUCCESS" };
    }
  };

  const rows: Array<DistributionRow> = [
    {
      role: "BRAND",
      name: record.brandName,
      amount: breakdown.brandPayout,
      account: BRAND_ACCOUNT,
      status: shareStatus("BRAND"),
    },
    {
      role: "INFLUENCER",
      name: record.showroomName,
      amount: breakdown.influencer.payout,
      account: INFLUENCER_ACCOUNT,
      status: shareStatus("INFLUENCER"),
    },
    {
      role: "PLATFORM",
      name: "SHOWROOMZ",
      amount: platformAmount,
      account: "—",
      status: shareStatus("PLATFORM"),
    },
    {
      role: "PG",
      name: "PG사",
      amount: breakdown.pgFee,
      account: "결제금 선차감",
      status: { kind: "TEXT", label: "자동 차감" },
    },
  ];
  return {
    rows,
    total: rows.reduce((sum, row) => sum + row.amount, 0),
    withholding: breakdown.influencer.withholding,
  };
}

/** 주말을 건너뛴 영업일 더하기(목업 — 공휴일 달력은 서버 소관) */
export function addBusinessDays(from: dayjs.Dayjs, days: number): dayjs.Dayjs {
  let cursor = from;
  let left = days;
  while (left > 0) {
    cursor = cursor.add(1, "day");
    if (cursor.day() !== 0 && cursor.day() !== 6) left -= 1;
  }
  return cursor;
}
