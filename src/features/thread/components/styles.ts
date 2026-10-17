/*
  시안 ui-admin-20a/20b의 원자 클래스 — 이 화면 안에서만 쓴다.
  공용 `Button`(shadcn)은 14px 베이스라 12px 라벨로 짜인 시안과 어긋나 `.btn`을 그대로 옮긴다.
*/

const BTN_BASE =
  "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] px-3.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed";

/** 시안 `.btn-secondary` */
export const BTN_SECONDARY = `${BTN_BASE} border border-sz-n-300 bg-white text-sz-n-900 hover:bg-sz-n-100 disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400`;

/** 시안 `.flink` — 값 옆 밑줄 링크 */
export const FLINK_CLASS =
  "cursor-pointer text-sz-n-600 underline underline-offset-2 hover:text-sz-accent-600";

/** 시안 `.inp` — 32px · 13px */
export const INPUT_CLASS =
  "h-8 w-full rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-1.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** 시안 `.mrow` (우측 패널 · 정보 바 안) — 11px 줄 · 좌 라벨 · 우 값 */
export const MROW_CLASS =
  "flex justify-between gap-2.5 border-b border-sz-n-100 py-1.5 text-[11px] last:border-b-0";
export const MK_CLASS = "shrink-0 text-sz-n-500";
export const MV_CLASS = "min-w-0 text-right font-medium text-sz-n-900";

/** 시안 `.t-sub` */
export const TSUB_CLASS = "text-[11px] font-normal text-sz-n-500";

/** 시안 `.ip-t` — 패널 칸 제목 */
export const IP_TITLE_CLASS =
  "mb-1.5 flex items-center justify-between gap-2 text-[12px] font-semibold text-sz-n-900";
