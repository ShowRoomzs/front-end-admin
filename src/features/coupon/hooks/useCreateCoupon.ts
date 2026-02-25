import { useMutation } from "@tanstack/react-query";
import { couponService } from "@/features/coupon/services/couponService";
import type { CreateCouponRequest } from "@/features/coupon/types/coupon";
import { queryClient } from "@/common/lib/queryClient";
import { COUPONS_QUERY_KEY } from "@/features/coupon/constants/queryKey";

export function useCreateCoupon() {
  return useMutation({
    mutationFn: (data: CreateCouponRequest) => couponService.createCoupon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [COUPONS_QUERY_KEY] });
    },
  });
}
