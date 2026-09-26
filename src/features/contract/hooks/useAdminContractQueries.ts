import { CONTRACT_SUMMARY_POLL_INTERVAL } from "@/features/contract/constants/params";
import { ADMIN_CONTRACT_QUERY_KEYS } from "@/features/contract/constants/queryKeys";
import { adminContractService } from "@/features/contract/services/adminContractService";
import type {
  AdminContractDocument,
  AdminContractListParams,
} from "@/features/contract/types";
import { useQueries, useQuery } from "@tanstack/react-query";

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

/**
 * 체결 문서 용량 — 상세 응답의 문서 목록엔 크기가 없어 다운로드 정보(GET /documents/{type})로 받는다.
 * 올린 시각이 키에 들어가 있어 교체하면 다시 부르고, 그 전에는 다시 부르지 않는다.
 */
export function useDocumentSizes(
  contractId: number,
  documents: Array<AdminContractDocument>
) {
  const targets = documents.filter(
    (document) =>
      document.exists &&
      (document.type === "SIGNED_PDF" || document.type === "AUDIT_TRAIL")
  );
  const results = useQueries({
    queries: targets.map((document) => ({
      queryKey: [
        ADMIN_CONTRACT_QUERY_KEYS.DOCUMENT_META,
        contractId,
        document.type,
        document.uploadedAt,
      ],
      queryFn: () =>
        adminContractService.getDocument(contractId, document.type),
      staleTime: Infinity,
      select: (data: { sizeBytes: number | null }) => data.sizeBytes,
    })),
  });
  const sizes: Partial<Record<AdminContractDocument["type"], number | null>> =
    {};
  targets.forEach((document, index) => {
    sizes[document.type] = results[index]?.data ?? null;
  });
  return sizes;
}
