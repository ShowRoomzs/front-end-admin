import type {
  AdminContractListParams,
  AdminContractQueue,
  AdminContractSort,
  AdminContractTab,
  ContractStatus,
} from "@/features/contract/types";

export const CONTRACT_LIST_PATH = "/contract";

/**
 * 탭 6종 — 작성중·검토 반려는 운영자 조치 대상이 아니라 탭이 없다.
 * rev.9 기-05: 「체결 처리 대기」→「공구 생성 대기」, 「체결완료」→「계약 성립」(서버 라벨과 다르다 — `STATUS_LABEL_OVERRIDE`).
 * 해지(TERMINATED)는 서버가 종료 탭에 센다.
 */
export const CONTRACT_TABS: Array<{ value: AdminContractTab; label: string }> =
  [
    { value: "ALL", label: "전체" },
    { value: "REVIEW_PENDING", label: "검토 대기" },
    { value: "SIGNING", label: "서명 진행중" },
    { value: "CONCLUSION_PENDING", label: "공구 생성 대기" },
    { value: "CONCLUDED", label: "계약 성립" },
    { value: "CLOSED", label: "종료" },
  ];

/**
 * 조치 큐 — 운영자는 처리할 것을 찾으러 온다(탭보다 위).
 * 시안 rev.9는 3개(검토 대기 · 공구 생성 대기 · 만료 확인)다. 「재발송 요청」은 rev.8 ②로 뺐다(20a 운영팀 채널 카드).
 * 「해지 요청」은 시안에 없지만 서버가 큐(`TERMINATION`)로 세고, 파트너가 넣은 해지 요청이 이 화면에 들어올
 * 다른 입구가 없어 4번째로 둔다(기획 확인 필요 · 문구 신규).
 */
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
    label: "공구 생성 대기",
    description: "양측 서명 완료 · PDF 업로드",
  },
  {
    value: "EXPIRY",
    label: "만료 확인",
    description: "서명 기한 경과 · 수동 종결",
  },
  {
    value: "TERMINATION",
    label: "해지 요청",
    description: "계약 성립 후 공구 오픈 전 · 상대방 동의 확인",
  },
];

/** 화면 · GNB 배지가 합산하는 큐 — `RESEND`는 서버가 세도 빼고 센다 */
export const CONTRACT_BADGE_QUEUES: Array<AdminContractQueue> =
  CONTRACT_QUEUES.map((queue) => queue.value);

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

/** 공구 상태 라벨 — 서버 `GroupBuyStatus`(해지는 1021 기-05 신설) */
export const GROUP_BUY_STATUS_LABEL: Record<string, string> = {
  PREPARING: "준비중",
  READY: "준비완료",
  IN_PROGRESS: "진행중",
  SUSPENSION_SCHEDULED: "중단 예정",
  ENDED: "종료",
  SETTLED: "정산완료",
  SUSPENDED: "중단",
  TERMINATED: "해지",
};

/**
 * 계약 상태 표시 라벨 덮어쓰기(rev.9 기-05) — 서버 라벨 대신 시안 문구를 쓴다.
 * 개발 서버(10-21)는 `CONCLUSION_PENDING`을 아직 「체결 처리 대기」로, main도 `CONCLUDED`를 「체결완료」로 내린다.
 */
export const STATUS_LABEL_OVERRIDE: Partial<Record<ContractStatus, string>> = {
  CONCLUSION_PENDING: "공구 생성 대기",
  CONCLUDED: "계약 성립",
  TERMINATED: "해지",
};

/**
 * 서명 기한 기본값(기-07) — 공구 시작 N일 전 그날 23:55. 시안 C1 「기본값 = 공구 시작 3일 전 23:55」.
 * 【잠정】 · [정책값 미정] 표기가 없는 확정값이고 서버 설정키(`contract.signature-deadline-days-before-start`
 * · `-suggest-time`)와 같은 값이다.
 */
export const SIGNATURE_DEADLINE_DAYS_BEFORE_START = 3;
export const SIGNATURE_DEADLINE_SUGGEST_TIME = { hour: "23", minute: "55" };

/** 해지 설명 최대 길이 — 서버 `TerminateRequest.explanation` @Size(max = 1000) */
export const TERMINATE_EXPLANATION_MAX = 1000;
