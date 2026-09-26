import { CONTRACT_INITIAL_PARAMS } from "@/features/contract/constants/params";
import { useGetAdminContractList } from "@/features/contract/hooks/useAdminContractQueries";
import type { AdminContractListParams } from "@/features/contract/types";
import { useMemo } from "react";

/**
 * 시안 `.page-h` [‹ 이전] [다음 ›] — 어드민 상세 응답엔 이웃 계약 ID가 없어서
 * 목록에서 들고 온 조건(탭·큐·검색어·정렬·페이지)으로 같은 목록을 다시 보고 앞뒤 건을 고른다.
 * 목록과 같은 방식(초기값 + URL 문자열)으로 조건을 만들어 대개 캐시에서 바로 나온다.
 * 페이지 경계 너머는 잇지 않는다.
 */
export function useContractNeighbors(contractId: number, search: string) {
  const params = useMemo<AdminContractListParams>(() => {
    const query = new URLSearchParams(search);
    const result = { ...CONTRACT_INITIAL_PARAMS } as Record<string, unknown>;
    Object.keys(CONTRACT_INITIAL_PARAMS).forEach((key) => {
      const value = query.get(key);
      if (value !== null) {
        result[key] = value;
      }
    });
    return result as unknown as AdminContractListParams;
  }, [search]);

  const { data } = useGetAdminContractList(params);

  return useMemo(() => {
    const rows = data?.content ?? [];
    const index = rows.findIndex((row) => row.contractId === contractId);
    if (index < 0) {
      return { prevId: null, nextId: null };
    }
    return {
      prevId: rows[index - 1]?.contractId ?? null,
      nextId: rows[index + 1]?.contractId ?? null,
    };
  }, [data, contractId]);
}
