import {
  StlBadge,
  TDim,
} from "@/features/settlement/components/shared/StlParts";
import {
  BUSINESS_TYPE_LABEL,
  CLAWBACK_STATUS,
  TAX_DOCUMENT_TONE,
} from "@/features/settlement/constants/params";
import type {
  ClawbackListItem,
  ClawbackStatus,
  EvidenceListItem,
  SettlementFooter,
  SettlementListItem,
} from "@/features/settlement/types";
import { md, periodShort, won } from "@/features/settlement/utils/format";
import { cn } from "@/lib/utils";
import type { KeyboardEvent, ReactNode } from "react";

/*
  시안 07a `.tcard` 표 — 머리 11px/600 · `--n-50` · 9px 10px, 본문 12px · 11px 10px · 좌우 끝 20px,
  금액 우측 정렬 + 등폭, 합계 행 상단 1.5px `--n-300`. 행 클릭으로 상세(관리 열 · 체크박스 없음).
*/

const HEAD =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-50 px-2.5 py-[9px] text-left text-[11px] font-semibold text-sz-n-600 first:pl-5 last:pr-5";
const CELL =
  "h-[50px] whitespace-nowrap border-b border-sz-n-100 px-2.5 py-[11px] align-middle text-[12px] text-sz-n-900 first:pl-5 last:pr-5";
const FOOT =
  "border-t-[1.5px] border-sz-n-300 bg-sz-n-50 px-2.5 py-[11px] align-middle text-[12px] font-semibold text-sz-n-900 first:pl-5 last:pr-5";
const ROW =
  "group cursor-pointer outline-none hover:bg-sz-n-50 focus-visible:bg-sz-accent-50 [&:last-child>td]:border-b-0";

/** 행 클릭으로 상세에 간다 — 키보드(Tab · Enter · Space)로도 같은 동작을 한다 */
function rowNav(onOpen: () => void) {
  return {
    tabIndex: 0,
    onClick: onOpen,
    onKeyDown: (event: KeyboardEvent<HTMLTableRowElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onOpen();
      }
    },
  };
}

/** 시안 `.t-main` + `.t-sub2` — 공구명과 보조줄 */
function TitleCell(props: { title: string; sub: ReactNode }) {
  return (
    <>
      <span className="block truncate text-[12px] font-medium text-sz-n-900 group-hover:text-sz-accent-600">
        {props.title}
      </span>
      <span className="mt-[3px] block truncate text-[11px] text-sz-n-500">
        {props.sub}
      </span>
    </>
  );
}

/** 시안 `tfoot .fn` */
function Fn(props: { children: ReactNode }) {
  return (
    <span className="mt-[2px] block break-keep text-[11px] font-normal text-sz-n-500">
      {props.children}
    </span>
  );
}

function Table(props: {
  minWidth: number;
  cols: Array<number | null>;
  head: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full table-fixed border-collapse"
        style={{ minWidth: props.minWidth }}
      >
        <colgroup>
          {props.cols.map((width, index) => (
            <col key={index} style={width ? { width } : undefined} />
          ))}
        </colgroup>
        <thead>
          <tr>{props.head}</tr>
        </thead>
        {props.children}
      </table>
    </div>
  );
}

/** 「일정」 열 — 서버 scheduleKind별 꼬리말 */
function scheduleText(item: SettlementListItem): ReactNode {
  if (!item.scheduleAt) return <TDim>—</TDim>;
  const date = md(item.scheduleAt);
  switch (item.scheduleKind) {
    case "REVIEW_DUE":
      return (
        <>
          {date} <TDim>확인 마감</TDim>
        </>
      );
    case "AGREEMENT_DUE":
      return (
        <>
          {date} <TDim>합의 기한</TDim>
        </>
      );
    case "PAYOUT_DUE":
      return (
        <>
          {date} <TDim>(예정)</TDim>
        </>
      );
    case "FAILED_AT":
      return (
        <>
          {date} <TDim>실패</TDim>
        </>
      );
    default:
      return date;
  }
}

/** L1~L4 · L7 — 정산 회차 표 */
export function SettlementTable(props: {
  rows: Array<SettlementListItem>;
  footer: SettlementFooter | null;
  onRowClick: (row: SettlementListItem) => void;
}) {
  const { rows, footer, onRowClick } = props;
  return (
    <Table
      minWidth={980}
      cols={[116, null, 116, 108, 108, 120, 104, 120]}
      head={
        <>
          <th className={HEAD}>정산번호</th>
          <th className={HEAD}>공구 · 브랜드 × 인플루언서</th>
          <th className={cn(HEAD, "text-center")}>정산 대상 기간</th>
          <th className={cn(HEAD, "text-right")}>확정 거래액</th>
          <th className={cn(HEAD, "text-right")}>브랜드 수취액</th>
          <th className={cn(HEAD, "text-right")}>인플루언서 실지급</th>
          <th className={cn(HEAD, "text-center")}>상태</th>
          <th className={cn(HEAD, "text-center")}>일정</th>
        </>
      }
    >
      {rows.length > 0 && (
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.settlementId}
              className={ROW}
              {...rowNav(() => onRowClick(row))}
            >
              <td className={cn(CELL, "tabular-nums")}>
                {row.settlementNumber}
              </td>
              <td className={CELL}>
                <TitleCell
                  title={row.groupBuyTitle}
                  sub={
                    <>
                      {row.brandName} <TDim>×</TDim> {row.showroomName}
                      {row.creatorBusinessType === "BUSINESS" && " · 사업자"}
                    </>
                  }
                />
              </td>
              <td className={cn(CELL, "text-center tabular-nums")}>
                {periodShort(row.periodStartAt, row.periodEndAt)}
              </td>
              <td className={cn(CELL, "text-right tabular-nums")}>
                {won(row.confirmedSalesAmount)}
              </td>
              <td className={cn(CELL, "text-right tabular-nums")}>
                {won(row.brandPayoutAmount)}
              </td>
              <td className={cn(CELL, "text-right tabular-nums")}>
                {won(row.creatorPayoutAmount)}
              </td>
              <td className={cn(CELL, "text-center")}>
                <StlBadge tone={row.statusTone}>{row.statusLabel}</StlBadge>
              </td>
              <td className={cn(CELL, "text-center tabular-nums")}>
                {scheduleText(row)}
              </td>
            </tr>
          ))}
        </tbody>
      )}
      {rows.length > 0 && footer && footer.count > 0 && (
        <tfoot>
          <tr>
            <td className={FOOT} colSpan={3}>
              확정 금액 합계
              <Fn>
                지급 예정 · 지급 완료 · 분배 실패 {footer.count}건 —{" "}
                <b className="font-semibold">정산 확인 중 · 조정 협의는 제외</b>
                (금액이 바뀔 수 있다)
              </Fn>
            </td>
            <td className={cn(FOOT, "text-right tabular-nums")}>
              {won(footer.confirmedSalesAmount)}
            </td>
            <td className={cn(FOOT, "text-right tabular-nums")}>
              {won(footer.brandPayoutAmount)}
              <Fn>PG 수수료 {won(footer.pgFeeAmount)}</Fn>
            </td>
            <td className={cn(FOOT, "text-right tabular-nums")}>
              {won(footer.creatorPayoutAmount)}
              <Fn>
                원천징수 {won(footer.withholdingAmount)} · 사업자 부가세 +
                {won(footer.creatorVatAmount)}
              </Fn>
            </td>
            <td className={cn(FOOT, "text-center")} colSpan={2}>
              리워드 부가세{" "}
              <b className="font-semibold tabular-nums">
                {won(footer.rewardVatAmount)}
              </b>
              원<Fn>플랫폼 수수료 {won(footer.platformFeeAmount)}원</Fn>
            </td>
          </tr>
        </tfoot>
      )}
    </Table>
  );
}

/** 인플루언서 쪽 문서(세금계산서 · 원천징수영수증 · 주민번호)면 사업자 구분을 붙인다 */
function isCreatorSide(row: EvidenceListItem): boolean {
  return (
    row.type === "CREATOR_TAX_INVOICE" ||
    row.type === "WITHHOLDING_RECEIPT" ||
    row.type === "RESIDENT_NUMBER_MISSING"
  );
}

function evidenceDate(row: EvidenceListItem): string {
  if (row.inputAt) return `${md(row.inputAt)} 입력`;
  if (row.dueAt) return `${md(row.dueAt)} 기한`;
  return "—";
}

/** L5 — 증빙 표(한 행 = 문서 1건 · 주민번호 미등록은 가상 행) */
export function EvidenceTable(props: {
  rows: Array<EvidenceListItem>;
  onRowClick: (row: EvidenceListItem) => void;
}) {
  const { rows, onRowClick } = props;
  return (
    <Table
      minWidth={880}
      cols={[116, null, 240, 120, 104, 110]}
      head={
        <>
          <th className={HEAD}>정산번호</th>
          <th className={HEAD}>공구 · 대상</th>
          <th className={HEAD}>처리 항목</th>
          <th className={cn(HEAD, "text-center")}>입력 · 기한</th>
          <th className={cn(HEAD, "text-center")}>상태</th>
          <th className={cn(HEAD, "text-center")}>지급 영향</th>
        </>
      }
    >
      {rows.length > 0 && (
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.settlementId}-${row.documentId ?? row.type}`}
              className={ROW}
              {...rowNav(() => onRowClick(row))}
            >
              <td className={cn(CELL, "tabular-nums")}>
                {row.settlementNumber}
              </td>
              <td className={CELL}>
                <TitleCell
                  title={row.groupBuyTitle}
                  sub={
                    <>
                      {row.counterpartyName}
                      {isCreatorSide(row) &&
                        ` · ${BUSINESS_TYPE_LABEL[row.creatorBusinessType]}`}
                    </>
                  }
                />
              </td>
              <td
                className={cn(CELL, "truncate")}
                title={`${row.typeLabel} · ${row.direction}`}
              >
                {row.typeLabel} <TDim>· {row.direction}</TDim>
              </td>
              <td className={cn(CELL, "text-center tabular-nums")}>
                {evidenceDate(row)}
              </td>
              <td className={cn(CELL, "text-center")}>
                <StlBadge tone={TAX_DOCUMENT_TONE[row.status] ?? "NEUTRAL"}>
                  {row.statusLabel}
                </StlBadge>
              </td>
              <td className={cn(CELL, "text-center")}>
                {row.payoutImpact === "BLOCKING" ? (
                  <span className="text-sz-warning-text">지급 보류</span>
                ) : (
                  <TDim>무관</TDim>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      )}
    </Table>
  );
}

/** 측별 상태를 한 줄 상태로 — 미회수가 하나라도 있으면 미회수, 전부 반영이면 반영, 아니면 예정 */
function clawbackRowStatus(row: ClawbackListItem): ClawbackStatus {
  const sides = [row.brandStatus, row.creatorStatus].filter(
    (status): status is ClawbackStatus => status !== null
  );
  if (sides.includes("UNRECOVERABLE")) return "UNRECOVERABLE";
  if (sides.length > 0 && sides.every((status) => status === "APPLIED")) {
    return "APPLIED";
  }
  return "PENDING";
}

function clawbackStatusLabel(
  row: ClawbackListItem,
  status: ClawbackStatus
): string {
  if (row.brandStatus === status && row.brandStatusLabel) {
    return row.brandStatusLabel;
  }
  if (row.creatorStatus === status && row.creatorStatusLabel) {
    return row.creatorStatusLabel;
  }
  return CLAWBACK_STATUS[status].label;
}

/** 측이 없으면 「—」 · 측 상태가 한 줄 상태와 다르면(이미 빠진 몫 등) 그 상태를 흐리게 붙인다 */
function shareCell(
  amount: number,
  side: ClawbackStatus | null,
  sideLabel: string | null,
  rowStatus: ClawbackStatus
): ReactNode {
  if (side === null) return <TDim>—</TDim>;
  return (
    <>
      {`− ${won(amount)}`}
      {side !== rowStatus && (
        <TDim className="block text-[11px]">
          {sideLabel ?? CLAWBACK_STATUS[side].label}
        </TDim>
      )}
    </>
  );
}

function appliedCell(row: ClawbackListItem, status: ClawbackStatus) {
  if (status === "APPLIED") return row.appliedSettlementNumber ?? "—";
  if (status === "UNRECOVERABLE") {
    return <TDim>{row.unrecoverableReasonLabel ?? "—"}</TDim>;
  }
  return <TDim>다음 정산 대기</TDim>;
}

/** L6 — 차감(클로백) 표 */
export function ClawbackTable(props: {
  rows: Array<ClawbackListItem>;
  onRowClick: (row: ClawbackListItem) => void;
}) {
  const { rows, onRowClick } = props;
  return (
    <Table
      minWidth={900}
      cols={[96, 116, null, 112, 104, 116, 104]}
      head={
        <>
          <th className={HEAD}>차감번호</th>
          <th className={HEAD}>원 정산</th>
          <th className={HEAD}>대상 · 사유</th>
          <th className={cn(HEAD, "text-right")}>브랜드 수취액</th>
          <th className={cn(HEAD, "text-right")}>리워드</th>
          <th className={cn(HEAD, "text-center")}>차감 정산</th>
          <th className={cn(HEAD, "text-center")}>상태</th>
        </>
      }
    >
      {rows.length > 0 && (
        <tbody>
          {rows.map((row, index) => {
            const status = clawbackRowStatus(row);
            const target =
              [row.productName, row.orderNumber].filter(Boolean).join(" · ") ||
              row.reasonLabel;
            const parties = [row.brandName, row.showroomName]
              .filter(Boolean)
              .join(" × ");
            return (
              <tr
                key={`${row.clawbackNumber}-${index}`}
                className={ROW}
                {...rowNav(() => onRowClick(row))}
              >
                <td className={cn(CELL, "tabular-nums")}>
                  {row.clawbackNumber}
                </td>
                <td className={cn(CELL, "tabular-nums")}>
                  {row.originSettlementNumber ?? "—"}
                </td>
                <td className={CELL}>
                  <TitleCell
                    title={target}
                    sub={[parties, row.reasonLabel].filter(Boolean).join(" · ")}
                  />
                </td>
                <td className={cn(CELL, "text-right tabular-nums")}>
                  {shareCell(
                    row.brandAmount,
                    row.brandStatus,
                    row.brandStatusLabel,
                    status
                  )}
                </td>
                <td className={cn(CELL, "text-right tabular-nums")}>
                  {shareCell(
                    row.creatorAmount,
                    row.creatorStatus,
                    row.creatorStatusLabel,
                    status
                  )}
                </td>
                <td className={cn(CELL, "text-center tabular-nums")}>
                  {appliedCell(row, status)}
                </td>
                <td className={cn(CELL, "text-center")}>
                  <StlBadge tone={CLAWBACK_STATUS[status].tone}>
                    {clawbackStatusLabel(row, status)}
                  </StlBadge>
                </td>
              </tr>
            );
          })}
        </tbody>
      )}
    </Table>
  );
}
