import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { formatDateOnly } from "@/common/utils/formatDate";
import { PENDING_TARGET_PATHS } from "@/features/consumer/constants/detail";
import { FLINK_CLASS, T_SUB_CLASS } from "@/features/consumer/constants/styles";
import type { ConsumerDetail } from "@/features/consumer/types/consumerDetail";
import {
  orderBrandLabel,
  orderProductLabel,
  orderStatusBadge,
} from "@/features/consumer/utils/detailView";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

/*
  표가 들어가는 카드(최근 주문 · 최근 문의) — 본문 패딩이 없는 카드라 `DetailCard` 대신
  같은 머리 모양(시안 `.card-h`)을 여기서 그린다. 표 셀은 시안 공통 `thead td` · `tbody td` 값.
*/
const TH =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-100 px-4 py-2.5 text-[11px] font-medium text-sz-n-600";
const TD =
  "border-t border-sz-n-100 px-4 py-[13px] text-[12px] align-middle group-first:border-t-0";
const ROW = "group cursor-pointer hover:bg-sz-accent-50";

function TableCard(props: {
  title: string;
  note?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex items-center gap-2 rounded-t-[8px] border-b border-sz-n-200 bg-sz-n-50 px-4 py-[11px]">
        <h2 className="text-[13px] font-semibold text-sz-n-900">
          {props.title}
        </h2>
        {props.note && (
          <span className="text-[11px] text-sz-n-500">{props.note}</span>
        )}
        {props.action && <span className="ml-auto">{props.action}</span>}
      </div>
      {props.children}
      {props.footer && (
        <div className="flex justify-end border-t border-sz-n-200 px-4 py-2.5">
          {props.footer}
        </div>
      )}
    </section>
  );
}

const NAV_BTN =
  "inline-flex h-8 items-center gap-[5px] whitespace-nowrap rounded-[6px] border border-sz-n-300 bg-white px-3 text-[12px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-900";

// ── 최근 주문 ───────────────────────────────────────────────────

/**
 * 최근 주문 5건 — 행 모양 · 집합이 어드민 주문 목록(`?userId=`)과 같다(서버가 같은 조회를 쓴다).
 * 상태 칸은 반품 · 교환 요약(「반품완료」 · 「교환완료」)이 먼저, 없으면 배송 이행 상태다.
 * 탈퇴 회원도 주문은 보존 기록이라 그대로 보인다.
 */
export function RecentOrdersCard(props: { detail: ConsumerDetail }) {
  const { detail } = props;
  const navigate = useNavigate();
  const { recentOrders } = detail;
  const empty = recentOrders.content.length === 0;

  return (
    <TableCard
      title="최근 주문"
      note={
        empty
          ? "주문 없음"
          : `최근 ${recentOrders.content.length}건 · 전체 ${recentOrders.total.toLocaleString()}건`
      }
      footer={
        empty ? undefined : (
          <button
            type="button"
            className={NAV_BTN}
            // 주문 조회 목록이 userId를 받는다(56 C1) — 기간 조건 없이 이 소비자 주문 전부
            onClick={() =>
              navigate(`${PENDING_TARGET_PATHS.ORDERS}?userId=${detail.userId}`)
            }
          >
            전체 주문 내역 보기 ›
          </button>
        )
      }
    >
      {empty ? (
        <div className="px-4 py-4">
          <div className={`${T_SUB_CLASS} py-1.5`}>주문 내역이 없습니다.</div>
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <td className={`${TH} w-[150px]`}>주문번호</td>
              <td className={TH}>상품명</td>
              <td className={`${TH} w-[110px]`}>브랜드</td>
              <td className={`${TH} w-[110px] text-right`}>결제금액</td>
              <td className={`${TH} w-[100px] text-center`}>상태</td>
              <td className={`${TH} w-[110px] text-center`}>주문일</td>
            </tr>
          </thead>
          <tbody>
            {recentOrders.content.map((order) => {
              const badge = orderStatusBadge(order);
              return (
                <tr
                  key={order.orderId}
                  className={ROW}
                  // 주문 조회 목록은 `?orderId=`로 들어오면 그 주문 상세를 바로 연다
                  onClick={() =>
                    navigate(
                      `${PENDING_TARGET_PATHS.ORDERS}?orderId=${order.orderId}`
                    )
                  }
                >
                  <td
                    className={`${TD} whitespace-nowrap text-[13px] font-medium tabular-nums text-sz-n-900 group-hover:text-sz-accent-600`}
                  >
                    {order.orderNumber}
                  </td>
                  <td className={`${TD} break-keep`}>
                    {orderProductLabel(order)}
                  </td>
                  <td className={`${TD} whitespace-nowrap ${T_SUB_CLASS}`}>
                    {orderBrandLabel(order)}
                  </td>
                  <td
                    className={`${TD} whitespace-nowrap text-right tabular-nums`}
                  >
                    {order.totalAmount.toLocaleString()}원
                  </td>
                  <td className={`${TD} text-center`}>
                    <StatusBadge variant={badge.variant}>
                      {badge.label}
                    </StatusBadge>
                  </td>
                  <td
                    className={`${TD} whitespace-nowrap text-center tabular-nums ${T_SUB_CLASS}`}
                  >
                    {formatDateOnly(order.paidAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </TableCard>
  );
}

// ── 최근 문의 ───────────────────────────────────────────────────

/**
 * 최근 문의 3건 — 1:1 · 상품 문의를 최신순으로 합친다. CS가 가장 먼저 보는 정보라 카드로 올렸다
 * (CS 응대 보강 ①). 행은 각 관리 화면 상세로, [전체 보기]는 이 소비자로 거른 1:1 문의 목록으로 간다.
 */
export function RecentInquiriesCard(props: { detail: ConsumerDetail }) {
  const { detail } = props;
  const navigate = useNavigate();
  const { recentInquiries } = detail;
  const withdrawn = detail.status === "WITHDRAWN";
  const total = recentInquiries.total.toLocaleString();

  return (
    <TableCard
      title="최근 문의"
      note={
        withdrawn
          ? `탈퇴 후에도 문의 기록은 보존 · 전체 ${total}건`
          : `최근 ${recentInquiries.content.length}건 · 전체 ${total}건 · 1:1 · 상품 문의 합산`
      }
      action={
        <button
          type="button"
          className={`${FLINK_CLASS} text-[11px] font-normal`}
          onClick={() =>
            navigate(
              `${PENDING_TARGET_PATHS.INQUIRIES}?userId=${detail.userId}`
            )
          }
        >
          1:1 문의 전체 보기 ↗
        </button>
      }
    >
      {recentInquiries.content.length === 0 ? (
        <div className="px-4 py-4">
          <div className={`${T_SUB_CLASS} py-1.5`}>문의 내역이 없습니다.</div>
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <td className={`${TH} w-[160px]`}>문의번호</td>
              <td className={`${TH} w-[72px]`}>구분</td>
              <td className={TH}>유형 · 제목</td>
              <td className={`${TH} w-[96px] text-center`}>상태</td>
              <td className={`${TH} w-[100px] text-center`}>접수일</td>
            </tr>
          </thead>
          <tbody>
            {recentInquiries.content.map((inquiry) => (
              <tr
                key={`${inquiry.kind}-${inquiry.inquiryId}`}
                className={ROW}
                onClick={() =>
                  navigate(
                    `${
                      inquiry.kind === "PRODUCT"
                        ? PENDING_TARGET_PATHS.PRODUCT_INQUIRIES
                        : PENDING_TARGET_PATHS.INQUIRIES
                    }/${inquiry.inquiryId}`
                  )
                }
              >
                <td className={`${TD} whitespace-nowrap tabular-nums`}>
                  {inquiry.inquiryNumber}
                </td>
                <td className={`${TD} whitespace-nowrap`}>
                  {inquiry.kindLabel}
                </td>
                <td className={`${TD} max-w-0 truncate`}>
                  {inquiry.typeLabel && (
                    <span className={T_SUB_CLASS}>{inquiry.typeLabel} · </span>
                  )}
                  {inquiry.title ?? "—"}
                </td>
                <td className={`${TD} text-center`}>
                  <StatusBadge
                    variant={
                      inquiry.status === "WAITING" ? "warning" : "success"
                    }
                    hideDot
                  >
                    {inquiry.statusLabel}
                  </StatusBadge>
                </td>
                <td
                  className={`${TD} whitespace-nowrap text-center tabular-nums`}
                >
                  {formatDateOnly(inquiry.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </TableCard>
  );
}
