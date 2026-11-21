/*
  웹 디자인 시스템 v1.2 버튼 — 화면마다 따로 베껴 두던 값을 여기로 모은다(11-20 DS 통일).

  DS `.btn`: 32px · 12px/500 · 모서리 6px · 좌우 14px. 비활성은 종류와 관계없이 n-100 면 · n-200 테두리 · n-400 글자.
  DS는 작은 버튼을 따로 정하지 않는다. 카드 머리 · 칩 옆처럼 32px가 들어가지 않는 자리는
  세 앱 시안 공통 `.btn-sm` 높이 28px를 쓰고, 글자 · 색 · hover · 비활성은 `.btn` 그대로 둔다(세 앱 합의 11-21).
  테두리형 위험 버튼(시안 `.btn-danger-o` · `.rbtn.del`)은 DS에 없다 — 채운 `.btn-danger` 하나로 쓴다.
*/

/** DS `.btn:disabled` — 모든 종류 공통 */
export const DS_BTN_DISABLED =
  "disabled:cursor-not-allowed disabled:border disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400";

const SM_BASE = `inline-flex h-7 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-[6px] px-3 text-[12px] font-medium transition-colors ${DS_BTN_DISABLED}`;

/** 작은 버튼 28px — secondary(흰 면 · n-300 테두리 · n-900 글자 · hover n-100) */
export const BTN_SM_SECONDARY = `${SM_BASE} border border-sz-n-300 bg-white text-sz-n-900 hover:bg-sz-n-100`;
/** 작은 버튼 28px — primary */
export const BTN_SM_PRIMARY = `${SM_BASE} bg-sz-accent-500 text-white hover:bg-sz-accent-600`;
/** 작은 버튼 28px — danger(채운 위험색 · hover #8F2828) */
export const BTN_SM_DANGER = `${SM_BASE} bg-sz-danger-text text-white hover:bg-[#8f2828]`;

/*
  목록 표의 관리 열 행 버튼 — 파트너 v1.3 `.act-btn`(세 앱 합의 11-21).
  28px · 11px/500 · 좌우 14px · n-300 테두리 · n-700 글자 · hover n-100 + n-400 테두리.
  `.del`은 채우지 않는다. 글자만 위험색이고 hover 때 위험색 면과 테두리가 생긴다.
  카드 머리 · 좁은 자리의 버튼은 위 `BTN_SM_*`를 쓴다.
*/
const ACT_BASE = `inline-flex h-7 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-[6px] border px-3.5 text-[11px] font-medium transition-colors ${DS_BTN_DISABLED}`;

/** 행 버튼 — 기본 */
export const BTN_ACT = `${ACT_BASE} border-sz-n-300 bg-white text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100`;
/** 행 버튼 — primary */
export const BTN_ACT_PRIMARY = `${ACT_BASE} border-sz-accent-500 bg-sz-accent-500 text-white hover:border-sz-accent-600 hover:bg-sz-accent-600`;
/** 행 버튼 — 삭제(.del) */
export const BTN_ACT_DEL = `${ACT_BASE} border-sz-n-300 bg-white text-sz-danger-text hover:border-sz-danger-text hover:bg-sz-danger-bg`;

/*
  큰 버튼 — 시안 `.btn-lg` 38px · 13px/500 · 좌우 20px(세 앱 합의 11-21).
  로그인처럼 화면에 하나뿐인 주 행동에만 쓴다.
*/
export const BTN_LG_PRIMARY = `inline-flex h-[38px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] bg-sz-accent-500 px-5 text-[13px] font-medium text-white transition-colors hover:bg-sz-accent-600 ${DS_BTN_DISABLED}`;
