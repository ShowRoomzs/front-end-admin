/*
  시안 ui-admin-06a-orders의 원자 클래스 — 이 화면 안에서만 쓴다.
  버튼 · 입력 · 셀렉트는 시안 DS 규격(12px/500 · 32px)을 그대로 옮겼다.
  툴바 셀렉트는 시안 `.sel-sm` 28px 대신 DS 32px · 13px(세 앱 합의 11-21).
*/

import { SELECT_TOOLBAR_CLASS } from "@/common/constants/dsStyle";

/** 시안 `.inp` — 13px · 32px · 포커스 링 */
export const INPUT_CLASS =
  "h-8 rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** 툴바 셀렉트 — DS 32px · 13px · n-900. 화살표는 `MODAL_SELECT_CHEVRON_STYLE`(세 앱 합의 11-21) */
export const SELECT_SM_CLASS = SELECT_TOOLBAR_CLASS;

/** 레일 인라인 폼 입력 — 시안 `.ifm .inp`는 28px · 11px지만 DS `.inp`(32px · 13px · 6/10)로 통일(11-20) */
export const FORM_INPUT_CLASS =
  "h-8 w-full rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-1.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** 시안 `.ifm .msel` — 화살표 자리를 비운 셀렉트(크기는 DS `.inp`) */
export const FORM_SELECT_CLASS = `${FORM_INPUT_CLASS} cursor-pointer appearance-none pr-8`;

/** 레일 인라인 폼 textarea — 시안 `.ifm .mta`는 11px지만 DS 13px · 여백 6/10으로 통일(11-20). 최소 52px · 줄간격은 그대로 */
export const FORM_TEXTAREA_CLASS =
  "min-h-[52px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-1.5 text-[13px] leading-[1.6] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** 시안 `.modal .mta` — 확인 모달 사유 입력(13px · 최소 88px) */
export const MODAL_TEXTAREA_CLASS =
  "min-h-[88px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-2.5 pb-1.5 pt-[7px] text-[13px] leading-[1.6] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** 시안 `.btn` — 12px/500 · 32px · 좌우 14px. 비활성은 DS `.btn:disabled`(n-100 + n-200 테두리) */
export const BTN_BASE =
  "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] px-3.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:border disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400";

export const BTN_PRIMARY = `${BTN_BASE} bg-sz-accent-500 text-white hover:bg-sz-accent-600`;
export const BTN_SECONDARY = `${BTN_BASE} border border-sz-n-300 bg-white text-sz-n-900 hover:bg-sz-n-100`;
/** [직권 취소] — 시안은 테두리형 `.btn-danger-o`지만 DS에 없어 채운 `.btn-danger`로 통일(11-20) */
export const BTN_DANGER_O = `${BTN_BASE} bg-sz-danger-text text-white hover:bg-[#8f2828]`;
/** 확인 모달의 확정 버튼 — 채운 위험색 */
export const BTN_DANGER = `${BTN_BASE} bg-sz-danger-text text-white hover:bg-[#8f2828]`;
