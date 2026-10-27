import { ModalLabel } from "@/common/components/ModalShell/ModalShell";
import {
  MODAL_SELECT_CLASS,
  MODAL_TEXTAREA_CLASS,
  SELECT_CHEVRON_STYLE,
} from "@/features/memberShared/constants/styles";
import type { AdminReasonOption } from "@/features/memberShared/types";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** `.mwarn` — 위험 톤(정지 · 승인) / `.mwarn.info` — 정보 톤(반려 · 마스킹 해제) */
export function ModalWarn(props: {
  tone?: "danger" | "info";
  children: ReactNode;
}) {
  const { tone = "danger", children } = props;

  return (
    <div
      className={cn(
        "mt-4 flex gap-2 rounded-[6px] px-3 py-2.5 text-[11px] font-medium leading-[1.6]",
        tone === "danger"
          ? "bg-sz-danger-bg text-sz-danger-text"
          : "bg-sz-info-bg text-sz-info-text"
      )}
    >
      <span className="shrink-0">{tone === "danger" ? "!" : "i"}</span>
      <span>{children}</span>
    </div>
  );
}

/** `.mlabel` — 위 여백 16px(첫 줄은 0) */
export function FieldLabel(props: {
  first?: boolean;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
}) {
  const { first = false, required = false, optional = false, children } = props;

  return (
    <div className={first ? "" : "mt-4"}>
      <ModalLabel
        required={required}
        optionalText={optional ? "선택" : undefined}
      >
        {children}
      </ModalLabel>
    </div>
  );
}

/** 사유 셀렉트(`.msel`) — 서버 사유 목록 그대로. 고르기 전에는 실행 버튼이 꺼져 있다 */
export function ReasonSelect(props: {
  reasons: Array<AdminReasonOption>;
  value: string;
  onChange: (code: string) => void;
  /** 고르기 전 자리 문구 — 비우면 첫 사유를 기본값으로 쓴다(마스킹 해제처럼 직전 사유 프리필) */
  placeholder?: string;
  ariaLabel: string;
}) {
  const { reasons, value, onChange, placeholder, ariaLabel } = props;

  return (
    <select
      aria-label={ariaLabel}
      className={cn(MODAL_SELECT_CLASS, !value && "text-sz-n-400")}
      style={SELECT_CHEVRON_STYLE}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {placeholder !== undefined && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {reasons.map((reason) => (
        <option key={reason.code} value={reason.code} className="text-sz-n-900">
          {reason.label}
        </option>
      ))}
    </select>
  );
}

/** `.mta` */
export function ReasonTextarea(props: {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  invalid?: boolean;
  ariaLabel: string;
}) {
  const { value, onChange, maxLength, invalid = false, ariaLabel } = props;

  return (
    <textarea
      aria-label={ariaLabel}
      className={cn(
        MODAL_TEXTAREA_CLASS,
        invalid && "border-sz-danger-text focus:border-sz-danger-text"
      )}
      value={value}
      maxLength={maxLength}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

/** `.mhint` */
export function ModalHint(props: { children: ReactNode }) {
  return <p className="mt-1.5 text-[11px] text-sz-n-500">{props.children}</p>;
}
