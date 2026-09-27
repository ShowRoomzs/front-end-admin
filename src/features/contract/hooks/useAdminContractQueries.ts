import { CONTRACT_SUMMARY_POLL_INTERVAL } from "@/features/contract/constants/params";
import { ADMIN_CONTRACT_QUERY_KEYS } from "@/features/contract/constants/queryKeys";
import { adminContractService } from "@/features/contract/services/adminContractService";
import type { AdminContractListParams } from "@/features/contract/types";
import { useQuery } from "@tanstack/react-query";

export function useGetAdminContractList(params: AdminContractListParams) {
  return useQuery({
    queryKey: [ADMIN_CONTRACT_QUERY_KEYS.LIST, params],
    queryFn: () => adminContractService.getList(params),
  });
}

/** 조치 큐 · 탭 카운트 · GNB 배지 — 셸과 목록이 같은 키를 써서 요청은 한 번만 나간다 */
export function useGetAdminContractSummary() {
  return useQuery({
    queryKey: [ADMIN_CONTRACT_QUERY_KEYS.SUMMARY],
    queryFn: adminContractService.getSummary,
    refetchInterval: CONTRACT_SUMMARY_POLL_INTERVAL,
    staleTime: 10_000,
  });
}

export function useGetAdminContractDetail(contractId: number) {
  return useQuery({
    queryKey: [ADMIN_CONTRACT_QUERY_KEYS.DETAIL, contractId],
    queryFn: () => adminContractService.getDetail(contractId),
    enabled: Number.isFinite(contractId) && contractId > 0,
  });
}
