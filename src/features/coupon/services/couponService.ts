import { apiInstance } from "@/common/lib/apiInstance";
import type { CreateCouponRequest } from "@/features/coupon/types/coupon";

export const couponService = {
  createCoupon: async (data: CreateCouponRequest) => {
    const response = await apiInstance.post("/admin/coupons", data);
    return response.data;
  },
};
