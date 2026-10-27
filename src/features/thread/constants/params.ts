import type {
  AdminChannelMemberStatus,
  AdminChannelTab,
  AdminIssueState,
  ThreadKind,
} from "@/features/thread/types";

/** 이 화면의 경로 — 다른 화면은 `?threadId=`만 붙여 들어온다(계약 · 공구 상세의 THREAD_PATH) */
export const THREAD_PAGE_PATH = "/monitoring/threads";

/*
  바깥 화면 링크 — 라우트(common/router/routes.tsx)에 있는 것만 건다.
  회원 상세는 브랜드 회원 관리(15) `/market/list/:marketId` · 인플루언서 회원 관리(18) `/showroom/list/:creatorId`
  — 채널의 `memberId`가 곧 마켓 id · 크리에이터 id다(서버 `AdminChannelMemberNumber`).
*/
export const CONTRACT_DETAIL_PATH = "/contract";
export const GROUP_BUY_DETAIL_PATH = "/group-buy";
export const SETTLEMENT_DETAIL_PATH = "/settlement/group-buy";
export const BRAND_MEMBER_DETAIL_PATH = "/market/list";
export const INFLUENCER_MEMBER_DETAIL_PATH = "/showroom/list";

/*
  시스템 카드의 고정 문구 — 서버는 사실만 싣고 문장은 FE가 kind · memberType으로 고른다
  (1021 설계서 1-6 · 2-3 · 1017 8-9). 【잠정】 기-01 · 02 · 06 · 21 — 변호사 확인 뒤 바뀔 수 있어 한 곳에 모은다.
*/
export const CARD_COPY = {
  /** A8 ② — 동의 확인 카드 제목(서버 제목은 「계약 취소 · 해지 동의 확인」 하나라 종류별로 나눈다) */
  consentTitle: {
    CANCEL: "계약 취소 동의 확인",
    TERMINATE: "계약 해지 동의 확인",
  },
  consentAction: { CANCEL: "계약 취소", TERMINATE: "계약 해지" },
  consentGuide: {
    CANCEL:
      "동의하시면 이 채널에 답해 주세요. 동의가 확인되면 운영팀이 계약을 취소하고 결과를 카드로 알려 드립니다.",
    TERMINATE:
      "동의하시면 이 채널에 답해 주세요. 동의가 확인되면 운영팀이 계약을 해지하고 결과를 카드로 알려 드립니다.",
  },
  /** A8 ① — 직권 중단 사전 통지 */
  suspensionGuide:
    "통지만으로 판매는 멈추지 않습니다. 의견이 있으면 이 채널에 남겨 주세요.",
  /** 해지 결과 — 생성된 공구가 함께 종결됐을 때 */
  terminatedGroupBuyClosed: "생성된 공구도 함께 종료됐습니다.",
  /** A7 — 계정 이용 정지 카드의 차단 · 계속 이용 범위(회원 유형별) */
  suspendedScope: {
    BRAND: {
      blocked: "새 상품 · 계약 · 공구 등록이 차단됩니다.",
      keep: "진행 중인 주문과 공구는 계속 처리",
    },
    CREATOR: {
      blocked: "공구 신청 · 계약 서명 · 새 게시물 등록이 차단됩니다.",
      keep: "진행 중인 공구는 계속 진행",
    },
  },
  /** 정산 줄 — 지급 정지 사유면 서버 설명(MessageCardResponse.SanctionDetail) 문장, 아니면 시안 A7 문장 */
  suspendedPayoutHeld:
    "정산은 확정까지 진행되며, 정지가 풀리면 다음 영업일에 지급됩니다.",
  suspendedPayoutKept: "정산은 예정대로 진행됩니다.",
  suspendedAppeal: "소명할 내용이 있으면 이 채널에 남겨 주세요.",
} as const;

/** 카드 · 정보 바의 당사자 표기 */
export const PARTY_LABEL = {
  SELLER: "브랜드",
  CREATOR: "인플루언서",
} as const;

/** 기본 진입은 이슈 스레드다(20a · 20b 「기본 진입」) */
export const DEFAULT_TAB: AdminChannelTab = "ISSUE";
export const DEFAULT_ISSUE_STATE: AdminIssueState = "OPEN";

export const CHANNEL_TABS: Array<{ value: AdminChannelTab; label: string }> = [
  { value: "ISSUE", label: "이슈 스레드" },
  { value: "BRAND", label: "브랜드" },
  { value: "INFLUENCER", label: "인플루언서" },
];

export const ISSUE_STATES: Array<{ value: AdminIssueState; label: string }> = [
  { value: "OPEN", label: "진행중" },
  { value: "CLOSED", label: "종결" },
];

/** 시안 `.cs-lh .inp` placeholder — 탭마다 검색 축이 다르다 */
export const SEARCH_PLACEHOLDER: Record<AdminChannelTab, string> = {
  ISSUE: "공구명 · 브랜드명 · 쇼룸명 검색",
  BRAND: "브랜드명 · 회원번호 · 담당자 검색",
  INFLUENCER: "쇼룸명 · 회원번호 검색",
};

export const TAB_ROLE_LABEL: Record<"BRAND" | "INFLUENCER", string> = {
  BRAND: "브랜드",
  INFLUENCER: "인플루언서",
};

export const MEMBER_STATUS_LABEL: Record<AdminChannelMemberStatus, string> = {
  ACTIVE: "활성",
  DORMANT: "휴면",
  SUSPENDED: "정지",
  WITHDRAWN: "탈퇴",
};

export const BUSINESS_TYPE_LABEL = {
  BUSINESS: "사업자",
  INDIVIDUAL: "개인",
} as const;

/** `ThreadKind` 설명 — 열린 이슈 스레드 칸의 보조 줄 */
export const THREAD_KIND_LABEL: Record<ThreadKind, string> = {
  CONNECTION: "연결",
  GROUP_BUY_ISSUE: "공구 이슈",
  GROUP_BUY_FULFILLMENT: "공구 이행 이견",
  SETTLEMENT_ADJUSTMENT: "정산 조정 협의",
};

/** 목록 · 메시지 페이지 크기 */
export const CHANNEL_PAGE_SIZE = 30;
export const MESSAGE_PAGE_SIZE = 30;

/*
  폴링 간격(ms) — 실시간 푸시가 없다(36 설계 0-2). 요약은 설계서 3-2 「30~60초」의 아래 끝,
  목록 · 메시지는 설계서가 정하지 않아 파트너센터 연결·소통과 같은 값을 쓴다.
*/
export const SUMMARY_POLL_INTERVAL = 30_000;
export const LIST_POLL_INTERVAL = 15_000;
export const MESSAGE_POLL_INTERVAL = 8_000;

/** 검색어 입력 → URL 반영 지연 */
export const KEYWORD_DEBOUNCE_MS = 300;

/*
  첨부 제한 — 개수 · 용량은 서로 독립인 두 축이다(서버가 전송 때 다시 검사한다).
  허용 확장자는 서버 AllowedAttachmentExtensions와 같은 목록(default-deny).
*/
export const ATTACHMENT_COUNT_MAX = 20;
export const ATTACHMENT_TOTAL_SIZE_MAX = 500 * 1024 * 1024;

export const ALLOWED_IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "heic",
  "heif",
];
export const ALLOWED_VIDEO_EXTENSIONS = [
  "mp4",
  "mov",
  "avi",
  "wmv",
  "mkv",
  "webm",
  "m4v",
];
export const ALLOWED_DOCUMENT_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "hwp",
  "hwpx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
  "rtf",
  "zip",
  "rar",
  "7z",
];
export const ALLOWED_EXTENSIONS = [
  ...ALLOWED_IMAGE_EXTENSIONS,
  ...ALLOWED_VIDEO_EXTENSIONS,
  ...ALLOWED_DOCUMENT_EXTENSIONS,
];

/** 이슈 정보 「유형」 — 종류가 하나라 FE 고정 문구(44 이슈 스레드 설계서 4-3) */
export const ISSUE_TYPE_LABEL = "정산 조정 요청";
export const ISSUE_TYPE_CODE = "[정산확인-조정요청]";
