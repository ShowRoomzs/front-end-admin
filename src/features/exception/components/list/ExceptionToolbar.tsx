import {
  EXCEPTION_PAGE_SIZES,
  EXCEPTION_SORT_OPTIONS,
  SELECT_CHEVRON_STYLE,
} from "@/features/exception/constants/params";
import { SELECT_SM_CLASS } from "@/features/exception/components/shared/styles";
import type { ExceptionSort, ExceptionTab } from "@/features/exception/types";

interface ExceptionToolbarProps {
  tab: ExceptionTab;
  /** 현재 조건의 결과 건수 — 못 받았으면 건수 문구를 그리지 않는다 */
  total: number | undefined;
  /** 처리 지연 탭의 「대행 가능 N건」 */
  proxyAvailableCount: number;
  sort: ExceptionSort;
  size: number;
  onSortChange: (sort: ExceptionSort) => void;
  onSizeChange: (size: number) => void;
}

/**
 * 시안 `.tbar` — 좌측 건수 문구, 우측 정렬 · 표시 건수.
 * 처리 지연은 「처리 지연 3건 · 대행 가능 1건」, 배송 예외는 「배송 예외 4건 · 운영자 조치 없음 — 관찰」
 * (플랫폼 미개입이라 운영자가 누를 것이 없다는 말을 건수 옆에 붙인다).
 */
export default function ExceptionToolbar(props: ExceptionToolbarProps) {
  const {
    tab,
    total,
    proxyAvailableCount,
    sort,
    size,
    onSortChange,
    onSizeChange,
  } = props;

  return (
    <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-4 py-2.5">
      <div className="text-[12px] leading-[1.6] text-sz-n-600">
        {total !== undefined &&
          (tab === "DELAY" ? (
            <>
              처리 지연 <b className="text-sz-n-900">{total}</b>건 · 대행 가능{" "}
              <b className="text-sz-n-900">{proxyAvailableCount}</b>건
            </>
          ) : (
            <>
              배송 예외 <b className="text-sz-n-900">{total}</b>건{" "}
              <span className="text-[11px] text-sz-n-500">
                · 운영자 조치 없음 — 관찰
              </span>
            </>
          ))}
      </div>
      <div className="flex items-center gap-2">
        <select
          aria-label="정렬"
          className={SELECT_SM_CLASS}
          style={SELECT_CHEVRON_STYLE}
          value={sort}
          onChange={(event) =>
            onSortChange(event.target.value as ExceptionSort)
          }
        >
          {EXCEPTION_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          aria-label="표시 건수"
          className={SELECT_SM_CLASS}
          style={SELECT_CHEVRON_STYLE}
          value={size}
          onChange={(event) => onSizeChange(Number(event.target.value))}
        >
          {EXCEPTION_PAGE_SIZES.map((option) => (
            <option key={option} value={option}>
              {option}건씩
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
