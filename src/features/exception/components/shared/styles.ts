/*
  시안 ui-admin-06d의 원자 클래스 — 이 화면 안에서만 쓴다.

  공용 `Button`(shadcn)은 14px 베이스라 12px 라벨 · 32px 높이로 짜인 어드민 목록 시안과 어긋난다
  (계약 관리의 `BTN_*`와 같은 판단). 시안 `.btn`(12px/500 · 32px · 좌우 14px) · `.btn-sm`(28px · 좌우 12px) ·
  `.inp`(13px · 32px) · `.sel-sm`(12px · 28px)를 그대로 옮긴다.
*/

const BTN_BASE =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] text-[12px] font-medium";

/** 시안 `.btn.btn-secondary` — 32px */
export const BTN_SECONDARY = `${BTN_BASE} h-8 border border-sz-n-300 bg-white px-3.5 text-sz-n-900 hover:bg-sz-n-100`;
/** 시안 `.btn.btn-secondary.btn-sm` — 표 행 버튼 28px */
export const BTN_SECONDARY_SM = `${BTN_BASE} h-7 border border-sz-n-300 bg-white px-3 text-sz-n-900 hover:bg-sz-n-100`;

/** 시안 `.inp` — 32px · 13px · 패딩 6/10 · 포커스 링 */
export const INPUT_CLASS =
  "h-8 rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-1.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** 시안 `.sel-sm` — 28px · 12px · 우측 26px(갈매기표 자리) */
export const SELECT_SM_CLASS =
  "h-7 cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[26px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";
