import {
  CancelRequestBlock,
  HistoryBlock,
  OrderBanner,
  PaymentBlock,
  SettlementBlock,
  ShippingBlock,
  SubOrdersBlock,
} from "@/features/order/components/detail/OrderBlocks";
import ForceCancelDialog from "@/features/order/components/detail/ForceCancelDialog";
import OrderRail from "@/features/order/components/detail/OrderRail";
import { ORDER_EXCEPTION_PATH } from "@/features/order/constants/params";
import { useGetOrderDetail } from "@/features/order/hooks/useOrderQueries";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface OrderDetailModalProps {
  orderNo: string;
  /** 지금 목록 화면에 보이는 주문번호 순서 — [이전]·[다음]이 이 안에서 움직인다 */
  orderNos: Array<string>;
  onNavigate: (orderNo: string) => void;
  onClose: () => void;
}

const NAV_BTN =
  "inline-flex h-8 cursor-pointer items-center gap-[5px] whitespace-nowrap rounded-[6px] border border-sz-n-300 bg-white px-3 text-[12px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-900";

/**
 * 시안 B1~B8 — 주문 상세 모달(1040px). 좌측 블록(결제 → 하위주문 → 배송 → 정산 반영 또는 취소 요청 → 이력)과
 * 우 레일(320px, DS §9 `1fr 320px`). 1:1 문의는 헤더 배지, 스레드는 레일 링크다.
 * 바깥을 눌러 닫지 않는다 — 입력 중인 폼이 빗나간 클릭 한 번에 날아가면 안 된다(닫기 · Esc).
 * [이전]·[다음]은 목록의 경계 건에서 렌더링을 생략한다(DS RecordNav).
 */
export default function OrderDetailModal(props: OrderDetailModalProps) {
  const { orderNo, orderNos, onNavigate, onClose } = props;
  const navigate = useNavigate();
  const { data: detail, isLoading, isError } = useGetOrderDetail(orderNo);
  const [cancelOpen, setCancelOpen] = useState(false);

  const index = orderNos.indexOf(orderNo);
  const prev = index > 0 ? orderNos[index - 1] : null;
  const next = index >= 0 ? (orderNos[index + 1] ?? null) : null;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // 직권 취소 확인창이 열려 있으면 그쪽이 먼저 닫힌다
      if (event.key === "Escape" && !cancelOpen) {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [onClose, cancelOpen]);

  // 블록 번호는 그려지는 순서대로 — 정산 반영이 없는 주문(취소 요청)은 ④가 취소 요청이다
  const blocks: Array<(i: number) => ReactNode> = [];
  if (detail) {
    blocks.push((i) => <PaymentBlock key="pay" index={i} detail={detail} />);
    blocks.push((i) => <SubOrdersBlock key="sub" index={i} detail={detail} />);
    blocks.push((i) => <ShippingBlock key="ship" index={i} detail={detail} />);
    if (detail.settlement) {
      blocks.push((i) => (
        <SettlementBlock key="settle" index={i} detail={detail} />
      ));
    }
    if (detail.cancelRequest) {
      blocks.push((i) => (
        <CancelRequestBlock key="cancel" index={i} detail={detail} />
      ));
    }
    blocks.push((i) => (
      <HistoryBlock key="history" index={i} items={detail.history} />
    ));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,27,31,0.4)] leading-[1.6]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`주문 상세 ${orderNo}`}
        className="flex max-h-[calc(100vh-48px)] w-[1040px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-5 py-3.5 text-[13px] font-semibold text-sz-n-900">
          <span>
            주문 상세{" "}
            <span className="font-medium tabular-nums tracking-[-0.1px] text-sz-n-600">
              {orderNo}
            </span>
            {detail && detail.inquiryCount > 0 && (
              <span className="ml-1.5">
                <StatusBadge variant="neutral" hideDot>
                  문의 {detail.inquiryCount}건
                </StatusBadge>
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5">
            {prev && (
              <button
                type="button"
                className={NAV_BTN}
                onClick={() => onNavigate(prev)}
              >
                ‹ 이전
              </button>
            )}
            {next && (
              <button
                type="button"
                className={NAV_BTN}
                onClick={() => onNavigate(next)}
              >
                다음 ›
              </button>
            )}
            {(prev || next) && (
              <span className="mx-0.5 h-[18px] w-px bg-sz-n-300" />
            )}
            <button
              type="button"
              aria-label="닫기"
              onClick={onClose}
              className="cursor-pointer text-sz-n-400 hover:text-sz-n-600"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-sz-n-50 p-4 text-[12px] leading-[1.7] text-sz-n-700">
          {isLoading && (
            <div className="py-[72px] text-center text-[12px] text-sz-n-500">
              불러오는 중…
            </div>
          )}
          {isError && (
            <div className="py-[72px] text-center">
              <div className="mb-1 text-[13px] font-semibold text-sz-n-700">
                주문 정보를 불러오지 못했습니다
              </div>
              <div className="text-[12px] text-sz-n-500">
                잠시 후 다시 열어 주세요.
              </div>
            </div>
          )}
          {detail && (
            <div
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_320px] items-start gap-4"
              )}
            >
              <div className="min-w-0">
                {detail.banner && (
                  <OrderBanner
                    banner={detail.banner}
                    onOpenException={() => navigate(ORDER_EXCEPTION_PATH)}
                  />
                )}
                {blocks.map((render, blockIndex) => render(blockIndex))}
              </div>
              {/* key — 다른 주문으로 넘어가면 펼쳐 둔 폼 상태를 버린다 */}
              <div className="sticky top-0">
                <OrderRail
                  key={detail.orderNo}
                  detail={detail}
                  onForceCancel={() => setCancelOpen(true)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {cancelOpen && detail?.actions.forceCancel && (
        <ForceCancelDialog
          orderNo={detail.orderNo}
          config={detail.actions.forceCancel}
          onClose={() => setCancelOpen(false)}
        />
      )}
    </div>
  );
}
