import { SETTLEMENT_QUERY_KEYS } from "@/features/settlement/constants/params";
import { adminSettlementService } from "@/features/settlement/services/adminSettlementService";
import type {
  BrandInvoicePayload,
  RedistributePayload,
  SettlementDetail,
  SettlementListParams,
  SettlementListResponse,
  VerifyPayload,
} from "@/features/settlement/types";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

/** 탭 숫자 · GNB 배지(MainLayout도 쓴다) */
export function useGetAdminSettlementSummary() {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.SUMMARY],
    queryFn: adminSettlementService.getSummary,
    staleTime: 10_000,
  });
}

export function useGetAdminSettlementList(
  params: SettlementListParams,
  enabled: boolean
) {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.LIST, "SETTLEMENT", params],
    queryFn: () => adminSettlementService.getSettlementList(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useGetAdminEvidenceList(
  params: SettlementListParams,
  enabled: boolean
) {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.LIST, "EVIDENCE", params],
    queryFn: () => adminSettlementService.getEvidenceList(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useGetAdminClawbackList(
  params: SettlementListParams,
  enabled: boolean
) {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.LIST, "CLAWBACK", params],
    queryFn: () => adminSettlementService.getClawbackList(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useGetAdminSettlementDetail(settlementId: number) {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.DETAIL, settlementId],
    queryFn: () => adminSettlementService.getDetail(settlementId),
    enabled: Number.isFinite(settlementId) && settlementId > 0,
    retry: false,
  });
}

/**
 * 쓰기는 갱신된 상세를 돌려준다 — 상세 캐시를 그 값으로 바꾸고, 목록 · 탭 숫자 · GNB 배지는 다시 읽는다.
 * 실패(상태 변경 409 등)면 화면이 최신 상세를 다시 읽도록 `refresh`를 쓴다.
 */
function useSettlementCache(settlementId: number) {
  const queryClient = useQueryClient();
  const others = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: [SETTLEMENT_QUERY_KEYS.LIST],
      }),
      queryClient.invalidateQueries({
        queryKey: [SETTLEMENT_QUERY_KEYS.SUMMARY],
      }),
    ]);
  return {
    apply: (detail: SettlementDetail) => {
      queryClient.setQueryData(
        [SETTLEMENT_QUERY_KEYS.DETAIL, settlementId],
        detail
      );
      return others();
    },
    refresh: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: [SETTLEMENT_QUERY_KEYS.DETAIL, settlementId],
        }),
        others(),
      ]),
  };
}

export function useRedistribute(settlementId: number) {
  const cache = useSettlementCache(settlementId);
  const mutation = useMutation({
    mutationFn: (payload: RedistributePayload) =>
      adminSettlementService.redistribute(settlementId, payload),
    onSuccess: cache.apply,
  });
  return { ...mutation, refresh: cache.refresh };
}

export function useVerifyTaxInvoice(settlementId: number) {
  const cache = useSettlementCache(settlementId);
  const mutation = useMutation({
    mutationFn: (payload: VerifyPayload) =>
      adminSettlementService.verifyTaxInvoice(settlementId, payload),
    onSuccess: cache.apply,
  });
  return { ...mutation, refresh: cache.refresh };
}

export function useIssueBrandInvoice(settlementId: number) {
  const cache = useSettlementCache(settlementId);
  const mutation = useMutation({
    mutationFn: (payload: BrandInvoicePayload) =>
      adminSettlementService.issueBrandInvoice(settlementId, payload),
    onSuccess: cache.apply,
  });
  return { ...mutation, refresh: cache.refresh };
}

/** 목록 한 페이지의 정산 id 순서 — 증빙 · 차감 탭은 행이 문서 · 차감이라 정산 id로 모은다(중복 제거) */
async function fetchSettlementIds(params: SettlementListParams) {
  const pick = <T>(
    response: SettlementListResponse<T>,
    idOf: (row: T) => number
  ) => ({
    ids: [...new Set(response.content.map(idOf))],
    hasNext: response.pageInfo.hasNext,
  });
  if (params.tab === "EVIDENCE") {
    return pick(
      await adminSettlementService.getEvidenceList(params),
      (row) => row.settlementId
    );
  }
  if (params.tab === "CLAWBACK") {
    return pick(
      await adminSettlementService.getClawbackList(params),
      (row) => row.originSettlementId
    );
  }
  return pick(
    await adminSettlementService.getSettlementList(params),
    (row) => row.settlementId
  );
}

function useSettlementIds(params: SettlementListParams, enabled: boolean) {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.LIST, "NAV", params],
    queryFn: () => fetchSettlementIds(params),
    enabled,
    staleTime: 30_000,
  });
}

export interface SettlementNeighbor {
  settlementId: number;
  page: number;
}

/**
 * 상세의 이전 · 다음 — 서버에 이웃 조회가 없어 목록 조건(탭 · 검색 · 정렬 · 페이지)으로 같은 목록을 읽어 앞뒤를 찾는다.
 * 페이지 끝이면 옆 페이지 첫 · 끝 건으로 넘어간다. 목록에서 오지 않았으면(`tab` 없음) 버튼을 그리지 않는다.
 */
export function useSettlementNeighbors(
  settlementId: number,
  params: SettlementListParams,
  enabled: boolean
): { prev: SettlementNeighbor | null; next: SettlementNeighbor | null } {
  const current = useSettlementIds(params, enabled);
  const ids = current.data?.ids ?? [];
  const index = ids.indexOf(settlementId);
  const found = enabled && index >= 0;
  const needPrevPage = found && index === 0 && params.page > 1;
  const needNextPage =
    found && index === ids.length - 1 && Boolean(current.data?.hasNext);
  const prevPage = useSettlementIds(
    { ...params, page: params.page - 1 },
    needPrevPage
  );
  const nextPage = useSettlementIds(
    { ...params, page: params.page + 1 },
    needNextPage
  );
  if (!found) return { prev: null, next: null };

  let prev: SettlementNeighbor | null = null;
  if (index > 0) {
    prev = { settlementId: ids[index - 1], page: params.page };
  } else if (needPrevPage && prevPage.data?.ids.length) {
    const last = prevPage.data.ids[prevPage.data.ids.length - 1];
    prev = { settlementId: last, page: params.page - 1 };
  }
  let next: SettlementNeighbor | null = null;
  if (index < ids.length - 1) {
    next = { settlementId: ids[index + 1], page: params.page };
  } else if (needNextPage && nextPage.data?.ids.length) {
    next = { settlementId: nextPage.data.ids[0], page: params.page + 1 };
  }
  if (prev?.settlementId === settlementId) prev = null;
  if (next?.settlementId === settlementId) next = null;
  return { prev, next };
}
