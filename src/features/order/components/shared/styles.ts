/*
  시안 ui-admin-06a-orders의 원자 클래스 — 이 화면 안에서만 쓴다.
  버튼 · 입력 · 셀렉트는 시안 DS 규격(12px/500 · 32px, `.sel-sm` 28px)을 그대로 옮겼다.
*/

/** 시안 `.inp` — 13px · 32px · 포커스 링 */
export const INPUT_CLASS =
  "h-8 rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** 시안 `.sel-sm` — 28px · 12px · 화살표는 배경 이미지 */
export const SELECT_SM_CLASS =
  "h-7 cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-[26px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** 시안 `.ifm .inp` — 레일 인라인 폼 입력(28px · 11px) */
export const FORM_INPUT_CLASS =
  "h-7 w-full rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[11px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** 시안 `.ifm .msel` — 화살표 자리를 비운 셀렉트 */
export const FORM_SELECT_CLASS = `${FORM_INPUT_CLASS} cursor-pointer appearance-none pr-8`;

/** 시안 `.ifm .mta` — 11px · 최소 52px */
export const FORM_TEXTAREA_CLASS =
  "min-h-[52px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-2.5 pb-1.5 pt-[7px] text-[11px] leading-[1.6] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** 시안 `.modal .mta` — 확인 모달 사유 입력(13px · 최소 88px) */
export const MODAL_TEXTAREA_CLASS =
  "min-h-[88px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-2.5 pb-1.5 pt-[7px] text-[13px] leading-[1.6] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** 시안 `.btn` — 12px/500 · 32px · 좌우 14px. 비활성은 DS `.btn:disabled`(n-100 + n-200 테두리) */
export const BTN_BASE =
  "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] px-3.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:border disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400";

export const BTN_PRIMARY = `${BTN_BASE} bg-sz-accent-500 text-white hover:bg-sz-accent-600`;
export const BTN_SECONDARY = `${BTN_BASE} border border-sz-n-300 bg-white text-sz-n-900 hover:bg-sz-n-100`;
/** 시안 `.btn-danger-o` — 흰 배경 + 중립 테두리 + 위험색 글자(직권 취소) */
export const BTN_DANGER_O = `${BTN_BASE} border border-sz-n-300 bg-white text-sz-danger-text hover:border-sz-n-400 hover:bg-sz-danger-bg`;
/** 확인 모달의 확정 버튼 — 채운 위험색 */
export const BTN_DANGER = `${BTN_BASE} bg-sz-danger-text text-white hover:bg-[#8f2828]`;
