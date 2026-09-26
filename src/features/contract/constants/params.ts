import type {
  AdminContractListParams,
  AdminContractQueue,
  AdminContractSort,
  AdminContractTab,
} from "@/features/contract/types";

export const CONTRACT_LIST_PATH = "/contract";

/** 탭 6종 — 작성중·검토 반려는 운영자 조치 대상이 아니라 탭이 없다 */
export const CONTRACT_TABS: Array<{ value: AdminContractTab; label: string }> =
  [
    { value: "ALL", label: "전체" },
    { value: "REVIEW_PENDING", label: "검토 대기" },
    { value: "SIGNING", label: "서명 진행중" },
    { value: "CONCLUSION_PENDING", label: "체결 처리 대기" },
    { value: "CONCLUDED", label: "체결완료" },
    { value: "CLOSED", label: "종료" },
  ];

/** 조치 큐 4종 — 운영자는 처리할 것을 찾으러 온다(탭보다 위) */
export const CONTRACT_QUEUES: Array<{
  value: AdminContractQueue;
  label: string;
  description: string;
}> = [
  {
    value: "REVIEW",
    label: "검토 대기",
    description: "브랜드 제출 · 승인 또는 반려",
  },
  {
    value: "CONCLUSION",
    label: "체결 처리 대기",
    description: "양측 서명 완료 · PDF 업로드",
  },
  {
    value: "EXPIRY",
    label: "만료 확인",
    description: "서명 기한 경과 · 수동 종결",
  },
  {
    value: "RESEND",
    label: "재발송 요청",
    description: "소통 스레드 자동 등록",
  },
];

export const CONTRACT_SORT_OPTIONS: Array<{
  value: AdminContractSort;
  label: string;
}> = [
  { value: "REVIEW_REQUESTED_ASC", label: "검토 요청 오래된순" },
  { value: "CREATED_DESC", label: "최근 생성순" },
  { value: "START_AT_ASC", label: "공구 시작일순" },
];

export const CONTRACT_PAGE_SIZES = [20, 50];

export const CONTRACT_INITIAL_PARAMS: AdminContractListParams = {
  tab: "ALL",
  queue: "",
  keyword: "",
  // 방치 건이 먼저 — 기본 정렬은 검토 요청 오래된순
  sort: "REVIEW_REQUESTED_ASC",
  page: 1,
  size: 20,
};

/** GNB 배지·조치 큐 폴링 간격(ms) */
export const CONTRACT_SUMMARY_POLL_INTERVAL = 30_000;

export const SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235B5F68' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 9px center",
} as const;

/** 모두싸인 대시보드 — API 미도입이라 운영자가 직접 열어 확인한다 */
export const MODUSIGN_DASHBOARD_URL = "https://app.modusign.co.kr";

/** 어드민 소통 스레드 화면(모니터링) — 서버 `link`가 가리키는 경로가 FE에 없어 여기로 보낸다 */
export const THREAD_PATH = "/monitoring/threads";

/** 공구 상태 라벨 — 서버 `GroupBuyStatus` */
export const GROUP_BUY_STATUS_LABEL: Record<string, string> = {
  PREPARING: "준비중",
  READY: "준비완료",
  IN_PROGRESS: "진행중",
  SUSPENSION_SCHEDULED: "중단 예정",
  ENDED: "종료",
  SETTLED: "정산완료",
  SUSPENDED: "중단",
};
