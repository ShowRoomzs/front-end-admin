import { cn } from "@/lib/utils";
import { Dayjs } from "dayjs";

/** 시안 10-terms `.cal-b` — 26px 이전/다음 달 버튼 */
const NAV_BUTTON_CLASS =
  "inline-flex size-[26px] items-center justify-center rounded-[6px] border border-sz-n-200 text-[11px] text-sz-n-600 hover:bg-sz-n-100 hover:text-sz-n-900";

interface CalendarProps {
  currentMonth: Dayjs;
  onMonthChange: (month: Dayjs) => void;
  selectedDate: Dayjs | null;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  onDateClick: (date: Dayjs) => void;
  type: "start" | "end";
}

export default function Calendar(props: CalendarProps) {
  const {
    currentMonth,
    onMonthChange,
    selectedDate,
    startDate,
    endDate,
    onDateClick,
    type,
  } = props;

  const getDaysInMonth = () => {
    const startOfMonth = currentMonth.startOf("month");
    const startDay = startOfMonth.day(); // 0 (일요일) ~ 6 (토요일)
    const daysInMonth = currentMonth.daysInMonth();

    const days: (Dayjs | null)[] = [];

    // 이전 달의 빈 칸
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // 현재 달의 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(currentMonth.date(i));
    }

    return days;
  };

  const isInRange = (date: Dayjs) => {
    if (!startDate || !endDate) return false;
    return date.isAfter(startDate) && date.isBefore(endDate);
  };

  const isSelected = (date: Dayjs) => {
    if (!selectedDate) return false;
    return date.isSame(selectedDate, "day");
  };

  const isDisabled = (date: Dayjs) => {
    if (type === "end" && startDate) {
      return date.isBefore(startDate, "day");
    }
    if (type === "start" && endDate) {
      return date.isAfter(endDate, "day");
    }
    return false;
  };

  return (
    <div className="min-w-[224px] flex flex-col">
      {/* 달력 헤더 — 시안 10-terms `.cal-h` · `.cal-t` · `.cal-b` */}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-[13px] font-semibold text-sz-n-900">
          {`${currentMonth.year()}년 ${currentMonth.month() + 1}월`}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="이전 달"
            onClick={() => onMonthChange(currentMonth.subtract(1, "month"))}
            className={NAV_BUTTON_CLASS}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="다음 달"
            onClick={() => onMonthChange(currentMonth.add(1, "month"))}
            className={NAV_BUTTON_CLASS}
          >
            ›
          </button>
        </div>
      </div>

      {/* 요일 헤더 — 시안 `.cal-w` */}
      <div className="grid grid-cols-7 gap-[2px]">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <div
            key={day}
            className="pt-[3px] pb-[5px] text-center text-[11px] text-sz-n-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 — 시안 `.cal-d` · `.mute` · `.on` */}
      <div className="grid grid-cols-7 gap-[2px]">
        {getDaysInMonth().map((date, index) => {
          const disabled = date ? isDisabled(date) : false;
          const selected = date ? isSelected(date) : false;
          return (
            <div
              key={index}
              className={cn(
                "flex h-8 items-center justify-center rounded-[6px] text-[12px] tabular-nums text-sz-n-900 cursor-pointer",
                !date && "cursor-default",
                date && !disabled && !selected && "hover:bg-sz-n-100",
                date && disabled && "text-sz-n-300 cursor-not-allowed",
                date && !selected && isInRange(date) && "bg-sz-accent-50",
                selected && "bg-sz-accent-500 font-semibold text-white"
              )}
              onClick={() => date && !disabled && onDateClick(date)}
            >
              {date ? date.date() : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
