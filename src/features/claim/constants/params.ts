import type {
  ClaimKind,
  ClaimListParams,
  ClaimParty,
  ClaimSort,
  ClaimTab,
} from "@/features/claim/types";

export const CLAIM_LIST_PATH = "/order/claim";

/** 탭 7종 — 파트너 11-claims와 같은 탭·같은 순서. 반품·교환은 탭을 나누지 않고 유형 열로 가른다 */
export const CLAIM_TABS: Array<{ value: ClaimTab; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "PICKUP_WAIT", label: "회수 대기" },
  { value: "IN_TRANSIT", label: "회수 중" },
  { value: "INSPECTION", label: "입고·검수" },
  { value: "RESHIP", label: "재발송" },
  { value: "REJECT_HOLD", label: "반려 보류" },
  { value: "DONE", label: "완료" },
];

export const CLAIM_KIND_OPTIONS: Array<{
  value: "" | ClaimKind;
  label: string;
}> = [
  { value: "", label: "유형 전체" },
  { value: "RETURN", label: "반품" },
  { value: "EXCHANGE", label: "교환" },
];

export const CLAIM_KIND_LABEL: Record<ClaimKind, string> = {
  RETURN: "반품",
  EXCHANGE: "교환",
};

export const CLAIM_PARTY_LABEL: Record<ClaimParty, string> = {
  CONSUMER: "소비자",
  BRAND: "브랜드",
};

export const CLAIM_SORT_OPTIONS: Array<{ value: ClaimSort; label: string }> = [
  { value: "CREATED_DESC", label: "신청일시 최신순" },
  { value: "ELAPSED_DESC", label: "경과 오래된순" },
];

export const CLAIM_PAGE_SIZES = [20, 50];

export const CLAIM_INITIAL_PARAMS: ClaimListParams = {
  tab: "ALL",
  kind: "",
  keyword: "",
  sort: "CREATED_DESC",
  page: 1,
  size: 20,
};

/** 탭 값 → 라벨 — 상단 줄 「입고·검수 2건」에 쓴다 */
export const CLAIM_TAB_LABEL: Record<ClaimTab, string> = Object.fromEntries(
  CLAIM_TABS.map((tab) => [tab.value, tab.label])
) as Record<ClaimTab, string>;

/** 주문 조회 · 소통 스레드 — 해당 화면이 아직 상세 경로를 받지 않아 목록으로 보낸다 */
export const ORDER_LIST_PATH = "/order/list";
export const THREAD_PATH = "/monitoring/threads";

export const SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235B5F68' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 9px center",
} as const;

/** 시안 `.msel` — 모달 안 셀렉트는 우측 여백이 10px */
export const MODAL_SELECT_CHEVRON_STYLE = {
  ...SELECT_CHEVRON_STYLE,
  backgroundPosition: "right 10px center",
} as const;
