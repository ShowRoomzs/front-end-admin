import { apiInstance } from "@/common/lib/apiInstance";
import type { PageResponse } from "@/common/types/page";
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams";
import type {
  AdminContractApproveRequest,
  AdminContractCancelRequest,
  AdminContractDetail,
  AdminContractDownloadResponse,
  AdminContractListItem,
  AdminContractListParams,
  AdminContractPresignResponse,
  AdminContractProcessResponse,
  AdminContractRejectRequest,
  AdminContractSignatureRequest,
  AdminContractSummary,
  ContractDocumentType,
} from "@/features/contract/types";

const BASE = "/admin/contracts";

/** 어드민 계약 API — 백엔드 `AdminContractController` 15개 엔드포인트와 1:1 */
export const adminContractService = {
  getList: async (params: AdminContractListParams) => {
    const { data } = await apiInstance.get<PageResponse<AdminContractListItem>>(
      BASE,
      { params: paramsToSearchParams(params) }
    );
    return data;
  },

  getSummary: async () => {
    const { data } = await apiInstance.get<AdminContractSummary>(
      `${BASE}/summary`
    );
    return data;
  },

  getDetail: async (contractId: number) => {
    const { data } = await apiInstance.get<AdminContractDetail>(
      `${BASE}/${contractId}`
    );
    return data;
  },

  approve: async (contractId: number, body: AdminContractApproveRequest) => {
    const { data } = await apiInstance.post<AdminContractProcessResponse>(
      `${BASE}/${contractId}/review/approve`,
      body
    );
    return data;
  },

  reject: async (contractId: number, body: AdminContractRejectRequest) => {
    const { data } = await apiInstance.post<AdminContractProcessResponse>(
      `${BASE}/${contractId}/review/reject`,
      body
    );
    return data;
  },

  /** 서명 현황 갱신 — null이면 서명 해제. 기준 시각은 서버가 저장 시각으로 기록한다 */
  updateSignatures: async (
    contractId: number,
    body: AdminContractSignatureRequest
  ) => {
    const { data } = await apiInstance.put<AdminContractProcessResponse>(
      `${BASE}/${contractId}/signatures`,
      body,
      // 다른 운영자가 먼저 저장했으면(409) 화면이 직접 안내한다
      { suppressErrorToast: true }
    );
    return data;
  },

  /** 체결 완료 — 같은 트랜잭션에서 공구가 생성된다(불가역) */
  conclude: async (contractId: number) => {
    const { data } = await apiInstance.post<AdminContractProcessResponse>(
      `${BASE}/${contractId}/conclude`
    );
    return data;
  },

  expire: async (contractId: number) => {
    const { data } = await apiInstance.post<AdminContractProcessResponse>(
      `${BASE}/${contractId}/expire`,
      { dashboardRechecked: true }
    );
    return data;
  },

  cancel: async (contractId: number, body: AdminContractCancelRequest) => {
    const { data } = await apiInstance.post<AdminContractProcessResponse>(
      `${BASE}/${contractId}/cancel`,
      body
    );
    return data;
  },

  /** 외부(모두싸인) 재발송 완료 기록 — 미처리 요청을 전부 처리한다 */
  handleResend: async (contractId: number) => {
    const { data } = await apiInstance.post<AdminContractProcessResponse>(
      `${BASE}/${contractId}/resend/handle`
    );
    return data;
  },

  presignDocument: async (
    contractId: number,
    documentType: ContractDocumentType,
    fileName: string
  ) => {
    const { data } = await apiInstance.post<AdminContractPresignResponse>(
      `${BASE}/${contractId}/documents/presign`,
      { documentType, contentType: "application/pdf", fileName }
    );
    return data;
  },

  registerDocument: async (
    contractId: number,
    body: {
      documentType: ContractDocumentType;
      s3Key: string;
      fileName: string;
      sizeBytes: number;
    }
  ) => {
    const { data } = await apiInstance.post<AdminContractDownloadResponse>(
      `${BASE}/${contractId}/documents`,
      body
    );
    return data;
  },

  deleteDocument: async (
    contractId: number,
    documentType: ContractDocumentType
  ) => {
    await apiInstance.delete(`${BASE}/${contractId}/documents/${documentType}`);
  },

  /** silent — 용량 표시처럼 실패해도 화면이 멀쩡한 부가 조회는 오류 토스트를 띄우지 않는다 */
  getDocument: async (
    contractId: number,
    documentType: ContractDocumentType,
    options?: { silent?: boolean }
  ) => {
    const { data } = await apiInstance.get<AdminContractDownloadResponse>(
      `${BASE}/${contractId}/documents/${documentType}`,
      { suppressErrorToast: options?.silent }
    );
    return data;
  },

  /** 계약서 생성본(제출본 PDF) — 없으면 서버가 이때 만든다 */
  getDraft: async (contractId: number) => {
    const { data } = await apiInstance.get<AdminContractDownloadResponse>(
      `${BASE}/${contractId}/document-draft`
    );
    return data;
  },
};
