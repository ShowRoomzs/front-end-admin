import Calendar from "@/common/components/Calendar/Calendar";
import { SELECT_CHEVRON_STYLE } from "@/features/contract/constants/params";
import {
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  type DateTimeParts,
} from "@/features/contract/utils/datetime";
import { cn } from "@/lib/utils";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";

interface DateTimeFieldProps {
  value: DateTimeParts;
  onChange: (value: DateTimeParts) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

const INNER_SELECT =
  "h-[30px] cursor-pointer appearance-none border-none bg-transparent py-0 pl-[9px] pr-[22px] text-[12px] tabular-nums text-sz-n-900 outline-none disabled:cursor-not-allowed disabled:text-sz-n-400";

/**
 * 날짜 칸 — 시안 `.dt input.d`는 「2026.08.14」 글자다. 브라우저 기본 날짜 입력은
 * `2026-08-14` + 달력 아이콘으로 그려져 시안과 달라, 시행일 입력(EffectiveDateField)과 같은
 * **읽기 전용 버튼 + 공용 Calendar 창**으로 받는다. 모달 위에 뜨므로 z-index를 한 단계 올린다.
 */
function DateButton(props: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  ariaLabel?: string;
}) {
  const { value, onChange, disabled, ariaLabel } = props;
  const [isOpen, setIsOpen] = useState(false);
  const selected = value ? dayjs(value) : null;
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(
    selected ?? dayjs().startOf("day")
  );

  const open = () => {
    setCurrentMonth(selected ?? dayjs().startOf("day"));
    setIsOpen(true);
  };

  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={open}
        className={cn(
          "h-[30px] w-[104px] bg-transparent px-2.5 text-left text-[12px] tabular-nums outline-none disabled:cursor-not-allowed disabled:text-sz-n-400",
          value ? "text-sz-n-900" : "text-sz-n-400"
        )}
      >
        {value ? dayjs(value).format("YYYY.MM.DD") : "날짜 선택"}
      </button>
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-sz-n-900/20"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div className="rounded-[8px] bg-white px-5 py-4 shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]">
            <Calendar
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              selectedDate={selected}
              startDate={null}
              endDate={null}
              type="end"
              onDateClick={(date) => {
                onChange(date.format("YYYY-MM-DD"));
                setIsOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

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
      <DateButton
        ariaLabel={ariaLabel ? `${ariaLabel} 날짜` : undefined}
        disabled={disabled}
        value={value.date}
        onChange={(date) => onChange({ ...value, date })}
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
