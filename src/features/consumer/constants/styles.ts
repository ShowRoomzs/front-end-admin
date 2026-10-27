/*
  시안 ui-admin-13의 원자 클래스 — 소비자 상세 안에서만 쓴다. 값은 시안 `<style>` 블록에서 옮겼다.
  공용 `Button`(shadcn)은 14px 베이스라 12px 라벨로 짜인 어드민 시안과 어긋난다(계약 관리와 같은 판단).
*/

/** `.btn` — 32px · 12px/500 · 좌우 14px */
const BTN_BASE =
  "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] px-3.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed";

export const BTN_PRIMARY = `${BTN_BASE} bg-sz-accent-500 text-white hover:bg-sz-accent-600 disabled:border disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400`;
export const BTN_SECONDARY = `${BTN_BASE} border border-sz-n-300 bg-white text-sz-n-900 hover:bg-sz-n-100 disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400`;
/** `.btn-danger-o` — 흰 배경 + 중립 테두리 + 위험색 글자(레일의 정지) */
export const BTN_DANGER_OUTLINE = `${BTN_BASE} border border-sz-n-300 bg-white text-sz-danger-text hover:border-sz-n-400 hover:bg-sz-danger-bg disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400`;
/** `.btn-danger` — 꽉 찬 위험색은 모달의 최종 실행 버튼에만 쓴다 */
export const BTN_DANGER = `${BTN_BASE} bg-sz-danger-text text-white hover:bg-[#8f2828] disabled:border disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400`;

/** `.unmask` — 본인확인 카드 머리의 24px 버튼(마스킹 해제 · 지금 잠금) */
export const UNMASK_BTN_CLASS =
  "inline-flex h-6 cursor-pointer items-center gap-[5px] whitespace-nowrap rounded-[6px] border border-sz-n-300 bg-white px-[9px] text-[11px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:text-sz-n-900 disabled:cursor-not-allowed disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400";

/** `.unmask-on` — 해제됨 칩(경고색) */
export const UNMASK_ON_CLASS =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[10px] bg-sz-warning-bg px-2.5 py-[3px] text-[11px] font-medium text-sz-warning-text";

/** `.relock` — 자동 잠김 칩(정상 만료라 중립) */
export const RELOCK_CLASS =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[10px] bg-sz-n-100 px-2.5 py-[3px] text-[11px] font-medium text-sz-n-600";

/** `.inp` — 32px · 13px */
export const INPUT_CLASS =
  "h-8 rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50 disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-500";

/** `.msel` — 모달 셀렉트 */
export const MODAL_SELECT_CLASS =
  "h-8 w-full cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-8 text-[13px] text-sz-n-900 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50 disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-400";

/** `.mta` — 모달 텍스트 영역 */
export const MODAL_TEXTAREA_CLASS =
  "min-h-[64px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-2.5 pb-1.5 pt-[7px] text-[13px] leading-[1.6] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** `.memo` — 메모 입력란(12px) */
export const MEMO_TEXTAREA_CLASS =
  "min-h-[76px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-2 text-[12px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** `.flink` — 밑줄 링크 */
export const FLINK_CLASS =
  "cursor-pointer text-sz-n-600 underline underline-offset-2 hover:text-sz-accent-600";

/** `.t-sub` */
export const T_SUB_CLASS = "text-[11px] text-sz-n-500";

/** `.st-hint` */
export const ST_HINT_CLASS = "mt-2.5 text-[11px] leading-[1.55] text-sz-n-500";

/** `.mwarn` — 모달 경고(위험) · `.mwarn.info` — 안내(정보) */
export const MWARN_DANGER_CLASS =
  "mt-4 flex gap-2 rounded-[6px] bg-sz-danger-bg px-3 py-2.5 text-[11px] font-medium leading-[1.6] text-sz-danger-text";
export const MWARN_INFO_CLASS =
  "mt-4 flex gap-2 rounded-[6px] bg-sz-info-bg px-3 py-2.5 text-[11px] font-medium leading-[1.6] text-sz-info-text";

/** `.mhint` */
export const MHINT_CLASS = "mt-1.5 text-[11px] text-sz-n-500";

/** `.mlabel` — 모달 필드 라벨(첫 라벨은 위 여백 0) */
export const MLABEL_CLASS =
  "mb-1 mt-4 block text-[12px] font-medium text-sz-n-600 first:mt-0";
