import { apiInstance } from "@/common/lib/apiInstance";
import type { PageResponse } from "@/common/types/page";
import { DEV_MOCK_ENABLED, mockScenario } from "@/common/utils/devMock";
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
  ContractStatus,
} from "@/features/contract/types";

/*
  어드민 계약 API — 백엔드 origin/main `AdminContractController`와 1:1.

  개발 서버(api.showroomz.shop · 10-21 배포본)에는 1021 기-05 · 06 · 07 변경이 아직 없다:
  `POST /{id}/terminate` · `POST /{id}/group-buy` · `POST /{id}/close-consent-card`가 없고, 상세의 `terminationRequest`
  · `termination` · `permissions.canTerminate/canCreateGroupBuy` · `signature.deadlineOverdueWhileHeld` 등이 오지 않는다.
  그래서 로컬에서 시안 state를 보려면 `?mock=`를 붙인다(개발 서버 전용 · 배포본은 항상 실호출) — 백엔드 배포 후 삭제.

  ?mock= 시나리오(상세 · 목록 공통)
  - c1         : B1 검토 대기 — [검토 승인] → C1 서명 기한 기본값(공구 시작 3일 전 23:55)
  - b3s        : B3-s 서명 진행중 · 인플루언서 계정 정지 · 서명 기한 경과 안내
  - b4         : B4 공구 생성 대기(감사추적인증서 미업로드) — [공구 생성] 비활성 · [해지 처리] → C7(오픈 전 · 요청 없음)
  - b5         : B5 계약 성립 · 공구 준비중 — [해지 처리] → C7(요청 없음 = 운영자 처리)
  - b5-request : B5 + 브랜드 해지 요청 대기 — 레일 「해지 요청」 행 · C7 「요청」 행
  - b7         : B7 해지 결과(생성 공구 함께 종료)
  - 목록 화면에 어느 값이든 붙이면 요약에 「해지 요청」 큐 1건이 더해진다.
  - 시나리오 중 쓰기(승인 · 반려 · 서명 저장 · 공구 생성 · 만료 · 취소 · 해지 · 업로드)는 서버로 보내지 않는다
    (실데이터 보호). b5 · b5-request에서 해지하면 그 계약은 B7로 바뀐다(새로고침하면 초기화).
*/

const BASE = "/admin/contracts";

/** 목업 시나리오(개발 서버 전용) — 배포본에서는 항상 null이라 아래 분기가 번들에서 빠진다 */
async function mockModule() {
  if (!DEV_MOCK_ENABLED || mockScenario() === null) {
    return null;
  }
  return import("../mocks/contractMock");
}

/** 시나리오 중 쓰기는 서버로 보내지 않는다 — null이면 실호출 */
async function mockWrite(
  contractId: number,
  status: ContractStatus
): Promise<AdminContractProcessResponse | null> {
  const mock = await mockModule();
  return mock ? mock.mockProcess(contractId, status) : null;
}

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
    const mock = await mockModule();
    return mock ? mock.mockContractSummary(data) : data;
  },

  getDetail: async (contractId: number) => {
    const mock = await mockModule();
    const scenario = mockScenario();
    if (mock && mock.isContractMockScenario(scenario)) {
      return mock.mockContractDetail(scenario, contractId);
    }
    const { data } = await apiInstance.get<AdminContractDetail>(
      `${BASE}/${contractId}`
    );
    return data;
  },

  approve: async (contractId: number, body: AdminContractApproveRequest) => {
    const mocked = await mockWrite(contractId, "SIGNING");
    if (mocked) {
      return mocked;
    }
    const { data } = await apiInstance.post<AdminContractProcessResponse>(
      `${BASE}/${contractId}/review/approve`,
      body
    );
    return data;
  },

  reject: async (contractId: number, body: AdminContractRejectRequest) => {
    const mocked = await mockWrite(contractId, "REVIEW_REJECTED");
    if (mocked) {
      return mocked;
    }
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
    const mocked = await mockWrite(contractId, "SIGNING");
    if (mocked) {
      return mocked;
    }
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
   * main의 새 경로는 `POST /{id}/group-buy`이고 `/conclude`는 1릴리스 유지되는 별칭이다. 개발 서버에는
   * `/conclude`만 있어 배포 순서와 무관하게 동작하도록 별칭을 부른다 — 백엔드 배포 후 `/group-buy`로 바꾼다.
   */
  createGroupBuy: async (contractId: number) => {
    const mocked = await mockWrite(contractId, "CONCLUDED");
    if (mocked) {
      return mocked;
    }
    const { data } = await apiInstance.post<AdminContractProcessResponse>(
      `${BASE}/${contractId}/conclude`
    );
    return data;
  },

  expire: async (contractId: number) => {
    const mocked = await mockWrite(contractId, "EXPIRED");
    if (mocked) {
      return mocked;
    }
    const { data } = await apiInstance.post<AdminContractProcessResponse>(
      `${BASE}/${contractId}/expire`,
      { dashboardRechecked: true }
    );
    return data;
  },

  cancel: async (contractId: number, body: AdminContractCancelRequest) => {
    const mocked = await mockWrite(contractId, "CANCELED");
    if (mocked) {
      return mocked;
    }
    const { data } = await apiInstance.post<AdminContractProcessResponse>(
      `${BASE}/${contractId}/cancel`,
      body
    );
    return data;
  },

  /**
   * 해지 처리(C7 · 기-05) — 성립 뒤 · 공구 오픈 전. 생성된 공구도 함께 종결된다(불가역).
   * origin/main에만 있다(개발 서버 미배포) — 배포 전 서버는 `canTerminate`를 내리지 않아 버튼이 보이지 않는다.
   */
  terminate: async (
    contractId: number,
    body: AdminContractTerminateRequest
  ) => {
    const mocked = await mockWrite(contractId, "TERMINATED");
    if (mocked) {
      return mocked;
    }
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
    if (await mockModule()) {
      // 목업 계약 번호로 실서버 S3에 올리지 않는다
      throw new Error("mock scenario: upload disabled");
    }
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
