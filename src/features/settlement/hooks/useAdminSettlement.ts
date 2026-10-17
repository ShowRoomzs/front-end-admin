import { DEV_MOCK_ENABLED, mockScenario } from "@/common/utils/devMock";
import { SETTLEMENT_QUERY_KEYS } from "@/features/settlement/constants/params";
import { adminSettlementService } from "@/features/settlement/services/adminSettlementService";
import type {
  BrandInvoicePayload,
  DetailNavParams,
  InvoiceCheckResult,
  RedistributePayload,
  SettlementListParams,
} from "@/features/settlement/types";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

/*
  배포본에서는 호출하지 않는다(enabled: DEV_MOCK_ENABLED) — API가 없어 화면이 「준비 중」을 띄운다.
  쿼리 키에 목업 시나리오를 넣어 `?mock=`을 바꾸면 다시 읽는다.
*/

/** 탭 건수 · GNB 배지 */
export function useGetAdminSettlementSummary() {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.SUMMARY, mockScenario()],
    queryFn: adminSettlementService.getSummary,
    enabled: DEV_MOCK_ENABLED,
    staleTime: 10_000,
  });
}

export function useGetAdminSettlementList(
  params: SettlementListParams,
  enabled: boolean
) {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.LIST, params],
    queryFn: () => adminSettlementService.getList(params),
    placeholderData: keepPreviousData,
    enabled: DEV_MOCK_ENABLED && enabled,
  });
}

export function useGetAdminEvidenceTasks(
  params: SettlementListParams,
  enabled: boolean
) {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.EVIDENCE, params],
    queryFn: () => adminSettlementService.getEvidenceTasks(params),
    placeholderData: keepPreviousData,
    enabled: DEV_MOCK_ENABLED && enabled,
  });
}

export function useGetAdminClawbacks(
  params: SettlementListParams,
  enabled: boolean
) {
  return useQuery({
    queryKey: [SETTLEMENT_QUERY_KEYS.CLAWBACK, params],
    queryFn: () => adminSettlementService.getClawbacks(params),
    placeholderData: keepPreviousData,
    enabled: DEV_MOCK_ENABLED && enabled,
  });
}

export function useGetAdminSettlementDetail(
  settlementId: number,
  navParams: DetailNavParams
) {
  return useQuery({
    queryKey: [
      SETTLEMENT_QUERY_KEYS.DETAIL,
      settlementId,
      navParams,
      mockScenario(),
    ],
    queryFn: () => adminSettlementService.getDetail(settlementId, navParams),
    enabled: DEV_MOCK_ENABLED && Number.isFinite(settlementId),
    retry: false,
  });
}

/** 상세 액션 뒤에는 목록 · 탭 건수 · GNB 배지가 함께 바뀐다 */
function useInvalidateSettlement() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      Object.values(SETTLEMENT_QUERY_KEYS).map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] })
      )
    );
}

export function useRedistribute(settlementId: number) {
  const invalidate = useInvalidateSettlement();
  return useMutation({
    mutationFn: (payload: RedistributePayload) =>
      adminSettlementService.redistribute(settlementId, payload),
    onSuccess: invalidate,
  });
}

export function useRequestAccountCheck(settlementId: number) {
  const invalidate = useInvalidateSettlement();
  return useMutation({
    mutationFn: () => adminSettlementService.requestAccountCheck(settlementId),
    onSuccess: invalidate,
  });
}

export function useCheckInfluencerInvoice(settlementId: number) {
  const invalidate = useInvalidateSettlement();
  return useMutation({
    mutationFn: (result: InvoiceCheckResult) =>
      adminSettlementService.checkInfluencerInvoice(settlementId, result),
    onSuccess: invalidate,
  });
}

export function useRegisterBrandInvoice(settlementId: number) {
  const invalidate = useInvalidateSettlement();
  return useMutation({
    mutationFn: (payload: BrandInvoicePayload) =>
      adminSettlementService.registerBrandInvoice(settlementId, payload),
    onSuccess: invalidate,
  });
}
