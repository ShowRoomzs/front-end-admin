import {
  CLAIM_INITIAL_PARAMS,
  CLAIM_LIST_RANGE_DAYS,
  CLAIM_PAGE_SIZES,
  CLAIM_SEARCH_FIELDS,
  CLAIM_SORT_OPTIONS,
  CLAIM_TABS,
  CLAIM_TYPE_OPTIONS,
} from "@/features/claim/constants/params";
import type { ClaimListParams, ClaimListQuery } from "@/features/claim/types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

/**
 * 주소창에서 읽은 값은 전부 문자열이고 손으로 고칠 수도 있다 —
 * 조회·화면에 쓰기 전에 숫자로 바꾸고, 모르는 값은 기본값으로 되돌린다.
 * (`?tab=FOO`면 켜진 탭이 없어지고, page "1"과 1이 서로 다른 캐시 키가 된다)
 */
export function normalizeClaimParams(params: ClaimListParams) {
  const page = Number(params.page);
  const size = Number(params.size);
  const initial = CLAIM_INITIAL_PARAMS;
  const next: ClaimListParams = {
    tab: CLAIM_TABS.some((item) => item.value === params.tab)
      ? params.tab
      : initial.tab,
    type: CLAIM_TYPE_OPTIONS.some((item) => item.value === params.type)
      ? params.type
      : initial.type,
    searchField: CLAIM_SEARCH_FIELDS.some(
      (item) => item.value === params.searchField
    )
      ? params.searchField
      : initial.searchField,
    keyword: params.keyword ?? "",
    sort: CLAIM_SORT_OPTIONS.some((item) => item.value === params.sort)
      ? params.sort
      : initial.sort,
    page: Number.isInteger(page) && page > 0 ? page : initial.page,
    size: CLAIM_PAGE_SIZES.includes(size) ? size : initial.size,
  };
  return next;
}

/**
 * 화면 조건 → 서버 조건. 검색어는 고른 기준 하나에만 싣는다.
 * `from`은 운영자 기준(KST) 오늘에서 상한만큼 — 서버 `to` 기본값(서버 오늘)과의 간격이 상한을 넘지 않는다.
 */
export function toClaimListQuery(params: ClaimListParams): ClaimListQuery {
  const keyword = params.keyword.trim();
  return {
    tab: params.tab,
    types: params.type ? [params.type] : undefined,
    from: dayjs()
      .utcOffset(9)
      .subtract(CLAIM_LIST_RANGE_DAYS, "day")
      .format("YYYY-MM-DD"),
    [params.searchField]: keyword || undefined,
    sort: params.sort || undefined,
    page: params.page,
    size: params.size,
  };
}
