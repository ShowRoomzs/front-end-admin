import type {
  DeviceType,
  PendingChipTarget,
} from "@/features/consumer/types/consumerDetail";

/** 목록 경로 — 상세 경로는 `${CONSUMER_LIST_PATH}/:userId` */
export const CONSUMER_LIST_PATH = "/member/list";

export const consumerDetailPath = (userId: number) =>
  `${CONSUMER_LIST_PATH}/${userId}`;

/** 관리자 메모 한 항목 최대 글자 — 서버 `MemoRequest` @Size(max = 300) */
export const MEMO_MAX_LENGTH = 300;

/**
 * 메모 수정 · 삭제 창 — 작성자 본인 · 작성 후 24시간(서버가 `editable`로 판정한다).
 * 화면은 잠긴 이유 문구를 고르는 데만 쓴다.
 */
export const MEMO_EDIT_WINDOW_HOURS = 24;

/** 정지 상세 사유 최대 글자 — 서버 `SuspendRequest` @Size(max = 500) */
export const SUSPEND_DETAIL_MAX_LENGTH = 500;

/**
 * 마스킹 해제 세션 길이(초) — **서버 정책값이 우선**이다(`unmask.remainingSeconds` · 10분 고정 만료).
 * 응답에 남은 초가 없을 때만 이 값으로 센다.
 */
export const UNMASK_SESSION_FALLBACK_SECONDS = 600;

/** 최근 로그인 기기 표기 — 시안 「iOS 앱」 · 「Android 앱」. 판별 불가는 붙이지 않는다 */
export const DEVICE_LABELS: Record<DeviceType, string | null> = {
  IPHONE: "iOS 앱",
  ANDROID: "Android 앱",
  DESKTOP_CHROME: "PC (크롬)",
  DESKTOP_EDGE: "PC (엣지)",
  UNKNOWN: null,
};

/**
 * 진행 중 칩 · 최근 문의가 가리키는 어드민 목록 경로(menu.ts와 같은 값).
 * 쿼리는 서버가 `links[].query`로 통째로 내려 준다(탭 · 상태 · userId) — 화면이 조립하지 않는다.
 */
export const PENDING_TARGET_PATHS: Record<PendingChipTarget, string> = {
  INQUIRIES: "/support/inquiry",
  PRODUCT_INQUIRIES: "/support/product-inquiry",
  ORDERS: "/order/list",
  CLAIMS: "/order/claim",
  REFUNDS: "/order/refund",
};

/** 열린 문의가 두 목록으로 갈릴 때 고르는 메뉴의 이름 — 사이드바 메뉴 이름 그대로 */
export const PENDING_TARGET_LABELS: Record<PendingChipTarget, string> = {
  INQUIRIES: "1:1 문의",
  PRODUCT_INQUIRIES: "상품 문의 모니터링",
  ORDERS: "주문 조회",
  CLAIMS: "반품·교환",
  REFUNDS: "환불 관리",
};

/** 진행 중 칩 종류 수 — 다섯 개가 다 켜지면 「그 외 0건」을 붙이지 않는다 */
export const PENDING_CHIP_KINDS = 5;

/*
  【잠정】 문구 — 결정 노트 v0.2 기-01 · 02 · 03(변호사 확인 뒤 바뀔 수 있다).
  문구와 조건을 이 한 곳에 모은다. 숫자(영업일)는 서버 값(`suspensionTerm` · `term`)을 쓰고
  여기에 하드코딩하지 않는다.
*/
export const PROVISIONAL = {
  /** 기-01 — 제재 명칭. 배지 · 탭은 칸이 좁아 「정지」 */
  suspendTitle: "계정 이용 정지",
  /** 기-02 — 정지 기간 입력 옆 안내 */
  autoReleaseHint: "종료일 다음 날 00:00",
  autoReleaseStrong: "자동 해제",
  /** 기-02 — 소명 검토 기한이 아직 정해지지 않았을 때 */
  policyPending: "[정책값 미정]",
  /** 기-01 · 03 — 정지 모달 경고(정지 = 로그인 허용 + 기능 제한 · 정지 중 탈퇴 가능) */
  suspendWarning: {
    lead: "정지하면 소비자는 ",
    blocked:
      "로그인은 되지만 새 구매 · 상품 문의 · 팔로우 · 좋아요 · 신고가 막힙니다",
    mid: ". 진행 중인 주문의 ",
    allowed: "배송 조회 · 취소 · 구매확정 · 반품·교환",
    mid2: "은 그대로 할 수 있고, 소명은 ",
    appeal: "1:1 문의",
    tail: "로 받습니다. 사유는 알림과 앱 상단 배너로 안내되며 처리 이력에 영구 기록됩니다. 정지 중에도 ",
    withdrawal: "탈퇴는 그대로",
    end: " 할 수 있습니다(셀프서비스).",
  },
} as const;
