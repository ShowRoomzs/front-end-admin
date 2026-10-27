import { ADMIN_CONTRACT_QUERY_KEYS } from "@/features/contract/constants/queryKeys";
import { adminContractService } from "@/features/contract/services/adminContractService";
import type {
  AdminContractApproveRequest,
  AdminContractCancelRequest,
  AdminContractRejectRequest,
  AdminContractSignatureRequest,
  AdminContractTerminateRequest,
} from "@/features/contract/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * 계약 쓰기 — 성공하면 상세·목록·요약(조치 큐·GNB 배지)을 함께 무효화한다.
 * 낙관적 갱신을 쓰지 않는다: 상태·권한·이력을 서버가 다시 계산해 내려준다.
 */
function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: [ADMIN_CONTRACT_QUERY_KEYS.DETAIL],
    });
    queryClient.invalidateQueries({
      queryKey: [ADMIN_CONTRACT_QUERY_KEYS.LIST],
    });
    queryClient.invalidateQueries({
      queryKey: [ADMIN_CONTRACT_QUERY_KEYS.SUMMARY],
    });
  };
}

export function useApproveContract() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: {
      contractId: number;
      body: AdminContractApproveRequest;
    }) => adminContractService.approve(v.contractId, v.body),
    onSuccess: invalidate,
  });
}

export function useRejectContract() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { contractId: number; body: AdminContractRejectRequest }) =>
      adminContractService.reject(v.contractId, v.body),
    onSuccess: invalidate,
  });
}

export function useUpdateSignatures() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: {
      contractId: number;
      body: AdminContractSignatureRequest;
    }) => adminContractService.updateSignatures(v.contractId, v.body),
    onSuccess: invalidate,
  });
}

/** 공구 생성(C4 · 기-05) — 계약은 양측 서명 때 이미 성립했고 이 조치는 공구를 만든다 */
export function useCreateGroupBuy() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (contractId: number) =>
      adminContractService.createGroupBuy(contractId),
    onSuccess: invalidate,
  });
}

export function useExpireContract() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (contractId: number) => adminContractService.expire(contractId),
    onSuccess: invalidate,
  });
}

export function useCancelContract() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { contractId: number; body: AdminContractCancelRequest }) =>
      adminContractService.cancel(v.contractId, v.body),
    onSuccess: invalidate,
  });
}

/** 해지 처리(C7 · 기-05) — 생성된 공구도 함께 종결되므로 공구 화면 캐시는 다음 진입 때 새로 받는다 */
export function useTerminateContract() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: {
      contractId: number;
      body: AdminContractTerminateRequest;
    }) => adminContractService.terminate(v.contractId, v.body),
    onSuccess: invalidate,
  });
}

/** 체결 문서 업로드 — presign → S3 PUT → 등록. 세 단계가 끝나야 상세를 다시 부른다 */
export function useUploadDocument() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (v: {
      contractId: number;
      documentType: "SIGNED_PDF" | "AUDIT_TRAIL";
      file: File;
    }) => {
      const presign = await adminContractService.presignDocument(
        v.contractId,
        v.documentType,
        v.file.name
      );
      const put = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": presign.contentType },
        body: v.file,
      });
      if (!put.ok) {
        throw new Error(`upload failed: ${put.status}`);
      }
      return adminContractService.registerDocument(v.contractId, {
        documentType: v.documentType,
        s3Key: presign.s3Key,
        fileName: v.file.name,
        sizeBytes: v.file.size,
      });
    },
    onSuccess: invalidate,
  });
}

export function useDeleteDocument() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: {
      contractId: number;
      documentType: "SIGNED_PDF" | "AUDIT_TRAIL";
    }) => adminContractService.deleteDocument(v.contractId, v.documentType),
    onSuccess: invalidate,
  });
}
