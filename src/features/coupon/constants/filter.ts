import type { FilterOptionGroup } from "@/common/components/FilterCard/FilterCard";
import type { CouponListParams } from "@/features/coupon/types/coupon";

export const COUPON_LIST_FILTER_OPTIONS: FilterOptionGroup<CouponListParams> = {
  상태: [
    {
      key: "status",
      type: "select",
      options: [
        { label: "전체", value: null },
        { label: "활성", value: "ACTIVE" },
        { label: "만료", value: "EXPIRED" },
        { label: "예정", value: "SCHEDULED" },
      ],
    },
  ],
};
