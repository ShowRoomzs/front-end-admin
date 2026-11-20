/*
  웹 디자인 시스템 v1.2 버튼 — 화면마다 따로 베껴 두던 값을 여기로 모은다(11-20 DS 통일).

  DS `.btn`: 32px · 12px/500 · 모서리 6px · 좌우 14px. 비활성은 종류와 관계없이 n-100 면 · n-200 테두리 · n-400 글자.
  DS는 작은 버튼을 따로 정하지 않는다. 표 안 · 카드 머리 · 칩 옆처럼 32px가 들어가지 않는 자리는
  DS의 작은 컨트롤 높이(툴바 셀렉트 `.sel-sm` 28px)를 쓰고, 글자 · 색 · hover · 비활성은 `.btn` 그대로 둔다.
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
