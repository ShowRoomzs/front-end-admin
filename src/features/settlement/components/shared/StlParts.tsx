import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { Tone } from "@/features/settlement/types";
import { toneToVariant } from "@/features/settlement/utils/format";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/*
  시안 ui-admin-07a · 07b의 원자 조각 — 정산 화면 안에서만 쓴다.
  버튼(.btn)은 계약 관리 Btn, 모달(.modal 520)은 공구 관리 GbModal과 같은 규격이라 그쪽을 쓰고,
  정산에만 있는 조각(.card-h 보조문 · .card-b.two · .ibar · .axis · .mtab · .ltab · .wait · .hist)을 여기 둔다.
*/

export function StlBadge(props: {
  tone: Tone;
  children: ReactNode;
  hideDot?: boolean;
}) {
  return (
    <StatusBadge variant={toneToVariant(props.tone)} hideDot={props.hideDot}>
      {props.children}
    </StatusBadge>
  );
}

/** 시안 `.t-sub` */
export function TSub(props: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("text-[11px] text-sz-n-500", props.className)}>
      {props.children}
    </span>
  );
}

/** 시안 `.t-dim` */
export function TDim(props: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("text-sz-n-400", props.className)}>
      {props.children}
    </span>
  );
}

/** 시안 본문 강조 `<b>` */
export function B(props: { children: ReactNode; className?: string }) {
  return (
    <b className={cn("font-semibold text-sz-n-900", props.className)}>
      {props.children}
    </b>
  );
}

/** 시안 `.flink` */
export const FLINK_CLASS =
  "cursor-pointer text-sz-n-600 underline underline-offset-2 hover:text-sz-accent-600";

/** 시안 `.card-h .btn` — 카드 머리 안의 작은 버튼(26px · 11px) */
export const CARD_HEAD_BTN_CLASS = "ml-3 h-[26px] px-2.5 text-[11px]";

/**
 * 시안 `.card` · `.card-h` · `.card-b` — 보조문(.ch-n)은 우측으로 밀리고, 머리 버튼은 그 뒤에 붙는다.
 * `flush`면 본문 여백 없이 표를 바로 붙인다(.mcols · .ltab).
 */
export function StlCard(props: {
  title: string;
  note?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
  flush?: boolean;
}) {
  const { title, note, extra, children, flush = false } = props;
  return (
    <section className="rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex items-center justify-between rounded-t-[8px] border-b border-sz-n-200 bg-sz-n-50 px-4 py-[11px]">
        <h2 className="shrink-0 text-[13px] font-semibold text-sz-n-900">
          {title}
        </h2>
        {note && (
          <span className="ml-auto pl-3 text-right text-[11px] font-normal text-sz-n-500">
            {note}
          </span>
        )}
        {extra}
      </div>
      {flush ? children : <div className="p-4">{children}</div>}
    </section>
  );
}

/** 시안 `.frow` — 라벨 140px · 9px 패딩(한 줄 필드) */
export function FRow(props: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-sz-n-100 py-[9px] text-[12px] first:pt-0 last:border-b-0">
      <div className="w-[140px] shrink-0 text-sz-n-500">{props.label}</div>
      <div className="min-w-0 flex-1 text-sz-n-900">{props.children}</div>
    </div>
  );
}

/**
 * 시안 `.card-b.two` — 필드 행 2열(열 간격 24 · 행 7px). 첫 줄은 위 여백이 없고,
 * 마지막 칸과 홀수 개일 때의 끝에서 두 번째 칸은 아래 선을 지운다(시안 nth 규칙).
 */
export function FieldGrid(props: {
  rows: Array<{ label: string; value: ReactNode }>;
}) {
  const { rows } = props;
  return (
    <div className="grid grid-cols-2 gap-x-6 p-4">
      {rows.map((row, index) => {
        const isLast = index === rows.length - 1;
        const isOddSecondLast = index === rows.length - 2 && index % 2 === 0;
        return (
          <div
            key={row.label}
            className={cn(
              "flex items-start gap-3 border-b border-sz-n-100 py-[7px] text-[12px]",
              index < 2 && "pt-0",
              (isLast || isOddSecondLast) && "border-b-0"
            )}
          >
            <div className="w-[140px] shrink-0 text-sz-n-500">{row.label}</div>
            <div className="min-w-0 flex-1 break-keep leading-[1.5] text-sz-n-900 [overflow-wrap:anywhere]">
              {row.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 시안 `.ibar` — 한 줄짜리 표를 표로 두지 않는다(인라인 요약 바) */
export function IBar(props: {
  items: Array<ReactNode>;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3",
        props.className
      )}
    >
      {props.items.map((item, index) => (
        <span
          key={index}
          className="mr-3.5 flex items-baseline gap-1.5 border-r border-sz-n-200 py-2 pr-3.5 text-[11px] text-sz-n-500 last:mr-0 last:border-r-0 [&_b]:text-[12px] [&_b]:font-semibold [&_b]:tabular-nums [&_b]:text-sz-n-900"
        >
          {item}
        </span>
      ))}
      {props.action && (
        <span className="ml-auto flex gap-1.5">{props.action}</span>
      )}
    </div>
  );
}

/** 시안 `.axis` — 금액 분해 표의 축 머리 */
export function Axis(props: { title: string; sub: ReactNode }) {
  return (
    <div className="flex items-baseline gap-2 border-b border-sz-n-200 bg-sz-n-50 px-4 py-2">
      <span className="text-[12px] font-semibold text-sz-n-900">
        {props.title}
      </span>
      <span className="text-[11px] text-sz-n-500">{props.sub}</span>
    </div>
  );
}

/** 시안 `.pb` — 금액 분해 행의 요율 칩 */
export function Pb(props: { children: ReactNode }) {
  return (
    <span className="ml-[5px] inline-block rounded-[3px] bg-sz-n-100 px-[5px] py-px align-middle text-[10px] text-sz-n-500">
      {props.children}
    </span>
  );
}

/** 시안 `.mtab` 행 — `sub`(차감) · `mid`(소계) · `tot`(총계) */
export function MRowTr(props: {
  kind?: "sub" | "mid" | "tot";
  label: ReactNode;
  value: ReactNode;
}) {
  const { kind, label, value } = props;
  return (
    <tr
      className={cn(
        kind === "mid" &&
          "bg-sz-n-50 font-semibold [&>td]:border-t [&>td]:border-sz-n-300",
        kind === "tot" &&
          "bg-sz-n-50 text-[13px] font-semibold text-sz-n-900 [&>td]:border-t-[1.5px] [&>td]:border-sz-n-400"
      )}
    >
      <td className={cn("px-3.5 py-1.5", kind === "sub" && "text-sz-n-600")}>
        {label}
      </td>
      <td
        className={cn(
          "px-3.5 py-1.5 text-right tabular-nums",
          kind === "sub" && "text-sz-n-700"
        )}
      >
        {value}
      </td>
    </tr>
  );
}

/** 시안 `.ltab` 셀 */
export const LTAB_HEAD =
  "whitespace-nowrap border-b border-sz-n-200 bg-sz-n-50 px-3.5 py-[7px] text-left text-[11px] font-semibold text-sz-n-600";
export const LTAB_CELL = "border-t border-sz-n-100 px-3.5 py-[7px]";
export const LTAB_FOOT =
  "border-t border-sz-n-300 bg-sz-n-50 px-3.5 py-[7px] font-semibold";

/** 우측 레일 `.mrow` */
export function MRow(props: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="shrink-0 text-sz-n-500">{props.label}</span>
      <span className="text-right font-medium text-sz-n-900">
        {props.value}
      </span>
    </div>
  );
}

/** 시안 `.wait` — 레일 안내 박스(경고 배경 · 분배 실패는 위험 배경) */
export function WaitBox(props: { children: ReactNode; danger?: boolean }) {
  return (
    <div
      className={cn(
        "mb-3 rounded-[6px] px-3 py-2.5 text-[11px] leading-[1.7]",
        props.danger
          ? "bg-sz-danger-bg text-sz-danger-text"
          : "bg-sz-warning-bg text-sz-warning-text",
        "[&_b]:font-semibold"
      )}
    >
      {props.children}
    </div>
  );
}

/** 시안 `.st-hint` */
export function Hint(props: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "mt-2.5 text-[11px] leading-[1.55] text-sz-n-500 [&_b]:font-semibold [&_b]:text-sz-n-900",
        props.className
      )}
    >
      {props.children}
    </p>
  );
}

const HDOT_CLASS: Record<Tone, string> = {
  INFO: "bg-sz-info-text",
  SUCCESS: "bg-sz-success-text",
  WARNING: "bg-sz-warning-text",
  DANGER: "bg-sz-danger-text",
  NEUTRAL: "bg-sz-n-400",
};

/** 시안 `.hist` · `.hitem` — 점 · 내용 · 「일시 · 주체 · 메모」 */
export function HistoryTimeline(props: {
  items: Array<{ label: string; meta: string; tone: Tone }>;
}) {
  return (
    <div className="px-4 pb-3 pt-2">
      {props.items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex gap-2.5 py-1.5">
          <span
            className={cn(
              "mt-1.5 size-[7px] shrink-0 rounded-full",
              HDOT_CLASS[item.tone]
            )}
          />
          <div className="min-w-0">
            <div className="text-[12px] text-sz-n-900">{item.label}</div>
            <div className="text-[11px] text-sz-n-500">{item.meta}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
