import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { Rich, RichSeg } from "@/features/order/types";
import { toneToVariant } from "@/features/order/utils/format";
import { cn } from "@/lib/utils";

const KIND_CLASS = {
  b: "font-bold",
  dim: "text-sz-n-400",
  bdim: "font-bold text-sz-n-400",
  sub: "text-[11px] text-sz-n-500",
  warn: "text-sz-warning-text",
  bwarn: "font-bold text-sz-warning-text",
  num: "tabular-nums tracking-[-0.1px]",
} as const;

function Part({ seg }: { seg: RichSeg }) {
  if (typeof seg === "string") {
    return <>{seg}</>;
  }
  if ("badge" in seg) {
    return (
      <StatusBadge variant={toneToVariant(seg.tone)} hideDot>
        {seg.badge}
      </StatusBadge>
    );
  }
  if ("tag" in seg) {
    // 시안 `.tag` — 기획 문서의 보류 표지(상태색이 아니다)
    return (
      <span className="ml-[5px] inline-block rounded-[6px] border border-sz-n-200 bg-sz-n-100 px-1.5 py-px align-[1px] text-[10px] font-medium text-sz-n-600">
        {seg.tag}
      </span>
    );
  }
  return <span className={cn(seg.k && KIND_CLASS[seg.k])}>{seg.t}</span>;
}

/** 시안의 한 줄 안에 굵게·흐리게·경고색·배지가 섞인 문장 조각을 그린다 */
export default function RichText({ value }: { value: Rich }) {
  return (
    <>
      {value.map((seg, index) => (
        <Part key={index} seg={seg} />
      ))}
    </>
  );
}
