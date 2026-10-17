import OrderBadge from "@/features/order/components/shared/OrderBadge";
import RichText from "@/features/order/components/shared/RichText";
import {
  Block,
  FRow,
  Grid2,
  Hint,
  ItRow,
  SubCard,
} from "@/features/order/components/detail/parts";
import type {
  OrderBannerData,
  OrderDetail,
  OrderHistoryEntry,
  OrderTone,
} from "@/features/order/types";
import { formatFullDateTime, formatWon } from "@/features/order/utils/format";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";

const TNUM = "tabular-nums tracking-[-0.1px]";

/** 시안 `.banner` — 모달 최상단 조치·종결 안내 */
export function OrderBanner(props: {
  banner: OrderBannerData;
  onOpenException: () => void;
}) {
  const { banner, onOpenException } = props;
  return (
    <div className="mb-2.5 flex gap-[9px] rounded-[8px] border border-[#EECFCF] bg-sz-danger-bg px-3 py-2.5 text-[11px] font-medium leading-[1.65] text-sz-danger-text">
      <span>!</span>
      <span>
        {banner.kind === "RETURN_REFUNDED" ? (
          <>
            반송이 완료되어 <b>PG 자동 환불</b>이 실행됐습니다(
            <span className={TNUM}>
              {formatWon(banner.refundAmount)} ·{" "}
              {dayjs(banner.refundAt).format("MM.DD HH:mm")}
            </span>
            ). <b>구매확정 타이머는 취소</b>됐고 이 주문은 정산에서 빠집니다.
          </>
        ) : (
          <>
            <b>대행 가능</b> — 발송 기한 경과 후 시스템 자동 알림{" "}
            <b>{banner.alertCount}회 무응답</b>(최근{" "}
            {dayjs(banner.lastAlertAt).format("MM.DD HH:mm")}).{" "}
            <button
              type="button"
              onClick={onOpenException}
              className="inline-flex cursor-pointer items-center gap-[3px] text-sz-accent-500 hover:underline"
            >
              예외 관리 › 처리 지연에서 보기 ↗
            </button>
          </>
        )}
      </span>
    </div>
  );
}

/** ① 결제 정보 — 결제가 둘이면(교환 재발송비) 원래 결제 · 추가 결제 두 줄로 나눈다(PG 거래가 따로라 취소도 따로) */
export function PaymentBlock(props: { index: number; detail: OrderDetail }) {
  const { index, detail } = props;
  const [original, extra] = detail.payments;

  return (
    <Block index={index} title="결제 정보">
      <Grid2>
        {extra ? (
          <>
            <FRow label="원래 결제">
              <span className={TNUM}>{formatWon(original.amount)}</span>{" "}
              <span className="text-[11px] text-sz-n-500">
                · {original.method} · {original.pgTxNo}
              </span>
            </FRow>
            <FRow label="결제일시">
              <span className={TNUM}>
                {formatFullDateTime(original.paidAt)}
              </span>
            </FRow>
            <FRow label="추가 결제">
              <span className={TNUM}>{formatWon(extra.amount)}</span>{" "}
              <span className="text-[11px] text-sz-n-500">
                · {extra.purpose} · {extra.pgTxNo}
              </span>
            </FRow>
            <FRow label="결제일시">
              <span className={TNUM}>{formatFullDateTime(extra.paidAt)}</span>
            </FRow>
            <FRow label="취소 가능 잔액">
              원래 <b>{formatWon(original.cancelable)}</b> · 추가{" "}
              <b>{formatWon(extra.cancelable)}</b>
            </FRow>
          </>
        ) : (
          <>
            <FRow label="PG 거래번호">
              <span className={TNUM}>{original.pgTxNo}</span>
            </FRow>
            <FRow label="결제수단">{original.method}</FRow>
            <FRow label="결제금액">
              <span className={TNUM}>{formatWon(original.amount)}</span>
            </FRow>
            <FRow label="결제일시">
              <span className={TNUM}>
                {formatFullDateTime(original.paidAt)}
              </span>
            </FRow>
            <FRow label="취소 가능 잔액">
              <b>{formatWon(original.cancelable)}</b>
              {detail.cancelableNote && (
                <>
                  {" "}
                  <span className="text-[11px] text-sz-n-500">
                    · {detail.cancelableNote}
                  </span>
                </>
              )}
            </FRow>
          </>
        )}
        <FRow label="결제 상태">
          <OrderBadge data={detail.paymentStatus} hideDot />
        </FRow>
      </Grid2>
    </Block>
  );
}

/** ② 하위주문 · 항목 — 항목(SKU) 트리는 여기서만 보인다(목록은 하위주문 1단에서 끊는다) */
export function SubOrdersBlock(props: { index: number; detail: OrderDetail }) {
  const { index, detail } = props;
  const note = [
    detail.groupBuyTitle,
    `인플루언서 ${detail.influencerName}`,
    detail.claimNote,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Block index={index} title="하위주문 · 항목" note={note}>
      <div>
        {detail.subOrders.map((sub) => (
          <SubCard
            key={sub.suffix}
            head={
              <>
                <b className="text-[12px]">{sub.brandName}</b>
                <OrderBadge data={sub.status} hideDot />
                <span className="ml-auto text-sz-n-500">
                  하위주문 {sub.suffix} · {formatWon(sub.amount)}
                </span>
              </>
            }
          >
            {sub.items.map((item) => (
              <ItRow key={item.id}>
                <span>{item.name}</span>
                <span className="text-sz-n-400">
                  {item.optionTo ? (
                    <>
                      {item.option} → <b>{item.optionTo}</b>
                    </>
                  ) : (
                    item.option
                  )}
                </span>
                <span className="text-sz-n-500">×{item.qty}</span>
                <OrderBadge data={item.status} hideDot />
                {item.extraBadge && (
                  <OrderBadge
                    data={item.extraBadge}
                    hideDot
                    className="ml-1.5"
                  />
                )}
                <span className="ml-auto tabular-nums text-sz-n-700">
                  {formatWon(item.price)}
                </span>
              </ItRow>
            ))}
          </SubCard>
        ))}
      </div>
    </Block>
  );
}

/** ③ 배송 — 송장 출처(브랜드 등록 · 운영자 대행 · 소비자 입력)가 이의의 쟁점이라 출처별로 적는다 */
export function ShippingBlock(props: { index: number; detail: OrderDetail }) {
  const { index, detail } = props;
  const { shipping } = detail;
  return (
    <Block index={index} title={shipping.title ?? "배송"}>
      {shipping.cards.map((card, cardIndex) => (
        <SubCard
          key={cardIndex}
          head={
            card.brandName && (
              <>
                <b className="text-[12px]">{card.brandName}</b>
                {card.status && <OrderBadge data={card.status} hideDot />}
                {card.head && (
                  <span className="ml-auto text-sz-n-500">
                    <RichText value={card.head} />
                  </span>
                )}
              </>
            )
          }
        >
          {card.rows.map((row) => (
            <ItRow key={row.label}>
              <span className="text-[11px] text-sz-n-500">{row.label}</span>
              <span
                className={cn(row.tone === "warn" && "text-sz-warning-text")}
              >
                <RichText value={row.main} />
              </span>
              {row.side && (
                <span className="ml-auto text-[11px] text-sz-n-500">
                  <RichText value={row.side} />
                </span>
              )}
            </ItRow>
          ))}
        </SubCard>
      ))}
      {shipping.hint && (
        <Hint>
          <RichText value={shipping.hint} />
        </Hint>
      )}
    </Block>
  );
}

/** ④ 정산 반영 — 직권 취소·사유 환불이 클로백을 만드는지가 판단에 직결돼 남긴다 */
export function SettlementBlock(props: { index: number; detail: OrderDetail }) {
  const { index, detail } = props;
  return (
    <Block index={index} title="정산 반영">
      <Grid2>
        {detail.settlement?.map((row) => (
          <FRow key={row.label} label={row.label}>
            <RichText value={row.value} />
          </FRow>
        ))}
      </Grid2>
    </Block>
  );
}

/** ④ 취소 요청 — 운영자가 볼 값은 응답 마감과 자동 승인 여부 둘(운영자 조치는 없다) */
export function CancelRequestBlock(props: {
  index: number;
  detail: OrderDetail;
}) {
  const { index, detail } = props;
  const request = detail.cancelRequest;
  if (!request) return null;
  return (
    <Block index={index} title="취소 요청">
      <Grid2>
        <FRow label="요청 일시">
          <span className={TNUM}>
            {formatFullDateTime(request.requestedAt)}
          </span>
        </FRow>
        <FRow label="사유">{request.reason}</FRow>
        <FRow label="응답 마감">
          <b className={TNUM}>{formatFullDateTime(request.respondBy)}</b>{" "}
          <span className="text-[11px] text-sz-n-500">
            · {request.respondBusinessDays}영업일
          </span>
        </FRow>
        <FRow label="미응답 시">
          <RichText value={request.autoApproveText} />
        </FRow>
      </Grid2>
      <Hint>
        브랜드 거부 사유는 4종(이미 포장·출고 완료 / 택배사 집화 완료 / 주문
        제작·맞춤 상품 / 기타 — 상세 필수)이고 <b>소비자에게 그대로 전달</b>
        됩니다.
      </Hint>
    </Block>
  );
}

const DOT_CLASS: Record<OrderTone, string> = {
  INFO: "bg-sz-info-text",
  SUCCESS: "bg-sz-success-text",
  WARNING: "bg-sz-warning-text",
  DANGER: "bg-sz-danger-text",
  NEUTRAL: "bg-sz-n-400",
};

/** ⑤ 이력 — 누가 언제 무슨 근거로 했는지(시스템 · 브랜드 · 소비자 · 운영자) */
export function HistoryBlock(props: {
  index: number;
  items: Array<OrderHistoryEntry>;
}) {
  const { index, items } = props;
  return (
    <Block index={index} title="이력">
      <div className="pt-0.5">
        {items.map((item, itemIndex) => (
          <div key={itemIndex} className="flex gap-2.5 py-1.5">
            <span
              className={cn(
                "mt-1.5 size-[7px] shrink-0 rounded-full",
                DOT_CLASS[item.tone]
              )}
            />
            <div>
              <div className="text-[12px]">{item.title}</div>
              <div className="text-[11px] text-sz-n-500">{item.meta}</div>
            </div>
          </div>
        ))}
      </div>
    </Block>
  );
}
