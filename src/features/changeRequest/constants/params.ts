import type {
  ChangeRequestParams,
  ChangeRequestStatusCounts,
  ChangeRequestType,
} from "@/features/changeRequest/services/changeRequestService";

export const CHANGE_REQUEST_INITIAL_PARAMS: ChangeRequestParams = {
  status: "PENDING",
  page: 1,
  size: 20,
  // API가 지원하는 검색은 브랜드명 단일 검색뿐이다
  keyword: "",
};

export const CHANGE_REQUEST_EMPTY_COUNTS: ChangeRequestStatusCounts = {
  pending: 0,
  approved: 0,
  rejected: 0,
  canceled: 0,
  all: 0,
};

export const CHANGE_REQUEST_TYPE_LABELS: Record<ChangeRequestType, string> = {
  BUSINESS_INFO: "사업자 정보",
  SETTLEMENT_ACCOUNT: "정산 계좌",
};

/** 미리보기에서 라이트박스로 띄울 수 있는 확장자. 그 외(PDF 등)는 원본 열기로 넘긴다 */
export const PREVIEWABLE_IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
];
