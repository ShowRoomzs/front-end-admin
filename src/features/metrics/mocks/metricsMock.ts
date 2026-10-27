/*
  운영 지표 DEV 목업 — 백엔드 배포 후 삭제(`services/adminMetricsService.ts`의 분기와 함께).
  값 · 문구는 시안 ui-admin-21-metrics rev.5 K1~K6를 서버 응답 모양(AdminMetricsDto)으로 옮긴 것이다.
  행 라벨 · 설명은 서버 `MetricKey` 라벨 · `MetricsFactsCalculator` 설명 규칙을 따른다.
  한 달(M1)과 직접 선택(K6 · 9월)은 시안 값, 오늘 · 7일 · 6개월은 같은 표 값에 기간 · 막대만 바꾼다.
*/
import type {
  AdminMetrics,
  MetricsChart,
  MetricsPeriod,
  MetricsPeriodParams,
  MetricsQueryParams,
  MetricsRow,
  MetricsTab,
  MetricsTabBadge,
} from "@/features/metrics/types";
import dayjs, { type Dayjs } from "dayjs";

type Kind = "GOOD" | "BAD" | "NEUTRAL";

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function row(
  key: string,
  label: string,
  note: string,
  valueType: string,
  current: number | null,
  previous: number | null,
  deltaKind: Kind,
  extra: Partial<MetricsRow> = {}
): MetricsRow {
  return {
    key,
    label,
    note,
    valueType,
    current,
    previous,
    delta:
      current == null || previous == null ? null : round1(current - previous),
    deltaKind,
    currentCount: null,
    previousCount: null,
    currentBreakdown: null,
    previousBreakdown: null,
    ...extra,
  };
}

// ── 시안 K1 · K6 핵심 ────────────────────────────────────────────────

function coreRows(september: boolean): Array<MetricsRow> {
  return september
    ? [
        row(
          "GMV",
          "공구 거래액",
          "결제 시점 · 취소 포함",
          "AMOUNT",
          24_610_000,
          21_940_000,
          "GOOD"
        ),
        row("ORDERS", "주문", "결제 완료 공구 주문", "COUNT", 561, 512, "GOOD"),
        row(
          "GMV_MEDIAN",
          "공구당 거래액(중앙값)",
          "중앙값 · 9건",
          "AMOUNT",
          2_430_000,
          2_610_000,
          "BAD"
        ),
        row(
          "FEE_REVENUE",
          "플랫폼 수수료 수익(예상)",
          "베타 0% · 정상 요율 2% 적용 시",
          "AMOUNT",
          492_200,
          438_800,
          "GOOD"
        ),
        row(
          "RETURN_EXCHANGE_RATE",
          "반품 · 교환율",
          "반품 · 교환 접수 ÷ 배송완료",
          "RATE",
          3.6,
          3.9,
          "GOOD",
          { currentCount: "20/556", previousCount: "21/538" }
        ),
      ]
    : [
        row(
          "GMV",
          "공구 거래액",
          "결제 시점 · 취소 포함",
          "AMOUNT",
          18_240_000,
          16_228_000,
          "GOOD"
        ),
        row("ORDERS", "주문", "결제 완료 공구 주문", "COUNT", 412, 381, "GOOD"),
        row(
          "GMV_MEDIAN",
          "공구당 거래액(중앙값)",
          "중앙값 · 8건",
          "AMOUNT",
          2_190_000,
          2_540_000,
          "BAD"
        ),
        row(
          "FEE_REVENUE",
          "플랫폼 수수료 수익(예상)",
          "베타 0% · 정상 요율 2% 적용 시",
          "AMOUNT",
          364_800,
          324_560,
          "GOOD"
        ),
        row(
          "RETURN_EXCHANGE_RATE",
          "반품 · 교환율",
          "반품 · 교환 접수 ÷ 배송완료",
          "RATE",
          3.2,
          3.6,
          "GOOD",
          { currentCount: "11/344", previousCount: "12/333" }
        ),
      ];
}

function coreCards(september: boolean): Array<MetricsRow> {
  return september
    ? [
        row(
          "ACTIVE_CREATORS",
          "활성 인플루언서",
          "기간 중 결제가 1건 이상 있는 공구의 인플루언서",
          "COUNT",
          6,
          5,
          "GOOD"
        ),
        row(
          "MIN_QUANTITY_RATE",
          "최소 물량 달성률",
          "기간 중 종료된 공구 중 판매 수량(취소 제외) ≥ 최소 준비 물량",
          "RATE",
          71.4,
          60.0,
          "GOOD",
          { currentCount: "5/7", previousCount: "3/5" }
        ),
        row(
          "FOLLOWER_CONVERSION",
          "팔로워 → 구매 전환율",
          "공구 구매 소비자 ÷ 진행 쇼룸 팔로워",
          "RATE",
          1.9,
          1.7,
          "GOOD"
        ),
        row(
          "BRAND_FAULT_RETURN_RATE",
          "브랜드 귀책 반품률",
          "브랜드 귀책 반품 ÷ 배송완료",
          "RATE",
          1.4,
          1.7,
          "GOOD",
          { currentCount: "8/556", previousCount: "9/538" }
        ),
      ]
    : [
        row(
          "ACTIVE_CREATORS",
          "활성 인플루언서",
          "기간 중 결제가 1건 이상 있는 공구의 인플루언서",
          "COUNT",
          5,
          4,
          "GOOD"
        ),
        row(
          "MIN_QUANTITY_RATE",
          "최소 물량 달성률",
          "기간 중 종료된 공구 중 판매 수량(취소 제외) ≥ 최소 준비 물량",
          "RATE",
          75.0,
          66.7,
          "GOOD",
          { currentCount: "6/8", previousCount: "4/6" }
        ),
        row(
          "FOLLOWER_CONVERSION",
          "팔로워 → 구매 전환율",
          "공구 구매 소비자 ÷ 진행 쇼룸 팔로워",
          "RATE",
          2.0,
          1.8,
          "GOOD"
        ),
        row(
          "BRAND_FAULT_RETURN_RATE",
          "브랜드 귀책 반품률",
          "브랜드 귀책 반품 ÷ 배송완료",
          "RATE",
          1.2,
          1.6,
          "GOOD",
          { currentCount: "5/412", previousCount: "6/375" }
        ),
      ];
}

// ── 시안 K2~K5 ──────────────────────────────────────────────────────

const SUPPLY_ROWS: Array<MetricsRow> = [
  row(
    "ACTIVE_CREATORS",
    "활성 인플루언서",
    "기간 중 공구 1건 이상 · 신규 1 · 재공구 4",
    "COUNT",
    5,
    4,
    "GOOD"
  ),
  row(
    "ACTIVE_BRANDS",
    "활성 브랜드",
    "기간 중 공구 1건 이상 · 신규 1 · 재공구 5",
    "COUNT",
    6,
    5,
    "GOOD"
  ),
  row(
    "CREATOR_REGROUPBUY_RATE",
    "인플루언서 재공구율",
    "종료 공구 중 60일 안에 다음 공구를 시작한 비율",
    "RATE",
    66.7,
    60.0,
    "GOOD",
    { currentCount: "4/6", previousCount: "3/5" }
  ),
  row(
    "BRAND_RECONTRACT_RATE",
    "브랜드 재계약률",
    "기간 중 체결한 브랜드 중 이전 체결이 있는 비율",
    "RATE",
    50.0,
    40.0,
    "GOOD",
    { currentCount: "3/6", previousCount: "2/5" }
  ),
  row(
    "CONNECTION_CONVERSION",
    "연결 → 체결 전환율",
    "기간 중 요청된 연결 중 그 연결로 체결된 비율",
    "RATE",
    54.5,
    57.1,
    "BAD",
    { currentCount: "6/11", previousCount: "4/7" }
  ),
  row(
    "CONCLUDE_TO_OPEN_DAYS",
    "체결 → 오픈 소요(중앙값)",
    "기간 중 오픈한 공구",
    "DAYS",
    9.2,
    11.5,
    "GOOD"
  ),
  row(
    "NEW_ONBOARDING",
    "신규 입점",
    "브랜드 · 인플루언서 입점 승인",
    "COUNT",
    4,
    3,
    "NEUTRAL",
    { currentBreakdown: "1곳 · 3명", previousBreakdown: "2곳 · 1명" }
  ),
];

const GROUP_BUY_ROWS: Array<MetricsRow> = [
  row(
    "GROUP_BUYS_RUN",
    "진행한 공구",
    "진행 중 6 · 종료 2",
    "COUNT",
    8,
    6,
    "GOOD"
  ),
  row(
    "GMV_MEDIAN",
    "공구당 거래액(중앙값)",
    "중앙값 · 8건",
    "AMOUNT",
    2_190_000,
    2_540_000,
    "BAD"
  ),
  row(
    "MIN_QUANTITY_RATE",
    "최소 물량 달성률",
    "기간 중 종료된 공구 중 판매 수량(취소 제외) ≥ 최소 준비 물량",
    "RATE",
    75.0,
    66.7,
    "GOOD",
    { currentCount: "6/8", previousCount: "4/6" }
  ),
  row(
    "BRAND_ROI",
    "브랜드 ROI(중앙값)",
    "거래액 ÷ (리워드 + 고정 지급비) · 정산 전이면 리워드율로 추정",
    "RATIO",
    7.6,
    6.9,
    "GOOD"
  ),
  row("SUSPENSIONS", "중단", "신청 0 · 직권 0", "COUNT", 0, 1, "GOOD"),
  row(
    "OPEN_REVIEW_DAYS",
    "오픈 승인 소요",
    "SLA 3영업일 · 초과 0건",
    "DAYS",
    1.4,
    1.9,
    "GOOD"
  ),
];

const DEMAND_ROWS: Array<MetricsRow> = [
  row(
    "BUYERS",
    "구매 소비자",
    "결제한 소비자(중복 제거)",
    "COUNT",
    356,
    331,
    "GOOD"
  ),
  row(
    "BUYERS_MEDIAN",
    "공구당 구매 소비자(중앙값)",
    "공구별 구매 소비자 수의 중앙값",
    "COUNT",
    41,
    48,
    "BAD"
  ),
  row(
    "FOLLOWER_CONVERSION",
    "팔로워 → 구매 전환율",
    "공구 구매 소비자 ÷ 진행 쇼룸 팔로워",
    "RATE",
    2.0,
    1.8,
    "GOOD"
  ),
  row(
    "REPURCHASE_RATE",
    "재구매율",
    "이전 구매 이력이 있는 구매 소비자",
    "RATE",
    18.3,
    16.9,
    "GOOD",
    { currentCount: "65/356", previousCount: "56/331" }
  ),
  row(
    "NEW_CONSUMERS",
    "신규 소비자",
    "카카오 128 · 네이버 51 · Apple 35 · 그 외 0",
    "COUNT",
    214,
    197,
    "GOOD"
  ),
  row(
    "CONSUMER_WITHDRAWALS",
    "소비자 탈퇴",
    "상태 이력 기준",
    "COUNT",
    7,
    5,
    "BAD"
  ),
];

const OPERATION_ROWS: Array<MetricsRow> = [
  row(
    "BRAND_FAULT_RETURN_RATE",
    "브랜드 귀책 반품률",
    "브랜드 귀책 반품 ÷ 배송완료",
    "RATE",
    1.2,
    1.6,
    "GOOD",
    { currentCount: "5/412", previousCount: "6/375" }
  ),
  row(
    "ADJUSTMENT_REQUEST_RATE",
    "정산 조정 요청률",
    "6건 중 1건 · 합의 대기 1건",
    "RATE",
    16.7,
    0.0,
    "BAD",
    { currentCount: "1/6", previousCount: "0/5" }
  ),
  row(
    "POST_REPORT_RATE",
    "게시물 신고율",
    "신고 18 ÷ 게시물 2,010 · 근거 서비스 운영정책 — 커뮤니티 장",
    "RATE",
    0.9,
    1.1,
    "GOOD",
    { currentCount: "18/2010", previousCount: "21/1912" }
  ),
  row("PROCESSED", "처리 완료", "하루 평균 11.6건", "COUNT", 186, 171, "GOOD"),
  row(
    "SLA_RATE",
    "SLA 준수율",
    "1:1 문의 24h · 오픈 승인 3영업일 · 입점 심사 3영업일 · 변경 요청 48h",
    "RATE",
    96.2,
    93.0,
    "GOOD",
    { currentCount: "100/104", previousCount: "93/100" }
  ),
  row(
    "INQUIRY_FIRST_ANSWER_HOURS",
    "1:1 문의 첫 답변",
    "기한 24시간 · 초과 2건",
    "HOURS",
    5.8,
    7.1,
    "GOOD"
  ),
  row(
    "REFUND_FAILURES",
    "환불 실패",
    "모두 카드 유효기간 만료",
    "COUNT",
    2,
    1,
    "BAD"
  ),
];

// ── 분해 표 ─────────────────────────────────────────────────────────

const GROUP_BUY_NAMES = [
  ["하이드라 앰플 공구", "퓨어네이처 × 하린_뷰티랩"],
  ["데일리 선크림 공구", "데일리랩 × 하린_뷰티랩"],
  ["글로우 크림 앵콜 공구", "글로우랩 × 글로우_지민"],
  ["클렌징 밤 공구", "퓨어랩 × 민재_셀렉트"],
  ["모이스처 토너 공구", "무드코스메틱 × 소연_쇼룸"],
];

function won(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function breakdown(tab: MetricsTab, september: boolean) {
  switch (tab) {
    case "SUPPLY":
      return {
        title: "인플루언서별 공구 상위 5",
        columns: ["인플루언서", "공구 수", "거래액", "누적 공구", "구분"],
        rows: [
          ["하린_뷰티랩", "3", won(9_500_000), "7", "재공구"],
          ["글로우_지민", "1", won(3_910_000), "2", "재공구"],
          ["민재_셀렉트", "1", won(2_470_000), "3", "재공구"],
          ["소연_쇼룸", "2", won(1_686_000), "4", "재공구"],
          ["라온_뷰티노트", "1", won(415_600), "1", "첫 공구"],
        ],
      };
    case "GROUP_BUY": {
      const extra = [
        ["142.0%", "9.1배"],
        ["118.0%", "8.4배"],
        ["104.0%", "7.2배"],
        ["96.0% · 미달", "6.1배"],
        ["46.0% · 미달", "2.3배"],
      ];
      const amounts = [5_120_000, 4_380_000, 3_910_000, 2_470_000, 686_000];
      return {
        title: "공구별 성과 상위 5",
        columns: ["공구", "브랜드 × 인플루언서", "거래액", "물량 달성", "ROI"],
        rows: GROUP_BUY_NAMES.map(([name, pair], index) => [
          name,
          pair,
          won(amounts[index]),
          extra[index][0],
          extra[index][1],
        ]),
      };
    }
    case "DEMAND":
      return {
        title: "쇼룸별 전환 · 구매 소비자 순 · 상위 5곳",
        columns: ["인플루언서(쇼룸)", "팔로워", "구매 소비자", "전환율"],
        rows: [
          ["하린_뷰티랩", "9800", "142", "1.4%"],
          ["글로우_지민", "3200", "84", "2.6%"],
          ["민재_셀렉트", "2150", "55", "2.6%"],
          ["소연_쇼룸", "1480", "47", "3.2%"],
          ["라온_뷰티노트", "640", "11", "1.7%"],
        ],
      };
    case "OPERATION":
      return {
        title: "큐별 처리",
        columns: ["큐", "처리", "평균 소요", "기한 초과"],
        rows: [
          ["1:1 문의 답변", "62", "5.8시간", "2"],
          ["브랜드 · 인플루언서 입점 심사", "14", "1.6영업일", "0"],
          ["오픈 승인 검토", "4", "1.4영업일", "0"],
          ["배송 예외 확인", "—", "—", "—"],
          ["신고 게시물 검토", "18", "0.7일", "—"],
          ["변경 요청 검토", "11", "1.8영업일", "2"],
        ],
      };
    default: {
      const orders = september ? [96, 140, 132, 84, 36] : [71, 104, 98, 62, 27];
      const amounts = september
        ? [6_907_000, 5_909_000, 5_275_000, 3_332_000, 925_000]
        : [5_120_000, 4_380_000, 3_910_000, 2_470_000, 686_000];
      const rates = ["1.4%", "3.8%", "2.5%", "4.2%", "7.4%"];
      return {
        title: "공구별 거래액 상위 5",
        columns: [
          "공구",
          "브랜드 × 인플루언서",
          "주문",
          "거래액",
          "반품·교환율",
        ],
        rows: GROUP_BUY_NAMES.map(([name, pair], index) => [
          name,
          pair,
          String(orders[index]),
          won(amounts[index]),
          rates[index],
        ]),
      };
    }
  }
}

// ── 기간 · 차트 ─────────────────────────────────────────────────────

/** 시안 막대 높이(%) — 이번 기간 막대만 쓴다(서버가 비교 기간 점을 내리지 않는다) */
const HEIGHTS: Record<string, Array<number>> = {
  CORE: [
    69.2, 73.2, 60.4, 69.3, 66.6, 70.1, 46.2, 90.9, 74.8, 81.0, 72.2, 85.5,
    78.6, 46.1, 69.7, 55.0,
  ],
  GROUP_BUY: [
    51.9, 51.9, 64.9, 64.9, 64.9, 64.9, 77.9, 77.9, 77.9, 77.9, 77.9, 90.9,
    77.9, 77.9, 77.9, 77.9,
  ],
  DEMAND: [
    65.7, 58.9, 90.9, 71.2, 38.6, 72.6, 44.5, 35.6, 51.4, 58.4, 85.2, 72.1,
    37.7, 66.1, 64.3, 36.1,
  ],
  OPERATION: [
    47.4, 90.9, 86.0, 77.4, 71.9, 68.4, 69.8, 76.8, 64.3, 47.1, 74.0, 42.0,
    85.7, 86.1, 78.0, 46.3,
  ],
  SEPTEMBER: [
    52.5, 55.4, 45.7, 52.5, 50.5, 53.1, 35.0, 68.9, 56.6, 61.4, 54.7, 64.8,
    59.5, 35.0, 52.8, 41.7, 75.2, 48.0, 55.4, 52.3, 39.2, 33.8, 71.4, 90.9,
    46.0, 50.5, 72.1, 39.7, 49.4, 55.0,
  ],
};

const CHART_META: Record<
  MetricsTab,
  { key: string; label: string; total: number; delta: number }
> = {
  CORE: {
    key: "GMV",
    label: "공구 거래액",
    total: 18_240_000,
    delta: 2_012_000,
  },
  SUPPLY: {
    key: "CONTRACTS_CONCLUDED",
    label: "계약 체결",
    total: 6,
    delta: 2,
  },
  GROUP_BUY: {
    key: "SELLING_GROUP_BUYS",
    label: "판매 중인 공구",
    total: 8,
    delta: 2,
  },
  DEMAND: { key: "BUYERS", label: "구매 소비자", total: 356, delta: 25 },
  OPERATION: { key: "PROCESSED", label: "처리 완료", total: 186, delta: 15 },
};

const LOCAL = "YYYY-MM-DDTHH:mm:ss";

function period(from: Dayjs, to: Dayjs): MetricsPeriod {
  const days = to.diff(from, "day");
  return {
    from: from.format(LOCAL),
    to: to.format(LOCAL),
    label: `${from.format("MM.DD")} ~ ${to.subtract(1, "day").format("MM.DD")} (${days}일)`,
  };
}

/** 높이 비율을 합계에 맞춘 값으로 — 금액은 천 원, 건수는 정수 */
function scaled(heights: Array<number>, total: number, amount: boolean) {
  const sum = heights.reduce((acc, h) => acc + h, 0) || 1;
  return heights.map((h) =>
    amount
      ? Math.round(((h / sum) * total) / 1000) * 1000
      : Math.max(0, Math.round((h / sum) * total))
  );
}

/** 「판매 중인 공구」는 날마다 센 공구 수(합계가 아니다) — 시안 막대 7칸 = 90.9% */
function sellingCounts(heights: Array<number>) {
  return heights.map((h) => Math.round((h / 90.9) * 7));
}

function buildChart(
  buckets: Array<{ start: Dayjs; label: string }>,
  heights: Array<number>,
  meta: { key: string; label: string; total: number; delta: number },
  unit: string
): MetricsChart {
  const values =
    meta.key === "SELLING_GROUP_BUYS"
      ? sellingCounts(heights)
      : scaled(heights, meta.total, meta.key === "GMV");
  return {
    metricKey: meta.key,
    label: meta.label,
    unit,
    total: meta.total,
    delta: meta.delta,
    points: buckets.map((bucket, index) => ({
      bucket: bucket.start.format(LOCAL),
      label: bucket.label,
      value: values[index % values.length] ?? 0,
    })),
  };
}

function dailyBuckets(from: Dayjs, days: number) {
  return Array.from({ length: days }, (_, index) => {
    const start = from.add(index, "day");
    return { start, label: start.format("MM.DD") };
  });
}

/** 기준 시각 — 시안 「10.17 00:00 집계 기준」 */
const BASE = dayjs("2026-10-17T00:00:00");

export function mockMetrics(
  params: MetricsQueryParams,
  scenario: string | null
): AdminMetrics {
  const { tab, preset } = params;
  const september = preset === "CUSTOM";
  const meta = { ...CHART_META[tab] };
  let current: MetricsPeriod;
  let compare: MetricsPeriod;
  let buckets: Array<{ start: Dayjs; label: string }>;
  let unit = "DAY";
  let heights = HEIGHTS[tab] ?? HEIGHTS.CORE;

  if (preset === "CUSTOM") {
    const from = dayjs(params.from ?? "2026-09-01");
    const to = dayjs(params.to ?? "2026-09-30").add(1, "day");
    const days = to.diff(from, "day");
    current = period(from, to);
    compare = period(from.subtract(days, "day"), from);
    buckets = dailyBuckets(from, days);
    if (tab === "CORE") {
      heights = HEIGHTS.SEPTEMBER;
      meta.total = 24_610_000;
      meta.delta = 2_670_000;
    }
  } else if (preset === "TODAY") {
    const now = dayjs();
    const today = now.startOf("day");
    current = { from: today.format(LOCAL), to: now.format(LOCAL), label: "" };
    compare = {
      from: today.subtract(1, "day").format(LOCAL),
      to: now.subtract(1, "day").format(LOCAL),
      label: "어제 같은 시간대",
    };
    unit = "HOUR";
    buckets = Array.from({ length: Math.max(now.hour() + 1, 1) }, (_, h) => ({
      start: today.add(h, "hour"),
      label: `${h}시`,
    }));
  } else if (preset === "M6") {
    const from = BASE.startOf("month").subtract(5, "month");
    current = period(from, BASE);
    compare = period(from.subtract(BASE.diff(from, "day"), "day"), from);
    unit = "MONTH";
    buckets = Array.from({ length: 6 }, (_, index) => {
      const start = from.add(index, "month");
      return { start, label: start.format("YYYY.MM") };
    });
  } else if (preset === "D7") {
    const from = BASE.subtract(7, "day");
    current = period(from, BASE);
    compare = period(from.subtract(7, "day"), from);
    buckets = dailyBuckets(from, 7);
  } else {
    const from = BASE.startOf("month");
    current = period(from, BASE);
    compare = period(from.subtract(1, "month"), BASE.subtract(1, "month"));
    buckets = dailyBuckets(from, BASE.diff(from, "day"));
  }

  // 공급 탭 — 계약 체결은 하루 0~1건이라 14일 이상이면 주별(서버 규칙)
  if (tab === "SUPPLY" && unit === "DAY" && buckets.length >= 14) {
    unit = "WEEK";
    const weekly: Array<{ start: Dayjs; label: string }> = [];
    buckets.forEach((bucket, index) => {
      if (index === 0 || bucket.start.day() === 1) {
        weekly.push({
          start: bucket.start,
          label: `${bucket.start.format("MM.DD")}~`,
        });
      }
    });
    buckets = weekly;
    heights = [25, 75, 50, 50, 25];
  }

  const chart = buildChart(buckets, heights, meta, unit);
  if (tab === "SUPPLY") {
    chart.points = chart.points.map((point, index) => ({
      ...point,
      value: [1, 3, 2, 2, 1][index % 5],
    }));
  }

  const rowsByTab: Record<MetricsTab, Array<MetricsRow>> = {
    CORE: coreRows(september),
    SUPPLY: SUPPLY_ROWS,
    GROUP_BUY: GROUP_BUY_ROWS,
    DEMAND: DEMAND_ROWS,
    OPERATION: OPERATION_ROWS,
  };
  const flatten = (rows: Array<MetricsRow>) =>
    scenario === "flat"
      ? rows.map((r) =>
          r.deltaKind === "BAD" ? { ...r, deltaKind: "NEUTRAL" } : r
        )
      : rows;

  return {
    preset,
    tab,
    period: current,
    compare,
    chart,
    cards: tab === "CORE" ? flatten(coreCards(september)) : null,
    rows: flatten(rowsByTab[tab]),
    breakdown: breakdown(tab, september),
    asOf: new Date().toISOString().slice(0, 19),
  };
}

export function mockMetricsTabs(
  params: MetricsPeriodParams,
  scenario: string | null
): Array<MetricsTabBadge> {
  // 시안 K1 「핵심 1 · 공급 1 · 공구 1 · 수요 2 · 운영 2」 · K6(직접 선택) 「핵심 1」만
  const counts: Record<MetricsTab, number> =
    params.preset === "CUSTOM"
      ? { CORE: 1, SUPPLY: 0, GROUP_BUY: 0, DEMAND: 0, OPERATION: 0 }
      : { CORE: 1, SUPPLY: 1, GROUP_BUY: 1, DEMAND: 2, OPERATION: 2 };
  const labels: Record<MetricsTab, string> = {
    CORE: "핵심",
    SUPPLY: "공급",
    GROUP_BUY: "공구",
    DEMAND: "수요",
    OPERATION: "운영",
  };
  return (Object.keys(counts) as Array<MetricsTab>).map((tab) => ({
    tab,
    label: labels[tab],
    worsenedCount: scenario === "flat" ? 0 : counts[tab],
  }));
}
