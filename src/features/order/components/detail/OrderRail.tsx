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
import { RAIL_NOTICE_TEXT } from "@/features/order/constants/labels";
import {
  ORDER_CLAIM_PATH,
  THREAD_PATH,
} from "@/features/order/constants/params";
import type { OrderDetail } from "@/features/order/types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface OrderRailProps {
  detail: OrderDetail;
  /** 직권 취소 확인 대화상자를 연다 */
  onForceCancel: () => void;
}

/**
 * 우 레일 — 현재 상태 · 운영자 조치 카드 · 그 외 조치. 운영자 액션은 목록이 아니라 여기서만 시작한다.
 * 액션은 조건 미충족이면 **숨긴다**(비활성 아님) — 서버가 내려준 가능 여부(`actions`)를 그대로 따른다.
 *
 * 구성 규칙
 *  - 안내만 있는 주문(반송 완료 · 취소 요청 · 교환 진행 중 …): 「운영자 조치」에 「조치할 것이 없습니다」
 *  - 전용 폼이 열린 주문(송장 대행 · 배송완료일 정정 · 반품 대신 열기) 또는 사유 환불 폼이 펼쳐진 주문:
 *    그 폼 카드 + 「그 외 조치」(남은 버튼 + 스레드 링크)
 *  - 그 밖: 「운영자 조치」에 버튼(사유 환불 · 직권 취소) + 직권 취소 대상·클로백 한 줄
 */
export default function OrderRail(props: OrderRailProps) {
  const { detail, onForceCancel } = props;
  const navigate = useNavigate();
  const [refundOpen, setRefundOpen] = useState(false);
  const { actions } = detail;

  const mainForm =
    actions.proxyInvoice !== null ||
    actions.correctDeliveredAt !== null ||
    actions.openReturn !== null;
  const refundFormVisible = refundOpen && actions.refund;

  const openThread = () => navigate(THREAD_PATH);

  const refundButton = actions.refund && !refundFormVisible && (
    <OrderBtn variant="secondary" block onClick={() => setRefundOpen(true)}>
      운영자 사유 환불
    </OrderBtn>
  );
  const cancelButton = actions.forceCancel && (
    <OrderBtn variant="dangerOutline" block onClick={onForceCancel}>
      직권 취소
    </OrderBtn>
  );

  return (
    <div>
      <RailCard title="현재 상태">
        <div className="mb-2 flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3">
          <span className="shrink-0 text-[12px] text-sz-n-500">주문</span>
          <OrderBadge
            data={{
              label: detail.statusCard.label,
              tone: detail.statusCard.tone,
            }}
          />
        </div>
        <div className="pt-2">
          {detail.statusCard.rows.map((row) => (
            <MetaRow key={row.label} label={row.label} tone={row.tone}>
              <RichText value={row.value} />
            </MetaRow>
          ))}
        </div>
      </RailCard>

      {detail.railNotice ? (
        <RailCard title="운영자 조치">
          <RailText flush>
            <RichText value={RAIL_NOTICE_TEXT[detail.railNotice]} />
          </RailText>
          {detail.claimLink && (
            <TLink onClick={() => navigate(ORDER_CLAIM_PATH)}>
              반품·교환 상세 보기 ↗
            </TLink>
          )}
          <TLink onClick={openThread}>연결·소통 스레드 열기 ↗</TLink>
        </RailCard>
      ) : mainForm || refundFormVisible ? (
        <>
          {actions.proxyInvoice && (
            <ProxyInvoiceForm orderNo={detail.orderNo} />
          )}
          {actions.correctDeliveredAt && (
            <CorrectDeliveredAtForm
              orderNo={detail.orderNo}
              config={actions.correctDeliveredAt}
            />
          )}
          {actions.openReturn && (
            <OpenReturnForm detail={detail} config={actions.openReturn} />
          )}
          {refundFormVisible && (
            <RefundForm detail={detail} onClose={() => setRefundOpen(false)} />
          )}
          <RailCard title="그 외 조치">
            {refundButton}
            {cancelButton}
            <TLink onClick={openThread}>연결·소통 스레드 열기 ↗</TLink>
          </RailCard>
        </>
      ) : (
        <RailCard title="운영자 조치">
          {refundButton}
          {cancelButton}
          {actions.forceCancel && (
            <RailText>
              <b>직권 취소</b>는{" "}
              <b>{actions.forceCancel.targetBrandNames.join(", ")} 하위주문</b>
              (배송 전)만 대상입니다. 취소분은 <b>PG 자동 환불</b>로 처리되며
              운영자 집행이 없습니다.{" "}
              <b>
                {actions.forceCancel.clawback
                  ? "정산 확정 항목이 있어 다음 정산에서 차감됩니다(클로백)."
                  : "정산 확정 항목 없음 — 클로백 발생하지 않습니다."}
              </b>
            </RailText>
          )}
          <TLink onClick={openThread}>연결·소통 스레드 열기 ↗</TLink>
        </RailCard>
      )}
    </div>
  );
}
