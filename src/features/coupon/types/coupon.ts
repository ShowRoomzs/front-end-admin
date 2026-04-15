import type { BaseParams, PageResponse } from "@/common/types";

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";
export type CouponStatus = "ACTIVE" | "EXPIRED" | "SCHEDULED";

export interface Coupon {
  couponId: number;
  name: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrderPrice: number;
  validFrom: string;
  validUntil: string;
  totalQuantity: number | null;
  remainingQuantity: number | null;
  status: CouponStatus;
  createdAt: string;
}
export interface CreateCouponRequest {
  name: string;
  couponCode: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validTo: string;
}

export interface CouponListParams extends BaseParams {
  status?: CouponStatus | null;
}

export type CouponListResponse = PageResponse<Coupon>;
