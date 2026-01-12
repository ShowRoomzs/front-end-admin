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

type SellerRegistrationResponse = PageResponse<SellerRegistrationInfo>;

export const sellerService = {
  getSellerRegistrationList: async () => {
    const { data: response } =
      await apiInstance.get<SellerRegistrationResponse>(
        "/admin/sellers/applications"
      );

    return response;
  },
};
