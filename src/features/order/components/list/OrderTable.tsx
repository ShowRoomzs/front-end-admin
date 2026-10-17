import OrderBadge from "@/features/order/components/shared/OrderBadge";
import { TRACKING_ALERT_TONE } from "@/features/order/constants/labels";
import type {
  AdminOrderGroupSummary,
  AdminOrderListItem,
  OrderBadgeData,
} from "@/features/order/types";
import {
  formatMonthDay,
  formatNumber,
  formatShortDateTime,
  subOrderSuffix,
} from "@/features/order/utils/format";
import { cn } from "@/lib/utils";
import { Fragment } from "react";

interface OrderTableProps {
  rows: Array<AdminOrderListItem>;
  expanded: ReadonlySet<number>;
  onToggle: (orderId: number) => void;
  onRowClick: (orderId: number) => void;
}

/**
 * 시안 열 폭 — 브랜드가 남는 폭을 받는다.
 * 시안의 「공구명」 열은 목록 응답에 공구 정보가 없어 뺐다(상세 ②블록에 공구 번호가 있다).
 * 「소비자」 열은 응답이 수취인명(`recipientName`)이라 「수취인」으로 적는다.
 */
const COLUMNS: Array<{
  label: string;
  width?: number;
  align?: "center" | "right";
}> = [
  { label: "", width: 46 },
  { label: "주문번호", width: 140 },
  { label: "결제일시", width: 100, align: "center" },
  { label: "수취인", width: 80 },
  { label: "브랜드" },
  { label: "결제금액", width: 96, align: "right" },
  { label: "상태", width: 140, align: "center" },
  { label: "배송 이상", width: 132, align: "center" },
];

const TH =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-50 px-2.5 py-[9px] text-[11px] font-semibold text-sz-n-600 first:pl-5 last:pr-5";
const TD =
  "h-[50px] whitespace-nowrap border-b border-sz-n-100 px-2.5 py-[11px] align-middle text-[12px] text-sz-n-900 first:pl-5 last:pr-5";
const SUB_TD =
  "h-[50px] whitespace-nowrap border-b border-sz-n-100 px-2.5 py-[9px] align-middle text-[12px] text-sz-n-900 first:pl-5 last:pr-5";
const TNUM = "tabular-nums tracking-[-0.1px]";

const ALIGN = { center: "text-center", right: "text-right" } as const;

const NOTE = "mt-[3px] block text-[11px] font-medium";

/** 상태 열 — 하위주문 상태가 갈리면 「혼합」 + 조합 부기(서버는 합치지 않는다) */
function statusCell(row: AdminOrderListItem): {
  badge: OrderBadgeData;
  note: string | null;
  noteTone?: "warn";
} {
  const labels = [...new Set(row.groups.map((g) => g.statusLabel))];
  const first = row.groups[0];
  const badge: OrderBadgeData =
    labels.length > 1 || !first
      ? { label: "혼합", tone: "INFO" }
      : { label: first.statusLabel, tone: first.statusTone };
  if (labels.length > 1) {
    return { badge, note: labels.join(" · ") };
  }
  if (row.groups.some((g) => g.cancelRequested)) {
    return { badge, note: "취소 요청 검토 중", noteTone: "warn" };
  }
  if (row.groups.some((g) => g.shipOverdue)) {
    return { badge, note: "발송 기한 경과", noteTone: "warn" };
  }
  return { badge, note: null };
}

/** 배송 이상 열 — 추적 경고(집화 확인 필요 · 추적 정지) 또는 반송중. 상태와 다른 축이다 */
function issueOf(group: AdminOrderGroupSummary): OrderBadgeData | null {
  if (group.trackingAlert && group.trackingAlertLabel) {
    return {
      label: group.trackingAlertLabel,
      tone: TRACKING_ALERT_TONE[group.trackingAlert],
    };
  }
  if (group.status === "RETURNING") {
    return { label: group.statusLabel, tone: group.statusTone };
  }
  return null;
}

const NOTE_TONE: Record<string, string> = {
  WARNING: "text-sz-warning-text",
  DANGER: "text-sz-danger-text",
};

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
          const canceled = row.groups.every((g) => g.status === "CANCELLED");
          const isOpen = expanded.has(row.orderId);
          const hasSubs = row.groups.length > 1;
          const brands = [...new Set(row.groups.map((g) => g.brandName))];
          const status = statusCell(row);
          const issueGroups = row.groups.filter((g) => issueOf(g) !== null);
          const issue = issueGroups[0] ? issueOf(issueGroups[0]) : null;

          return (
            <Fragment key={row.orderId}>
              <tr
                tabIndex={0}
                onClick={() => onRowClick(row.orderId)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    onRowClick(row.orderId);
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
                      aria-label={`${row.orderNumber} 하위주문 ${isOpen ? "접기" : "펼치기"}`}
                      aria-expanded={isOpen}
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggle(row.orderId);
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
                <td className={cn(TD, TNUM)}>{row.orderNumber}</td>
                <td className={cn(TD, TNUM, "text-center")}>
                  {formatShortDateTime(row.paidAt)}
                </td>
                <td className={cn(TD, "truncate")}>{row.recipientName}</td>
                <td className={cn(TD, "truncate")}>
                  <span
                    className={cn(
                      brands.length > 1 && "font-medium",
                      canceled && "text-sz-n-400"
                    )}
                  >
                    {brands.length > 1
                      ? `${brands.length}개 브랜드`
                      : (brands[0] ?? "—")}
                  </span>
                </td>
                <td className={cn(TD, TNUM, "text-right")}>
                  {formatNumber(row.totalAmount)}
                </td>
                <td className={cn(TD, "text-center")}>
                  <OrderBadge data={status.badge} />
                  {status.note && (
                    <span
                      className={cn(
                        NOTE,
                        "truncate",
                        status.noteTone === "warn" && "text-sz-warning-text"
                      )}
                    >
                      {status.note}
                    </span>
                  )}
                </td>
                <td className={cn(TD, "text-center")}>
                  {issue ? (
                    <>
                      <OrderBadge data={issue} />
                      {/* 여러 브랜드면 어느 하위주문의 이상인지 적는다 */}
                      {hasSubs && (
                        <span
                          className={cn(
                            NOTE,
                            "truncate",
                            NOTE_TONE[issue.tone]
                          )}
                        >
                          {issueGroups.length > 1
                            ? `하위주문 ${issueGroups.length}건`
                            : issueGroups[0].brandName}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-sz-n-400">—</span>
                  )}
                </td>
              </tr>

              {hasSubs &&
                isOpen &&
                row.groups.map((group) => {
                  const groupIssue = issueOf(group);
                  return (
                    <tr
                      key={group.deliveryGroupId}
                      onClick={() => onRowClick(row.orderId)}
                      className="cursor-pointer bg-sz-n-50 hover:bg-sz-n-100"
                    >
                      <td className={SUB_TD} />
                      <td className={cn(SUB_TD, TNUM)}>
                        {subOrderSuffix(group.subOrderNumber)}
                      </td>
                      <td className={cn(SUB_TD, "text-center")}>하위주문</td>
                      <td className={SUB_TD} />
                      <td className={cn(SUB_TD, "truncate")}>
                        <div className="flex items-center gap-[7px]">
                          <span className="w-3.5 shrink-0 text-center text-[11px] text-sz-n-400">
                            └
                          </span>
                          <span className="truncate font-medium">
                            {group.brandName}
                          </span>
                        </div>
                      </td>
                      <td className={SUB_TD} />
                      <td className={cn(SUB_TD, "text-center")}>
                        <OrderBadge
                          data={{
                            label: group.statusLabel,
                            tone: group.statusTone,
                          }}
                          hideDot
                        />
                      </td>
                      <td className={cn(SUB_TD, "text-center text-[11px]")}>
                        {groupIssue ? (
                          <OrderBadge data={groupIssue} hideDot />
                        ) : group.cancelRequested ? (
                          <span className="text-sz-warning-text">
                            취소 요청 검토 중
                          </span>
                        ) : group.shipOverdue ? (
                          <span className="text-sz-warning-text">
                            발송 기한 경과
                          </span>
                        ) : group.shipDueAt &&
                          (group.status === "NEW" ||
                            group.status === "PREPARING") ? (
                          <span className={cn(TNUM, "text-sz-n-500")}>
                            기한 {formatMonthDay(group.shipDueAt)}
                          </span>
                        ) : (
                          <span className="text-sz-n-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
