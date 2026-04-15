import { apiInstance } from "@/common/lib/apiInstance";
import type {
  CouponListParams,
  CouponListResponse,
  CreateCouponRequest,
} from "@/features/coupon/types/coupon";

export const couponService = {
  createCoupon: async (data: CreateCouponRequest) => {
    const response = await apiInstance.post("/admin/coupons", data);
    return response.data;
  },
  getCouponList: async (params: CouponListParams) => {
    const { data: response } = await apiInstance.get<CouponListResponse>(
      "/admin/coupons",
      { params }
    );
    return response;
  },
};
