import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CheckProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
}

/** 시안 `.chk/.cbox` — 15px 체크박스 + 라벨 */
export default function Check(props: CheckProps) {
  const { checked, onChange, disabled = false, children, className } = props;

  return (
    <label
      className={cn(
        "inline-flex items-center gap-[7px] text-[11px] font-medium text-inherit",
        disabled ? "cursor-default" : "cursor-pointer",
        className
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span
        aria-hidden
        className={cn(
          "flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px]",
          checked
            ? "border-sz-accent-500 bg-sz-accent-500"
            : "border-sz-n-400 bg-white"
        )}
      >
        {checked && (
          <svg viewBox="0 0 10 10" fill="none" className="h-2.5 w-2.5">
            <path
              d="M1.5 5.2L3.9 7.5L8.5 2.6"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {children}
    </label>
  );
}

/** 모달 체크리스트 한 줄(시안 C1·C5·C6) — 테두리 박스 안에 구분선으로 쌓인다 */
export function CheckListRow(props: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  const { checked, onChange, children } = props;
  return (
    <div className="flex items-start gap-[9px] border-b border-sz-n-100 py-[7px] last:border-b-0">
      <Check checked={checked} onChange={onChange} className="mt-[3px]" />
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="flex-1 cursor-pointer text-left text-[12px] leading-[1.65] text-sz-n-700"
      >
        {children}
      </button>
    </div>
  );
}
