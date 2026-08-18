import type { BaseParams, PageInfo } from "@/common/types";

/**
 * 답변 축 — 브랜드가 답했는지 여부. 노출 축과 **별개 값**이다.
 *
 * 삭제 요청 중에도 이 값이 보존돼야 반려 시 요청 직전 상태로 정확히 되돌아간다.
 * 두 축을 하나로 합쳐 다루지 말 것.
 */
export type ProductInquiryAnswerStatus = "WAITING" | "ANSWERED";

/** 노출 축 — 소비자 화면에 보이는지 여부 */
export type ProductInquiryExposureStatus =
  "NORMAL" | "DELETE_REQUESTED" | "DELETED";

/** 목록 탭 — 두 축을 운영자 관점 한 줄로 합친 값 */
export type ProductInquiryStatusFilter =
  "ALL" | "WAITING" | "ANSWERED" | "DELETE_REQUESTED" | "DELETED";

/**
 * 문의 유형 코드.
 *
 * §17의 CS 분류 5종과 **의도적으로 다른 목록**이다 — 상품 문의는 상품 상세에서 그
 * 상품을 묻는 것이고, 1:1은 주문·결제·계정 등 서비스 전반이다. FAQ 카테고리와
 * 맞출 대상도 §17 쪽이라, 두 목록을 통일하려 하지 말 것.
 */
export type ProductInquiryTypeCode = string;

export interface ProductInquiryTypeOption {
  code: ProductInquiryTypeCode;
  label: string;
}

export interface ProductInquiryListItem {
  inquiryId: number;
  type: ProductInquiryTypeCode;
  typeName: string;
  /** 질문 — 목록은 한 줄 말줄임 */
  content: string;
  productName: string;
  brandName: string;
  createdAt: string;
  /** 미답변이면 null */
  answeredAt: string | null;
  status: ProductInquiryAnswerStatus;
  exposureStatus: ProductInquiryExposureStatus;
  /** 두 축을 합친 표시 문구 — 배지 텍스트는 이 값을 그대로 쓴다 */
  statusLabel: string;
}

export interface ProductInquiryStatusCounts {
  all: number;
  waiting: number;
  answered: number;
  deleteRequested: number;
  deleted: number;
}

export interface ProductInquiryListResponse {
  content: Array<ProductInquiryListItem>;
  pageInfo: PageInfo;
  statusCounts: ProductInquiryStatusCounts;
  /**
   * 전체 삭제 요청 건수 — **탭·필터와 무관한 값**이다.
   *
   * `statusCounts.deleteRequested`는 현재 유형·검색어를 반영한 값이라 서로 다르다.
   * 툴바의 `삭제 요청 N건`은 "지금 내가 처리해야 할 총량"이라 이쪽을 쓴다.
   */
  deleteRequestedCount: number;
}

export interface ProductInquiryListParams extends BaseParams {
  status: ProductInquiryStatusFilter;
  /** null = 전체 유형 */
  type: ProductInquiryTypeCode | null;
  keyword: string;
}

export type ProductInquiryDetailParams = Omit<
  ProductInquiryListParams,
  "page" | "size"
>;

/** 브랜드가 낸 삭제 요청 — 요청이 있는 건에만 존재한다 */
export interface ProductInquiryDeleteRequest {
  reason: string;
  reasonName: string;
  detail: string | null;
  requesterBrandName: string;
  requestedAt: string;
  /** 운영자 검토 대기 중 */
  underReview: boolean;
  /** 반려됨 — 문의는 게시 유지, 상태는 요청 직전으로 복귀했다 */
  rejected: boolean;
  rejectReasonType: string | null;
  rejectReasonName: string | null;
  rejectReasonDetail: string | null;
  rejectedAt: string | null;
  rejectedByName: string | null;
}

/** 우측 처리 패널 메타 — 표시 항목만 상태별로 달라지고 레이아웃은 같다 */
export interface ProductInquiryProcessingMeta {
  createdAt: string;
  answeredAt: string | null;
  answererName: string | null;
  deleteRequestedAt: string | null;
  deleteRequesterName: string | null;
  deletedAt: string | null;
  processedByName: string | null;
  /** 내부 기록용 — 작성자에게 통지하지 않는다 */
  deleteReasonName: string | null;
  deleteReasonDetail: string | null;
}

export type ProductInquiryHistoryEventType =
  | "REGISTERED"
  | "ANSWERED"
  | "ANSWER_MODIFIED"
  | "DELETE_REQUESTED"
  | "DELETE_REJECTED"
  | "DELETE_EXECUTED";

export interface ProductInquiryHistoryItem {
  event: ProductInquiryHistoryEventType;
  /** 어드민 화면 전용 라벨 — 서버가 내려주므로 프론트에 문구 표를 두지 않는다 */
  label: string;
  detail: string | null;
  occurredAt: string;
  actorType: "CONSUMER" | "BRAND" | "OPERATOR";
  /** `역할(이름)` 형태 */
  actorLabel: string;
}

export interface ProductInquiryDetail {
  inquiryId: number;
  inquiryNumber: string;
  type: ProductInquiryTypeCode;
  typeName: string;
  productId: number;
  productName: string;
  marketId: number;
  brandName: string;
  userId: number;
  /** 실명 우선, 없으면 닉네임. 마스킹하지 않는다 */
  writerName: string;
  secret: boolean;
  visibilityName: string;
  createdAt: string;
  content: string;
  /** 최대 3장 */
  imageUrls: Array<string> | null;
  /** 미답변이면 null — 그때는 브랜드 답변 카드가 비어 있다 */
  answerContent: string | null;
  answeredAt: string | null;
  answerModifiedAt: string | null;
  answererName: string | null;
  status: ProductInquiryAnswerStatus;
  exposureStatus: ProductInquiryExposureStatus;
  statusLabel: string;
  /** 요청이 없으면 null */
  deleteRequest: ProductInquiryDeleteRequest | null;
  processingMeta: ProductInquiryProcessingMeta;
  history: Array<ProductInquiryHistoryItem>;
  /** 삭제된 건이 아니면 언제나 true — 요청 유무와 무관하다 */
  canExecuteDelete: boolean;
  /** 삭제 요청이 있을 때만 true(§18-4) */
  canReject: boolean;
  prevInquiryId: number | null;
  nextInquiryId: number | null;
}

/** 삭제 집행 — 사유는 내부 기록용이며 작성자·브랜드에 통지하지 않는다 */
export interface ProductInquiryDeleteExecuteRequest {
  reason: string;
  /** 사유가 ETC면 필수 */
  detail?: string;
}

/** 삭제 요청 반려 — 사유는 **요청 브랜드에 전달된다** */
export interface ProductInquiryRejectRequest {
  reason: string;
  /** 사유가 ETC면 필수 */
  detail?: string;
}
