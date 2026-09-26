import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** 시안 `.mwarn` — 모달 경고(기본 위험색) · `info` 변형 */
export function ModalWarn(props: { children: ReactNode; tone?: "info" }) {
  const { children, tone } = props;
  return (
    <div
      className={cn(
        "mt-4 flex gap-2 rounded-[6px] px-3 py-2.5 text-[11px] font-medium leading-[1.6]",
        tone === "info"
          ? "bg-sz-info-bg text-sz-info-text"
          : "bg-sz-danger-bg text-sz-danger-text"
      )}
    >
      <span>{tone === "info" ? "i" : "!"}</span>
      <span>{children}</span>
    </div>
  );
}

/** 시안 `.mlabel` */
export function MLabel(props: {
  children: ReactNode;
  required?: boolean;
  first?: boolean;
}) {
  const { children, required, first } = props;
  return (
    <label
      className={cn(
        "mb-1 block text-[12px] font-medium text-sz-n-600",
        first ? "mt-0" : "mt-4"
      )}
    >
      {children}
      {required && <span className="ml-0.5 text-sz-danger-text">*</span>}
    </label>
  );
}

/** 체크리스트 테두리 박스(시안 C1·C5·C6) */
export function CheckBox(props: { children: ReactNode }) {
  return (
    <div className="rounded-[6px] border border-sz-n-200 px-[13px] py-0.5">
      {props.children}
    </div>
  );
}

export const MODAL_SELECT_CLASS =
  "h-8 w-full cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-8 text-[13px] text-sz-n-900 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

export const MODAL_TEXTAREA_CLASS =
  "min-h-[88px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-2.5 pb-1.5 pt-[7px] text-[13px] leading-[1.6] text-sz-n-900 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";
