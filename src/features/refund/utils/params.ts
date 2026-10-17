import {
  REFUND_INITIAL_PARAMS,
  REFUND_PAGE_SIZES,
  REFUND_ROUTE_OPTIONS,
  REFUND_SORT_OPTIONS,
  REFUND_TABS,
} from "@/features/refund/constants/params";
import type { RefundListParams } from "@/features/refund/types";

/**
 * 주소창에서 읽은 값은 전부 문자열이고 손으로 고칠 수도 있다 —
 * 서버에 보내기 전에 숫자로 바꾸고, 모르는 값은 기본값으로 되돌린다.
 */
export function normalizeRefundParams(params: RefundListParams) {
  const page = Number(params.page);
  const size = Number(params.size);
  const initial = REFUND_INITIAL_PARAMS;
  const next: RefundListParams = {
    tab: REFUND_TABS.some((item) => item.value === params.tab)
      ? params.tab
      : initial.tab,
    route: REFUND_ROUTE_OPTIONS.some((item) => item.value === params.route)
      ? params.route
      : initial.route,
    keyword: params.keyword ?? "",
    sort: REFUND_SORT_OPTIONS.some((item) => item.value === params.sort)
      ? params.sort
      : initial.sort,
    page: Number.isInteger(page) && page > 0 ? page : initial.page,
    size: REFUND_PAGE_SIZES.includes(size) ? size : initial.size,
  };
  return next;
}
