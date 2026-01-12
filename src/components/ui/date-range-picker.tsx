import Calendar from "@/common/components/Calendar/Calendar";
import { cn } from "@/lib/utils";
import dayjs, { Dayjs } from "dayjs";
import { CalendarIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface DateRangePickerProps {
  startDate: string | null;
  endDate: string | null;
  onChange: (startDate: string, endDate: string) => void;
  startPlaceholder?: string;
  endPlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

const DEFAULT_SELECTED_FLAG = { start: false, end: false };

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  startPlaceholder = "시작일",
  endPlaceholder = "종료일",
  disabled = false,
  className,
}: DateRangePickerProps) {
  const selectedFlag = useRef({ ...DEFAULT_SELECTED_FLAG });
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const [tempStartDate, setTempStartDate] = useState<Dayjs | null>(
    startDate ? dayjs(startDate) : null
  );
  const [tempEndDate, setTempEndDate] = useState<Dayjs | null>(
    endDate ? dayjs(endDate) : null
  );
  const [startMonth, setStartMonth] = useState(
    startDate ? dayjs(startDate) : dayjs()
  );
  const [endMonth, setEndMonth] = useState(
    endDate ? dayjs(endDate) : dayjs().add(1, "month")
  );

  const wrapperRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    if (disabled) return;

    if (!isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();

      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });

      selectedFlag.current = { ...DEFAULT_SELECTED_FLAG };
    }
    setIsOpen(!isOpen);
  };

  const update = useCallback(
    (startDate: Dayjs | null, endDate: Dayjs | null) => {
      if (!onChange || !startDate || !endDate) {
        return;
      }
      onChange(startDate.format("YYYY-MM-DD"), endDate.format("YYYY-MM-DD"));
      selectedFlag.current = { ...DEFAULT_SELECTED_FLAG };
      setIsOpen(false);
    },
    [onChange]
  );

  const handleStartDateClick = (date: Dayjs) => {
    setTempStartDate(date);
    selectedFlag.current.start = true;

    if (selectedFlag.current.end && tempEndDate) {
      update(date, tempEndDate);
    }
  };

  const handleEndDateClick = (date: Dayjs) => {
    setTempEndDate(date);
    selectedFlag.current.end = true;

    if (selectedFlag.current.start && tempStartDate) {
      update(tempStartDate, date);
    }
  };

  const initialize = useCallback(() => {
    if (startDate) {
      setTempStartDate(dayjs(startDate));
      setStartMonth(dayjs(startDate));
    } else {
      setTempStartDate(null);
      setStartMonth(dayjs());
    }
    if (endDate) {
      setTempEndDate(dayjs(endDate));
      setEndMonth(dayjs(endDate));
    } else if (startDate) {
      setEndMonth(dayjs(startDate).add(1, "month"));
    } else {
      setEndMonth(dayjs().add(1, "month"));
      setTempEndDate(null);
    }
  }, [endDate, startDate]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const dropdownMenus = document.querySelectorAll(".dropdown-menu");
      let isClickingDropdown = false;
      dropdownMenus.forEach((menu) => {
        if (menu.contains(target)) {
          isClickingDropdown = true;
        }
      });

      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        calendarRef.current &&
        !calendarRef.current.contains(target) &&
        !isClickingDropdown
      ) {
        setIsOpen(false);
        update(tempStartDate, tempEndDate);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, update, tempStartDate, tempEndDate]);

  // ESC 키 처리
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (!isOpen) {
        return;
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        initialize();
      }
    };
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [endDate, initialize, isOpen, startDate]);
  return (
    <>
      <div
        ref={wrapperRef}
        className={cn(
          "flex items-center gap-2",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {/* 시작일 Input */}
        <div
          className={cn(
            "rounded-[3px] border-[1px] border-gray-300 min-w-[150px] pl-[10px] pr-[12px] py-[7px] bg-white flex flex-row items-center justify-between cursor-pointer flex-1",
            disabled && "cursor-not-allowed"
          )}
          onClick={handleToggle}
        >
          <div
            className={cn(
              "text-[12px] font-normal",
              startDate ? "text-[#000000]" : "text-[#B3B3B3]"
            )}
          >
            {startDate || startPlaceholder}
          </div>
          <CalendarIcon className="w-4 h-4 ml-2" />
        </div>

        <span className="text-gray-400">-</span>

        {/* 종료일 Input */}
        <div
          className={cn(
            "rounded-[3px] border-[1px] border-gray-300 min-w-[150px] pl-[10px] pr-[12px] py-[7px] bg-white flex flex-row items-center justify-between cursor-pointer flex-1",
            disabled && "cursor-not-allowed"
          )}
          onClick={handleToggle}
        >
          <div
            className={cn(
              "text-[12px] font-normal",
              endDate ? "text-[#000000]" : "text-[#B3B3B3]"
            )}
          >
            {endDate || endPlaceholder}
          </div>
          <CalendarIcon className="w-4 h-4 ml-2" />
        </div>
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={calendarRef}
            className="absolute bg-white border-[1px] border-gray-300 rounded-[8px] shadow-lg z-[9999] p-[12px] flex gap-[20px]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            <div className="flex flex-col">
              <Calendar
                currentMonth={startMonth}
                onMonthChange={setStartMonth}
                selectedDate={tempStartDate}
                startDate={tempStartDate}
                endDate={tempEndDate}
                onDateClick={handleStartDateClick}
                type="start"
              />
            </div>

            <div className="flex flex-col">
              <Calendar
                currentMonth={endMonth}
                onMonthChange={setEndMonth}
                selectedDate={tempEndDate}
                startDate={tempStartDate}
                endDate={tempEndDate}
                onDateClick={handleEndDateClick}
                type="end"
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
