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
  AdminContractTerminateRequest,
  ContractDocumentType,
} from "@/features/contract/types";

/*
  어드민 계약 API — 백엔드 origin/main `AdminContractController`와 1:1.
  1021 기-05 · 06 · 07(해지 · 공구 생성 · 취소 동의 카드 · 서명 기한 제안값)까지 개발 서버에 배포됐다
  (백엔드 58 · 2026-11-03 확인) — DEV 목업 없이 늘 실호출한다.
*/

const BASE = "/admin/contracts";

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

  /**
   * 공구 생성(C4 · 기-05) — 같은 트랜잭션에서 공구가 생성된다(불가역).
   * 새 경로 `POST /{id}/group-buy` — `/conclude`는 1릴리스 유지되는 옛 별칭이라 쓰지 않는다.
   */
  createGroupBuy: async (contractId: number) => {
    const { data } = await apiInstance.post<AdminContractProcessResponse>(
      `${BASE}/${contractId}/group-buy`
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

  /**
   * 해지 처리(C7 · 기-05) — 성립 뒤 · 공구 오픈 전. 생성된 공구도 함께 종결된다(불가역).
   */
  terminate: async (
    contractId: number,
    body: AdminContractTerminateRequest
  ) => {
    const { data } = await apiInstance.post<AdminContractProcessResponse>(
      `${BASE}/${contractId}/terminate`,
      body
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

  getDocument: async (
    contractId: number,
    documentType: ContractDocumentType
  ) => {
    const { data } = await apiInstance.get<AdminContractDownloadResponse>(
      `${BASE}/${contractId}/documents/${documentType}`
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
