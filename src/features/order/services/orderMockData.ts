/*
  주문 조회 목업 데이터 — 개발 서버 전용(`common/utils/devMock.ts`). 배포본에서는 아무도 읽지 않는다.

  시안 ui-admin-06a-orders.html의 샘플 주문을 그대로 옮기고(ORD-24201 · 24198 · 24195 · 24190 · 24187 ·
  24180 · 24176 · 24166 · 24158 · 24151 · 24112), 나머지는 시안 숫자(총 142건 · 배송 이상 4 · 취소 7 ·
  상태 18/31/44/27/15/7 · 글로우코스 38건 · 처리 지연 3)에 맞춰 규칙적으로 채운다.

  ORD id → 시안 상태
    ORD-24201 B1 · B5(`?mock=recall`)   ORD-24198 B2 반송 완료   ORD-24187 B3 이의 → 정정
    ORD-24190 B4 대행 가능              ORD-24112 B6 하자 → 반품   ORD-24176 B7 취소 요청
    ORD-24158 B8 교환 진행 중
*/

import type {
  OrderActions,
  OrderAnomalyType,
  OrderBadgeData,
  OrderCancelType,
  OrderDetail,
  OrderHistoryEntry,
  OrderItemLine,
  OrderListItem,
  OrderPayMethod,
  OrderShippingCard,
  OrderStatusGroup,
  OrderSubOrder,
  OrderSubSummary,
  OrderTone,
  Rich,
  RichSeg,
} from "@/features/order/types";
import dayjs from "dayjs";

// ── 표시 조각 ───────────────────────────────────────────
const b = (t: string): RichSeg => ({ t, k: "b" });
const dim = (t: string): RichSeg => ({ t, k: "dim" });
const bdim = (t: string): RichSeg => ({ t, k: "bdim" });
const sub = (t: string): RichSeg => ({ t, k: "sub" });
const num = (t: string): RichSeg => ({ t, k: "num" });
const bwarn = (t: string): RichSeg => ({ t, k: "bwarn" });
const badge = (label: string, tone: OrderTone): RichSeg => ({
  badge: label,
  tone,
});

const st = (label: string, tone: OrderTone): OrderBadgeData => ({
  label,
  tone,
});
const INFO = (label: string) => st(label, "INFO");
const OK = (label: string) => st(label, "SUCCESS");
const WARN = (label: string) => st(label, "WARNING");
const BAD = (label: string) => st(label, "DANGER");
const GRAY = (label: string) => st(label, "NEUTRAL");

/** `MM.DD HH:mm` — 이력 meta에 들어가는 일시 */
export const md = (value: string) => dayjs(value).format("MM.DD HH:mm");

// ── 카탈로그 ────────────────────────────────────────────
export const BRANDS = [
  { id: "b1", name: "글로우코스" },
  { id: "b2", name: "데일리랩" },
  { id: "b3", name: "퓨어네이처" },
];

export const INFLUENCERS = [
  { id: "i1", name: "글로우_지민" },
  { id: "i2", name: "소연_쇼룸" },
  { id: "i3", name: "하린_뷰티랩" },
];

export const PAY_METHODS: Array<{ value: OrderPayMethod; label: string }> = [
  { value: "CARD", label: "카드" },
  { value: "KAKAOPAY", label: "카카오페이" },
  { value: "NAVERPAY", label: "네이버페이" },
  { value: "TRANSFER", label: "계좌이체" },
];

interface GroupBuyDef {
  id: string;
  title: string;
  brandId: string;
  influencerId: string;
  product: string;
  option: string;
  price: number;
}

export const GROUP_BUYS: Array<GroupBuyDef> = [
  {
    id: "g1",
    title: "글로우 크림 공구",
    brandId: "b1",
    influencerId: "i1",
    product: "글로우 크림",
    option: "50ml",
    price: 34000,
  },
  {
    id: "g2",
    title: "글로우 세럼 공구",
    brandId: "b1",
    influencerId: "i3",
    product: "글로우 세럼",
    option: "30ml",
    price: 45000,
  },
  {
    id: "g3",
    title: "클렌징 밤 공구",
    brandId: "b1",
    influencerId: "i2",
    product: "클렌징 밤",
    option: "70g",
    price: 28000,
  },
  {
    id: "g4",
    title: "톤업 쿠션 공구",
    brandId: "b1",
    influencerId: "i2",
    product: "톤업 쿠션",
    option: "21호",
    price: 32000,
  },
  {
    id: "g5",
    title: "데일리 선크림 공구",
    brandId: "b2",
    influencerId: "i2",
    product: "데일리 선크림",
    option: "50ml",
    price: 16000,
  },
  {
    id: "g6",
    title: "하이드라 앰플 공구",
    brandId: "b3",
    influencerId: "i3",
    product: "하이드라 앰플",
    option: "30ml · 3개입",
    price: 36000,
  },
  {
    id: "g7",
    title: "수분 크림 공구",
    brandId: "b3",
    influencerId: "i3",
    product: "수분 크림",
    option: "50ml",
    price: 28000,
  },
];

const brandName = (id: string) => BRANDS.find((x) => x.id === id)?.name ?? "";
const influencerName = (id: string) =>
  INFLUENCERS.find((x) => x.id === id)?.name ?? "";
const groupBuy = (id: string) => GROUP_BUYS.find((x) => x.id === id)!;

// ── 목업 레코드 ─────────────────────────────────────────
export interface MockMeta {
  consumerName: string;
  brandIds: Array<string>;
  groupBuyId: string;
  influencerId: string;
  payMethod: OrderPayMethod;
  /** 검색·중복 검사용 전체 송장번호(화면에는 마스킹해서 나간다) */
  invoiceNos: Array<string>;
  pgTxNos: Array<string>;
  anomalyType: OrderAnomalyType | null;
  /** 이상이 시작된 시각 — 「이상 지속 오래된순」 정렬 근거 */
  anomalySince: string | null;
  cancelType: OrderCancelType | null;
  delayed: boolean;
}

export interface MockOrder {
  row: OrderListItem;
  detail: OrderDetail;
  meta: MockMeta;
}

const NO_ACTIONS: OrderActions = {
  refund: false,
  forceCancel: null,
  proxyInvoice: null,
  correctDeliveredAt: null,
  openReturn: null,
};

/** 정산 반영 4칸의 흔한 조합 — 아직 정산 전 */
const settlementBefore = (
  confirm: Rich
): NonNullable<OrderDetail["settlement"]> => [
  { label: "구매확정", value: confirm },
  { label: "정산 편입", value: [badge("미편입", "NEUTRAL")] },
  { label: "정산 확정일", value: [dim("—")] },
  { label: "클로백", value: [dim("해당 없음")] },
];

const pay = (
  seed: number,
  method: OrderPayMethod
): { id: string; text: string } => {
  const hex = (seed * 7919 + 40503).toString(16).padStart(8, "0").slice(-8);
  switch (method) {
    case "CARD":
      return { id: `tosspay_${hex}`, text: "카드 · 신한 (일시불)" };
    case "KAKAOPAY":
      return { id: `kakaopay_${hex}`, text: "카카오페이" };
    case "NAVERPAY":
      return { id: `naverpay_${hex}`, text: "네이버페이" };
    default:
      return { id: `bank_${hex}`, text: "계좌이체" };
  }
};

const maskInvoice = (value: string) =>
  value.length >= 10 ? `${value.slice(0, 4)}****${value.slice(-4)}` : value;

// ── 일반 주문(시안에 상세가 없는 행) ────────────────────
interface GenericSpec {
  orderNo: string;
  paidAt: string;
  consumerName: string;
  groupBuyId: string;
  qty: number;
  group: OrderStatusGroup;
  method: OrderPayMethod;
  anomaly?: {
    type: OrderAnomalyType;
    label: string;
    tone: OrderTone;
    note: string;
    since: string;
  };
  delayed?: boolean;
  cancelType?: OrderCancelType;
}

const GROUP_STATUS: Record<OrderStatusGroup, OrderBadgeData> = {
  PAID: INFO("결제완료"),
  PREPARING: INFO("상품준비중"),
  SHIPPING: INFO("배송중"),
  DELIVERED: OK("배송완료"),
  CONFIRMED: OK("구매확정"),
  CANCELED: GRAY("취소·환불"),
};

const CANCEL_NOTE: Record<OrderCancelType, string> = {
  CONSUMER: "PG 자동 환불",
  FORCED: "직권 취소",
  RETURNED: "반송 · PG 자동 환불",
};

const maskName = (name: string) => `${name[0]}**`;

function buildGeneric(spec: GenericSpec): MockOrder {
  const gb = groupBuy(spec.groupBuyId);
  const seed = Number(spec.orderNo.slice(4));
  const amount = gb.price * spec.qty;
  const payInfo = pay(seed, spec.method);
  const invoice = `65${String(seed * 131)
    .padStart(10, "0")
    .slice(-10)}`;
  const paid = dayjs(spec.paidAt);
  const at = (hours: number) => md(paid.add(hours, "hour").format());
  const status = GROUP_STATUS[spec.group];
  const brand = brandName(gb.brandId);
  const canceled = spec.group === "CANCELED";
  const shipped =
    spec.group === "SHIPPING" ||
    spec.group === "DELIVERED" ||
    spec.group === "CONFIRMED";

  const item: OrderItemLine = {
    id: `it-${spec.orderNo}-1`,
    name: gb.product,
    option: gb.option,
    qty: spec.qty,
    status: canceled ? GRAY("취소·환불") : status,
    price: amount,
    settled: spec.group === "CONFIRMED",
  };
  const subOrder: OrderSubOrder = {
    suffix: "-01",
    brandName: brand,
    status: canceled ? GRAY("취소") : status,
    amount,
    items: [item],
  };

  const subSummary: OrderSubSummary = {
    suffix: "-01",
    brandName: brand,
    itemSummary: `${gb.product} ${gb.option} · ${spec.qty}건`,
    amount,
    status: subOrder.status,
    shipNote: shipped ? `CJ ${maskInvoice(invoice)}` : "송장 미등록",
  };

  const row: OrderListItem = {
    orderNo: spec.orderNo,
    paidAt: spec.paidAt,
    consumerMasked: maskName(spec.consumerName),
    brandLabel: brand,
    groupBuyTitle: gb.title,
    payAmount: amount,
    status,
    statusNote: spec.cancelType ? CANCEL_NOTE[spec.cancelType] : null,
    statusGroup: spec.group,
    anomaly: spec.anomaly
      ? {
          label: spec.anomaly.label,
          tone: spec.anomaly.tone,
          note: spec.anomaly.note,
        }
      : null,
    subOrders: [subSummary],
  };

  // 배송 카드
  const shipRows: OrderShippingCard["rows"] = [];
  let shipHead: Rich;
  if (canceled) {
    shipHead = [dim("송장 없음")];
  } else if (!shipped) {
    shipHead =
      spec.group === "PAID"
        ? ["송장 미등록 ", dim("· 상품 준비 전")]
        : ["송장 미등록"];
    if (spec.group === "PREPARING") {
      shipRows.push({
        label: "발송 기한",
        main: [num(paid.add(4, "day").format("YYYY.MM.DD 23:59"))],
        side: ["공구 마감 + ", b("3영업일"), "(주문 시점 값)"],
        tone: spec.delayed ? "warn" : undefined,
      });
    }
  } else {
    shipHead = ["CJ대한통운 · ", maskInvoice(invoice)];
    if (spec.group === "SHIPPING") {
      shipRows.push({
        label: "추적",
        main: ["간선 상차 ", dim(`· 갱신 ${at(30)}`)],
        side: ["송장 출처 브랜드 등록"],
      });
      if (spec.anomaly) {
        shipRows.push({
          label: "이상",
          main: [spec.anomaly.label, " ", dim(`· ${spec.anomaly.note}`)],
          side: ["택배사 상태 코드 기준"],
          tone: spec.anomaly.tone === "WARNING" ? "warn" : undefined,
        });
      }
    } else {
      shipRows.push({
        label: "추적",
        main: ["배송완료 ", num(at(60)), " ", sub("(자동 확인)")],
        side: ["최종 갱신 ", num(at(60))],
      });
      if (spec.group === "CONFIRMED") {
        shipRows.push({
          label: "구매확정",
          main: [num(md(paid.add(9, "day").format())), " 자동 (D+7)"],
          side: ["반품·교환 기간 종료"],
        });
      }
    }
  }
  const shippingCard: OrderShippingCard = {
    brandName: brand,
    status: canceled ? GRAY("취소") : status,
    head: shipHead,
    rows: shipRows,
  };

  // 이력
  const history: OrderHistoryEntry[] = [];
  if (canceled) {
    history.push({
      tone: "NEUTRAL",
      title: `${
        spec.cancelType === "FORCED"
          ? "직권 취소"
          : spec.cancelType === "RETURNED"
            ? "반송 완료"
            : "소비자 취소"
      } · PG 자동 환불 · ${amount.toLocaleString("ko-KR")}원`,
      meta: `시스템 · ${at(5)}`,
    });
  } else {
    if (spec.group === "CONFIRMED") {
      history.push({
        tone: "SUCCESS",
        title: "구매확정 (자동)",
        meta: `시스템 · 배송완료 D+7 · ${md(paid.add(9, "day").format())}`,
      });
    }
    if (spec.group === "DELIVERED" || spec.group === "CONFIRMED") {
      history.push({
        tone: "SUCCESS",
        title: "배송완료 (자동 확인)",
        meta: `시스템 · 택배사 상태 코드 ${at(60)}`,
      });
    }
    if (shipped) {
      history.push({
        tone: "INFO",
        title: "배송중 전환",
        meta: `브랜드 ${brand} · 송장 등록 ${at(26)}`,
      });
    }
    if (spec.group !== "PAID") {
      history.push({
        tone: spec.delayed ? "WARNING" : "INFO",
        title: spec.delayed
          ? "발송 기한 경과"
          : "상품준비중 전환 · 발주서 다운로드",
        meta: spec.delayed
          ? `시스템 · 공구 마감 + 3영업일(주문 시점 값) · ${at(100)}`
          : `브랜드 ${brand} · ${at(8)}`,
      });
    }
  }
  history.push({
    tone: "SUCCESS",
    title: "결제 완료",
    meta: `소비자 ${maskName(spec.consumerName)} · PG 승인 ${md(spec.paidAt)}`,
  });

  // 현재 상태 카드
  const statusRows: OrderDetail["statusCard"]["rows"] = [];
  let cardStatus = canceled ? GRAY("취소·환불") : status;
  if (canceled) {
    statusRows.push(
      {
        label: "환불",
        value: [num(`${amount.toLocaleString("ko-KR")}원`), " · 자동 완료"],
      },
      { label: "환불 일시", value: [num(at(5))] }
    );
  } else if (spec.group === "PAID") {
    statusRows.push({ label: "하위주문", value: ["결제완료 1"] });
  } else if (spec.group === "PREPARING") {
    cardStatus = spec.delayed ? WARN("상품준비중") : status;
    statusRows.push(
      spec.delayed
        ? { label: "발송기한", value: ["1일 초과"], tone: "warn" }
        : { label: "하위주문", value: ["준비중 1"] }
    );
  } else if (spec.group === "SHIPPING") {
    statusRows.push({ label: "하위주문", value: ["배송중 1"] });
    if (spec.anomaly) {
      statusRows.push({
        label: "배송 이상",
        value: [spec.anomaly.label],
        tone: spec.anomaly.tone === "WARNING" ? "warn" : undefined,
      });
    }
  } else if (spec.group === "DELIVERED") {
    statusRows.push(
      { label: "배송완료", value: [num(at(60).slice(0, 5)), " (자동 확인)"] },
      {
        label: "구매확정 예정",
        value: [num(md(paid.add(9, "day").format()).slice(0, 5))],
      }
    );
  } else {
    statusRows.push({
      label: "구매확정",
      value: [num(md(paid.add(9, "day").format()).slice(0, 5)), " 자동"],
    });
  }

  const confirmDate = md(paid.add(9, "day").format()).slice(0, 5);
  const settlement: OrderDetail["settlement"] =
    spec.group === "CONFIRMED"
      ? [
          { label: "구매확정", value: [num(confirmDate)] },
          { label: "정산 편입", value: [badge("확정", "SUCCESS")] },
          {
            label: "정산 확정일",
            value: [num(md(paid.add(16, "day").format()).slice(0, 5)), " 회차"],
          },
          { label: "클로백", value: [bwarn("환불 시 다음 정산에서 차감")] },
        ]
      : settlementBefore(
          canceled
            ? [dim("해당 없음")]
            : spec.group === "DELIVERED"
              ? ["예정 ", num(confirmDate)]
              : [dim("미도래")]
        );

  const detail: OrderDetail = {
    orderNo: spec.orderNo,
    asOf: "2026-09-16T18:00:00",
    inquiryCount: 0,
    banner: null,
    groupBuyTitle: gb.title,
    influencerName: influencerName(gb.influencerId),
    claimNote: null,
    payments: [
      {
        kind: "ORIGINAL",
        pgTxNo: payInfo.id,
        method: payInfo.text,
        amount,
        paidAt: spec.paidAt,
        cancelable: canceled ? 0 : amount,
      },
    ],
    paymentStatus: canceled ? GRAY("전체 취소") : OK("결제완료"),
    cancelableNote: canceled ? "전액 환불" : "부분 환불 없음",
    subOrders: [subOrder],
    shipping: { title: null, cards: [shippingCard], hint: null },
    settlement,
    cancelRequest: null,
    history,
    statusCard: {
      label: cardStatus.label,
      tone: cardStatus.tone,
      rows: statusRows,
    },
    actions: canceled
      ? NO_ACTIONS
      : {
          ...NO_ACTIONS,
          refund: spec.group === "SHIPPING" || spec.group === "DELIVERED",
          forceCancel:
            spec.group === "PAID" || spec.group === "PREPARING"
              ? { targetBrandNames: [brand], clawback: false }
              : null,
        },
    railNotice: canceled
      ? "CANCELED"
      : spec.group === "CONFIRMED"
        ? "NO_ACTION"
        : null,
    claimLink: false,
  };

  return {
    row,
    detail,
    meta: {
      consumerName: spec.consumerName,
      brandIds: [gb.brandId],
      groupBuyId: gb.id,
      influencerId: gb.influencerId,
      payMethod: spec.method,
      invoiceNos: shipped ? [invoice] : [],
      pgTxNos: [payInfo.id],
      anomalyType: spec.anomaly?.type ?? null,
      anomalySince: spec.anomaly?.since ?? null,
      cancelType: spec.cancelType ?? null,
      delayed: Boolean(spec.delayed),
    },
  };
}

// ── 시안 샘플 주문 ──────────────────────────────────────
function order24201(): MockOrder {
  const gb = groupBuy("g1");
  const subs: OrderSubOrder[] = [
    {
      suffix: "-01",
      brandName: "글로우코스",
      status: INFO("배송중"),
      amount: 34000,
      items: [
        {
          id: "it-24201-1",
          name: "글로우 크림",
          option: "50ml",
          qty: 1,
          status: INFO("배송중"),
          price: 34000,
          settled: false,
        },
      ],
    },
    {
      suffix: "-02",
      brandName: "데일리랩",
      status: INFO("상품준비중"),
      amount: 24400,
      items: [
        {
          id: "it-24201-2",
          name: "데일리 선크림",
          option: "50ml",
          qty: 1,
          status: INFO("상품준비중"),
          price: 16000,
          settled: false,
        },
        {
          id: "it-24201-3",
          name: "선크림 리필",
          option: "단품",
          qty: 1,
          status: INFO("상품준비중"),
          price: 8400,
          settled: false,
        },
      ],
    },
  ];
  return {
    row: {
      orderNo: "ORD-24201",
      paidAt: "2026-09-16T14:22:00",
      consumerMasked: "김**",
      brandLabel: "2개 브랜드",
      groupBuyTitle: gb.title,
      payAmount: 58400,
      status: INFO("혼합"),
      statusNote: "배송중 · 상품준비중",
      statusGroup: "SHIPPING",
      anomaly: null,
      subOrders: [
        {
          suffix: "-01",
          brandName: "글로우코스",
          itemSummary: "글로우 크림 50ml · 1건",
          amount: 34000,
          status: INFO("배송중"),
          shipNote: "CJ 6512****8823",
        },
        {
          suffix: "-02",
          brandName: "데일리랩",
          itemSummary: "데일리 선크림 외 1종 · 2건",
          amount: 24400,
          status: INFO("상품준비중"),
          shipNote: "송장 미등록",
        },
      ],
    },
    detail: {
      orderNo: "ORD-24201",
      asOf: "2026-09-17T09:00:00",
      inquiryCount: 0,
      banner: null,
      groupBuyTitle: gb.title,
      influencerName: "글로우_지민",
      claimNote: null,
      payments: [
        {
          kind: "ORIGINAL",
          pgTxNo: "tosspay_8f21c904",
          method: "카드 · 신한 (일시불)",
          amount: 58400,
          paidAt: "2026-09-16T14:22:00",
          cancelable: 58400,
        },
      ],
      paymentStatus: OK("결제완료"),
      cancelableNote: "부분 환불 없음",
      subOrders: subs,
      shipping: {
        title: null,
        cards: [
          {
            brandName: "글로우코스",
            status: INFO("배송중"),
            head: ["CJ대한통운 · 6512****8823"],
            rows: [
              {
                label: "추적",
                main: ["간선 상차 ", dim("· 갱신 09.17 08:20")],
                side: ["송장 출처 브랜드 등록"],
              },
            ],
          },
          {
            brandName: "데일리랩",
            status: INFO("상품준비중"),
            head: [
              "송장 미등록 ",
              dim("· 기한 마감 09.18 + 3영업일 → "),
              dim("09.23"),
            ],
            rows: [],
          },
        ],
        hint: null,
      },
      settlement: settlementBefore([dim("0 / 3 항목")]),
      cancelRequest: null,
      history: [
        {
          tone: "INFO",
          title: "하위주문 -01 송장 등록 → 배송중 전환",
          meta: "브랜드 글로우코스 · CJ대한통운 6512****8823 · 집화 확인 09.16 21:10",
        },
        {
          tone: "INFO",
          title: "하위주문 -02 상품준비중 전환 · 발주서 다운로드",
          meta: "브랜드 데일리랩 · 09.16 17:40",
        },
        {
          tone: "SUCCESS",
          title: "결제 완료",
          meta: "소비자 김** · PG 승인 09.16 14:22",
        },
      ],
      statusCard: {
        label: "혼합",
        tone: "INFO",
        rows: [
          { label: "하위주문", value: ["배송중 1 · 준비중 1"] },
          { label: "구매확정", value: ["미도래"] },
        ],
      },
      actions: {
        ...NO_ACTIONS,
        refund: true,
        forceCancel: { targetBrandNames: ["데일리랩"], clawback: false },
      },
      railNotice: null,
      claimLink: false,
    },
    meta: {
      consumerName: "김민준",
      brandIds: ["b1", "b2"],
      groupBuyId: "g1",
      influencerId: "i1",
      payMethod: "CARD",
      invoiceNos: ["651200008823"],
      pgTxNos: ["tosspay_8f21c904"],
      anomalyType: null,
      anomalySince: null,
      cancelType: null,
      delayed: false,
    },
  };
}

function order24198(): MockOrder {
  const gb = groupBuy("g5");
  return {
    row: {
      orderNo: "ORD-24198",
      paidAt: "2026-09-16T11:05:00",
      consumerMasked: "이**",
      brandLabel: "데일리랩",
      groupBuyTitle: gb.title,
      payAmount: 32000,
      status: INFO("배송중"),
      statusNote: null,
      statusGroup: "SHIPPING",
      anomaly: { label: "반송 중", tone: "DANGER", note: "감지 09.12" },
      subOrders: [
        {
          suffix: "-01",
          brandName: "데일리랩",
          itemSummary: "데일리 선크림 50ml · 2건",
          amount: 32000,
          status: INFO("배송중"),
          shipNote: "한진 4188****2071",
        },
      ],
    },
    detail: {
      orderNo: "ORD-24198",
      asOf: "2026-09-16T18:00:00",
      inquiryCount: 1,
      banner: {
        kind: "RETURN_REFUNDED",
        refundAmount: 32000,
        refundAt: "2026-09-16T09:13:00",
      },
      groupBuyTitle: gb.title,
      influencerName: "소연_쇼룸",
      claimNote: null,
      payments: [
        {
          kind: "ORIGINAL",
          pgTxNo: "tosspay_7c40ab18",
          method: "카드 · 국민 (일시불)",
          amount: 32000,
          paidAt: "2026-09-16T11:05:00",
          cancelable: 0,
        },
      ],
      paymentStatus: GRAY("전체 취소"),
      cancelableNote: "전액 환불 09.16",
      subOrders: [
        {
          suffix: "-01",
          brandName: "데일리랩",
          status: BAD("반송 완료"),
          amount: 32000,
          items: [
            {
              id: "it-24198-1",
              name: "데일리 선크림",
              option: "50ml",
              qty: 2,
              status: BAD("반송 완료"),
              extraBadge: WARN("환불 대기"),
              price: 32000,
              settled: false,
            },
          ],
        },
      ],
      shipping: {
        title: null,
        cards: [
          {
            brandName: "데일리랩",
            status: BAD("반송 완료"),
            head: ["한진택배 · 4188****2071"],
            rows: [
              {
                label: "반송 감지",
                main: [num("2026.09.12 13:40")],
                side: ["택배사 상태 코드 수신"],
              },
              {
                label: "반송 완료",
                main: [num("2026.09.16 09:12")],
                side: ["브랜드 수취 확인"],
              },
            ],
          },
        ],
        hint: [
          "반송 사유는 플랫폼이 판정하지 않습니다 — ",
          b("택배사에서 직접 확인"),
          "하세요.",
        ],
      },
      settlement: [
        { label: "구매확정", value: [dim("타이머 정지")] },
        { label: "정산 편입", value: [badge("미편입", "NEUTRAL")] },
        {
          label: "왕복 배송비",
          value: ["차감 예정", { tag: "보류-정산구조" }],
        },
        { label: "클로백", value: [dim("해당 없음")] },
      ],
      cancelRequest: null,
      history: [
        {
          tone: "NEUTRAL",
          title: "PG 자동 환불 · 32,000원",
          meta: "시스템 · 반송 완료 자동 감지 09.16 09:13 · 소비자 선택 없음",
        },
        {
          tone: "DANGER",
          title: "반송 완료",
          meta: "시스템 · 택배사 상태 코드 09.16 09:12",
        },
        {
          tone: "DANGER",
          title: "반송 감지",
          meta: "시스템 · 택배사 상태 코드 09.12 13:40",
        },
        {
          tone: "INFO",
          title: "배송중 전환",
          meta: "시스템 · 집화 확인 09.11 19:30",
        },
      ],
      statusCard: {
        label: "반송 완료",
        tone: "DANGER",
        rows: [
          { label: "환불", value: [num("32,000원"), " · 자동 완료"] },
          { label: "환불 일시", value: [num("09.16 09:13")] },
          { label: "구매확정", value: ["타이머 취소 · 정산 제외"] },
        ],
      },
      actions: NO_ACTIONS,
      railNotice: "RETURNED",
      claimLink: false,
    },
    meta: {
      consumerName: "이서준",
      brandIds: ["b2"],
      groupBuyId: "g5",
      influencerId: "i2",
      payMethod: "CARD",
      invoiceNos: ["418800002071"],
      pgTxNos: ["tosspay_7c40ab18"],
      anomalyType: "RETURNING",
      anomalySince: "2026-09-12T13:40:00",
      cancelType: null,
      delayed: false,
    },
  };
}

function order24190(): MockOrder {
  const gb = groupBuy("g5");
  return {
    row: {
      orderNo: "ORD-24190",
      paidAt: "2026-09-15T09:48:00",
      consumerMasked: "최**",
      brandLabel: "데일리랩",
      groupBuyTitle: gb.title,
      payAmount: 16000,
      status: INFO("상품준비중"),
      statusNote: null,
      statusGroup: "PREPARING",
      anomaly: null,
      subOrders: [
        {
          suffix: "-01",
          brandName: "데일리랩",
          itemSummary: "데일리 선크림 50ml · 1건",
          amount: 16000,
          status: INFO("상품준비중"),
          shipNote: "송장 미등록",
        },
      ],
    },
    detail: {
      orderNo: "ORD-24190",
      asOf: "2026-09-19T11:30:00",
      inquiryCount: 2,
      banner: {
        kind: "PROXY_AVAILABLE",
        alertCount: 3,
        lastAlertAt: "2026-09-19T10:00:00",
      },
      groupBuyTitle: gb.title,
      influencerName: "소연_쇼룸",
      claimNote: null,
      payments: [
        {
          kind: "ORIGINAL",
          pgTxNo: "tosspay_2d77f051",
          method: "카카오페이",
          amount: 16000,
          paidAt: "2026-09-15T09:48:00",
          cancelable: 16000,
        },
      ],
      paymentStatus: OK("결제완료"),
      cancelableNote: "부분 환불 없음",
      subOrders: [
        {
          suffix: "-01",
          brandName: "데일리랩",
          status: WARN("상품준비중"),
          amount: 16000,
          items: [
            {
              id: "it-24190-1",
              name: "데일리 선크림",
              option: "50ml",
              qty: 1,
              status: WARN("발송기한 초과"),
              price: 16000,
              settled: false,
            },
          ],
        },
      ],
      shipping: {
        title: null,
        cards: [
          {
            brandName: "데일리랩",
            status: WARN("상품준비중"),
            head: ["송장 미등록"],
            rows: [
              {
                label: "발송 기한",
                main: [num("2026.09.16 23:59"), b(" · 3일 초과")],
                side: [
                  "공구 마감 ",
                  num("09.11"),
                  " + ",
                  b("3영업일"),
                  "(주문 시점 값)",
                ],
                tone: "warn",
              },
              {
                label: "자동 알림",
                main: ["3회 ", dim("· 09.19 10:00 마지막")],
                side: ["브랜드 무응답"],
              },
            ],
          },
        ],
        hint: null,
      },
      settlement: settlementBefore([dim("미도래")]),
      cancelRequest: null,
      history: [
        {
          tone: "WARNING",
          title: "발송 기한 경과 알림 3회",
          meta: "시스템 자동 · 브랜드 무응답 · 마지막 09.19 10:00",
        },
        {
          tone: "WARNING",
          title: "발송 기한 경과",
          meta: "시스템 · 공구 마감 09.11 + 3영업일(주문 시점 값) · 09.17 00:00",
        },
        {
          tone: "INFO",
          title: "상품준비중 전환 · 발주서 다운로드",
          meta: "브랜드 데일리랩 · 09.12 11:20",
        },
      ],
      statusCard: {
        label: "상품준비중",
        tone: "WARNING",
        rows: [
          { label: "발송기한", value: ["1일 초과"], tone: "warn" },
          { label: "자동 알림", value: ["3회 무응답 · 대행 가능"] },
        ],
      },
      actions: {
        ...NO_ACTIONS,
        refund: true,
        forceCancel: { targetBrandNames: ["데일리랩"], clawback: false },
        proxyInvoice: { overdueBrandName: "데일리랩" },
      },
      railNotice: null,
      claimLink: false,
    },
    meta: {
      consumerName: "최예은",
      brandIds: ["b2"],
      groupBuyId: "g5",
      influencerId: "i2",
      payMethod: "KAKAOPAY",
      invoiceNos: [],
      pgTxNos: ["tosspay_2d77f051"],
      anomalyType: null,
      anomalySince: null,
      cancelType: null,
      delayed: true,
    },
  };
}

function order24187(): MockOrder {
  const gb = groupBuy("g6");
  return {
    row: {
      orderNo: "ORD-24187",
      paidAt: "2026-09-14T18:12:00",
      consumerMasked: "정**",
      brandLabel: "퓨어네이처",
      groupBuyTitle: gb.title,
      payAmount: 72000,
      status: OK("배송완료"),
      statusNote: null,
      statusGroup: "DELIVERED",
      anomaly: null,
      subOrders: [
        {
          suffix: "-01",
          brandName: "퓨어네이처",
          itemSummary: "하이드라 앰플 30ml · 3개입 · 1건",
          amount: 72000,
          status: OK("배송완료"),
          shipNote: "CJ 6512****4471",
        },
      ],
    },
    detail: {
      orderNo: "ORD-24187",
      asOf: "2026-09-19T11:00:00",
      inquiryCount: 1,
      banner: null,
      groupBuyTitle: gb.title,
      influencerName: "하린_뷰티랩",
      claimNote: null,
      payments: [
        {
          kind: "ORIGINAL",
          pgTxNo: "tosspay_5a93de77",
          method: "카드 · 현대 (일시불)",
          amount: 72000,
          paidAt: "2026-09-14T18:12:00",
          cancelable: 72000,
        },
      ],
      paymentStatus: OK("결제완료"),
      cancelableNote: "부분 환불 없음",
      subOrders: [
        {
          suffix: "-01",
          brandName: "퓨어네이처",
          status: OK("배송완료"),
          amount: 72000,
          items: [
            {
              id: "it-24187-1",
              name: "하이드라 앰플",
              option: "30ml · 3개입",
              qty: 1,
              status: OK("배송완료"),
              price: 72000,
              settled: false,
            },
          ],
        },
      ],
      shipping: {
        title: null,
        cards: [
          {
            brandName: "퓨어네이처",
            status: OK("배송완료"),
            head: [
              "CJ대한통운 ",
              num("6512****4471"),
              " ",
              dim("· 브랜드 등록"),
            ],
            rows: [
              {
                label: "추적",
                main: [
                  "배송완료 ",
                  num("09.16 14:20"),
                  " ",
                  sub("(자동 확인)"),
                ],
                side: ["최종 갱신 ", num("09.16 14:20")],
              },
              {
                label: "소비자 이의",
                main: [
                  "실제 수령 ",
                  num("09.18"),
                  " 주장 · 1:1 문의 ",
                  num("#4518"),
                ],
                side: [num("09.19"), " 접수"],
              },
            ],
          },
        ],
        hint: [
          "택배사 스캔은 ",
          b("09.16 배송완료"),
          "이지만 소비자는 경비실 보관 후 ",
          b("09.18 수령"),
          "을 주장합니다 — 정정은 ",
          b("이의를 받아들일 때만"),
          " 합니다.",
        ],
      },
      settlement: settlementBefore(["예정 ", num("09.23"), " ", sub("(D-4)")]),
      cancelRequest: null,
      history: [
        {
          tone: "WARNING",
          title: "배송완료일 이의 접수",
          meta: "소비자 정** · 1:1 문의 #4518 · 실제 수령 09.18 주장 · 09.19 10:42",
        },
        {
          tone: "SUCCESS",
          title: "배송완료 (자동 확인)",
          meta: "시스템 · 택배사 상태 코드 09.16 14:20 · 구매확정 D+7 시작",
        },
        {
          tone: "INFO",
          title: "배송중 전환",
          meta: "브랜드 퓨어네이처 · 송장 등록 09.14 20:10",
        },
        {
          tone: "SUCCESS",
          title: "결제 완료",
          meta: "소비자 정** · PG 승인 09.14 18:12",
        },
      ],
      statusCard: {
        label: "배송완료",
        tone: "SUCCESS",
        rows: [
          { label: "배송완료", value: [num("09.16"), " (자동 확인)"] },
          { label: "구매확정 예정", value: [num("09.23")] },
          { label: "이의", value: ["1건 접수"] },
        ],
      },
      actions: {
        ...NO_ACTIONS,
        correctDeliveredAt: {
          currentDate: "2026-09-16",
          sourceLabel: "자동 확인",
          claimedDate: "2026-09-18",
          evidenceOptions: ["1:1 문의 #4518", "연결·소통 스레드"],
          confirmDays: 7,
        },
      },
      railNotice: null,
      claimLink: false,
    },
    meta: {
      consumerName: "정우진",
      brandIds: ["b3"],
      groupBuyId: "g6",
      influencerId: "i3",
      payMethod: "CARD",
      invoiceNos: ["651200004471"],
      pgTxNos: ["tosspay_5a93de77"],
      anomalyType: null,
      anomalySince: null,
      cancelType: null,
      delayed: false,
    },
  };
}

function order24176(): MockOrder {
  const gb = groupBuy("g6");
  return {
    row: {
      orderNo: "ORD-24176",
      paidAt: "2026-09-12T21:40:00",
      consumerMasked: "윤**",
      brandLabel: "퓨어네이처",
      groupBuyTitle: gb.title,
      payAmount: 64000,
      status: WARN("취소 요청"),
      statusNote: "응답 대기",
      statusGroup: "PREPARING",
      anomaly: null,
      subOrders: [
        {
          suffix: "-01",
          brandName: "퓨어네이처",
          itemSummary: "하이드라 앰플 외 1종 · 2건",
          amount: 64000,
          status: WARN("취소 요청"),
          shipNote: "송장 미등록",
        },
      ],
    },
    detail: {
      orderNo: "ORD-24176",
      asOf: "2026-09-16T11:30:00",
      inquiryCount: 0,
      banner: null,
      groupBuyTitle: gb.title,
      influencerName: "하린_뷰티랩",
      claimNote: null,
      payments: [
        {
          kind: "ORIGINAL",
          pgTxNo: "tosspay_71c0be29",
          method: "카드 · 신한 (일시불)",
          amount: 64000,
          paidAt: "2026-09-12T21:40:00",
          cancelable: 64000,
        },
      ],
      paymentStatus: OK("결제완료"),
      cancelableNote: "자동 승인 시 36,000원 환불",
      subOrders: [
        {
          suffix: "-01",
          brandName: "퓨어네이처",
          status: WARN("취소 요청"),
          amount: 64000,
          items: [
            {
              id: "it-24176-1",
              name: "하이드라 앰플",
              option: "30ml · 3개입",
              qty: 1,
              status: WARN("취소 요청"),
              price: 36000,
              settled: false,
            },
            {
              id: "it-24176-2",
              name: "수분 크림",
              option: "50ml",
              qty: 1,
              status: INFO("상품준비중"),
              price: 28000,
              settled: false,
            },
          ],
        },
      ],
      shipping: {
        title: null,
        cards: [
          {
            brandName: "퓨어네이처",
            status: INFO("상품준비중"),
            head: [
              "송장 미등록 ",
              dim("· 취소 요청 처리 전까지 "),
              bdim("하위주문 전체"),
              dim(" 등록 잠김"),
            ],
            rows: [
              {
                label: "발송 기한",
                main: [num("2026.09.16 23:59")],
                side: ["마감 ", num("09.12"), " + 3영업일(주문 시점 값)"],
              },
              {
                label: "준비 시작",
                main: ["브랜드 퓨어네이처 · ", b("발주서 다운로드")],
                side: [num("09.14 10:05")],
              },
            ],
          },
        ],
        hint: null,
      },
      settlement: null,
      cancelRequest: {
        requestedAt: "2026-09-15T14:30:00",
        reason: "단순 변심",
        respondBy: "2026-09-16T14:30:00",
        respondBusinessDays: 1,
        autoApproveText: [
          b("자동 승인"),
          " · PG 즉시 환불 ",
          num("36,000원"),
          " ",
          sub("(하이드라 앰플만)"),
        ],
      },
      history: [
        {
          tone: "WARNING",
          title: "소비자 취소 요청",
          meta: "소비자 윤** · 단순 변심 · 응답 마감 09.16 14:30 · 09.15 14:30",
        },
        {
          tone: "INFO",
          title: "상품준비중 전환 · 발주서 다운로드",
          meta: "브랜드 퓨어네이처 · 09.14 10:05",
        },
        {
          tone: "SUCCESS",
          title: "결제 완료",
          meta: "소비자 윤** · PG 승인 09.12 21:40",
        },
      ],
      statusCard: {
        label: "취소 요청",
        tone: "WARNING",
        rows: [
          { label: "응답 마감", value: [num("09.16 14:30")] },
          { label: "남은 시간", value: [b("3시간")] },
          { label: "미응답 시", value: ["자동 승인 · PG 환불"] },
        ],
      },
      actions: NO_ACTIONS,
      railNotice: "CANCEL_REQUESTED",
      claimLink: false,
    },
    meta: {
      consumerName: "윤하늘",
      brandIds: ["b3"],
      groupBuyId: "g6",
      influencerId: "i3",
      payMethod: "CARD",
      invoiceNos: [],
      pgTxNos: ["tosspay_71c0be29"],
      anomalyType: null,
      anomalySince: null,
      cancelType: null,
      delayed: false,
    },
  };
}

function order24158(): MockOrder {
  const gb = groupBuy("g4");
  return {
    row: {
      orderNo: "ORD-24158",
      paidAt: "2026-09-03T13:20:00",
      consumerMasked: "한**",
      brandLabel: "글로우코스",
      groupBuyTitle: gb.title,
      payAmount: 32000,
      status: INFO("교환 진행 중"),
      statusNote: "회수중",
      statusGroup: "DELIVERED",
      anomaly: null,
      subOrders: [
        {
          suffix: "-01",
          brandName: "글로우코스",
          itemSummary: "톤업 쿠션 21호 → 23호 · 1건",
          amount: 32000,
          status: INFO("교환 진행 중"),
          shipNote: "회수 롯데 2448****7015",
        },
      ],
    },
    detail: {
      orderNo: "ORD-24158",
      asOf: "2026-09-13T10:00:00",
      inquiryCount: 0,
      banner: null,
      groupBuyTitle: gb.title,
      influencerName: "소연_쇼룸",
      claimNote: "사유 단순 변심(색상) · 소비자 귀책",
      payments: [
        {
          kind: "ORIGINAL",
          pgTxNo: "tosspay_3e88a1d5",
          method: "카드 · 국민",
          amount: 32000,
          paidAt: "2026-09-03T13:20:00",
          cancelable: 32000,
        },
        {
          kind: "EXTRA",
          pgTxNo: "kakaopay_b204f9c1",
          method: "카카오페이",
          amount: 3000,
          paidAt: "2026-09-09T19:02:00",
          purpose: "교환 재발송비",
          cancelable: 3000,
        },
      ],
      paymentStatus: OK("결제완료"),
      cancelableNote: null,
      subOrders: [
        {
          suffix: "-01",
          brandName: "글로우코스",
          status: INFO("교환 진행 중"),
          amount: 32000,
          items: [
            {
              id: "it-24158-1",
              name: "톤업 쿠션",
              option: "21호",
              optionTo: "23호",
              qty: 1,
              status: INFO("회수중"),
              price: 32000,
              settled: false,
            },
          ],
        },
      ],
      shipping: {
        title: "배송 · 송장 3종",
        cards: [
          {
            rows: [
              {
                label: "출고",
                main: [
                  "CJ대한통운 ",
                  num("6512****3390"),
                  " ",
                  dim("· 브랜드 등록"),
                ],
                side: ["배송완료 ", num("09.06"), " (자동 확인)"],
              },
              {
                label: "회수",
                main: [
                  "롯데택배 ",
                  num("2448****7015"),
                  " ",
                  dim("· 소비자 입력 09.10"),
                ],
                side: ["회수중 · 집화 ", num("09.11")],
              },
              {
                label: "교환 재발송",
                main: [dim("미등록")],
                side: ["검수 승인 후 브랜드 등록"],
              },
            ],
          },
        ],
        hint: null,
      },
      settlement: [
        {
          label: "구매확정",
          value: [b("타이머 정지"), " ", sub("· 남은 4일에서 멈춤")],
        },
        { label: "재개", value: ["교환 완료 시 ", b("7일 새로 시작")] },
        { label: "정산 편입", value: [badge("미편입", "NEUTRAL")] },
        {
          label: "재발송비",
          value: [
            "브랜드 수취액 ",
            b("+3,000원"),
            " ",
            sub("· 리워드 기준 제외"),
          ],
        },
      ],
      cancelRequest: null,
      history: [
        {
          tone: "INFO",
          title: "회수 집화",
          meta: "시스템 · 롯데택배 09.11 18:40",
        },
        {
          tone: "INFO",
          title: "회수 송장 입력",
          meta: "소비자 한** · 롯데택배 2448****7015 · 09.10 09:15",
        },
        {
          tone: "WARNING",
          title: "교환 요청 · 재발송비 결제",
          meta: "소비자 한** · 21호 → 23호 · 3,000원 · 구매확정 타이머 정지(남은 4일) · 09.09 19:02",
        },
        {
          tone: "SUCCESS",
          title: "배송완료 (자동 확인)",
          meta: "시스템 · 09.06 15:30 · 구매확정 D+7 시작",
        },
      ],
      statusCard: {
        label: "교환 진행 중",
        tone: "INFO",
        rows: [
          { label: "단계", value: ["회수중 → 검수 대기"] },
          { label: "구매확정", value: ["정지 · 남은 4일"] },
          { label: "재발송비", value: ["3,000원 결제됨"] },
        ],
      },
      actions: NO_ACTIONS,
      railNotice: "EXCHANGING",
      claimLink: true,
    },
    meta: {
      consumerName: "한지호",
      brandIds: ["b1"],
      groupBuyId: "g4",
      influencerId: "i2",
      payMethod: "CARD",
      invoiceNos: ["651200003390", "244800007015"],
      pgTxNos: ["tosspay_3e88a1d5", "kakaopay_b204f9c1"],
      anomalyType: null,
      anomalySince: null,
      cancelType: null,
      delayed: false,
    },
  };
}

function order24112(): MockOrder {
  const gb = groupBuy("g2");
  return {
    row: {
      orderNo: "ORD-24112",
      paidAt: "2026-08-21T10:05:00",
      consumerMasked: "최**",
      brandLabel: "글로우코스",
      groupBuyTitle: gb.title,
      payAmount: 45000,
      status: OK("구매확정"),
      statusNote: null,
      statusGroup: "CONFIRMED",
      anomaly: null,
      subOrders: [
        {
          suffix: "-01",
          brandName: "글로우코스",
          itemSummary: "글로우 세럼 30ml · 1건",
          amount: 45000,
          status: OK("구매확정"),
          shipNote: "CJ 6512****2087",
        },
      ],
    },
    detail: {
      orderNo: "ORD-24112",
      asOf: "2026-09-18T16:00:00",
      inquiryCount: 1,
      banner: null,
      groupBuyTitle: gb.title,
      influencerName: "하린_뷰티랩",
      claimNote: null,
      payments: [
        {
          kind: "ORIGINAL",
          pgTxNo: "kakaopay_8d21c4f0",
          method: "간편결제 · 카카오페이",
          amount: 45000,
          paidAt: "2026-08-21T10:05:00",
          cancelable: 45000,
        },
      ],
      paymentStatus: OK("결제완료"),
      cancelableNote: "부분 환불 없음",
      subOrders: [
        {
          suffix: "-01",
          brandName: "글로우코스",
          status: OK("구매확정"),
          amount: 45000,
          items: [
            {
              id: "it-24112-1",
              name: "글로우 세럼",
              option: "30ml",
              qty: 1,
              status: OK("구매확정"),
              price: 45000,
              settled: true,
            },
          ],
        },
      ],
      shipping: {
        title: null,
        cards: [
          {
            brandName: "글로우코스",
            status: OK("배송완료"),
            head: [
              "CJ대한통운 ",
              num("6512****2087"),
              " ",
              dim("· 브랜드 등록"),
            ],
            rows: [
              {
                label: "추적",
                main: [
                  "배송완료 ",
                  num("08.27 11:40"),
                  " ",
                  sub("(자동 확인)"),
                ],
                side: ["최종 갱신 ", num("08.27 11:40")],
              },
              {
                label: "구매확정",
                main: [num("09.03"), " 자동 (D+7)"],
                side: ["반품·교환 기간 종료"],
              },
            ],
          },
        ],
        hint: null,
      },
      settlement: [
        { label: "구매확정", value: [num("09.03")] },
        { label: "정산 편입", value: [badge("확정", "SUCCESS")] },
        { label: "정산 확정일", value: [num("09.10"), " 회차"] },
        { label: "클로백", value: [bwarn("환불 시 다음 정산에서 차감")] },
      ],
      cancelRequest: null,
      history: [
        {
          tone: "WARNING",
          title: "1:1 문의 접수 · 하자 주장",
          meta: "소비자 최** · #4521 · 내용물 변색 · 사진 3장 · 09.18 15:20",
        },
        {
          tone: "SUCCESS",
          title: "정산 확정",
          meta: "시스템 · 09.10 회차 · 브랜드 글로우코스 지급",
        },
        {
          tone: "SUCCESS",
          title: "구매확정 (자동)",
          meta: "시스템 · 배송완료 D+7 · 09.03",
        },
        {
          tone: "SUCCESS",
          title: "배송완료 (자동 확인)",
          meta: "시스템 · 택배사 상태 코드 08.27 11:40",
        },
        {
          tone: "SUCCESS",
          title: "결제 완료",
          meta: "소비자 최** · PG 승인 08.21 10:05",
        },
      ],
      statusCard: {
        label: "구매확정",
        tone: "SUCCESS",
        rows: [
          { label: "공급일", value: [num("08.27"), " → 3개월 ", num("11.27")] },
          {
            label: "하자 인지",
            value: [num("09.17"), " → 30일 ", num("10.17")],
          },
          { label: "청약철회 기한", value: [b("10.17"), " · D-29"] },
        ],
      },
      actions: {
        ...NO_ACTIONS,
        openReturn: {
          itemIds: ["it-24112-1"],
          evidenceOptions: ["1:1 문의 #4521 · 사진 3장"],
          suggestedNoticeDate: "2026-09-17",
          withdrawalDeadline: "2026-10-17",
          expired: false,
          settledRoundLabel: "09.10 회차",
        },
      },
      railNotice: null,
      claimLink: false,
    },
    meta: {
      consumerName: "최서윤",
      brandIds: ["b1"],
      groupBuyId: "g2",
      influencerId: "i3",
      payMethod: "KAKAOPAY",
      invoiceNos: ["651200002087"],
      pgTxNos: ["kakaopay_8d21c4f0"],
      anomalyType: null,
      anomalySince: null,
      cancelType: null,
      delayed: false,
    },
  };
}

// ── 전체 데이터 조립 ────────────────────────────────────
const SURNAMES = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임"];
const GIVEN = ["민준", "서연", "도윤", "하준", "지우", "예린", "시우", "유진"];

/** 결정적 의사난수 — 새로고침해도 같은 142건이 나온다 */
function lcg(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function shuffle<T>(items: Array<T>, rand: () => number) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function fill<T>(entries: Array<[T, number]>) {
  return entries.flatMap(([value, count]) =>
    Array.from({ length: count }, () => value)
  );
}

export function buildMockOrders(): Array<MockOrder> {
  const handmade: Array<MockOrder> = [
    order24201(),
    order24198(),
    buildGeneric({
      orderNo: "ORD-24195",
      paidAt: "2026-09-15T20:31:00",
      consumerName: "박하준",
      groupBuyId: "g2",
      qty: 1,
      group: "SHIPPING",
      method: "CARD",
      anomaly: {
        type: "COLLECT_CHECK",
        label: "집화 확인 필요",
        tone: "WARNING",
        note: "등록 후 26시간",
        since: "2026-09-15T21:00:00",
      },
    }),
    order24190(),
    order24187(),
    buildGeneric({
      orderNo: "ORD-24180",
      paidAt: "2026-09-13T15:40:00",
      consumerName: "한지우",
      groupBuyId: "g3",
      qty: 1,
      group: "CANCELED",
      method: "CARD",
      cancelType: "CONSUMER",
    }),
    order24176(),
    buildGeneric({
      orderNo: "ORD-24166",
      paidAt: "2026-09-11T16:40:00",
      consumerName: "서예린",
      groupBuyId: "g3",
      qty: 1,
      group: "SHIPPING",
      method: "NAVERPAY",
      anomaly: {
        type: "TRACKING_STOPPED",
        label: "추적 정지",
        tone: "DANGER",
        note: "7일 무갱신",
        since: "2026-09-09T10:00:00",
      },
    }),
    order24158(),
    buildGeneric({
      orderNo: "ORD-24151",
      paidAt: "2026-09-09T10:20:00",
      consumerName: "조시우",
      groupBuyId: "g6",
      qty: 1,
      group: "SHIPPING",
      method: "CARD",
      anomaly: {
        type: "TRACKING_STOPPED",
        label: "추적 정지",
        tone: "DANGER",
        note: "8일 무갱신",
        since: "2026-09-08T10:00:00",
      },
    }),
    order24112(),
  ];

  // 나머지 131건 — 상태 18/31/44/27/15/7에서 샘플이 차지한 몫(배송중 5 · 준비중 2 · 배송완료 2 · 구매확정 1 · 취소 1)을 뺀다
  const rand = lcg(20260916);
  const groups = shuffle(
    fill<OrderStatusGroup>([
      ["PAID", 18],
      ["PREPARING", 29],
      ["SHIPPING", 39],
      ["DELIVERED", 25],
      ["CONFIRMED", 14],
      ["CANCELED", 6],
    ]),
    rand
  );
  // 글로우코스 38건(샘플 6건 + 32건) · 데일리랩 · 퓨어네이처
  const brands = shuffle(
    fill<string>([
      ["b1", 32],
      ["b2", 50],
      ["b3", 49],
    ]),
    rand
  );
  const cancelTypes: Array<OrderCancelType> = [
    "CONSUMER",
    "CONSUMER",
    "CONSUMER",
    "FORCED",
    "FORCED",
    "RETURNED",
  ];
  const methods: Array<OrderPayMethod> = [
    "CARD",
    "CARD",
    "KAKAOPAY",
    "NAVERPAY",
    "CARD",
    "TRANSFER",
  ];
  const taken = new Set(handmade.map((m) => m.row.orderNo));
  let delayedLeft = 2;
  let cancelIdx = 0;

  const fillers: Array<MockOrder> = [];
  // 2026.09.13 15:00부터 5시간 안팎 간격으로 거슬러 올라간다 — 131건이면 조회기간(08.17~) 안쪽 08.18 무렵에 닿는다
  let cursor = dayjs("2026-09-13T15:00:00");
  let seq = 24175;
  for (let i = 0; i < 131; i++) {
    while (taken.has(`ORD-${seq}`)) seq -= 1;
    const orderNo = `ORD-${seq}`;
    seq -= 1;
    const group = groups[i];
    const brandId = brands[i];
    const options = GROUP_BUYS.filter((g) => g.brandId === brandId);
    const gb = options[Math.floor(rand() * options.length)];
    const qty = 1 + Math.floor(rand() * 2);
    const surname = SURNAMES[Math.floor(rand() * SURNAMES.length)];
    const given = GIVEN[Math.floor(rand() * GIVEN.length)];
    let delayed = false;
    // 글로우코스는 「처리 지연 0건」(시안 A1-d)이라 지연 샘플은 다른 브랜드에서 고른다
    if (group === "PREPARING" && brandId !== "b1" && delayedLeft > 0) {
      delayed = true;
      delayedLeft -= 1;
    }
    fillers.push(
      buildGeneric({
        orderNo,
        paidAt: cursor.format("YYYY-MM-DDTHH:mm:ss"),
        consumerName: `${surname}${given}`,
        groupBuyId: gb.id,
        qty,
        group,
        method: methods[Math.floor(rand() * methods.length)],
        delayed,
        cancelType:
          group === "CANCELED"
            ? cancelTypes[cancelIdx++ % cancelTypes.length]
            : undefined,
      })
    );
    cursor = cursor
      .subtract(4, "hour")
      .subtract(40 + Math.floor(rand() * 20), "minute");
  }

  return [...handmade, ...fillers];
}

/** `?mock=recall` — 위해성 긴급 중단(약관 제17조③)이 걸린 ORD-24201(시안 B5) */
export function applyRecallScenario(orders: Array<MockOrder>) {
  const target = orders.find((o) => o.row.orderNo === "ORD-24201");
  if (!target) return;
  target.detail.inquiryCount = 1;
  target.detail.history.unshift({
    tone: "DANGER",
    title: "공구 긴급 중단 (글로우 크림 공구)",
    meta: "운영자 김운영 · 09.17 09:30 · 약관 제17조③ · 사후 통지 발송",
  });
  target.detail.asOf = "2026-09-17T10:00:00";
  target.detail.statusCard.rows = target.detail.statusCard.rows.filter(
    (r) => r.label !== "구매확정"
  );
  target.detail.settlement = settlementBefore([dim("0 / 3 항목")]).map((row) =>
    row.label === "클로백"
      ? { ...row, value: [dim("해당 없음 · 정산 전")] }
      : row
  );
}

export { maskInvoice, influencerName };
