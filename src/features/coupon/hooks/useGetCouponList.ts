import { COUPONS_QUERY_KEY } from "@/features/coupon/constants/queryKey";
import { couponService } from "@/features/coupon/services/couponService";
import type { CouponListParams } from "@/features/coupon/types/coupon";
import { useQuery } from "@tanstack/react-query";

export function useGetCouponList(params: CouponListParams) {
  return useQuery({
    queryKey: [COUPONS_QUERY_KEY, params],
    queryFn: () => couponService.getCouponList(params),
  });
}
