import type {
  AdminGroupBuyListParams,
  AdminGroupBuyQueue,
  AdminGroupBuySort,
  AdminGroupBuyTab,
  EmergencySuspensionReason,
  PostHideReason,
  PostRejectReason,
  SuspensionReasonClause,
  SuspensionWithdrawReason,
} from "@/features/groupBuy/types";

export const GROUP_BUY_LIST_PATH = "/group-buy";

/** 어드민 소통 스레드(모니터링) — 계약 관리와 같은 목적지 */
export const THREAD_PATH = "/monitoring/threads";

/** 정산 관리 · 공구 정산 — 보류 해제·이체는 그 화면 소관이다 */
export const SETTLEMENT_PATH = "/settlement/group-buy";

export const GROUP_BUY_QUERY_KEYS = {
  LIST: "adminGroupBuyList",
  SUMMARY: "adminGroupBuySummary",
  DETAIL: "adminGroupBuyDetail",
  NOTICE_OPTIONS: "adminGroupBuyNoticeOptions",
} as const;

/**
 * 시안 A1 탭 6종 — 전체 · 조치 필요 · 진행중 · 종료 · 정산완료 · 중단.
 * 준비중·준비완료는 탭을 두지 않는다(시안) — 조치가 필요한 준비중(오픈 승인)은 조치 필요 탭이 잡는다.
 * 중단 예정은 진행중 탭 안에 배지로만 나타난다.
 */
export const GROUP_BUY_TABS: Array<{ value: AdminGroupBuyTab; label: string }> =
  [
    { value: "ALL", label: "전체" },
    { value: "ACTION_REQUIRED", label: "조치 필요" },
    { value: "IN_PROGRESS", label: "진행중" },
    { value: "ENDED", label: "종료" },
    { value: "SETTLED", label: "정산완료" },
    { value: "SUSPENDED", label: "중단" },
  ];

export const GROUP_BUY_SORT_OPTIONS: Array<{
  value: AdminGroupBuySort;
  label: string;
}> = [
  { value: "ACTION_REQUIRED_FIRST", label: "조치 필요 우선" },
  { value: "CREATED_DESC", label: "최근 등록순" },
  { value: "END_AT_ASC", label: "종료 임박순" },
];

export const GROUP_BUY_PAGE_SIZES = [20, 50];

export const GROUP_BUY_INITIAL_PARAMS: AdminGroupBuyListParams = {
  tab: "ALL",
  keyword: "",
  sort: "ACTION_REQUIRED_FIRST",
  page: 1,
  size: 20,
};

/** GNB 배지·조치 큐 폴링 간격 — 계약 관리와 같은 주기 */
export const GROUP_BUY_SUMMARY_POLL_INTERVAL = 30_000;

/** 조치 큐 라벨 — 툴바 요약 「오픈 승인 2 · 중단 요청 1 …」 */
export const QUEUE_LABEL: Record<AdminGroupBuyQueue, string> = {
  OPEN_REVIEW: "오픈 승인",
  SUSPEND_REQUEST: "중단 요청",
  EARLY_CLOSE_REQUEST: "조기 마감 요청",
  APPEAL_REVIEW: "소명 검토",
};

export const QUEUE_ORDER: Array<AdminGroupBuyQueue> = [
  "OPEN_REVIEW",
  "SUSPEND_REQUEST",
  "EARLY_CLOSE_REQUEST",
  "APPEAL_REVIEW",
];

/** 시안 M1 반려 사유 7종 — 서버 GroupBuyPostRejectReason */
export const REJECT_REASON_OPTIONS: Array<{
  value: PostRejectReason;
  label: string;
}> = [
  { value: "AD_EFFECT_ASSERTION", label: "표시광고법 위반 문구 — 효과 단정" },
  {
    value: "AD_MEDICAL_CLAIM",
    label: "표시광고법 위반 문구 — 의료적 효능 표현",
  },
  {
    value: "AD_SUPERLATIVE",
    label: "표시광고법 위반 문구 — 최저가·최상급 표현",
  },
  { value: "CONTRACT_PRODUCT_MISMATCH", label: "계약과 다른 상품 구성" },
  { value: "CONTRACT_PRICE_MISMATCH", label: "계약과 다른 가격 표기" },
  { value: "DISCLOSURE_DAMAGED", label: "대가관계 표시 훼손" },
  { value: "ETC", label: "기타(직접 입력)" },
];

/** 시안 M5 숨김 사유 7종 — 서버 GroupBuyPostHideReason */
export const HIDE_REASON_OPTIONS: Array<{
  value: PostHideReason;
  label: string;
}> = [
  { value: "AD_EFFECT_ASSERTION", label: "표시광고법 위반 문구 — 효과 단정" },
  {
    value: "AD_MEDICAL_CLAIM",
    label: "표시광고법 위반 문구 — 의료적 효능 표현",
  },
  {
    value: "AD_SUPERLATIVE",
    label: "표시광고법 위반 문구 — 최저가·최상급 표현",
  },
  { value: "DISCLOSURE_DAMAGED", label: "대가관계 표시 훼손" },
  { value: "CONTRACT_MISMATCH", label: "계약과 다른 상품·가격 기재" },
  { value: "FALSE_INFORMATION", label: "사실과 다른 정보" },
  { value: "ETC", label: "기타(직접 입력)" },
];

/** 시안 M6 직권 중단 사유 — 제17조① 1~4호(기타 없음) */
export const CLAUSE_OPTIONS: Array<{
  value: SuspensionReasonClause;
  label: string;
}> = [
  {
    value: "ART17_1_LAW",
    label: "1호 — 법령 위반 (화장품법 · 표시광고법 · 전자상거래법)",
  },
  {
    value: "ART17_2_IP_DEFECT",
    label: "2호 — 지식재산권 침해 또는 상품의 중대한 하자·위해성",
  },
  {
    value: "ART17_3_BREACH",
    label: "3호 — 게시물 무단 변경 · 공급불능 · 약관·계약서상 중대 의무 불이행",
  },
  {
    value: "ART17_4_DISPUTE",
    label: "4호 — 분쟁 심화로 거래 이행 불가 · 플랫폼 신용·명예 훼손",
  },
];

/** 시안 M4 긴급 사유 3종 — 제17조③(기타 없음) */
export const EMERGENCY_OPTIONS: Array<{
  value: EmergencySuspensionReason;
  label: string;
}> = [
  { value: "CONSUMER_HARM", label: "소비자 위해 방지" },
  { value: "AUTHORITY_ORDER", label: "행정·사법기관의 명령" },
  { value: "DAMAGE_SURGE", label: "피해 급증 우려" },
];

/** 시안 M7 철회 사유 — 서버 SuspensionWithdrawReason */
export const WITHDRAW_OPTIONS: Array<{
  value: SuspensionWithdrawReason;
  label: string;
}> = [
  { value: "RECTIFIED", label: "지적 사항이 시정 완료됨" },
  { value: "NOT_A_VIOLATION", label: "사실관계 오인 — 위반에 해당하지 않음" },
  { value: "NOT_BRAND_FAULT", label: "귀책이 브랜드에 없음" },
  { value: "ETC", label: "기타(직접 입력)" },
];

export const ISSUE_TYPE_OPTIONS = [
  { value: "CONTENT_FULFILLMENT", label: "콘텐츠 이행 문제" },
  { value: "TERMS_INTERPRETATION", label: "계약 조건 해석 이견" },
  { value: "SETTLEMENT_AMOUNT", label: "정산 금액 이견" },
  { value: "ETC", label: "기타" },
] as const;

/** 시안 `.sel-sm`/`.msel` — 선으로 그린 갈매기표 */
export const SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235B5F68' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 9px center",
};

export const MODAL_SELECT_CHEVRON_STYLE = {
  ...SELECT_CHEVRON_STYLE,
  backgroundPosition: "right 10px center",
};
