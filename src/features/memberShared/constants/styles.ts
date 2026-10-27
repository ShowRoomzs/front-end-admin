/*
  시안 ui-admin-14 · 15 · 16 · 18의 원자 클래스 — 회원 관리 화면 안에서만 쓴다.

  공용 `Button`(shadcn)은 14px 베이스라 12px 라벨로 짜인 어드민 시안과 어긋난다(계약 관리 `shared/styles.ts`와 같은 판단).
  값은 시안 `<style>` 블록에서 그대로 옮겼다.
*/

/** `.btn` — 32px · 12px/500 · 좌우 14px */
const BTN_BASE =
  "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] px-3.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed";

export const BTN_PRIMARY = `${BTN_BASE} bg-sz-accent-500 text-white hover:bg-sz-accent-600 disabled:border disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400`;
export const BTN_SECONDARY = `${BTN_BASE} border border-sz-n-300 bg-white text-sz-n-900 hover:bg-sz-n-100 disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400`;
/** `.btn-danger-o` — 흰 배경 + 중립 테두리 + 위험색 글자(레일의 정지 · 반려) */
export const BTN_DANGER_OUTLINE = `${BTN_BASE} border border-sz-n-300 bg-white text-sz-danger-text hover:border-sz-n-400 hover:bg-sz-danger-bg disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400`;
/** `.btn-danger` — 꽉 찬 위험색은 모달의 최종 실행 버튼에만 쓴다 */
export const BTN_DANGER = `${BTN_BASE} bg-sz-danger-text text-white hover:bg-[#8f2828] disabled:border disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400`;
/** `.card-h .btn` — 카드 머리 안 작은 버튼(메모 기입) */
export const BTN_CARD_HEAD =
  "inline-flex h-[26px] cursor-pointer items-center whitespace-nowrap rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[11px] font-medium text-sz-n-900 hover:bg-sz-n-100";

/** `.inp` — 32px · 13px */
export const INPUT_CLASS =
  "h-8 rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50 disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-500";

/** `.sel-sm` — 툴바 「20건씩」 */
export const SELECT_SM_CLASS =
  "h-7 cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white bg-no-repeat py-0 pl-2.5 pr-[26px] text-[12px] text-sz-n-700 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** `.msel` — 모달 셀렉트 */
export const MODAL_SELECT_CLASS =
  "h-8 w-full cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white bg-no-repeat py-0 pl-2.5 pr-8 text-[13px] text-sz-n-900 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** `.mta` — 모달 텍스트 영역 */
export const MODAL_TEXTAREA_CLASS =
  "min-h-[64px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-2.5 pb-1.5 pt-[7px] text-[13px] leading-[1.6] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** 셀렉트 갈매기표(시안 data URI 그대로) */
export const SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235B5F68' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundPosition: "right 10px center",
} as const;

/** `.flink` — 값 옆 밑줄 링크 */
export const FLINK_CLASS =
  "cursor-pointer text-sz-n-600 underline underline-offset-2 hover:text-sz-accent-600";

/** `.elink` — 외부 이동(↗) */
export const ELINK_CLASS =
  "inline-flex items-center gap-1 text-sz-accent-600 hover:underline";

/** `.hmore` — 「전체 N건 보기」 */
export const HMORE_CLASS =
  "mt-1 block w-full cursor-pointer border-t border-sz-n-100 pb-0.5 pt-2 text-left text-[11px] text-sz-accent-600";

/** `.st-hint` */
export const ST_HINT_CLASS = "mt-2.5 text-[11px] leading-[1.55] text-sz-n-500";

/** `.t-sub` */
export const T_SUB_CLASS = "text-[11px] text-sz-n-500";

/** `.t-main` — 행 호버 때 인디고로 바뀐다(행에 `group`이 붙어 있어야 한다) */
export const T_MAIN_CLASS =
  "text-[13px] font-medium text-sz-n-900 group-hover:text-sz-accent-600";
