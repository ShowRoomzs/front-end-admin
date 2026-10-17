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
  formatShortDateTime,
  formatWon,
  purchaseConfirmText,
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

/** 「현재 상태」 카드의 메타 줄 — 서버 값만 옮긴다 */
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
  detail.groups.forEach((group) => {
    const suffix = multi ? ` ${subOrderSuffix(group.subOrderNumber)}` : "";
    const request = group.cancelRequest;
    if (request) {
      const hours = dayjs(request.respondDueAt).diff(dayjs(), "hour");
      rows.push({
        label: `응답 마감${suffix}`,
        value: formatShortDateTime(request.respondDueAt),
      });
      rows.push({
        label: "남은 시간",
        value: hours > 0 ? `${hours}시간` : "마감 임박",
        warn: true,
      });
    }
    if (group.shipping.shipOverdue) {
      rows.push({
        label: `발송 기한${suffix}`,
        value: "기한 경과",
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
    if (group.shipping.deliveredAt && group.status !== "CANCELLED") {
      rows.push({
        label: `배송완료${suffix}`,
        value: `${dayjs(group.shipping.deliveredAt).format("MM.DD")}${
          group.shipping.deliveredSourceLabel
            ? ` (${group.shipping.deliveredSourceLabel})`
            : ""
        }`,
      });
      rows.push({
        label: `구매확정${suffix}`,
        value: purchaseConfirmText(group),
      });
    }
    const refund = group.refunds[group.refunds.length - 1];
    if (refund) {
      rows.push({
        label: `환불${suffix}`,
        value: `${formatWon(refund.amount)} · ${REFUND_STATUS_BADGE[refund.status].label}`,
      });
    }
    group.activeClaims.forEach((claim) => {
      rows.push({
        label: `${claim.type === "EXCHANGE" ? "교환" : "반품"}${suffix}`,
        value: `${claim.claimNumber} · ${claim.statusLabel}`,
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
            </RailText>
          )}
          {claimLinks}
          <TLink onClick={openThread}>연결·소통 스레드 열기 ↗</TLink>
        </RailCard>
      )}
    </div>
  );
}
