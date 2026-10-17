import {
  StlBadge,
  TDim,
} from "@/features/settlement/components/shared/StlParts";
import {
  STATUS_LABEL,
  STATUS_TONE,
  TASK_TYPE_LABEL,
} from "@/features/settlement/constants/params";
import type {
  Clawback,
  ClawbackShare,
  ClawbackStatus,
  EvidenceTask,
  SettlementListItem,
  SettlementTotals,
  Tone,
} from "@/features/settlement/types";
import { md, periodShort, won } from "@/features/settlement/utils/format";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/*
  시안 07a `.tcard` 표 — 머리 11px/600 · `--n-50` · 9px 10px, 본문 12px · 11px 10px · 좌우 끝 20px,
  금액 우측 정렬 + 등폭, 합계 행 상단 1.5px `--n-300`. 행 클릭으로 상세(관리 열 · 체크박스 없음).
*/

const HEAD =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-50 px-2.5 py-[9px] text-left text-[11px] font-semibold text-sz-n-600 first:pl-5 last:pr-5";
const CELL =
  "h-[50px] whitespace-nowrap border-b border-sz-n-100 px-2.5 py-[11px] align-middle text-[12px] text-sz-n-900 first:pl-5 last:pr-5";
const FOOT =
  "border-t-[1.5px] border-sz-n-300 bg-sz-n-50 px-2.5 py-[11px] align-top text-[12px] font-semibold text-sz-n-900 first:pl-5 last:pr-5";
const ROW =
  "group cursor-pointer hover:bg-sz-n-50 [&:last-child>td]:border-b-0";

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

function scheduleText(item: SettlementListItem): ReactNode {
  const date = md(item.schedule.date);
  switch (item.schedule.kind) {
    case "CHECK_DUE":
      return (
        <>
          {date} <TDim>확인 마감</TDim>
        </>
      );
    case "AGREE_DUE":
      return (
        <>
          {date} <TDim>합의 기한</TDim>
        </>
      );
    case "PAYOUT_PLANNED":
      return (
        <>
          {date} <TDim>(예정)</TDim>
        </>
      );
    default:
      return date;
  }
}

/** L1~L4 · L7 — 정산 회차 표 */
export function SettlementTable(props: {
  rows: Array<SettlementListItem>;
  totals: SettlementTotals | null;
  onRowClick: (row: SettlementListItem) => void;
}) {
  const { rows, totals, onRowClick } = props;
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
              onClick={() => onRowClick(row)}
            >
              <td className={cn(CELL, "tabular-nums")}>{row.settlementNo}</td>
              <td className={CELL}>
                <TitleCell
                  title={row.groupBuyTitle}
                  sub={
                    <>
                      {row.brandName} <TDim>×</TDim> {row.showroomName}
                      {row.influencerBusiness && " · 사업자"}
                    </>
                  }
                />
              </td>
              <td
                className={cn(
                  CELL,
                  "text-center text-[11px] tabular-nums text-sz-n-500"
                )}
              >
                {periodShort(row.periodStart, row.periodEnd)}
              </td>
              <td className={cn(CELL, "text-right tabular-nums")}>
                {won(row.confirmedSales)}
              </td>
              <td className={cn(CELL, "text-right tabular-nums")}>
                {won(row.brandPayout)}
              </td>
              <td className={cn(CELL, "text-right tabular-nums")}>
                {won(row.influencerPayout)}
              </td>
              <td className={cn(CELL, "text-center")}>
                <StlBadge tone={STATUS_TONE[row.status]}>
                  {STATUS_LABEL[row.status]}
                </StlBadge>
              </td>
              <td
                className={cn(
                  CELL,
                  "text-center text-[11px] tabular-nums text-sz-n-500"
                )}
              >
                {scheduleText(row)}
              </td>
            </tr>
          ))}
        </tbody>
      )}
      {rows.length > 0 && totals && (
        <tfoot>
          <tr>
            <td className={FOOT} colSpan={3}>
              확정 금액 합계
              <Fn>
                지급 예정 · 지급 완료 · 분배 실패 {totals.count}건 —{" "}
                <b className="font-semibold">정산 확인 중 · 조정 협의는 제외</b>
                (금액이 바뀔 수 있다)
              </Fn>
            </td>
            <td className={cn(FOOT, "text-right tabular-nums")}>
              {won(totals.confirmedSales)}
            </td>
            <td className={cn(FOOT, "text-right tabular-nums")}>
              {won(totals.brandPayout)}
              <Fn>PG 수수료 {won(totals.pgFee)}</Fn>
            </td>
            <td className={cn(FOOT, "text-right tabular-nums")}>
              {won(totals.influencerPayout)}
              <Fn>
                원천징수 {won(totals.withholding)} · 사업자 부가세 +
                {won(totals.businessVat)}
              </Fn>
            </td>
            <td className={cn(FOOT, "text-center")} colSpan={2}>
              리워드 부가세{" "}
              <b className="font-semibold tabular-nums">
                {won(totals.rewardVat)}
              </b>
              원
              <Fn>
                플랫폼 수수료 {won(totals.platformFee)}원 ·{" "}
                {totals.platformFeeLabel}
              </Fn>
            </td>
          </tr>
        </tfoot>
      )}
    </Table>
  );
}

/** L5 — 증빙 처리 항목 표(한 행 = 처리 항목 1건) */
export function EvidenceTable(props: {
  rows: Array<EvidenceTask>;
  onRowClick: (row: EvidenceTask) => void;
}) {
  const { rows, onRowClick } = props;
  return (
    <Table
      minWidth={880}
      cols={[116, null, 220, 120, 104, 110]}
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
              key={row.taskId}
              className={ROW}
              onClick={() => onRowClick(row)}
            >
              <td className={cn(CELL, "tabular-nums")}>{row.settlementNo}</td>
              <td className={CELL}>
                <TitleCell
                  title={row.groupBuyTitle}
                  sub={
                    <>
                      {row.targetName}
                      {row.targetBusiness !== null &&
                        (row.targetBusiness ? " · 사업자" : " · 비사업자")}
                    </>
                  }
                />
              </td>
              <td
                className={cn(CELL, "truncate")}
                title={`${TASK_TYPE_LABEL[row.type].label} · ${TASK_TYPE_LABEL[row.type].sub}`}
              >
                {TASK_TYPE_LABEL[row.type].label}{" "}
                <TDim>· {TASK_TYPE_LABEL[row.type].sub}</TDim>
              </td>
              <td
                className={cn(
                  CELL,
                  "text-center text-[11px] tabular-nums text-sz-n-500"
                )}
              >
                {row.date
                  ? `${md(row.date)} ${row.dateKind === "INPUT" ? "입력" : "기한"}`
                  : "—"}
              </td>
              <td className={cn(CELL, "text-center")}>
                <StlBadge tone={row.statusTone}>{row.statusLabel}</StlBadge>
              </td>
              <td className={cn(CELL, "text-center")}>
                {row.payoutHold ? (
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

const CLAWBACK_STATUS: Record<ClawbackStatus, { label: string; tone: Tone }> = {
  PENDING: { label: "차감 예정", tone: "NEUTRAL" },
  APPLIED: { label: "차감 반영", tone: "INFO" },
  UNRECOVERED: { label: "미회수", tone: "WARNING" },
};

/** 한 건이 몫별로 갈리면(CLW-0003) 이미 빠진 몫은 「STL-… 차감」으로 흐리게 적는다 */
function shareCell(row: Clawback, share: ClawbackShare): ReactNode {
  if (share.state === "APPLIED" && row.status !== "APPLIED") {
    return <TDim>{share.appliedSettlementNo} 차감</TDim>;
  }
  return `− ${won(share.amount)}`;
}

function appliedCell(row: Clawback): ReactNode {
  if (row.status === "APPLIED") return row.appliedSettlementNo;
  if (row.status === "UNRECOVERED") return <TDim>{row.unrecoveredReason}</TDim>;
  return <TDim>다음 정산 대기</TDim>;
}

/** L6 — 차감(클로백) 표 */
export function ClawbackTable(props: {
  rows: Array<Clawback>;
  onRowClick: (row: Clawback) => void;
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
          {rows.map((row) => (
            <tr
              key={row.clawbackId}
              className={cn(
                ROW,
                // 원 정산이 목록에 없는 회차면 갈 상세가 없다
                row.originSettlementId === null && "cursor-default"
              )}
              onClick={() => onRowClick(row)}
            >
              <td className={cn(CELL, "tabular-nums")}>{row.clawbackNo}</td>
              <td className={cn(CELL, "tabular-nums")}>
                {row.originSettlementNo}
              </td>
              <td className={CELL}>
                <TitleCell
                  title={`${row.productTitle} · ${row.orderNo}`}
                  sub={`${row.brandName} × ${row.showroomName} · ${row.reason}`}
                />
              </td>
              <td className={cn(CELL, "text-right tabular-nums")}>
                {shareCell(row, row.brand)}
              </td>
              <td className={cn(CELL, "text-right tabular-nums")}>
                {shareCell(row, row.reward)}
              </td>
              <td
                className={cn(
                  CELL,
                  "text-center text-[11px] tabular-nums text-sz-n-500"
                )}
              >
                {appliedCell(row)}
              </td>
              <td className={cn(CELL, "text-center")}>
                <StlBadge tone={CLAWBACK_STATUS[row.status].tone}>
                  {CLAWBACK_STATUS[row.status].label}
                </StlBadge>
              </td>
            </tr>
          ))}
        </tbody>
      )}
    </Table>
  );
}
