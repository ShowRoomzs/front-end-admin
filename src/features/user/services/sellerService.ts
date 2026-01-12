import { apiInstance } from "@/common/lib/apiInstance";
import type { BaseParams } from "@/common/types";
import type { SELLER_REGISTRATION_STATUS } from "@/features/user/constants/params";

export type SellerRegistrationStatus = keyof typeof SELLER_REGISTRATION_STATUS;

export interface SellerRegistrationParams extends BaseParams {
  status: SellerRegistrationStatus;
  startDate: string;
  endDate: string;
}

export const sellerService = {
  getSellerRegistrationList: async () => {
    const { data: response } = await apiInstance.get(
      "/admin/seller/applications"
    );

    return response;
  },
};
