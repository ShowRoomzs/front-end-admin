import {
  PAGE_SIZES,
  SETTLEMENT_INITIAL_PARAMS,
  isSettlementSort,
  isSettlementTab,
} from "@/features/settlement/constants/params";
import type { SettlementListParams } from "@/features/settlement/types";

/**
 * 주소(`?tab=&keyword=&sort=&page=&size=`)에서 읽은 값을 서버가 받는 값으로 고른다.
 * 주소 값은 문자열이고, 목업 시절 탭 이름(CHECKING · FAILED)이 남은 주소도 있어 모르는 값은 기본값으로 둔다
 * — 그대로 보내면 서버 enum 변환이 400을 낸다.
 */
export function normalizeListParams(
  raw: Partial<Record<keyof SettlementListParams, unknown>>
): SettlementListParams {
  const tab = isSettlementTab(raw.tab) ? raw.tab : "ALL";
  const sort =
    tab === "ALL"
      ? isSettlementSort(raw.sort)
        ? raw.sort
        : SETTLEMENT_INITIAL_PARAMS.sort
      : "";
  const size = Number(raw.size);
  const page = Number(raw.page);
  return {
    tab,
    keyword: typeof raw.keyword === "string" ? raw.keyword : "",
    sort,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    size: PAGE_SIZES.includes(size) ? size : SETTLEMENT_INITIAL_PARAMS.size,
  };
}
