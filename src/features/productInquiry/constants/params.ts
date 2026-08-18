import type {
  ProductInquiryListParams,
  ProductInquiryStatusCounts,
} from "@/features/productInquiry/types/productInquiry";

export const PRODUCT_INQUIRY_PAGE_SIZES = [20, 50, 100];

/** 기본 진입 탭은 전체다 — 이 화면은 처리 대기열이 아니라 모니터링 창구다(§18-2) */
export const PRODUCT_INQUIRY_INITIAL_PARAMS: ProductInquiryListParams = {
  page: 1,
  size: PRODUCT_INQUIRY_PAGE_SIZES[0],
  status: "ALL",
  type: null,
  keyword: "",
};

export const PRODUCT_INQUIRY_EMPTY_COUNTS: ProductInquiryStatusCounts = {
  all: 0,
  waiting: 0,
  answered: 0,
  deleteRequested: 0,
  deleted: 0,
};

/** `기타(직접 입력)` — 이 값이 선택되면 상세 사유가 선택 → 필수로 전환된다 */
export const REASON_ETC = "ETC";

export interface DecisionReasonOption {
  code: string;
  label: string;
}

/**
 * 삭제 사유 (§18-5) — 서버 `ProductInquiryAdminDeleteReason`과 1:1로 맞춘 목록이다.
 *
 * 사유 조회 엔드포인트가 없어 프론트가 들고 있다. 서버 enum이 바뀌면 여기도 함께
 * 고쳐야 하므로, 값을 추가할 때는 반드시 BE enum을 먼저 확인할 것.
 *
 * 브랜드가 삭제를 요청할 때 고르는 사유(`ProductInquiryDeleteReason`)와는 **다른
 * 목록**이다 — 이건 운영자가 집행 근거로 남기는 내부 기록이다.
 */
export const PRODUCT_INQUIRY_DELETE_REASONS: Array<DecisionReasonOption> = [
  { code: "ADVERTISEMENT", label: "광고·홍보성 게시물" },
  { code: "ABUSE", label: "비방·욕설" },
  { code: "PRIVACY_EXPOSURE", label: "개인정보 노출" },
  { code: REASON_ETC, label: "기타(직접 입력)" },
];

/**
 * 반려 사유 (§18-6) — 서버 `ProductInquiryRejectReason`과 1:1.
 *
 * 삭제 사유와 달리 이 값은 **요청 브랜드에 전달된다.** 요청자는 결과의 근거를 알아야
 * 다음 요청 기준을 잡을 수 있기 때문이다(§16-5와 같은 논리).
 */
export const PRODUCT_INQUIRY_REJECT_REASONS: Array<DecisionReasonOption> = [
  { code: "NOT_QUALIFYING", label: "삭제 기준에 해당하지 않음" },
  { code: "INSUFFICIENT_EVIDENCE", label: "근거 부족 — 사실관계 확인 불가" },
  { code: "NORMAL_INQUIRY", label: "정상적인 상품 문의" },
  { code: REASON_ETC, label: "기타(직접 입력)" },
];
