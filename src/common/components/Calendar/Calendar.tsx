import Dropdown from "@/common/components/Dropdown/Dropdown";
import { cn } from "@/lib/utils";
import { Dayjs } from "dayjs";

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

  const handleYearChange = (value: string) => {
    const year = parseInt(value);
    const newDate = currentMonth.year(year);
    onMonthChange(newDate);
  };

  const handleMonthChange = (value: string) => {
    const month = parseInt(value);
    const newDate = currentMonth.month(month);
    onMonthChange(newDate);
  };

  const getYearRange = () => {
    const currentYear = currentMonth.year();
    const years: number[] = [];
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
      years.push(i);
    }
    return years.map((year) => ({
      label: `${year}년`,
      value: year.toString(),
    }));
  };

  const getMonths = () => {
    return Array.from({ length: 12 }, (_, i) => ({
      label: `${i + 1}월`,
      value: i.toString(),
    }));
  };

  const currentYear = currentMonth.year();
  const currentMonthIndex = currentMonth.month();
  const yearItems = getYearRange();
  const monthItems = getMonths();

  return (
    <div className="min-w-[186px] flex flex-col">
      {/* 달력 헤더 */}
      <div className="flex items-center gap-[6px] mb-[12px]">
        <Dropdown
          items={yearItems}
          value={currentYear.toString()}
          onChange={handleYearChange}
          className="flex-1 py-[2px] border-none"
        />
        <Dropdown
          items={monthItems}
          value={currentMonthIndex.toString()}
          onChange={handleMonthChange}
          className="flex-1 py-[2px] border-none"
        />
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-[3px] mb-[6px]">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <div
            key={day}
            className="text-center text-[11px] text-gray-500 font-medium py-[3px]"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-[3px]">
        {getDaysInMonth().map((date, index) => {
          const disabled = date ? isDisabled(date) : false;
          return (
            <div
              key={index}
              className={cn(
                "text-center py-[5px] px-[5px] text-[11px] rounded cursor-pointer",
                !date && "cursor-default",
                date && !disabled && "hover:bg-gray-100",
                date && disabled && "opacity-30 cursor-not-allowed",
                date && isInRange(date) && "bg-blue-50",
                date &&
                  isSelected(date) &&
                  "bg-[#5468CD] text-white hover:bg-[#5468CD]",
                date &&
                  date.day() === 0 &&
                  !isSelected(date) &&
                  !disabled &&
                  "text-red-500",
                date &&
                  date.day() === 6 &&
                  !isSelected(date) &&
                  !disabled &&
                  "text-blue-500"
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
