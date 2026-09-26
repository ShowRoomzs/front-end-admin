import { SELECT_CHEVRON_STYLE } from "@/features/contract/constants/params";
import {
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  type DateTimeParts,
} from "@/features/contract/utils/datetime";
import { cn } from "@/lib/utils";

interface DateTimeFieldProps {
  value: DateTimeParts;
  onChange: (value: DateTimeParts) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

const INNER_SELECT =
  "h-[30px] cursor-pointer appearance-none border-none bg-transparent py-0 pl-[9px] pr-[22px] text-[12px] tabular-nums text-sz-n-900 outline-none disabled:cursor-not-allowed disabled:text-sz-n-400";

/**
 * 시안 `.dt` — 날짜 | 시 : 분 한 칸. 모두싸인 대시보드의 값을 **옮겨 적는** 칸이라
 * 분 단위까지 받는다(5분 단위로 깎지 않는다).
 */
export default function DateTimeField(props: DateTimeFieldProps) {
  const { value, onChange, disabled = false, ariaLabel } = props;

  return (
    <div
      className={cn(
        "inline-flex h-8 items-center overflow-hidden rounded-[6px] border border-sz-n-300 bg-white focus-within:border-sz-accent-500 focus-within:ring-[3px] focus-within:ring-sz-accent-50",
        disabled && "bg-sz-n-100"
      )}
    >
      <input
        type="date"
        aria-label={ariaLabel ? `${ariaLabel} 날짜` : undefined}
        disabled={disabled}
        value={value.date}
        onChange={(event) => onChange({ ...value, date: event.target.value })}
        className="h-[30px] w-[124px] border-none bg-transparent px-2.5 text-[12px] tabular-nums text-sz-n-900 outline-none disabled:text-sz-n-400"
      />
      <span className="h-4 w-px shrink-0 bg-sz-n-200" />
      <select
        aria-label={ariaLabel ? `${ariaLabel} 시` : undefined}
        disabled={disabled}
        value={value.hour}
        onChange={(event) => onChange({ ...value, hour: event.target.value })}
        className={INNER_SELECT}
        style={{
          ...SELECT_CHEVRON_STYLE,
          backgroundPosition: "right 7px center",
        }}
      >
        {HOUR_OPTIONS.map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>
      <span className="px-px text-[12px] text-sz-n-400">:</span>
      <select
        aria-label={ariaLabel ? `${ariaLabel} 분` : undefined}
        disabled={disabled}
        value={value.minute}
        onChange={(event) => onChange({ ...value, minute: event.target.value })}
        className={INNER_SELECT}
        style={{
          ...SELECT_CHEVRON_STYLE,
          backgroundPosition: "right 7px center",
        }}
      >
        {MINUTE_OPTIONS.map((minute) => (
          <option key={minute} value={minute}>
            {minute}
          </option>
        ))}
      </select>
    </div>
  );
}
