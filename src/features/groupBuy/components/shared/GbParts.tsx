import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { toneToVariant } from "@/features/contract/utils/statusBadge";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/features/groupBuy/constants/params";
import type { GroupBuyTone } from "@/features/groupBuy/types";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import {
  useCallback,
  useEffect,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

/*
  시안 ui-admin-17-groupbuys의 원자 조각 — 이 화면 안에서만 쓴다.
  버튼(.btn)은 계약 관리와 같은 규격이라 그쪽 Btn을 쓰고, 공구에만 있는 조각
  (.gate · .kpi4 · .pv · .req-b · .stm · 레일 .kpi · .dchip · 520px 모달)을 여기 둔다.
*/

/** 시안 본문 강조 `<b>` — 600 */
export function B(props: { children: ReactNode; className?: string }) {
  return (
    <b className={cn("font-semibold", props.className)}>{props.children}</b>
  );
}

export function GbBadge(props: {
  tone: GroupBuyTone;
  children: ReactNode;
  hideDot?: boolean;
}) {
  return (
    <StatusBadge variant={toneToVariant(props.tone)} hideDot={props.hideDot}>
      {props.children}
    </StatusBadge>
  );
}

/**
 * 시안 `.card` — 공용 DetailCard는 본문 여백이 목록형(상 4px)이라 시안 `.card-b`(16px)와 어긋난다.
 * `inlineNote`는 제목 바로 옆에 붙는 보조 문구(게시물 카드 · 게시물번호), `badge`는 우측 끝.
 */
export function GbCard(props: {
  title: string;
  note?: ReactNode;
  inlineNote?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  flush?: boolean;
}) {
  const { title, note, inlineNote, badge, children, flush = false } = props;
  return (
    <section className="rounded-[8px] border border-sz-n-200 bg-white">
      <div className="flex items-center justify-between gap-2 rounded-t-[8px] border-b border-sz-n-200 bg-sz-n-50 px-4 py-[11px]">
        <h2 className="text-[13px] font-semibold text-sz-n-900">{title}</h2>
        {inlineNote && (
          <span className="mr-auto text-[11px] text-sz-n-500">
            {inlineNote}
          </span>
        )}
        {note && <span className="text-[11px] text-sz-n-500">{note}</span>}
        {badge}
      </div>
      <div className={flush ? "px-4 pb-3 pt-2" : "p-4"}>{children}</div>
    </section>
  );
}

/** 시안 `.frow` — 라벨 140px · 9px 패딩 */
export function FRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-sz-n-100 py-[9px] text-[12px] first:pt-0 last:border-b-0">
      <div className="w-[140px] shrink-0 text-sz-n-500">{props.label}</div>
      <div className="min-w-0 flex-1 text-sz-n-900">{props.children}</div>
    </div>
  );
}

/** 시안 `.pi-x` — 값 아래 보조 줄 */
export function PiX(props: { children: ReactNode }) {
  return (
    <div className="mt-[3px] text-[11px] leading-[1.7] text-sz-n-600">
      {props.children}
    </div>
  );
}

/** 시안 `.t-sub` */
export function TSub(props: { children: ReactNode }) {
  return <span className="text-[11px] text-sz-n-500">{props.children}</span>;
}

/** 시안 `.flink` */
export const FLINK =
  "cursor-pointer text-sz-n-600 underline underline-offset-2 hover:text-sz-accent-600";

// ── 판정 게이트(.gate) ───────────────────────────────

export function Gate(props: {
  tone: "ok" | "wait" | "idle";
  title: string;
  sub: ReactNode;
  actions?: ReactNode;
}) {
  const { tone, title, sub, actions } = props;
  return (
    <div className="flex items-start gap-2.5 border-b border-sz-n-100 py-[11px] first:pt-0 last:border-b-0 last:pb-0">
      <div
        className={cn(
          "mt-px flex size-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
          tone === "ok" && "bg-sz-success-bg text-sz-success-text",
          tone === "wait" && "bg-sz-warning-bg text-sz-warning-text",
          tone === "idle" && "bg-sz-n-100 text-sz-n-400"
        )}
      >
        {tone === "ok" ? "✓" : tone === "wait" ? "!" : "·"}
      </div>
      <div className="flex-1">
        <div className="text-[12px] font-semibold text-sz-n-900">{title}</div>
        <div className="mt-[2px] text-[11px] leading-[1.6] text-sz-n-500">
          {sub}
        </div>
      </div>
      {actions && <div className="ml-auto flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

// ── 판매 실적 4칸(.kpi4) ─────────────────────────────

export function Kpi4(props: {
  items: Array<{ value: string; label: string; sub: string }>;
}) {
  return (
    <div className="grid grid-cols-4 gap-px overflow-hidden rounded-[6px] bg-sz-n-200">
      {props.items.map((item) => (
        <div key={item.label} className="bg-white px-3.5 py-[13px]">
          <div className="text-[16px] font-semibold tabular-nums tracking-[-0.01em] text-sz-n-900">
            {item.value}
          </div>
          <div className="mt-[3px] text-[11px] text-sz-n-600">{item.label}</div>
          <div className="mt-[2px] text-[11px] text-sz-n-400">{item.sub}</div>
        </div>
      ))}
    </div>
  );
}

/** 우측 레일 `.kpi` — 키 · 값 한 줄 */
export function RailKpi(props: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between border-b border-sz-n-100 py-2 text-[12px] last:border-b-0">
      <span className="text-sz-n-600">{props.label}</span>
      <span className="text-right font-semibold tabular-nums text-sz-n-900">
        {props.value}
        {props.sub && (
          <span className="ml-1 text-[11px] font-normal text-sz-n-500">
            {props.sub}
          </span>
        )}
      </span>
    </div>
  );
}

// ── 요청 박스(.req-b) · 정산 상태머신(.stm) ────────────

export function ReqBox(props: {
  head: ReactNode;
  body: ReactNode;
  meta?: ReactNode;
  neutral?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[6px] border px-3.5 py-3",
        props.neutral
          ? "border-sz-n-200 bg-sz-n-50"
          : "border-[#F0DCC0] bg-[#FDF6EC]"
      )}
    >
      <div
        className={cn(
          "text-[12px] font-semibold",
          props.neutral ? "text-sz-n-900" : "text-sz-warning-text"
        )}
      >
        {props.head}
      </div>
      <div className="mt-1.5 text-[12px] leading-[1.7] text-sz-n-900">
        {props.body}
      </div>
      {props.meta && (
        <div className="mt-2 text-[11px] text-sz-n-600">{props.meta}</div>
      )}
    </div>
  );
}

export function SettlementMachine(props: {
  stage: "WAITING" | "CONFIRMED" | "TRANSFERRED";
}) {
  const steps = [
    { key: "WAITING", label: "정산 대기" },
    { key: "CONFIRMED", label: "운영자 확인" },
    { key: "TRANSFERRED", label: "이체 완료" },
  ] as const;
  const current = steps.findIndex((step) => step.key === props.stage);
  return (
    <div className="mt-[2px] flex items-center">
      {steps.map((step, index) => (
        <div key={step.key} className="contents">
          {index > 0 && (
            <span className="px-1 text-[10px] text-sz-n-300">›</span>
          )}
          <span
            className={cn(
              "flex-1 rounded-[6px] px-1 py-[7px] text-center text-[11px]",
              index < current && "bg-sz-success-bg text-sz-success-text",
              index === current &&
                "bg-sz-accent-50 font-semibold text-sz-accent-600",
              index > current && "bg-sz-n-100 text-sz-n-500"
            )}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** 시안 `.mwarn` — 기본 위험색(!) · `info`는 정보색(i) */
export function MWarn(props: {
  children: ReactNode;
  info?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mt-4 flex gap-2 rounded-[6px] px-3 py-2.5 text-[11px] font-medium leading-[1.6]",
        props.info
          ? "bg-sz-info-bg text-sz-info-text"
          : "bg-sz-danger-bg text-sz-danger-text",
        props.className
      )}
    >
      <span>{props.info ? "i" : "!"}</span>
      <span>{props.children}</span>
    </div>
  );
}

/** 시안 `.unmask` — 카드 하단 보조 버튼(게시물 숨김 · 숨김 해제 · 본문 대조) */
export function MiniBtn(props: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      className={cn(
        "inline-flex h-6 items-center gap-[5px] rounded-[6px] border border-sz-n-300 bg-white px-[9px] text-[11px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:text-sz-n-900 disabled:cursor-not-allowed disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400",
        props.className
      )}
    >
      {props.children}
    </button>
  );
}

/** 시안 `.chip` — 상품 칩(상품 상세 링크) */
export function ProductChip(props: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className="group/chip inline-flex items-center gap-[5px] rounded-[10px] border border-sz-n-300 bg-white px-[9px] py-0.5 text-[11px] text-sz-n-700 hover:border-sz-accent-500 hover:text-sz-accent-600"
    >
      {props.children}
      <span className="text-[9px] text-sz-n-400 group-hover/chip:text-sz-accent-500">
        ↗
      </span>
    </button>
  );
}

// ── 모달(.modal 520) ─────────────────────────────────

export function GbModal(props: {
  title: string;
  width?: number;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  const { title, width = 520, onClose, footer, children } = props;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [handleKeyDown]);

  return (
    // 바깥 클릭으로 닫지 않는다 — 입력한 사유가 빗나간 클릭 한 번에 날아가면 안 된다
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,27,31,0.4)]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gb-modal-title"
        className="flex max-h-[90vh] flex-col overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]"
        style={{ width }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-5 py-3.5">
          <h2
            id="gb-modal-title"
            className="text-[13px] font-semibold text-sz-n-900"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-sz-n-400 hover:text-sz-n-600"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto p-5 text-[12px] leading-[1.7] text-sz-n-700">
          {children}
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-sz-n-200 px-5 py-3">
          {footer}
        </div>
      </div>
    </div>
  );
}

export function MLabel(props: { children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-1 mt-4 block text-[12px] font-medium text-sz-n-600">
      {props.children}
      {props.required && <span className="ml-0.5 text-sz-danger-text">*</span>}
    </label>
  );
}

export function MHint(props: { children: ReactNode }) {
  return <p className="mt-1.5 text-[11px] text-sz-n-500">{props.children}</p>;
}

const MFIELD =
  "w-full rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** 시안 `.msel` — 32px */
export function MSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, style, ...rest } = props;
  return (
    <select
      {...rest}
      style={{ ...MODAL_SELECT_CHEVRON_STYLE, ...style }}
      className={cn(
        MFIELD,
        "h-8 cursor-pointer appearance-none py-0 pr-8",
        className
      )}
    />
  );
}

/** 시안 `.mta` — 대부분 70px로 줄여 쓴다 */
export function MTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={cn(
        MFIELD,
        "min-h-[70px] resize-y pb-1.5 pt-[7px] leading-[1.6]",
        className
      )}
    />
  );
}

/** 시안 `.dchip` — 날짜 칩(잠긴 날짜는 회색 취소선 · 고를 수 없다) */
export function DateChip(props: {
  children: ReactNode;
  on?: boolean;
  locked?: boolean;
  onClick?: () => void;
}) {
  const { children, on = false, locked = false, onClick } = props;
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      className={cn(
        "rounded-[6px] border px-[9px] py-1 text-[11px]",
        on && "border-sz-accent-500 bg-sz-accent-500 font-semibold text-white",
        locked &&
          "cursor-not-allowed border-sz-n-200 bg-sz-n-50 text-sz-n-400 line-through decoration-sz-n-300",
        !on &&
          !locked &&
          "border-sz-n-300 bg-white text-sz-n-700 hover:border-sz-accent-500 hover:text-sz-accent-600"
      )}
    >
      {children}
    </button>
  );
}
