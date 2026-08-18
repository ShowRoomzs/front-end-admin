import Calendar from "@/common/components/Calendar/Calendar";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect, useState } from "react";

interface EffectiveDateFieldProps {
  /** `YYYY-MM-DD` — 비어 있으면 미선택 */
  value: string;
  onChange: (value: string) => void;
}

/**
 * 시행일 입력 — **읽기 전용 인풋 + 달력 모달**이다(§21-5 · 시안 C6).
 *
 * 직접 타이핑을 막는 건 의도된 것이다. 시행일은 서버 배치가 00:00에 교체 기준으로 쓰는
 * 값이라 `2026.13.01` 같은 입력이 들어오면 안 되고, 무엇보다 **오늘 이후만** 허용해야
 * 한다 — 과거 시행일은 이미 시행됐어야 할 문서를 뒤늦게 등록하는 셈이라 동의 기록과
 * 어긋난다.
 *
 * 달력은 공용 `Calendar`를 그대로 쓴다. 그 컴포넌트의 `type="end" + startDate`는
 * "startDate 이전은 선택 불가"로 동작하므로, startDate에 오늘을 넣으면 원하는 하한이
 * 정확히 걸린다 — 하한만 필요해 별도 달력을 새로 만들지 않았다.
 */
export default function EffectiveDateField(props: EffectiveDateFieldProps) {
  const { value, onChange } = props;
  const [isOpen, setIsOpen] = useState(false);
  const today = dayjs().startOf("day");
  const selected = value ? dayjs(value) : null;
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(selected ?? today);

  // 값이 바뀐 뒤 다시 열면 그 달부터 보여준다(늘 이번 달로 되돌아가면 다시 넘겨야 한다)
  useEffect(() => {
    if (isOpen && value) {
      setCurrentMonth(dayjs(value));
    }
  }, [isOpen, value]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-8 w-[180px] items-center justify-between rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] tabular-nums text-sz-n-900 hover:border-sz-n-400"
      >
        <span className={value ? "" : "text-sz-n-400"}>
          {value ? dayjs(value).format("YYYY.MM.DD") : "날짜 선택"}
        </span>
        <span aria-hidden className="text-[12px] text-sz-n-500">
          📅
        </span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-sz-n-900/40 p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div className="w-[360px] max-w-full overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]">
            <div className="flex items-center justify-between border-b border-sz-n-200 px-5 py-3.5">
              <h2 className="text-[13px] font-semibold text-sz-n-900">
                시행일 선택
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="닫기"
                className="text-[13px] text-sz-n-400 hover:text-sz-n-700"
              >
                ✕
              </button>
            </div>

            <div className="px-5 py-4">
              <Calendar
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                selectedDate={selected}
                startDate={today}
                endDate={null}
                type="end"
                onDateClick={(date) => {
                  onChange(date.format("YYYY-MM-DD"));
                  setIsOpen(false);
                }}
              />
              <p className="mt-3 text-[11px] leading-[1.6] text-sz-n-500">
                오늘 이전 날짜는 선택할 수 없습니다. 시행일 00:00에 시스템이
                자동 으로 새 버전을 시행합니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
