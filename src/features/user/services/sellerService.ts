import { apiInstance } from "@/common/lib/apiInstance";
import type { BaseParams, PageResponse } from "@/common/types";
import type {
  SELLER_REGISTRATION_KEYWORD_TYPE,
  SELLER_REGISTRATION_STATUS,
} from "@/features/user/constants/params";

export type SellerRegistrationStatus =
  | keyof typeof SELLER_REGISTRATION_STATUS
  | null; // null은 전체 조회
export type SellerRegistrationKeywordType =
  | keyof typeof SELLER_REGISTRATION_KEYWORD_TYPE;
export interface SellerRegistrationParams extends BaseParams {
  status: SellerRegistrationStatus;
  startDate: string;
  endDate: string;
  keyword: string;
  keywordType: SellerRegistrationKeywordType;
}

export interface SellerRegistrationInfo {
  createdAt: string;
  email: string;
  marketId: number;
  marketName: string;
  name: string;
  phoneNumber: string;
  rejectionReason: string | null;
  sellerId: number;
  status: SellerRegistrationStatus;
}

export type RejectionReason =
  | "BUSINESS_INFO_UNVERIFIED"
  | "CRITERIA_NOT_MET"
  | "INAPPROPRIATE_MARKET_NAME"
  | "OTHER";
type SellerRegistrationResponse = PageResponse<SellerRegistrationInfo>;

export interface UpdateSellerRegistrationStatusData {
  status: Exclude<SellerRegistrationStatus, "PENDING" | null>;
  rejectionReasonType?: RejectionReason;
  rejectionReasonDetail?: string;
}

export const sellerService = {
  getSellerRegistrationList: async (params: SellerRegistrationParams) => {
    const { data: response } =
      await apiInstance.get<SellerRegistrationResponse>(
        "/admin/sellers/applications",
        {
          params,
        }
      );

    return response;
  },
  getSellerRegistrationDetail: async (sellerId: number) => {
    const { data: response } = await apiInstance.get<SellerRegistrationInfo>(
      `/admin/sellers/${sellerId}`
    );

    return response;
  },
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
};
