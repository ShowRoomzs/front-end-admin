import { parseServerDateTime } from "@/common/utils/formatDate";
import CorrectDeliveredAtForm from "@/features/order/components/detail/forms/CorrectDeliveredAtForm";
import OpenReturnForm from "@/features/order/components/detail/forms/OpenReturnForm";
import ProxyInvoiceForm from "@/features/order/components/detail/forms/ProxyInvoiceForm";
import RefundForm from "@/features/order/components/detail/forms/RefundForm";
import {
  MetaRow,
  RailCard,
  RailText,
  TLink,
} from "@/features/order/components/detail/parts";
import OrderBadge from "@/features/order/components/shared/OrderBadge";
import OrderBtn from "@/features/order/components/shared/OrderBtn";
import RichText from "@/features/order/components/shared/RichText";
import {
  RAIL_NOTICE_TEXT,
  REFUND_STATUS_BADGE,
  type OrderRailNotice,
} from "@/features/order/constants/labels";
import {
  ORDER_CLAIM_PATH,
  THREAD_PATH,
} from "@/features/order/constants/params";
import type {
  AdminOrderActions,
  AdminOrderDetail,
  AdminOrderGroupDetail,
  OrderBadgeData,
} from "@/features/order/types";
import {
  formatDueShort,
  formatMonthDay,
  formatShortDateTime,
  formatWon,
  shipOverdueDays,
  subOrderSuffix,
} from "@/features/order/utils/format";
import dayjs from "dayjs";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface OrderRailProps {
  detail: AdminOrderDetail;
  /** 직권 취소 확인 대화상자를 연다 */
  onForceCancel: () => void;
}

type FormKey = "refund" | "correct" | "openReturn";

/** 이 조치를 열 수 있는 하위주문 — 버튼 노출의 정본은 서버 `actions` */
function groupsWith(detail: AdminOrderDetail, key: keyof AdminOrderActions) {
  return detail.groups.filter((group) => group.actions[key]);
}

/** 주문 배지 — 하위주문 상태가 하나면 그 상태, 갈리면 「혼합」 */
function orderBadge(detail: AdminOrderDetail): OrderBadgeData {
  const labels = new Set(detail.groups.map((group) => group.statusLabel));
  const first = detail.groups[0];
  if (labels.size === 1 && first) {
    if (first.cancelRequest) {
      return { label: "취소 요청", tone: "WARNING" };
    }
    return { label: first.statusLabel, tone: first.statusTone };
  }
  return { label: "혼합", tone: "INFO" };
}

/** 조치가 하나도 없을 때 레일에 적는 안내 */
function railNotice(detail: AdminOrderDetail): OrderRailNotice {
  const groups = detail.groups;
  if (
    groups.some((g) => g.status === "RETURNING" || g.shipping.returnCompletedAt)
  ) {
    return "RETURNED";
  }
  if (groups.some((g) => g.cancelRequest)) {
    return "CANCEL_REQUESTED";
  }
  const claims = groups.flatMap((g) => g.activeClaims);
  if (claims.some((claim) => claim.type === "EXCHANGE")) {
    return "EXCHANGING";
  }
  if (claims.length > 0) {
    return "RETURN_OPENED";
  }
  if (groups.length > 0 && groups.every((g) => g.status === "CANCELLED")) {
    return "CANCELED";
  }
  return "NO_ACTION";
}

function groupName(group: AdminOrderGroupDetail) {
  return `${group.brandName} ${subOrderSuffix(group.subOrderNumber)}`;
}

/** 「현재 상태」 카드의 구매확정 줄 — 확정 · 정지(남은 N일) · 예정일 · 반송 환불(타이머 취소) */
function purchaseConfirmRow(group: AdminOrderGroupDetail, suffix: string) {
  if (group.refunds.some((refund) => refund.source === "RETURN_COMPLETED")) {
    // 시안 B2 — 반송 완료 자동 환불은 구매확정 타이머를 취소하고 정산에서 뺀다(상단 배너와 같은 사실)
    return { label: `구매확정${suffix}`, value: "타이머 취소 · 정산 제외" };
  }
  const pc = group.purchaseConfirm;
  if (!pc || group.status === "CANCELLED") return null;
  if (pc.confirmedAt) {
    return {
      label: `구매확정${suffix}`,
      value: `확정 ${formatMonthDay(pc.confirmedAt)}`,
    };
  }
  if (pc.paused) {
    return {
      label: `구매확정${suffix}`,
      value: `정지 · 남은 ${pc.remainingDays ?? 0}일`,
    };
  }
  if (pc.dueAt) {
    return {
      label: `구매확정 예정${suffix}`,
      value: formatMonthDay(pc.dueAt),
    };
  }
  return null;
}

/** 「현재 상태」 카드의 메타 줄 — 서버 값만 옮긴다(시안 B1 · B2 · B3 · B4 · B7 · B8 순서) */
function statusRows(detail: AdminOrderDetail) {
  const rows: Array<{ label: string; value: ReactNode; warn?: boolean }> = [];
  const multi = detail.groups.length > 1;
  if (multi) {
    const counts = new Map<string, number>();
    detail.groups.forEach((g) =>
      counts.set(g.statusLabel, (counts.get(g.statusLabel) ?? 0) + 1)
    );
    rows.push({
      label: "하위주문",
      value: [...counts].map(([label, n]) => `${label} ${n}`).join(" · "),
    });
  }
  // 시안 B1 「구매확정 미도래」 — 배송중 하위주문이 있고 아직 배송완료 · 확정 일정이 하나도 없을 때(주문 단위 한 줄)
  const live = detail.groups.filter((g) => g.status !== "CANCELLED");
  if (
    live.some((g) => g.status === "SHIPPING") &&
    live.every((g) => !g.shipping.deliveredAt && !g.purchaseConfirm)
  ) {
    rows.push({ label: "구매확정", value: "미도래" });
  }
  detail.groups.forEach((group) => {
    const suffix = multi ? ` ${subOrderSuffix(group.subOrderNumber)}` : "";
    const request = group.cancelRequest;
    if (request) {
      // 응답 마감은 영업일 기한(23:59:59 KST를 UTC로 바꾼 값)이라 지금 시각과 바로 뺀다
      const hours = parseServerDateTime(request.respondDueAt).diff(
        dayjs(),
        "hour"
      );
      rows.push({
        label: `응답 마감${suffix}`,
        value: formatDueShort(request.respondDueAt),
      });
      rows.push({
        label: "남은 시간",
        value: hours > 0 ? `${hours}시간` : "마감 임박",
        warn: true,
      });
      rows.push({ label: "미응답 시", value: "자동 승인 · PG 환불" });
    }
    if (group.shipping.shipOverdue && group.shipping.shipDueAt) {
      rows.push({
        label: `발송기한${suffix}`,
        value: `${shipOverdueDays(group.shipping.shipDueAt)}일 초과`,
        warn: true,
      });
    }
    if (group.actions.canRegisterShipment) {
      rows.push({
        label: `자동 알림${suffix}`,
        value: `${group.shipping.overdueNoticeCount}회 무응답 · 대행 가능`,
        warn: true,
      });
    }
    if (group.shipping.trackingAlertLabel) {
      rows.push({
        label: `배송 이상${suffix}`,
        value: group.shipping.trackingAlertLabel,
        warn: true,
      });
    }
    // 배송완료(B3) — 클레임이 진행 중이면 단계 줄이 대신한다(B8)
    if (
      group.shipping.deliveredAt &&
      group.status === "DELIVERED" &&
      group.activeClaims.length === 0
    ) {
      rows.push({
        label: `배송완료${suffix}`,
        value: `${formatMonthDay(group.shipping.deliveredAt)}${
          group.shipping.deliveredSourceLabel
            ? ` (${group.shipping.deliveredSourceLabel})`
            : ""
        }`,
      });
    }
    const refund = group.refunds[group.refunds.length - 1];
    if (refund) {
      // 시안 B2 「32,000원 · 자동 완료」 — PG 자동 환불이 끝났으면 「자동 완료」, 그 밖은 환불 큐 상태
      const done = refund.origin === "PG_AUTO" && refund.status === "DONE";
      rows.push({
        label: `환불${suffix}`,
        value: `${formatWon(refund.amount)} · ${
          done ? "자동 완료" : REFUND_STATUS_BADGE[refund.status].label
        }`,
      });
      if (refund.executedAt) {
        rows.push({
          label: `환불 일시${suffix}`,
          value: formatShortDateTime(refund.executedAt),
        });
      }
    }
    group.activeClaims.forEach((claim) => {
      rows.push({
        label: `단계${suffix}`,
        value: `${
          group.activeClaims.length > 1 ? `${claim.claimNumber} · ` : ""
        }${claim.type === "EXCHANGE" ? "교환" : "반품"} · ${claim.statusLabel}`,
      });
    });
    const confirmRow = purchaseConfirmRow(group, suffix);
    if (confirmRow) rows.push(confirmRow);
    // 시안 B8 「재발송비 3,000원 결제됨」 — 클레임 재발송비 결제(① 추가 결제와 같은 행)
    detail.additionalPayments
      .filter((extra) => extra.deliveryGroupId === group.deliveryGroupId)
      .forEach((extra) => {
        rows.push({
          label: `재발송비${suffix}`,
          value: `${formatWon(extra.amount)} ${
            extra.status === "PAID" ? "결제됨" : extra.statusLabel
          }`,
        });
      });
  });
  return rows;
}

/**
 * 우 레일 — 현재 상태 · 운영자 조치 카드 · 그 외 조치. 운영자 액션은 목록이 아니라 여기서만 시작한다.
 * 액션은 조건 미충족이면 **숨긴다**(비활성 아님) — 하위주문마다 서버가 내려준 `actions`를 그대로 따른다.
 *
 * 구성 규칙
 *  - 조치가 하나도 없는 주문(반송 완료 · 취소 요청 · 교환 진행 중 …): 「운영자 조치」에 「조치할 것이 없습니다」
 *  - 대행 가능(B4) 주문: 송장 대행 폼이 펼쳐진 채 + 「그 외 조치」
 *  - 버튼으로 연 폼(사유 환불 · 배송완료일 정정 · 반품 대신 열기): 그 폼 카드 + 「그 외 조치」(남은 버튼)
 *  - 그 밖: 「운영자 조치」에 버튼 + 직권 취소 대상 한 줄
 * 분실 처리 · 배송완료 처리(추적 정지 28일 · `canMarkLost` · `canMarkDelivered`)는 시안 · 설계서에
 * 자리가 없어 아직 버튼을 두지 않는다.
 */
export default function OrderRail(props: OrderRailProps) {
  const { detail, onForceCancel } = props;
  const navigate = useNavigate();
  const [openForm, setOpenForm] = useState<FormKey | null>(null);

  const shipmentGroups = groupsWith(detail, "canRegisterShipment");
  const refundGroups = groupsWith(detail, "canEnqueueRefund");
  const correctGroups = groupsWith(detail, "canCorrectDeliveredAt");
  const returnGroups = groupsWith(detail, "canOpenDefectClaim");
  const cancelGroups = groupsWith(detail, "canCancel");

  const hasAnyAction =
    shipmentGroups.length +
      refundGroups.length +
      correctGroups.length +
      returnGroups.length +
      cancelGroups.length >
    0;
  const claims = detail.groups.flatMap((group) => group.activeClaims);

  const openThread = () => navigate(THREAD_PATH);
  const openClaim = (claimId: number) =>
    navigate(`${ORDER_CLAIM_PATH}?claimId=${claimId}`);
  const close = () => setOpenForm(null);

  const formButton = (key: FormKey, label: string, count: number) =>
    count > 0 &&
    openForm !== key && (
      <OrderBtn
        key={key}
        variant="secondary"
        block
        onClick={() => setOpenForm(key)}
      >
        {label}
      </OrderBtn>
    );
  const buttons = (
    <>
      {formButton("refund", "운영자 사유 환불", refundGroups.length)}
      {formButton("correct", "배송완료일 정정", correctGroups.length)}
      {formButton("openReturn", "반품 대신 열기", returnGroups.length)}
      {cancelGroups.length > 0 && (
        <OrderBtn variant="dangerOutline" block onClick={onForceCancel}>
          직권 취소
        </OrderBtn>
      )}
    </>
  );
  const claimLinks = claims.map((claim) => (
    <TLink key={claim.claimId} onClick={() => openClaim(claim.claimId)}>
      {claims.length > 1
        ? `반품·교환 상세 보기 (${claim.claimNumber}) ↗`
        : "반품·교환 상세 보기 ↗"}
    </TLink>
  ));

  const showForms = shipmentGroups.length > 0 || openForm !== null;

  return (
    <div>
      <RailCard title="현재 상태">
        <div className="mb-2 flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3">
          <span className="shrink-0 text-[12px] text-sz-n-500">주문</span>
          <OrderBadge data={orderBadge(detail)} />
        </div>
        <div className="pt-2">
          {statusRows(detail).map((row, rowIndex) => (
            <MetaRow
              key={rowIndex}
              label={row.label}
              tone={row.warn ? "warn" : undefined}
            >
              {row.value}
            </MetaRow>
          ))}
        </div>
      </RailCard>

      {!hasAnyAction ? (
        <RailCard title="운영자 조치">
          <RailText flush>
            <RichText value={RAIL_NOTICE_TEXT[railNotice(detail)]} />
          </RailText>
          {claimLinks}
          <TLink onClick={openThread}>연결·소통 스레드 열기 ↗</TLink>
        </RailCard>
      ) : showForms ? (
        <>
          {shipmentGroups.length > 0 && (
            <ProxyInvoiceForm detail={detail} groups={shipmentGroups} />
          )}
          {openForm === "refund" && (
            <RefundForm detail={detail} groups={refundGroups} onClose={close} />
          )}
          {openForm === "correct" && (
            <CorrectDeliveredAtForm
              detail={detail}
              groups={correctGroups}
              onClose={close}
            />
          )}
          {openForm === "openReturn" && (
            <OpenReturnForm
              detail={detail}
              groups={returnGroups}
              onClose={close}
            />
          )}
          <RailCard title="그 외 조치">
            {buttons}
            {claimLinks}
            <TLink onClick={openThread}>연결·소통 스레드 열기 ↗</TLink>
          </RailCard>
        </>
      ) : (
        <RailCard title="운영자 조치">
          {buttons}
          {cancelGroups.length > 0 && (
            <RailText>
              <b>직권 취소</b>는{" "}
              <b>{cancelGroups.map(groupName).join(", ")} 하위주문</b>(배송
              전)만 대상입니다. 취소분은 <b>PG 자동 환불</b>(항목 + 배송비
              전액)로 처리되며 운영자 집행이 없습니다.
              {/* 클로백은 정산이 생성된 항목의 운영자 사유 · 반품 통과 환불에서만 생긴다(SettlementClawbackService) */}
              {cancelGroups.every((group) => group.settlement === null) &&
                " 정산 확정 항목 없음 — 클로백 발생하지 않습니다."}
            </RailText>
          )}
          {claimLinks}
          <TLink onClick={openThread}>연결·소통 스레드 열기 ↗</TLink>
        </RailCard>
      )}
    </div>
  );
}
