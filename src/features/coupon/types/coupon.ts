export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

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
