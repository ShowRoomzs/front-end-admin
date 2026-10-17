import { EXCEPTION_KINDS } from "@/features/exception/constants/labels";
import {
  EXCEPTION_INITIAL_PARAMS,
  EXCEPTION_PAGE_SIZES,
  EXCEPTION_TABS,
} from "@/features/exception/constants/params";
import type { ExceptionListParams } from "@/features/exception/types";

/**
 * 주소창에서 읽은 값은 전부 문자열이고 손으로 고칠 수도 있다(`?tab=foo` · `?keyword=null`) —
 * 서버에 보내거나 화면에 그리기 전에 숫자로 바꾸고, 모르는 값은 기본값으로 되돌린다.
 * 유형은 **고른 탭의** 유형일 때만 살린다 — 다른 탭 유형을 보내면 서버가 400을 준다.
 */
export function normalizeExceptionParams(params: ExceptionListParams) {
  const page = Number(params.page);
  const size = Number(params.size);
  const initial = EXCEPTION_INITIAL_PARAMS;
  const tab = EXCEPTION_TABS.some((item) => item.value === params.tab)
    ? params.tab
    : initial.tab;
  const next: ExceptionListParams = {
    tab,
    kind: EXCEPTION_KINDS.some(
      (item) => item.tab === tab && item.value === params.kind
    )
      ? params.kind
      : initial.kind,
    keyword: typeof params.keyword === "string" ? params.keyword : "",
    page: Number.isInteger(page) && page > 0 ? page : initial.page,
    size: EXCEPTION_PAGE_SIZES.includes(size) ? size : initial.size,
  };
  return next;
}
