import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** 시안 `.frow.ro` — 라벨 140px · 행 패딩 9px(어드민 상세 필드행 규격) */
export function FieldRow(props: {
  label: string;
  children: ReactNode;
  sub?: ReactNode;
}) {
  const { label, children, sub } = props;
  return (
    <div className="flex gap-3 border-b border-sz-n-100 py-[9px] text-[12px] first:pt-0 last:border-b-0">
      <div className="w-[140px] shrink-0 text-sz-n-500">{label}</div>
      <div className="min-w-0 flex-1 text-sz-n-900">
        {children}
        {sub && <div className="mt-0.5 text-[11px] text-sz-n-500">{sub}</div>}
      </div>
    </div>
  );
}

/** 시안 `.mrow` — 레일 메타 한 줄(라벨 좌 · 값 우) */
export function MetaRow(props: {
  label: string;
  value: ReactNode;
  tone?: "warning";
}) {
  const { label, value, tone } = props;
  return (
    <div className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0">
      <span className="text-sz-n-500">{label}</span>
      <span
        className={cn(
          "text-right font-medium tabular-nums text-sz-n-900",
          tone === "warning" && "text-sz-warning-text"
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** 시안 `.flink` */
export function FLink(props: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="cursor-pointer text-sz-n-600 underline underline-offset-2 hover:text-sz-accent-600"
    >
      {props.children}
    </button>
  );
}
