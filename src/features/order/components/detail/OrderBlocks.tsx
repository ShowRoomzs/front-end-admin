import OrderBadge from "@/features/order/components/shared/OrderBadge";
import {
  Block,
  FRow,
  Grid2,
  Hint,
  ItRow,
  SubCard,
} from "@/features/order/components/detail/parts";
import {
  ACTOR_LABEL,
  ITEM_STATUS_BADGE,
  PAYMENT_STATUS_BADGE,
  REFUND_STATUS_BADGE,
  STALL_CHOICE_TEXT,
  TRACKING_ALERT_TONE,
  cancelTypeText,
} from "@/features/order/constants/labels";
import { inquiryDetailPath } from "@/features/order/constants/params";
import type {
  AdminOrderDetail,
  AdminOrderGroupDetail,
  AdminOrderStallChoice,
  OrderBadgeTone,
} from "@/features/order/types";
import {
  formatDueFull,
  formatFullDateTime,
  formatMonthDay,
  formatShortDateTime,
  formatWon,
  purchaseConfirmText,
  subOrderSuffix,
  toDotDate,
} from "@/features/order/utils/format";
import { cn } from "@/lib/utils";
import { Fragment, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

const TNUM = "tabular-nums tracking-[-0.1px]";
const SUB = "text-[11px] text-sz-n-500";

interface BlockProps {
  index: number;
  detail: AdminOrderDetail;
}

/** 하위주문 블록 머리 — 브랜드 · 상태 · 하위주문 번호 */
function GroupHead(props: { group: AdminOrderGroupDetail; right?: ReactNode }) {
  const { group, right } = props;
  return (
    <>
      <b className="text-[12px]">{group.brandName}</b>
      <OrderBadge
        data={{ label: group.statusLabel, tone: group.statusTone }}
        hideDot
      />
      <span className="ml-auto text-sz-n-500">
        {right ?? `하위주문 ${subOrderSuffix(group.subOrderNumber)}`}
      </span>
    </>
  );
}

function groupAmount(group: AdminOrderGroupDetail) {
  return group.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/** 반송 완료 → PG 자동 환불(B2) · 대행 가능(B4) — 모달 최상단 조치·종결 안내 */
export function OrderBanner(props: {
  detail: AdminOrderDetail;
  onOpenException: () => void;
}) {
  const { detail, onOpenException } = props;
  const returned = detail.groups
    .flatMap((group) => group.refunds)
    .find((refund) => refund.source === "RETURN_COMPLETED");
  const actOnBehalf = detail.groups.find(
    (group) => group.actions.canRegisterShipment
  );
  if (!returned && !actOnBehalf) {
    return null;
  }
  return (
    <div className="mb-2.5 flex gap-[9px] rounded-[8px] border border-[#EECFCF] bg-sz-danger-bg px-3 py-2.5 text-[11px] font-medium leading-[1.65] text-sz-danger-text">
      <span>!</span>
      <span>
        {returned ? (
          <>
            반송이 완료되어 <b>PG 자동 환불</b>
            {returned.status === "DONE"
              ? "이 실행됐습니다"
              : "이 진행 중입니다"}
            (
            <span className={TNUM}>
              {formatWon(returned.amount)}
              {returned.executedAt &&
                ` · ${formatShortDateTime(returned.executedAt)}`}
            </span>
            ). <b>구매확정 타이머는 취소</b>됐고 이 주문은 정산에서 빠집니다.
          </>
        ) : (
          actOnBehalf && (
            <>
              <b>대행 가능</b> — 발송 기한 경과 후 시스템 자동 알림{" "}
              <b>{actOnBehalf.shipping.overdueNoticeCount}회 무응답</b>
              {(actOnBehalf.shipping.lastOverdueNoticeAt ||
                detail.groups.length > 1) &&
                `(${[
                  detail.groups.length > 1 ? actOnBehalf.brandName : null,
                  actOnBehalf.shipping.lastOverdueNoticeAt &&
                    `최근 ${formatShortDateTime(actOnBehalf.shipping.lastOverdueNoticeAt)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")})`}
              .{" "}
              <button
                type="button"
                onClick={onOpenException}
                className="inline-flex cursor-pointer items-center gap-[3px] text-sz-accent-500 hover:underline"
              >
                예외 관리 › 처리 지연에서 보기 ↗
              </button>
            </>
          )
        )}
      </span>
    </div>
  );
}

/**
 * ① 결제 정보 — 결제가 없는 주문(밖에서 처리)도 있다.
 * 클레임 재발송비 결제가 있으면(B8) 원래 결제 · 추가 결제를 두 줄로 나눈다 — PG 거래가 따로라 취소도 따로다.
 */
export function PaymentBlock(props: BlockProps) {
  const { index, detail } = props;
  const { payment, consumer, recipient, additionalPayments } = detail;
  const statusBadge = payment
    ? (PAYMENT_STATUS_BADGE[payment.status] ?? {
        label: payment.status,
        tone: "NEUTRAL" as OrderBadgeTone,
      })
    : null;
  const cancellable = payment ? payment.amount - payment.cancelledAmount : 0;
  const extraCancellable = additionalPayments.reduce(
    (sum, extra) => sum + extra.cancellableAmount,
    0
  );

  return (
    <Block index={index} title="결제 정보">
      <Grid2>
        {payment && additionalPayments.length > 0 ? (
          <>
            <FRow label="원래 결제">
              <span className={TNUM}>{formatWon(payment.amount)}</span>{" "}
              <span className={SUB}>
                · {payment.methodLabel} ·{" "}
                <span className={TNUM}>{payment.paymentId}</span>
              </span>
            </FRow>
            <FRow label="결제일시">
              <span className={TNUM}>{formatFullDateTime(payment.paidAt)}</span>
            </FRow>
            {additionalPayments.map((extra) => (
              <Fragment key={extra.chargeId}>
                <FRow label="추가 결제">
                  <span className={TNUM}>{formatWon(extra.amount)}</span>{" "}
                  <span className={SUB}>
                    · {extra.typeLabel} ·{" "}
                    <span className={TNUM}>
                      {extra.pgTxId ?? extra.paymentId}
                    </span>
                    {extra.status !== "PAID" && ` · ${extra.statusLabel}`}
                  </span>
                </FRow>
                <FRow label="결제일시">
                  {extra.paidAt ? (
                    <span className={TNUM}>
                      {formatFullDateTime(extra.paidAt)}
                    </span>
                  ) : (
                    "—"
                  )}
                </FRow>
              </Fragment>
            ))}
            <FRow label="취소 가능 잔액">
              원래 <b>{formatWon(cancellable)}</b> · 추가{" "}
              <b>{formatWon(extraCancellable)}</b>
            </FRow>
            <FRow label="결제 상태">
              {statusBadge && <OrderBadge data={statusBadge} hideDot />}
            </FRow>
          </>
        ) : payment ? (
          <>
            <FRow label="PG 거래번호">
              <span className={TNUM}>{payment.paymentId}</span>
            </FRow>
            <FRow label="결제수단">{payment.methodLabel}</FRow>
            <FRow label="결제금액">
              <span className={TNUM}>{formatWon(payment.amount)}</span>
            </FRow>
            <FRow label="결제일시">
              <span className={TNUM}>{formatFullDateTime(payment.paidAt)}</span>
            </FRow>
            <FRow label="취소 가능 잔액">
              <b>{formatWon(cancellable)}</b>{" "}
              <span className={SUB}>
                ·{" "}
                {payment.cancelledAmount > 0
                  ? `취소 누적 ${formatWon(payment.cancelledAmount)}`
                  : "부분 환불 없음"}
              </span>
            </FRow>
            <FRow label="결제 상태">
              {statusBadge && <OrderBadge data={statusBadge} hideDot />}
            </FRow>
          </>
        ) : (
          <FRow label="결제">
            <span className="text-sz-n-500">결제 기록 없음</span>
          </FRow>
        )}
        <FRow label="소비자">
          {consumer.name ?? "—"}
          {consumer.email && <span className={SUB}> · {consumer.email}</span>}
        </FRow>
        <FRow label="수취인">
          {recipient.name} <span className={SUB}>· {recipient.phone}</span>
        </FRow>
        <FRow label="배송지">
          <span className={TNUM}>({recipient.zipCode})</span>{" "}
          {recipient.address} {recipient.detailAddress}
        </FRow>
        {recipient.memo && <FRow label="배송 메모">{recipient.memo}</FRow>}
      </Grid2>
    </Block>
  );
}

/** ② 머리 오른쪽 — 「글로우 크림 공구 · 인플루언서 글로우_지민」. 하위주문마다 공구가 다르면 이어 적는다 */
function groupBuyNote(detail: AdminOrderDetail) {
  const lines = detail.groups
    .filter((group) => group.groupBuyTitle)
    .map((group) =>
      [
        group.groupBuyTitle,
        group.creatorName && `인플루언서 ${group.creatorName}`,
      ]
        .filter(Boolean)
        .join(" · ")
    );
  const unique = [...new Set(lines)];
  return unique.length > 0 ? unique.join(" / ") : undefined;
}

/** ② 하위주문 · 항목 — 항목(SKU) 트리는 여기서만 보인다(목록은 하위주문 1단에서 끊는다) */
export function SubOrdersBlock(props: BlockProps) {
  const { index, detail } = props;
  const note = groupBuyNote(detail);
  return (
    <Block
      index={index}
      title="하위주문 · 항목"
      note={
        note && (
          <span className="text-[11px] font-normal text-sz-n-500">{note}</span>
        )
      }
    >
      <div>
        {detail.groups.map((group) => (
          <SubCard
            key={group.deliveryGroupId}
            head={
              <GroupHead
                group={group}
                right={
                  <>
                    {group.groupBuyNumber && `${group.groupBuyNumber} · `}
                    하위주문 {subOrderSuffix(group.subOrderNumber)} ·{" "}
                    {formatWon(groupAmount(group))}
                  </>
                }
              />
            }
          >
            {group.items.map((item) => {
              const badge = ITEM_STATUS_BADGE[item.status] ?? {
                label: item.status,
                tone: "NEUTRAL" as OrderBadgeTone,
              };
              const requested =
                group.cancelRequest?.orderProductIds.includes(
                  item.orderProductId
                ) ?? false;
              return (
                <ItRow key={item.orderProductId}>
                  <span>{item.productName}</span>
                  {item.optionName && (
                    <span className="text-sz-n-400">{item.optionName}</span>
                  )}
                  <span className="text-sz-n-500">×{item.quantity}</span>
                  <OrderBadge data={badge} hideDot />
                  {requested && (
                    <OrderBadge
                      data={{ label: "취소 요청", tone: "WARNING" }}
                      hideDot
                      className="ml-1.5"
                    />
                  )}
                  {item.returnedQuantity > 0 && (
                    <span className={SUB}>반품 {item.returnedQuantity}</span>
                  )}
                  {item.cancelTypeLabel && (
                    <span className={SUB}>
                      {cancelTypeText(item.cancelTypeLabel)}
                    </span>
                  )}
                  <span className="ml-auto tabular-nums text-sz-n-700">
                    {formatWon(item.price * item.quantity)}
                  </span>
                </ItRow>
              );
            })}
          </SubCard>
        ))}
      </div>
    </Block>
  );
}

function ShipRow(props: {
  label: string;
  children: ReactNode;
  side?: ReactNode;
  warn?: boolean;
}) {
  return (
    <ItRow>
      <span className="text-[11px] text-sz-n-500">{props.label}</span>
      <span className={cn(props.warn && "text-sz-warning-text")}>
        {props.children}
      </span>
      {props.side && (
        <span className="ml-auto text-[11px] text-sz-n-500">{props.side}</span>
      )}
    </ItRow>
  );
}

/**
 * 추적 정지 · 소비자 선택(기-15 【잠정】) — 시안은 목록 보조줄(A3)에만 그렸고 상세 자리는 없다.
 * 서버가 상세에 `stallChoice`를 내리므로(목록에는 아직 없다) 배송 블록 「추적」 아래 한 줄로 둔다.
 */
function StallChoiceRow(props: { choice: AdminOrderStallChoice }) {
  const { choice } = props;
  if (choice.state === "CHOSEN") {
    return (
      <ShipRow
        label="소비자 선택"
        side={
          choice.chosenAt && (
            <span className={TNUM}>{formatShortDateTime(choice.chosenAt)}</span>
          )
        }
      >
        <b>{STALL_CHOICE_TEXT.chosen(choice.choiceLabel)}</b>
        <span className={SUB}> · 처리는 브랜드</span>
      </ShipRow>
    );
  }
  return (
    <ShipRow
      label="소비자 선택"
      warn={choice.state === "OPEN"}
      side={
        choice.opensAt && (
          <span className={TNUM}>
            개방 {formatShortDateTime(choice.opensAt)}
          </span>
        )
      }
    >
      {choice.state === "OPEN"
        ? STALL_CHOICE_TEXT.open
        : STALL_CHOICE_TEXT.waiting(choice.daysUntilOpen)}
    </ShipRow>
  );
}

/** 1:1 문의 줄 — 「1:1 문의 #4518」을 눌러 CS 문의 상세로 간다(B3 수령일 이의의 근거) */
function InquiryRows(props: { detail: AdminOrderDetail }) {
  const navigate = useNavigate();
  return props.detail.inquiries.map((inquiry) => (
    <ShipRow
      key={inquiry.inquiryId}
      label="1:1 문의"
      side={
        <>
          <span className={TNUM}>{formatMonthDay(inquiry.createdAt)}</span> 접수
        </>
      }
    >
      <button
        type="button"
        onClick={() => navigate(inquiryDetailPath(inquiry.inquiryId))}
        className="cursor-pointer text-sz-accent-500 hover:underline"
      >
        <span className={TNUM}>#{inquiry.inquiryId}</span> ↗
      </button>
      <span className={SUB}>
        {" "}
        · {inquiry.typeLabel} · {inquiry.answered ? "답변 완료" : "답변 대기"}
      </span>
    </ShipRow>
  ));
}

/** ③ 배송 — 하위주문마다 송장(출처) · 발송 기한 · 추적 · 반송 · 배송완료(출처) · 취소 */
export function ShippingBlock(props: BlockProps) {
  const { index, detail } = props;
  const locked = detail.groups.some((group) => group.cancelRequest);
  const multi = detail.groups.length > 1;
  const hasInquiries = detail.inquiries.length > 0;
  return (
    <Block index={index} title="배송">
      {detail.groups.map((group) => {
        const s = group.shipping;
        const beforeShip =
          group.status === "NEW" || group.status === "PREPARING";
        return (
          <SubCard
            key={group.deliveryGroupId}
            head={
              <GroupHead
                group={group}
                right={
                  s.trackingNumber ? (
                    <>
                      {s.carrierLabel}{" "}
                      <span className={TNUM}>{s.trackingNumber}</span>
                      {s.invoiceSourceLabel && (
                        <span className="text-sz-n-400">
                          {" "}
                          · {s.invoiceSourceLabel}
                        </span>
                      )}
                    </>
                  ) : (
                    "송장 미등록"
                  )
                }
              />
            }
          >
            {beforeShip && (
              <ShipRow
                label="발송 기한"
                warn={s.shipOverdue}
                side={`공구 마감 + ${s.shipDueBusinessDays}영업일(주문 시점 값)`}
              >
                {s.shipDueAt ? (
                  <>
                    <span className={TNUM}>{formatDueFull(s.shipDueAt)}</span>
                    {s.shipOverdue && <b> · 기한 경과</b>}
                  </>
                ) : (
                  "공구 진행 중 — 마감 전이라 기한이 없습니다"
                )}
              </ShipRow>
            )}
            {s.overdueNoticeCount > 0 && (
              <ShipRow label="자동 알림" side="브랜드 무응답">
                {s.overdueNoticeCount}회
                {s.lastOverdueNoticeAt && (
                  <span className="text-sz-n-400">
                    {" "}
                    ·{" "}
                    <span className={TNUM}>
                      {formatShortDateTime(s.lastOverdueNoticeAt)}
                    </span>{" "}
                    마지막
                  </span>
                )}
              </ShipRow>
            )}
            {s.prepareStartedAt && (
              <ShipRow label="준비 시작">
                <span className={TNUM}>
                  {formatFullDateTime(s.prepareStartedAt)}
                </span>
              </ShipRow>
            )}
            {s.shippedAt && (
              <ShipRow label="발송">
                <span className={TNUM}>{formatFullDateTime(s.shippedAt)}</span>
              </ShipRow>
            )}
            {(s.trackingAlert || s.lastTrackingAt || s.lastTrackingLabel) && (
              <ShipRow
                label="추적"
                side={
                  s.lastTrackingAt && (
                    <span className={TNUM}>
                      최종 갱신 {formatShortDateTime(s.lastTrackingAt)}
                    </span>
                  )
                }
              >
                {s.trackingAlert && s.trackingAlertLabel && (
                  <OrderBadge
                    data={{
                      label: s.trackingAlertLabel,
                      tone: TRACKING_ALERT_TONE[s.trackingAlert],
                    }}
                    hideDot
                    className={s.lastTrackingLabel ? "mr-1.5" : undefined}
                  />
                )}
                {/* 마지막 스캔 문구(「간선 상차」) — 연동 업체 원문 */}
                {s.lastTrackingLabel ?? (s.trackingAlert ? null : "정상")}
              </ShipRow>
            )}
            {group.stallChoice && <StallChoiceRow choice={group.stallChoice} />}
            {s.returnDetectedAt && (
              <ShipRow label="반송 감지">
                <span className={TNUM}>
                  {formatFullDateTime(s.returnDetectedAt)}
                </span>
              </ShipRow>
            )}
            {s.returnCompletedAt && (
              <ShipRow label="반송 완료">
                <span className={TNUM}>
                  {formatFullDateTime(s.returnCompletedAt)}
                </span>
              </ShipRow>
            )}
            {s.deliveredAt && (
              <ShipRow label="배송완료">
                <span className={TNUM}>
                  {formatFullDateTime(s.deliveredAt)}
                </span>
                {s.deliveredSourceLabel && ` (${s.deliveredSourceLabel})`}
              </ShipRow>
            )}
            {group.cancel && (
              <ShipRow
                label="취소"
                side={
                  <span className={TNUM}>
                    {formatShortDateTime(group.cancel.cancelledAt)}
                  </span>
                }
              >
                {cancelTypeText(group.cancel.cancelTypeLabel)}
                {group.cancel.reasonLabel && ` · ${group.cancel.reasonLabel}`}
                {group.cancel.reasonDetail && (
                  <span className={SUB}> · {group.cancel.reasonDetail}</span>
                )}
              </ShipRow>
            )}
            {!multi && hasInquiries && <InquiryRows detail={detail} />}
          </SubCard>
        );
      })}
      {/* 문의는 주문 단위라 하위주문이 여럿이면 카드 하나로 따로 모은다 */}
      {multi && hasInquiries && (
        <SubCard>
          <InquiryRows detail={detail} />
        </SubCard>
      )}
      {locked && (
        <Hint>
          취소 요청 처리 전까지 <b>하위주문 전체의 송장 등록이 잠깁니다</b>.
        </Hint>
      )}
      {detail.groups.some((group) => group.status === "RETURNING") && (
        <Hint>
          반송 사유는 플랫폼이 판정하지 않습니다 — 택배사에서 직접 확인하세요.
        </Hint>
      )}
    </Block>
  );
}

/** ④ 정산 반영 — 직권 취소·사유 환불이 클로백을 만드는지가 판단에 직결돼 남긴다 */
export function SettlementBlock(props: BlockProps) {
  const { index, detail } = props;
  const multi = detail.groups.length > 1;
  const rows = (group: AdminOrderGroupDetail) => {
    const st = group.settlement;
    return (
      <Grid2>
        <FRow label="구매확정">{purchaseConfirmText(group)}</FRow>
        <FRow label="정산 편입">
          {st ? (
            <>
              <span className={TNUM}>{st.settlementNumber}</span> ·{" "}
              {st.statusLabel}
            </>
          ) : (
            "미편입"
          )}
        </FRow>
        <FRow label="정산 확정일">
          {st?.confirmedAt ? (
            <span className={TNUM}>{toDotDate(st.confirmedAt)}</span>
          ) : (
            "—"
          )}
        </FRow>
        {st && (
          <FRow label="정산 반영액">
            <span className={TNUM}>{formatWon(st.settledAmount)}</span>{" "}
            <span className={SUB}>· 리워드 {formatWon(st.rewardAmount)}</span>
          </FRow>
        )}
        <FRow label="클로백">
          {st && st.clawbacks.length > 0
            ? st.clawbacks.map((c) => (
                <div key={c.clawbackNumber}>
                  <span className={TNUM}>{c.clawbackNumber}</span> ·{" "}
                  {c.side === "BRAND" ? "브랜드" : "인플루언서"}{" "}
                  {formatWon(c.amount)} · {c.statusLabel}
                </div>
              ))
            : st?.confirmedAt
              ? "환불 시 다음 정산에서 차감"
              : "해당 없음"}
        </FRow>
      </Grid2>
    );
  };
  return (
    <Block index={index} title="정산 반영">
      {multi
        ? detail.groups.map((group) => (
            <SubCard
              key={group.deliveryGroupId}
              head={<GroupHead group={group} />}
            >
              <div className="px-2.5 py-1">{rows(group)}</div>
            </SubCard>
          ))
        : detail.groups[0]
          ? rows(detail.groups[0])
          : null}
    </Block>
  );
}

/** ④ 취소 요청(B7) — 운영자가 볼 값은 응답 마감과 자동 승인 여부 둘(운영자 조치는 없다) */
export function CancelRequestBlock(props: BlockProps) {
  const { index, detail } = props;
  const groups = detail.groups.filter((group) => group.cancelRequest);
  return (
    <Block index={index} title="취소 요청">
      {groups.map((group) => {
        const request = group.cancelRequest;
        if (!request) return null;
        const names = group.items
          .filter((item) =>
            request.orderProductIds.includes(item.orderProductId)
          )
          .map((item) => item.productName);
        return (
          <Grid2 key={group.deliveryGroupId}>
            {groups.length > 1 || detail.groups.length > 1 ? (
              <FRow label="하위주문">
                {group.brandName} {subOrderSuffix(group.subOrderNumber)}
              </FRow>
            ) : null}
            <FRow label="요청 일시">
              <span className={TNUM}>
                {formatFullDateTime(request.requestedAt)}
              </span>
            </FRow>
            <FRow label="사유">
              {request.reasonLabel}
              {request.reasonDetail && (
                <span className={SUB}> · {request.reasonDetail}</span>
              )}
            </FRow>
            <FRow label="응답 마감">
              <b className={TNUM}>{formatDueFull(request.respondDueAt)}</b>
            </FRow>
            <FRow label="미응답 시">
              <b>자동 승인</b> · PG 즉시 환불
            </FRow>
            <FRow label="요청 항목">{names.join(", ") || "—"}</FRow>
          </Grid2>
        );
      })}
      {/* 기-33 — 「주문 제작·맞춤 상품」은 거부 사유에서 빠졌다(06a rev.5 B7). 서버는 옛 저장 행 표시용으로
          `MADE_TO_ORDER`를 선택 불가로 남겨 두었고, 이 블록은 응답 대기 중 요청만 그려 거부 사유가 오지 않는다 */}
      <Hint>
        브랜드 거부 사유는 3종(이미 포장·출고 완료 / 택배사 집화 완료 / 기타 —
        상세 필수)이고 <b>소비자에게 그대로 전달</b>
        됩니다.
      </Hint>
    </Block>
  );
}

/** 환불 — 하위주문의 환불 큐 전부(PG 자동 · 운영자 사유). 환불번호로 환불 관리에서 찾는다 */
export function RefundBlock(props: BlockProps) {
  const { index, detail } = props;
  const multi = detail.groups.length > 1;
  return (
    <Block index={index} title="환불">
      <SubCard>
        {detail.groups.flatMap((group) =>
          group.refunds.map((refund) => (
            <ItRow key={refund.refundTaskId}>
              <span className={TNUM}>{refund.refundNo}</span>
              {multi && <span className={SUB}>{group.brandName}</span>}
              <span className={SUB}>{refund.originLabel}</span>
              <OrderBadge data={REFUND_STATUS_BADGE[refund.status]} hideDot />
              {refund.lastError && (
                <span className="truncate text-[11px] text-sz-danger-text">
                  {refund.lastError}
                </span>
              )}
              <span className="ml-auto tabular-nums text-sz-n-700">
                {formatWon(refund.amount)}
                <span className={cn(SUB, "ml-1.5")}>
                  {formatShortDateTime(refund.executedAt ?? refund.createdAt)}
                </span>
              </span>
            </ItRow>
          ))
        )}
      </SubCard>
    </Block>
  );
}

/** ⑤ 이력 — 누가 언제 무슨 근거로 했는지. 하위주문 이력을 모아 최신순으로 */
export function HistoryBlock(props: BlockProps) {
  const { index, detail } = props;
  const multi = detail.groups.length > 1;
  const items = detail.groups
    .flatMap((group) =>
      group.history.map((entry) => ({
        entry,
        prefix: multi
          ? `하위주문 ${subOrderSuffix(group.subOrderNumber)} `
          : "",
      }))
    )
    .sort((a, b) => b.entry.occurredAt.localeCompare(a.entry.occurredAt));
  return (
    <Block index={index} title="이력">
      <div className="pt-0.5">
        {items.map(({ entry, prefix }, itemIndex) => (
          <div key={itemIndex} className="flex gap-2.5 py-1.5">
            <span
              className={cn(
                "mt-1.5 size-[7px] shrink-0 rounded-full",
                entry.actorType === "ADMIN" ? "bg-sz-info-text" : "bg-sz-n-400"
              )}
            />
            <div>
              <div className="text-[12px]">
                {prefix}
                {entry.label}
              </div>
              <div className="text-[11px] text-sz-n-500">
                {[
                  ACTOR_LABEL[entry.actorType] ?? entry.actorType,
                  entry.detail,
                  formatShortDateTime(entry.occurredAt),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Block>
  );
}
