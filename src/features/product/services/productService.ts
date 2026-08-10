import { apiInstance } from "@/common/lib/apiInstance";
import type { BaseParams, PageInfo } from "@/common/types";

/**
 * 진열 상태 — 백엔드 ProductDisplayStatus와 1:1.
 * "미진열"과 "미진열(요청)"은 **같은 상태값이 아니다** — 백엔드가 HIDDEN/HIDE_REQUEST로
 * 값 자체를 나눠서 내려준다(기능요구사항 §11-2는 "같은 상태값"이라 기술하지만,
 * 실제 API는 별개 enum 값이므로 여기서는 API를 따른다).
 */
export type ProductDisplayStatus =
  | "DISPLAY"
  | "HIDDEN"
  | "PENDING_REVIEW"
  | "HIDE_REQUEST";

/** 공구 상태 — 백엔드 ProductGroupBuyStatus와 1:1 */
export type ProductGroupBuyStatus =
  | "PREPARING"
  | "READY"
  | "IN_PROGRESS"
  | "NOT_CONNECTED";

/** 미진열 사유 — 백엔드 ProductHideReasonType과 1:1 */
export type ProductHideReasonType =
  | "PRODUCT_NOTICE_ERROR"
  | "AD_DISPLAY_VIOLATION"
  | "BRAND_REQUEST"
  | "OTHER";

/** 정렬 — 백엔드 ProductListSortType과 1:1 */
export type ProductListSortType = "CREATED_AT" | "MODIFIED_AT" | "STOCK_ASC";

/**
 * 목록 검색 조건 — 백엔드 AdminProductSearchCondition + PagingRequest.
 *
 * 진열·공구 상태는 각각 **단일값**이다. 화면은 체크박스지만 한 축에 하나만 켜진다 —
 * 서버·화면 모두 단일선택으로 합의된 상태다(ProductStatusFilter 주석 참고).
 */
export interface AdminProductParams extends BaseParams {
  displayStatus: ProductDisplayStatus | null;
  groupBuyStatus: ProductGroupBuyStatus | null;
  /** 상품명·상품번호·브랜드명 부분 일치 */
  keyword: string;
  sortType: ProductListSortType;
}

/** 진열 상태별 건수 — 검색어·공구상태는 반영, 진열상태 필터는 미반영 */
export interface DisplayStatusCounts {
  all: number;
  display: number;
  hidden: number;
  pendingReview: number;
  hideRequest: number;
}

/** 공구 상태별 건수 — 검색어·진열상태는 반영, 공구상태 필터는 미반영 */
export interface GroupBuyStatusCounts {
  all: number;
  preparing: number;
  ready: number;
  inProgress: number;
  notConnected: number;
}

/** 목록 행 — 백엔드 AdminProductDto.ProductListItem과 1:1 */
export interface AdminProductListItem {
  productId: number;
  productNumber: string;
  sellerProductCode: string | null;
  /** 마켓(브랜드)명 */
  marketName: string;
  thumbnailUrl: string | null;
  name: string;
  regularPrice: number;
  createdAt: string;
  modifiedAt: string | null;
  displayStatus: ProductDisplayStatus;
  groupBuyStatus: ProductGroupBuyStatus;
  /** 옵션 재고 합계. 0이면 품절 배지 */
  stock: number | null;
}

export interface AdminProductListResponse {
  content: Array<AdminProductListItem>;
  pageInfo: PageInfo;
  displayStatusCounts: DisplayStatusCounts;
  groupBuyStatusCounts: GroupBuyStatusCounts;
}

export type ProductProcessingHistoryType =
  | "PRODUCT_CREATED"
  | "PRODUCT_INFO_UPDATED"
  | "STOCK_UPDATED"
  | "HIDDEN"
  | "REDISPLAYED"
  | "HIDE_REQUESTED"
  | "PENDING_REVIEW";

/** 처리 이력의 미진열 사유(사유 + 상세 묶음) */
export interface HideReason {
  reasonType: ProductHideReasonType;
  reasonDescription: string;
  detail: string | null;
}

/**
 * 처리 이력 항목 — 백엔드 ProductProcessingHistoryDto.HistoryItem과 1:1.
 * `title`은 서버가 historyType.description으로 채워 내려주므로 프론트에서 라벨을 만들지 않는다.
 */
export interface ProductHistoryItem {
  historyId: number;
  historyType: ProductProcessingHistoryType;
  title: string;
  previousDisplayStatus: ProductDisplayStatus | null;
  newDisplayStatus: ProductDisplayStatus | null;
  hideReason: HideReason | null;
  stockQuantity: number | null;
  /** 미진열 처리는 운영자 이메일, 그 외 어드민 처리는 "이름 운영자" */
  processorName: string | null;
  createdAt: string;
}

/** 최근 미진열 정보 — displayStatus=HIDDEN일 때만 내려온다 */
export interface LatestHideInfo {
  hideReasonType: ProductHideReasonType;
  hideReasonDescription: string;
  hideDetail: string | null;
  hiddenAt: string;
  processorName: string | null;
}

export interface ProductOptionInfo {
  optionId: number;
  name: string;
  /** 추가 가격 */
  price: number;
}

export interface ProductOptionGroupInfo {
  optionGroupId: number;
  name: string;
  options: Array<ProductOptionInfo>;
}

/** 옵션 조합(SKU) */
export interface ProductVariantInfo {
  variantId: number;
  /** 조합명 (예: "S, Black") */
  name: string;
  /** 옵션가가 포함된 판매가 */
  regularPrice: number;
  stock: number;
  isRepresentative: boolean;
  optionIds: Array<number>;
}

/**
 * 상품정보제공고시 11필드 — 백엔드는 `productNotice`를 **JSON 문자열**로 내려준다.
 * 파싱은 parseProductNotice()를 쓴다.
 */
export interface ProductNotice {
  capacityWeight?: string;
  mainSpecs?: string;
  expirationPeriod?: string;
  usageMethod?: string;
  manufacturerSeller?: string;
  origin?: string;
  ingredients?: string;
  functionalCosmeticApproval?: string;
  precautions?: string;
  qualityAssurance?: string;
  customerServicePhone?: string;
}

/**
 * 상세 — 백엔드 seller ProductDto.ProductDetailResponse와 1:1.
 * 어드민 상세는 셀러와 **같은 DTO**를 재사용한다(AdminProductController.getProductById).
 */
export interface AdminProductDetail {
  productId: number;
  productNumber: string;
  marketId: number;
  marketName: string;
  categoryId: number;
  categoryName: string;
  name: string;
  sellerProductCode: string | null;
  representativeImageUrl: string | null;
  coverImageUrls: Array<string> | null;
  regularPrice: number;
  displayStatus: ProductDisplayStatus;
  groupBuyStatus: ProductGroupBuyStatus;
  latestHideInfo: LatestHideInfo | null;
  isRecommended: boolean;
  /** JSON 문자열 — parseProductNotice()로 파싱한다 */
  productNotice: string | null;
  /** HTML */
  description: string | null;
  createdAt: string;
  optionGroups: Array<ProductOptionGroupInfo> | null;
  variants: Array<ProductVariantInfo> | null;
  processingHistory: Array<ProductHistoryItem> | null;
}

/** 진열 상태 변경 요청 — HIDDEN일 때 hideReasonType 필수 */
export interface UpdateDisplayStatusData {
  displayStatus: Extract<ProductDisplayStatus, "DISPLAY" | "HIDDEN">;
  hideReasonType?: ProductHideReasonType;
  hideDetail?: string;
}

/**
 * productNotice JSON 문자열을 객체로 판다.
 * 서버가 빈 값·깨진 JSON을 줄 수 있어 실패 시 빈 객체로 떨어뜨린다(화면은 필드별 "—"로 표시).
 */
export function parseProductNotice(raw: string | null): ProductNotice {
  if (!raw) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as ProductNotice;
    }
    return {};
  } catch {
    return {};
  }
}

export const productService = {
  getProductList: async (params: AdminProductParams) => {
    const { data: response } = await apiInstance.get<AdminProductListResponse>(
      "/admin/products",
      { params }
    );

    return response;
  },
  getProductDetail: async (productId: number) => {
    const { data: response } = await apiInstance.get<AdminProductDetail>(
      `/admin/products/${productId}`
    );

    return response;
  },
  /** 미진열 처리(HIDDEN) / 다시 진열(DISPLAY) */
  updateDisplayStatus: async (
    productId: number,
    data: UpdateDisplayStatusData
  ) => {
    const { data: response } = await apiInstance.patch(
      `/admin/products/${productId}/display-status`,
      data
    );

    return response;
  },
};
