import type {
  ProductDisplayStatus,
  ProductGroupBuyStatus,
  ProductHideReasonType,
  ProductListSortType,
} from "@/features/product/services/productService";

export const PRODUCT_DISPLAY_STATUS: Record<ProductDisplayStatus, string> = {
  DISPLAY: "진열",
  HIDDEN: "미진열",
  PENDING_REVIEW: "재검토 대기",
  HIDE_REQUEST: "미진열(요청)",
};

export const PRODUCT_GROUP_BUY_STATUS: Record<ProductGroupBuyStatus, string> = {
  PREPARING: "준비중",
  READY: "준비완료",
  IN_PROGRESS: "진행중",
  NOT_CONNECTED: "연결 없음",
};

/**
 * 미진열 사유 4종 — 백엔드 ProductHideReasonType 그대로.
 * 어드민 상품의 미진열 사유는 브랜드에게 **공개**된다(§11-11) —
 * 인플루언서 입점 심사의 반려 사유(비공개)와 정반대이므로 문구를 섞어 쓰면 안 된다.
 */
export const PRODUCT_HIDE_REASONS: Array<{
  value: ProductHideReasonType;
  label: string;
}> = [
  { value: "PRODUCT_NOTICE_ERROR", label: "상품 정보 제공 고시 오류" },
  { value: "AD_DISPLAY_VIOLATION", label: "표시·광고 위반 의심" },
  { value: "BRAND_REQUEST", label: "브랜드 요청" },
  { value: "OTHER", label: "기타(직접 입력)" },
];

/** 상세 화면에서 사유 코드를 한글로 표시하기 위한 맵 */
export const PRODUCT_HIDE_REASON_LABELS: Record<string, string> = {
  PRODUCT_NOTICE_ERROR: "상품 정보 제공 고시 오류",
  AD_DISPLAY_VIOLATION: "표시·광고 위반 의심",
  BRAND_REQUEST: "브랜드 요청",
  OTHER: "기타",
};

export const PRODUCT_SORT_OPTIONS: Array<{
  value: ProductListSortType;
  label: string;
}> = [
  { value: "CREATED_AT", label: "등록일순" },
  { value: "MODIFIED_AT", label: "수정일순" },
  { value: "STOCK_ASC", label: "재고 적은순" },
];

/** 상품정보제공고시 11필드 — 화장품 카테고리 고정, 표기 순서도 시안 그대로 */
export const PRODUCT_NOTICE_FIELDS: Array<{ key: string; label: string }> = [
  { key: "capacityWeight", label: "용량·중량" },
  { key: "mainSpecs", label: "제품 주요 사양" },
  { key: "expirationPeriod", label: "사용기한·개봉 후 사용기간" },
  { key: "usageMethod", label: "사용방법" },
  { key: "manufacturerSeller", label: "화장품제조업자·책임판매업자" },
  { key: "origin", label: "제조국" },
  { key: "ingredients", label: "전성분" },
  {
    key: "functionalCosmeticApproval",
    label: "기능성 화장품 심사필 여부",
  },
  { key: "precautions", label: "사용 시 주의사항" },
  { key: "qualityAssurance", label: "품질보증기준" },
  { key: "customerServicePhone", label: "소비자상담 전화번호" },
];
