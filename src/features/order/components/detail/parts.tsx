import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/*
  상세 모달의 원자 조각 — 시안 `.mbk`(좌측 블록) · `.sc`(하위주문 카드) · `.rl`(우측 레일) · `.frow`.
  블록 번호(①②…)는 화면이 그리는 순서대로 붙는다: 취소 요청이 걸린 주문은 ④가 정산 반영이 아니라 취소 요청이다.
*/

const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦"];

/** 시안 `.mbk` — 좌측 블록 */
export function Block(props: {
  index: number;
  title: string;
  /** 머리 오른쪽 한 줄 — 공구명 · 인플루언서 */
  note?: ReactNode;
  children: ReactNode;
}) {
  const { index, title, note, children } = props;
  return (
    <section className="mb-[5px] rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex items-center justify-between gap-2 rounded-t-[8px] border-b border-sz-n-200 bg-sz-n-50 px-3 py-[7px] text-[12px] font-semibold text-sz-n-900">
        <span>
          <span className="mr-1.5 text-[10px] font-semibold text-sz-n-400">
            {CIRCLED[index]}
          </span>
          {title}
        </span>
        {note && <span>{note}</span>}
      </div>
      <div className="px-3 py-[9px]">{children}</div>
    </section>
  );
}

/** 시안 `.mbk .frow` — 라벨 118px · 행 패딩 4px · 11px */
export function FRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-sz-n-100 py-1 text-[11px] last:border-b-0">
      <div className="w-[118px] shrink-0 text-sz-n-500">{props.label}</div>
      <div className="min-w-0 flex-1 text-sz-n-900">{props.children}</div>
    </div>
  );
}

export function Grid2({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-5">{children}</div>;
}

/** 시안 `.sc` — 하위주문·배송 카드 */
export function SubCard(props: { head?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-1.5 overflow-hidden rounded-[6px] border border-sz-n-200 last:mb-0">
      {props.head && (
        <div className="flex items-center gap-2 border-b border-sz-n-200 bg-sz-n-50 px-2.5 py-[5px] text-[11px]">
          {props.head}
        </div>
      )}
      {props.children}
    </div>
  );
}

/** 시안 `.itrow` */
export function ItRow(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b border-sz-n-100 px-2.5 py-1 text-[11px] last:border-b-0",
        props.className
      )}
    >
      {props.children}
    </div>
  );
}

/** 시안 `.mhint` — 블록 안의 보조 설명 */
export function Hint(props: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "mb-[11px] mt-2 text-[11px] text-sz-n-500",
        props.className
      )}
    >
      {props.children}
    </p>
  );
}

/** 시안 `.rl` — 우측 레일 카드 */
export function RailCard(props: {
  title: string;
  /** 머리 오른쪽 작은 링크 — 인라인 폼을 접는다 */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-2 rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex items-center justify-between rounded-t-[8px] border-b border-sz-n-200 bg-sz-n-50 px-3 py-[9px] text-[12px] font-semibold text-sz-n-900">
        <span>{props.title}</span>
        {props.action}
      </div>
      <div className="flex flex-col gap-[7px] p-3">{props.children}</div>
    </section>
  );
}

/** 시안 `.rl-t` */
export function RailText(props: { children: ReactNode; flush?: boolean }) {
  return (
    <p
      className={cn(
        // 시안 p.rl-t — 브라우저 기본 문단 여백(1em)이 그대로 남아 있다
        "my-[11px] text-[11px] leading-[1.6] text-sz-n-500",
        props.flush && "mt-0"
      )}
    >
      {props.children}
    </p>
  );
}

/** 시안 `.tlink` */
export function TLink(props: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="cursor-pointer py-0.5 text-center text-[11px] text-sz-accent-500 hover:underline"
    >
      {props.children}
    </button>
  );
}

/** 시안 `.mrow` — 레일 메타 한 줄 */
export function MetaRow(props: {
  label: string;
  tone?: "warn";
  children: ReactNode;
}) {
  return (
    <div className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="text-sz-n-500">{props.label}</span>
      <span
        className={cn(
          "text-right font-medium text-sz-n-900",
          props.tone === "warn" && "text-sz-warning-text"
        )}
      >
        {props.children}
      </span>
    </div>
  );
}
