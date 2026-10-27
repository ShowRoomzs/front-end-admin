import type {
  ChangeRequestParams,
  ChangeRequestStatusCounts,
  ChangeRequesterType,
  ChangeRequestType,
} from "@/features/changeRequest/services/changeRequestService";

export const CHANGE_REQUEST_INITIAL_PARAMS: ChangeRequestParams = {
  status: "PENDING",
  page: 1,
  size: 20,
  // 서버가 브랜드명 · 쇼룸명을 함께 찾는다(rev.7) — 검색창 하나
  keyword: "",
};

export const CHANGE_REQUEST_EMPTY_COUNTS: ChangeRequestStatusCounts = {
  pending: 0,
  approved: 0,
  rejected: 0,
  canceled: 0,
  all: 0,
};

/**
 * 목록 「요청 유형」 배지 · 상세 제목 아래 줄의 짧은 라벨(시안 C1).
 * 서버 `typeLabel`은 「계좌 변경 (인플루언서)」처럼 요청자를 덧붙이지만, 목록은 첫 열에
 * 요청자 배지가 따로 있어 짧게 쓴다. 모르는 유형이 오면 서버 `typeLabel` → 코드 순으로 대신한다.
 */
export const CHANGE_REQUEST_TYPE_LABELS: Record<ChangeRequestType, string> = {
  BUSINESS_INFO: "사업자 정보",
  SETTLEMENT_ACCOUNT: "정산 계좌",
  TO_BUSINESS: "사업자 전환",
  TO_INDIVIDUAL: "비사업자 전환",
  CREATOR_ACCOUNT: "계좌 변경",
};

/** 상세 우측 「요청 유형」 행 — 인플루언서 계좌만 시안(C4b)이 요청자를 덧붙인다 */
export const CHANGE_REQUEST_TYPE_META_LABELS: Record<
  ChangeRequestType,
  string
> = {
  ...CHANGE_REQUEST_TYPE_LABELS,
  CREATOR_ACCOUNT: "계좌 변경 (인플루언서)",
};

/** 「○○ 요청」 — 상세 제목 아래 줄 · 승인/반려 모달 · 처리 토스트(C3 ~ C10) */
export const CHANGE_REQUEST_PHRASES: Record<ChangeRequestType, string> = {
  BUSINESS_INFO: "사업자 정보 변경 요청",
  SETTLEMENT_ACCOUNT: "정산 계좌 변경 요청",
  TO_BUSINESS: "사업자 전환 요청",
  TO_INDIVIDUAL: "비사업자 전환 요청",
  CREATOR_ACCOUNT: "계좌 변경 요청",
};

/** 목록 첫 열 요청자 배지 · 상세 제목 옆 칩(rev.7) */
export const CHANGE_REQUESTER_LABELS: Record<ChangeRequesterType, string> = {
  BRAND: "브랜드",
  CREATOR: "인플루언서",
};

/**
 * 제목 옆 [○○ 상세 ↗] 칩이 여는 회원 상세. 회원 관리 상세는 `/<목록>/:id`다
 * (브랜드 15 = `brandMember` · 인플루언서 18).
 */
export const CHANGE_REQUESTER_DETAIL_PATHS: Record<
  ChangeRequesterType,
  string
> = {
  BRAND: "/market/list",
  CREATOR: "/showroom/list",
};

/** 「승인하면」 카드 적용 시점 — 서버 `approvalImpact.appliesFrom` */
export const APPLIES_FROM_LABELS: Record<string, string> = {
  NEXT_SETTLEMENT: "다음 정산부터",
};

/** 미리보기에서 라이트박스로 띄울 수 있는 확장자. 그 외(PDF 등)는 원본 열기로 넘긴다 */
export const PREVIEWABLE_IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
];
