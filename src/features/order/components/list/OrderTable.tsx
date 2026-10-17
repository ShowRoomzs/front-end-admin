import OrderBadge from "@/features/order/components/shared/OrderBadge";
import type { OrderListItem } from "@/features/order/types";
import {
  formatNumber,
  formatShortDateTime,
} from "@/features/order/utils/format";
import { cn } from "@/lib/utils";
import { Fragment } from "react";

interface OrderTableProps {
  rows: Array<OrderListItem>;
  expanded: ReadonlySet<string>;
  onToggle: (orderNo: string) => void;
  onRowClick: (orderNo: string) => void;
}

/** 시안 열 폭 — 공구명만 남는 폭을 받는다 */
const COLUMNS: Array<{
  label: string;
  width?: number;
  align?: "center" | "right";
}> = [
  { label: "", width: 46 },
  { label: "주문번호", width: 104 },
  { label: "결제일시", width: 100, align: "center" },
  { label: "소비자", width: 62 },
  { label: "브랜드", width: 108 },
  { label: "공구명" },
  { label: "결제금액", width: 96, align: "right" },
  { label: "상태", width: 124, align: "center" },
  { label: "배송 이상", width: 120, align: "center" },
];

const TH =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-50 px-2.5 py-[9px] text-[11px] font-semibold text-sz-n-600 first:pl-5 last:pr-5";
const TD =
  "h-[50px] whitespace-nowrap border-b border-sz-n-100 px-2.5 py-[11px] align-middle text-[12px] text-sz-n-900 first:pl-5 last:pr-5";
const SUB_TD =
  "h-[50px] whitespace-nowrap border-b border-sz-n-100 px-2.5 py-[9px] align-middle text-[12px] text-sz-n-900 first:pl-5 last:pr-5";
const TNUM = "tabular-nums tracking-[-0.1px]";

const ALIGN = { center: "text-center", right: "text-right" } as const;

/**
 * 시안 A1·A2 — 행 = 주문(결제 1건). 체크박스도 행 액션도 없다(조회 화면).
 * 행을 누르면 상세 모달이 열리고, 하위주문이 둘 이상이면 앞의 ▸로 한 단만 펼친다 —
 * 항목(SKU) 3단째는 상세 모달 ②블록의 일이라 같은 열 골격에 얹지 않는다.
 */
export default function OrderTable(props: OrderTableProps) {
  const { rows, expanded, onToggle, onRowClick } = props;

  return (
    <table className="w-full table-fixed border-collapse">
      <colgroup>
        {COLUMNS.map((column, index) => (
          <col
            key={index}
            style={column.width ? { width: column.width } : undefined}
          />
        ))}
      </colgroup>
      <thead>
        <tr>
          {COLUMNS.map((column, index) => (
            <th
              key={index}
              scope="col"
              className={cn(
                TH,
                column.align ? ALIGN[column.align] : "text-left"
              )}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const canceled = row.statusGroup === "CANCELED";
          const isOpen = expanded.has(row.orderNo);
          const hasSubs = row.subOrders.length > 1;

          return (
            <Fragment key={row.orderNo}>
              <tr
                tabIndex={0}
                onClick={() => onRowClick(row.orderNo)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onRowClick(row.orderNo);
                  }
                }}
                className={cn(
                  "cursor-pointer outline-none focus-visible:bg-sz-n-50",
                  isOpen ? "bg-sz-accent-50" : "hover:bg-sz-n-50"
                )}
              >
                <td className={cn(TD, "text-center")}>
                  {hasSubs && (
                    <button
                      type="button"
                      aria-label={`${row.orderNo} 하위주문 ${isOpen ? "접기" : "펼치기"}`}
                      aria-expanded={isOpen}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggle(row.orderNo);
                      }}
                      className={cn(
                        "inline-flex size-[18px] cursor-pointer items-center justify-center rounded-[6px] border text-[8px]",
                        isOpen
                          ? "border-sz-accent-500 bg-sz-accent-500 text-white"
                          : "border-sz-n-300 bg-white text-sz-n-500"
                      )}
                    >
                      {isOpen ? "▾" : "▸"}
                    </button>
                  )}
                </td>
                <td className={cn(TD, TNUM)}>{row.orderNo}</td>
                <td className={cn(TD, TNUM, "text-center")}>
                  {formatShortDateTime(row.paidAt)}
                </td>
                <td className={cn(TD, "truncate")}>{row.consumerMasked}</td>
                <td className={cn(TD, "truncate")}>
                  <span
                    className={cn(
                      hasSubs && "font-medium",
                      canceled && "text-sz-n-400"
                    )}
                  >
                    {row.brandLabel}
                  </span>
                </td>
                <td className={cn(TD, "truncate", !canceled && "font-medium")}>
                  {row.groupBuyTitle}
                </td>
                <td className={cn(TD, TNUM, "text-right")}>
                  {formatNumber(row.payAmount)}
                </td>
                <td className={cn(TD, "text-center")}>
                  <OrderBadge data={row.status} />
                  {row.statusNote && (
                    <span className="mt-[3px] block text-[11px] font-medium">
                      {row.statusNote}
                    </span>
                  )}
                </td>
                <td className={cn(TD, "text-center")}>
                  {row.anomaly ? (
                    <>
                      <OrderBadge data={row.anomaly} />
                      <span
                        className={cn(
                          "mt-[3px] block text-[11px] font-medium",
                          row.anomaly.tone === "WARNING" &&
                            "text-sz-warning-text",
                          row.anomaly.tone === "DANGER" && "text-sz-danger-text"
                        )}
                      >
                        {row.anomaly.note}
                      </span>
                    </>
                  ) : (
                    <span className="text-sz-n-400">—</span>
                  )}
                </td>
              </tr>

              {hasSubs &&
                isOpen &&
                row.subOrders.map((sub) => (
                  <tr
                    key={sub.suffix}
                    onClick={() => onRowClick(row.orderNo)}
                    className="cursor-pointer bg-sz-n-50 hover:bg-sz-n-100"
                  >
                    <td className={SUB_TD} />
                    <td className={cn(SUB_TD, TNUM)}>{sub.suffix}</td>
                    <td className={cn(SUB_TD, "text-center")}>하위주문</td>
                    <td className={SUB_TD} />
                    <td className={cn(SUB_TD, "font-medium")}>
                      {sub.brandName}
                    </td>
                    <td className={SUB_TD}>
                      <div className="flex items-center gap-[7px]">
                        <span className="w-3.5 shrink-0 text-center text-[11px] text-sz-n-400">
                          └
                        </span>
                        <span className="truncate text-[11px] text-sz-n-500">
                          {sub.itemSummary}
                        </span>
                      </div>
                    </td>
                    <td className={cn(SUB_TD, TNUM, "text-right")}>
                      {formatNumber(sub.amount)}
                    </td>
                    <td className={cn(SUB_TD, "text-center")}>
                      <OrderBadge data={sub.status} hideDot />
                    </td>
                    <td className={cn(SUB_TD, "text-center")}>
                      {sub.shipNote}
                    </td>
                  </tr>
                ))}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
