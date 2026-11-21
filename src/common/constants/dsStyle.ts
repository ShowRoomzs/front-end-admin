/*
  DS v1.2에 정의가 없던 요소의 공통 값 — 어드민 · 파트너센터 · 스튜디오 합의(11-21).

  근거는 DS 토큰과 v1.3 시트에 이미 있는 컴포넌트다.
  - 파트너 v1.3: `.calc` · `.notice` · `.subtab` · `.act-btn` · `.stp`
  - 스튜디오 v1.3: `.sec-note`
  세 앱이 같은 값을 쓰도록 여기 값을 바꿀 때는 다른 두 앱과 맞춘다.
  버튼은 `buttonStyle.ts`, 모달 셀렉트 화살표는 `selectStyle.ts`에 있다.
*/

/** DS 포커스 — accent-500 테두리 + 3px accent-50 링 */
export const DS_FOCUS = "outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/**
 * 툴바 셀렉트 — DS select 32px · 13px · n-900.
 * 예전 시안 `.sel-sm`(28px · 12px · n-700)은 쓰지 않는다. DS의 input · select에는 작은 크기가 없다.
 * 화살표는 `MODAL_SELECT_CHEVRON_STYLE`(10×6 · 오른쪽 10px)을 style로 함께 넘긴다.
 */
export const SELECT_TOOLBAR_CLASS = `h-8 cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-8 text-[13px] text-sz-n-900 ${DS_FOCUS}`;

/** 툴바 날짜 입력 — DS input 32px · 13px. 툴바 셀렉트와 같은 높이 */
export const DATE_INPUT_CLASS = `h-8 rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 placeholder:text-sz-n-400 ${DS_FOCUS}`;

/** 큰 입력 — 로그인처럼 큰 버튼(38px)과 한 줄에 놓는 입력 */
export const INPUT_LG_CLASS = `h-[38px] w-full rounded-[6px] border border-sz-n-300 bg-white px-3 text-[13px] text-sz-n-900 placeholder:text-sz-n-400 ${DS_FOCUS}`;

/** 안내 상자 · 중립 — v1.3 `.sec-note`(11px · n-600 · n-50 바탕 · n-200 테두리 · 9px 12px · 줄간 1.7) */
export const NOTE_CLASS =
  "rounded-[6px] border border-sz-n-200 bg-sz-n-50 px-3 py-[9px] text-[11px] leading-[1.7] text-sz-n-600";

/** 안내 상자 · 상태 — v1.3 `.notice`(11px · 줄간 1.6 · 11px 13px · 테두리 없음). 굵게는 600 */
export const NOTICE_BASE_CLASS = "rounded-[6px] px-[13px] py-[11px] text-[11px] leading-[1.6] [&_b]:font-semibold [&_strong]:font-semibold";
export const NOTICE_INFO_CLASS = `${NOTICE_BASE_CLASS} bg-sz-info-bg text-sz-info-text`;
export const NOTICE_WARN_CLASS = `${NOTICE_BASE_CLASS} bg-sz-warning-bg text-sz-warning-text`;
export const NOTICE_DANGER_CLASS = `${NOTICE_BASE_CLASS} bg-sz-danger-bg text-sz-danger-text`;

/** 1단 탭 — DS `.tab`(12px · n-500 · 8px 4px · 간격 16 · 2px 밑줄) */
export const TAB_CLASS =
  "mr-4 cursor-pointer border-b-2 border-transparent px-1 py-2 text-[12px] text-sz-n-500 transition-colors hover:text-sz-n-700";
/** 1단 탭 켬 — accent-500 글자 · 밑줄 · 500 */
export const TAB_ON_CLASS = "border-sz-accent-500 font-medium text-sz-accent-500 hover:text-sz-accent-500";

/** 2단 탭 — v1.3 `.subtab` 필형(30px · 좌우 13 · r 15 · n-300 · 12px n-600) */
export const SUBTAB_CLASS =
  "inline-flex h-[30px] cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[15px] border border-sz-n-300 bg-white px-[13px] text-[12px] text-sz-n-600 transition-colors hover:bg-sz-n-100";
/** 2단 탭 켬 */
export const SUBTAB_ON_CLASS = "border-sz-accent-500 bg-sz-accent-500 font-medium text-white hover:bg-sz-accent-500";
/** 2단 탭 안 건수 */
export const SUBTAB_COUNT_CLASS = "text-[11px] opacity-75";

/** 분절 버튼(기간 프리셋 · 보기 전환) 틀 — n-300 테두리 · r-sm */
export const SEG_CLASS = "inline-flex overflow-hidden rounded-[6px] border border-sz-n-300 bg-white";
/** 분절 버튼 항목 — 바깥 32px(테두리 포함) · 12px n-600 · 칸 사이 n-300 */
export const SEG_ITEM_CLASS =
  "inline-flex h-[30px] cursor-pointer items-center whitespace-nowrap border-r border-sz-n-300 px-3 text-[12px] text-sz-n-600 transition-colors last:border-r-0 hover:bg-sz-n-100";
/** 분절 버튼 켬 — accent-500 · 흰 글자 · 500 */
export const SEG_ITEM_ON_CLASS = "bg-sz-accent-500 font-medium text-white hover:bg-sz-accent-500";

/**
 * 명세표(머리 없는 금액 표) — v1.3 `.calc`. 바깥 테두리 없이 카드 안에 둔다.
 * 행 tr에 아래 값을 쓴다. 칸 8px 4px · 아래 선 n-100 · 라벨 n-600 · 값 n-900 오른쪽 tabular-nums.
 * ⚠️ 표 행 간격은 시안이 우선이다(사용자 지시 11-21). 시안에 여백이 있는 표는 그 여백을 두고 색 · 선만 맞춘다.
 */
export const CALC_TABLE_CLASS = "w-full border-collapse text-[12px]";
export const CALC_TD_CLASS = "border-b border-sz-n-100 px-1 py-2";
export const CALC_LBL_CLASS = "text-sz-n-600";
export const CALC_VAL_CLASS = "text-right tabular-nums text-sz-n-900";
/** 하위 행 — 라벨 왼쪽 14px · 11px · n-500 */
export const CALC_SUB_LBL_CLASS = "pl-3.5 text-[11px] text-sz-n-500";
export const CALC_SUB_VAL_CLASS = "text-right tabular-nums text-[11px] text-sz-n-500";
/** 합계 행 — 위 선 1.5px n-300 · 위 10px · 16px/600 */
export const CALC_TOTAL_TD_CLASS = "border-t-[1.5px] border-b-0 border-sz-n-300 px-1 pb-2 pt-2.5 text-[16px] font-semibold text-sz-n-900";

/** 체크박스 상자 — DS `.fp-box`(15px · 1.5px n-300 · r 4px) */
export const CHECK_BOX_CLASS =
  "flex size-[15px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-sz-n-300 bg-white";
/** 체크박스 켬 — accent-500 면 · 흰 체크(9px) */
export const CHECK_BOX_ON_CLASS = "border-sz-accent-500 bg-sz-accent-500 text-white";

/** 드롭다운 메뉴 · 팝오버 — 흰 바탕 · n-200 테두리 · r-md · DS --shadow-popover */
export const POPOVER_CLASS =
  "rounded-[8px] border border-sz-n-200 bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]";
/** 드롭다운 메뉴 항목 — 32px · 12px n-700 · hover n-100 */
export const POPOVER_ITEM_CLASS =
  "flex h-8 w-full cursor-pointer items-center whitespace-nowrap px-3 text-left text-[12px] text-sz-n-700 hover:bg-sz-n-100";
