import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { OrderBadgeTone } from "@/features/order/types";
import { toneToVariant } from "@/features/order/utils/format";
import { cn } from "@/lib/utils";

/** 표시용 문장 조각 — 굵게·흐리게·경고색·숫자 정렬·배지를 한 줄 안에 섞는다 */
export type RichSeg =
  | string
  | {
      t: string;
      /** b 굵게 · dim 흐림(n-400) · bdim 굵은 흐림 · sub 보조(n-500) · warn 경고색 · bwarn 굵은 경고색 · num 숫자 정렬 */
      k?: "b" | "dim" | "sub" | "warn" | "num" | "bwarn" | "bdim";
    }
  | { badge: string; tone: OrderBadgeTone };
export type Rich = Array<RichSeg>;

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
