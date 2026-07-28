import { apiInstance } from "@/common/lib/apiInstance";
import type { BaseParams, PageInfo, PageResponse } from "@/common/types";
import type { SELLER_REGISTRATION_STATUS } from "@/features/seller/constants/params";

export type SellerRegistrationStatus =
  | keyof typeof SELLER_REGISTRATION_STATUS
  | null; // null은 전체 조회

/**
 * 목록 검색 조건 — 백엔드 AdminMarketDto.SearchCondition과 1:1.
 * 기간·검색타입 필터는 API에서 제거되어(PR #272) 브랜드명 단일 검색만 지원한다.
 */
export interface SellerRegistrationParams extends BaseParams {
  status: SellerRegistrationStatus;
  keyword: string;
}

/** 목록 행 — 백엔드 AdminMarketDto.ApplicationResponse와 1:1 */
export interface SellerRegistrationInfo {
  /** 신청서 ID — 상세 조회 키 */
  applicationId: number;
  /** 판매자 ID — 승인/반려 처리 키 */
  sellerId: number;
  marketId: number | null;
  email: string;
  /** 판매 담당자 이름 (반려 시 파기되어 null) */
  name: string | null;
  marketName: string;
  /** 판매 담당자 연락처 (반려 시 파기되어 null) */
  phoneNumber: string | null;
  status: SellerRegistrationStatus;
  rejectionReason: string | null;
  createdAt: string;
  businessType: string | null;
  /** 반려 시 단방향 해시값으로 대체된다 */
  businessNumber: string | null;
  processedAt: string | null;
}

/** 상태별 신청서 건수 — 브랜드명 검색어는 반영, 상태 필터는 미반영 */
export interface SellerApplicationStatusCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

/** 목록 응답 — 백엔드 AdminMarketDto.ApplicationListResponse와 1:1 */
export interface SellerRegistrationListResponse {
  content: Array<SellerRegistrationInfo>;
  pageInfo: PageInfo;
  statusCounts: SellerApplicationStatusCounts;
}

/**
 * 반려 사유 유형 — 백엔드 RejectionReasonType enum과 일치해야 한다.
 * 백엔드는 6종을 정의하지만 UI에는 4종만 노출한다(기능요구사항 v0.8 §5).
 */
export type RejectionReason =
  | "BUSINESS_REG_NUMBER_MISMATCH"
  | "MAIL_ORDER_REPORT_INCOMPLETE"
  | "INSUFFICIENT_DOCUMENTS"
  | "BANK_ACCOUNT_ERROR"
  | "DUPLICATE_APPLICATION"
  | "OTHER";

export type SellerProcessingHistoryType =
  | "APPLICATION_RECEIVED"
  | "APPLICATION_APPROVED"
  | "APPLICATION_REJECTED";

export interface SellerProcessingHistoryItem {
  type: SellerProcessingHistoryType;
  label: string;
  processedAt: string | null;
}

/**
 * 상세 — 백엔드 AdminSellerDetailResponse와 1:1.
 *
 * 반려(REJECTED) 건은 계정·제출 정보가 실제로 파기되어 대부분 필드가 null로 내려온다.
 * 사업자등록번호만 businessRegistrationNumberHash에 단방향 해시로 보존된다.
 */
export interface SellerRegistrationDetailInfo {
  applicationId: number;
  sellerId: number;
  email: string | null;
  marketName: string;
  status: Exclude<SellerRegistrationStatus, null>;

  /**
   * 판매 담당자 이름·연락처, 고객센터 전화번호.
   * SellerApplication 엔티티에는 있으나 상세 응답 DTO에 아직 노출되지 않아
   * 옵셔널로 둔다 (미반영 시 화면에서 "—"로 표시).
   */
  sellerName?: string | null;
  sellerContact?: string | null;
  csNumber?: string | null;

  // 사업자 정보
  businessType: string | null;
  representativeName: string | null;
  representativeContact: string | null;
  businessCompanyName: string | null;
  /** 반려 시 null — 해시값은 businessRegistrationNumberHash로 내려온다 */
  businessRegistrationNumber: string | null;
  /** 반려 시에만 값이 있는 단방향 해시 (복원 불가) */
  businessRegistrationNumberHash: string | null;
  businessCategory: string | null;
  businessAddress: string | null;
  businessDetailAddress: string | null;
  taxEmail: string | null;

  // 첨부 서류 (반려 시 파기)
  businessLicenseImageUrl: string | null;
  mailOrderLicenseImageUrl: string | null;
  mailOrderSalesNumber: string | null;

  // 정산 정보 — 계좌번호는 통장 사본과 대조해야 하므로 마스킹하지 않는다
  settlementBankName: string | null;
  accountHolderName: string | null;
  accountNumber: string | null;
  bankBookImageUrl: string | null;

  applicationDate: string | null;
  processedDate: string | null;
  /** 승인/반려를 처리한 운영자 로그인 아이디(이메일) — 심사 대기 시 null */
  processorLoginId: string | null;
  processingHistory: Array<SellerProcessingHistoryItem> | null;
  reviewMemo: string | null;

  /**
   * 반려 사유(유형 코드) + 상세 사유. 둘 다 상세 응답에는 아직 없어 옵셔널로 둔다.
   * rejectionReason이 없으면 반려 사유 박스를 렌더링하지 않는다.
   */
  rejectionReason?: string | null;
  rejectionReasonDetail?: string | null;
}

export interface UpdateSellerRegistrationStatusData {
  status: Exclude<SellerRegistrationStatus, "PENDING" | null>;
  rejectionReasonType?: RejectionReason;
  rejectionReasonDetail?: string;
}

export interface SellerUserListParams extends BaseParams {
  mainCategory: string;
  marketName: string;
}

export interface SellerUserInfo {
  marketId: number;
  marketName: string;
  mainCategory: string;
  sellerName: string;
  phoneNumber: string;
  productCount: number;
  createdAt: string;
}
export type SellerUserListResponse = PageResponse<SellerUserInfo>;

export const sellerService = {
  getSellerRegistrationList: async (params: SellerRegistrationParams) => {
    const { data: response } =
      await apiInstance.get<SellerRegistrationListResponse>(
        "/admin/sellers/applications",
        {
          params,
        }
      );

    return response;
  },
  /** 상세는 판매자 ID가 아니라 신청서 ID로 조회한다 */
  getSellerRegistrationDetail: async (applicationId: number) => {
    const { data: response } =
      await apiInstance.get<SellerRegistrationDetailInfo>(
        `/admin/sellers/applications/${applicationId}`
      );

    return response;
  },
  /** 승인/반려는 신청서 ID가 아니라 판매자 ID로 처리한다 */
  updateSellerRegistrationStatus: async (
    sellerId: number,
    data: UpdateSellerRegistrationStatusData
  ) => {
    const { data: response } = await apiInstance.patch(
      `/admin/sellers/${sellerId}/status`,
      data
    );

    return response;
  },
  getSellerUserList: async (params: SellerUserListParams) => {
    const { data: response } = await apiInstance.get<SellerUserListResponse>(
      "/admin/markets",
      {
        params,
      }
    );

    return response;
  },
};
