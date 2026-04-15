import type { Columns } from "@/common/components/Table/types";
import { formatDate } from "@/common/utils/formatDate";
import type { Coupon, CouponStatus, DiscountType } from "@/features/coupon/types/coupon";

const DISCOUNT_TYPE_LABEL: Record<DiscountType, string> = {
  PERCENTAGE: "정률",
  FIXED_AMOUNT: "정액",
};

const COUPON_STATUS_LABEL: Record<CouponStatus, string> = {
  ACTIVE: "활성",
  EXPIRED: "만료",
  SCHEDULED: "예정",
};

export const COUPON_LIST_COLUMNS: Columns<Coupon> = [
  {
    key: "code",
    label: "쿠폰 코드",
    width: 130,
  },
  {
    key: "name",
    label: "쿠폰명",
    width: 200,
  },
  {
    key: "discountType",
    label: "할인",
    width: 140,
    render: (_value, record) => {
      const type = DISCOUNT_TYPE_LABEL[record.discountType];
      const value =
        record.discountType === "PERCENTAGE"
          ? `${record.discountValue}%`
          : `${record.discountValue.toLocaleString()}원`;
      return `${type} ${value}`;
    },
  },
  {
    key: "minimumOrderPrice",
    label: "최소주문금액",
    width: 130,
    render: (value) => `${(Number(value) || 0).toLocaleString()}원`,
  },
  {
    key: "validFrom",
    label: "유효기간",
    width: 260,
    render: (_value, record) =>
      `${formatDate(record.validFrom)} ~ ${formatDate(record.validUntil)}`,
  },
  {
    key: "remainingQuantity",
    label: "수량(잔여/총)",
    width: 130,
    align: "center",
    render: (_value, record) => {
      if (record.totalQuantity === null) {
        return "무제한";
      }
      const remaining = record.remainingQuantity ?? 0;
      return `${remaining.toLocaleString()} / ${record.totalQuantity.toLocaleString()}`;
    },
  },
  {
    key: "status",
    label: "상태",
    width: 90,
    align: "center",
    render: (value) => COUPON_STATUS_LABEL[value as CouponStatus],
  },
  {
    key: "createdAt",
    label: "생성일",
    width: 160,
    render: (value) => formatDate(value as string),
  },
];
