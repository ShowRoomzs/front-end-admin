import Pagination from "@/common/components/Pagination/Pagination";
import type { PaginationProps } from "@/common/components/Pagination/Pagination";
import { ClaimBadge } from "@/features/claim/components/shared/ClaimParts";
import {
  CLAIM_PAGE_SIZES,
  CLAIM_SORT_OPTIONS,
  CLAIM_TAB_LABEL,
  SELECT_CHEVRON_STYLE,
} from "@/features/claim/constants/params";
import type {
  ClaimListItem,
  ClaimListView,
  ClaimSort,
  ClaimSummary,
  ClaimTab,
} from "@/features/claim/types";
import {
  dDay,
  elapsedLabel,
  feeBearerShort,
  md,
  mdHm,
  stageBadge,
  won,
} from "@/features/claim/utils/format";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const SELECT_SM_CLASS =
  "h-7 cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[26px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

interface Column {
  label: string;
  /** 시안 열 너비(px) — 없으면 남는 폭을 가진다 */
  width?: number;
  center?: boolean;
  render: (item: ClaimListItem) => ReactNode;
}

const TNUM = "tabular-nums tracking-[-0.1px]";

/** 시안 `.t-note` — 배지 · 상품 아래 보조 줄. 경고색은 운영자 조치가 필요한 것(소비자 이의)만 */
function Note(props: { warn?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "mt-[3px] block text-[11px] font-medium",
        props.warn && "text-sz-warning-text"
      )}
    >
      {props.children}
    </span>
  );
}

/** 「50ml」 · 교환은 「03 → 05」 */
function optionText(item: ClaimListItem): string {
  const { optionName, exchangeOptionName } = item.claim;
  if (exchangeOptionName) {
    return `${optionName ?? "—"} → ${exchangeOptionName}`;
  }
  return optionName ?? "";
}

/** 시안 `.t-main` + `.t-sub` — 상품 · 옵션 */
function ProductCell(props: {
  name: string;
  option: string;
  note?: ReactNode;
}) {
  return (
    <div className="overflow-hidden text-ellipsis">
      <span className="text-[12px] font-medium text-sz-n-900">
        {props.name}
      </span>{" "}
      <span className="text-[11px] text-sz-n-500">{props.option}</span>
      {props.note}
    </div>
  );
}

const CLAIM_NO_COLUMN: Column = {
  label: "접수번호",
  width: 92,
  render: (item) => <span className={TNUM}>{item.claim.claimNumber}</span>,
};
const CONSUMER_COLUMN: Column = {
  label: "소비자",
  width: 80,
  center: true,
  // 서버는 이름을 가리지 않고 준다 — 긴 이름은 말줄임 · 전체는 툴팁
  render: (item) => (
    <span className="block truncate" title={item.claim.consumerName}>
      {item.claim.consumerName}
    </span>
  ),
};
const BRAND_COLUMN: Column = {
  label: "브랜드",
  width: 100,
  render: (item) => item.brandName ?? "—",
};
const QUANTITY_COLUMN: Column = {
  label: "수량",
  width: 44,
  center: true,
  render: (item) => <span className={TNUM}>{item.claim.quantity}</span>,
};

/** 전체·진행 탭 열 — 어드민 전용 열은 브랜드와 귀책 둘 */
const DEFAULT_COLUMNS: Array<Column> = [
  CLAIM_NO_COLUMN,
  {
    label: "유형",
    width: 54,
    center: true,
    render: (item) => item.claim.typeLabel,
  },
  CONSUMER_COLUMN,
  BRAND_COLUMN,
  {
    label: "상품 · 옵션",
    render: (item) => (
      <ProductCell name={item.claim.productName} option={optionText(item)} />
    ),
  },
  QUANTITY_COLUMN,
  { label: "사유", width: 150, render: (item) => item.claim.reasonLabel },
  {
    label: "귀책",
    width: 64,
    center: true,
    render: (item) => feeBearerShort(item),
  },
  {
    label: "단계",
    width: 150,
    center: true,
    render: (item) => {
      const badge = stageBadge(item.claim);
      return (
        <>
          <ClaimBadge tone={badge.tone}>{badge.label}</ClaimBadge>
          {item.claim.openedByOperator && (
            <Note>
              {["운영자 개설", item.claim.openReason]
                .filter(Boolean)
                .join(" · ")}
            </Note>
          )}
          {item.disputeOpen && <Note warn>소비자 이의 접수</Note>}
        </>
      );
    },
  },
  {
    label: "경과",
    width: 92,
    center: true,
    render: (item) => (
      // 시안은 평소 본문색 — 기한 초과만 경고색(.t-warn)
      <span
        className={cn(
          TNUM,
          item.claim.overdue ? "text-sz-warning-text" : "text-sz-n-900"
        )}
      >
        {elapsedLabel(item.claim)}
      </span>
    ),
  },
];

/**
 * 반려 보류 탭 열 — 파트너와 같은 열(반려 사유 · 고지 · 보관 기한) + 어드민 전용 「재발송비 결제」.
 * 「폐기 가능」 표기와 폐기 액션은 두지 않는다 — 약관 반영 전이라(결정 12) 기한 경과는 「약관 반영 후 처리」로만 적는다.
 */
const HOLD_COLUMNS: Array<Column> = [
  CLAIM_NO_COLUMN,
  CONSUMER_COLUMN,
  BRAND_COLUMN,
  {
    label: "보관 중인 상품",
    render: (item) => (
      <ProductCell
        name={item.claim.shipLabel ?? item.claim.productName}
        option={item.claim.shipLabel ? "" : optionText(item)}
        note={
          item.disputeOpen && (
            <Note warn>
              소비자 이의 접수
              {item.disputedAt && ` ${md(item.disputedAt)}`}
            </Note>
          )
        }
      />
    ),
  },
  QUANTITY_COLUMN,
  {
    label: "반려 사유",
    width: 170,
    render: (item) => item.claim.rejectReasonLabel ?? "—",
  },
  {
    label: "반려일시",
    width: 110,
    center: true,
    render: (item) => (
      <span className={TNUM}>{mdHm(item.claim.rejectedAt)}</span>
    ),
  },
  {
    label: "재발송비 결제",
    width: 120,
    center: true,
    render: (item) => {
      const fee = item.claim.reshipFee;
      if (!fee) return "—";
      return (
        <>
          <ClaimBadge
            tone={fee.status === "PENDING" ? "INFO" : "NEUTRAL"}
            hideDot
          >
            {fee.statusLabel}
          </ClaimBadge>
          <Note>
            {won(fee.amount)}
            {fee.status === "PENDING" && fee.dueAt && ` · ${dDay(fee.dueAt)}`}
          </Note>
        </>
      );
    },
  },
  {
    label: "고지",
    width: 70,
    center: true,
    render: (item) => (
      <span className={TNUM}>
        {item.claim.storage ? `${item.claim.storage.noticeCount}회` : "—"}
      </span>
    ),
  },
  {
    label: "보관 기한",
    width: 96,
    center: true,
    render: (item) => {
      const storage = item.claim.storage;
      if (!storage) return "—";
      if (!storage.storageDueAt) {
        return <span className="text-sz-n-400">고지 2회 후</span>;
      }
      return (
        <>
          <span className={TNUM}>{md(storage.storageDueAt)}</span>
          {storage.phase === "EXPIRED" && <Note>기한 경과</Note>}
        </>
      );
    },
  },
];

const TH_CLASS =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-50 px-2.5 py-[9px] text-[11px] font-semibold text-sz-n-600 first:pl-5 last:pr-5";
const TD_CLASS =
  "h-[50px] overflow-hidden whitespace-nowrap border-b border-sz-n-100 px-2.5 py-[11px] align-middle text-[12px] text-sz-n-900 first:pl-5 last:pr-5";

/**
 * 시안 `.tbar-l` — 탭마다 보여줄 건수가 다르다(지연은 입고·검수, 이의는 반려 보류).
 * 지연 · 이의 건수는 요약(`kpi.overdue` · `disputeCount`)이라 검색 조건과 무관한 전체 기준이다.
 */
function summaryLine(
  tab: ClaimTab,
  total: number,
  delayCount: number,
  disputeCount: number
): ReactNode {
  if (tab === "ALL") {
    return (
      <>
        총 <b>{total}</b>건
        {delayCount > 0 && (
          <>
            {" · 지연 "}
            <b>{delayCount}</b>건
          </>
        )}
        {disputeCount > 0 && (
          <>
            {" · 반려 이의 "}
            <b>{disputeCount}</b>건{" "}
            <span className="text-[11px] text-sz-n-500">
              · 운영자 조치는 이의 {disputeCount}건뿐 — 나머지는 브랜드·소비자
              진행
            </span>
          </>
        )}
      </>
    );
  }
  return (
    <>
      {CLAIM_TAB_LABEL[tab]} <b>{total}</b>건
      {tab === "INSPECTION" && delayCount > 0 && (
        <>
          {" · 지연 "}
          <b>{delayCount}</b>건
        </>
      )}
      {tab === "REJECT_HOLD" && disputeCount > 0 && (
        <>
          {" · 이의 "}
          <b>{disputeCount}</b>건
        </>
      )}
    </>
  );
}

interface ClaimTableProps {
  /** 주소의 탭 — 아직 받은 결과가 없을 때만 열 구성에 쓴다 */
  tab: ClaimTab;
  list: ClaimListView | undefined;
  summary: ClaimSummary | undefined;
  isLoading: boolean;
  isError: boolean;
  /** 지금 적용된 정렬 — 고르지 않았으면 탭 기본 정렬 */
  sort: ClaimSort;
  size: number;
  pageInfo: PaginationProps;
  emptyState: ReactNode;
  onSortChange: (sort: ClaimSort) => void;
  onSizeChange: (size: number) => void;
  onRowClick: (item: ClaimListItem) => void;
}

/**
 * A1~A3 — 목록 표. 행을 누르면 상세 모달이 열린다(목록에는 액션 버튼이 없다).
 *
 * 공용 Table은 셀 좌우 여백 16px이라 「수량」 44px · 「귀책」 64px 같은 시안의 좁은 열에 헤더가 안 들어간다.
 * 시안 `.tcard`의 여백(10px · 첫 열 20px)과 행 50px을 그대로 옮긴 전용 표다.
 */
export default function ClaimTable(props: ClaimTableProps) {
  const {
    tab,
    list,
    summary,
    isLoading,
    isError,
    sort,
    size,
    pageInfo,
    emptyState,
    onSortChange,
    onSizeChange,
    onRowClick,
  } = props;

  // 열·상단 줄은 지금 보이는 행을 불러온 탭을 따른다 — 탭을 막 옮겨 직전 탭의 행이 남아 있는 동안
  // 주소의 탭을 따르면 반려 사유·재발송비 칸이 비고 건수도 엉뚱한 탭 이름에 붙는다
  const shownTab = list?.tab ?? tab;
  const columns = shownTab === "REJECT_HOLD" ? HOLD_COLUMNS : DEFAULT_COLUMNS;
  const items = list?.content ?? [];
  const total = list?.pageInfo.totalResults ?? 0;

  return (
    <div className="overflow-hidden rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
        <div className="text-[12px] text-sz-n-600 [&_b]:text-sz-n-900">
          {list &&
            summaryLine(
              shownTab,
              total,
              summary?.kpi.overdue ?? 0,
              summary?.disputeCount ?? 0
            )}
        </div>
        <div className="flex items-center gap-2">
          <select
            aria-label="정렬"
            className={SELECT_SM_CLASS}
            style={SELECT_CHEVRON_STYLE}
            value={sort}
            onChange={(event) => onSortChange(event.target.value as ClaimSort)}
          >
            {CLAIM_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            aria-label="표시 건수"
            className={SELECT_SM_CLASS}
            style={SELECT_CHEVRON_STYLE}
            value={size}
            onChange={(event) => onSizeChange(Number(event.target.value))}
          >
            {CLAIM_PAGE_SIZES.map((value) => (
              <option key={value} value={value}>
                {value}건씩
              </option>
            ))}
          </select>
        </div>
      </div>

      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.label}
                className={cn(
                  TH_CLASS,
                  column.center ? "text-center" : "text-left"
                )}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        {items.length > 0 && (
          <tbody>
            {items.map((item) => (
              <tr
                key={item.claim.claimId}
                onClick={() => onRowClick(item)}
                className="cursor-pointer hover:bg-sz-n-50 [&:last-child>td]:border-b-0"
              >
                {columns.map((column) => (
                  <td
                    key={column.label}
                    className={cn(TD_CLASS, column.center && "text-center")}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        )}
      </table>

      {items.length === 0 && (
        <div className="px-6 py-[72px] text-center">
          {isLoading ? (
            <div className="text-[12px] text-sz-n-500">불러오는 중…</div>
          ) : isError ? (
            <div className="text-[12px] text-sz-n-500">
              목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
            </div>
          ) : (
            emptyState
          )}
        </div>
      )}

      {pageInfo.totalPages > 1 && (
        <div className="flex justify-center border-t border-sz-n-100 py-[11px]">
          <Pagination {...pageInfo} />
        </div>
      )}
    </div>
  );
}
