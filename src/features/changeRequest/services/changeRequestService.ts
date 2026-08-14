import { apiInstance } from "@/common/lib/apiInstance";
import type { BaseParams, PageInfo } from "@/common/types";

/** 요청 유형 — 백엔드 ChangeRequestType enum과 1:1 */
export type ChangeRequestType = "BUSINESS_INFO" | "SETTLEMENT_ACCOUNT";

/**
 * 요청 상태 — 백엔드 ChangeRequestStatus enum과 1:1.
 * CANCELED는 브랜드가 검토 중에 스스로 철회한 건이라 전체 탭에서만 나타난다.
 */
export type ChangeRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELED";

/**
 * 목록 탭 = 조회 필터 — 백엔드 AdminChangeRequestStatusFilter와 1:1.
 * 상태(ChangeRequestStatus)와 다른 타입이다: 취소 탭은 없고, ALL만 CANCELED를 포함한다.
 */
export type ChangeRequestStatusFilter =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "ALL";

export interface ChangeRequestParams extends BaseParams {
  status: ChangeRequestStatusFilter;
  keyword: string;
}

/** 목록 행 — 백엔드 AdminChangeRequestDto.ListItem과 1:1 */
export interface ChangeRequestInfo {
  requestId: number;
  /** 목록에는 표시하지 않는다(rev.4에서 제거) — 상세 전용 */
  requestCode: string;
  brandName: string;
  type: ChangeRequestType;
  requestedAt: string;
  /** 검토 대기 건은 null */
  processedAt: string | null;
  /** "18h" · "2일 3h" — 서버가 만든 문구. 처리 완료 건은 null */
  elapsedText: string | null;
  /** 검토 대기 + 48시간 초과 */
  slaExceeded: boolean;
  status: ChangeRequestStatus;
}

/**
 * 상태별 건수 — 검색어는 반영, 탭 필터는 미반영.
 * all은 CANCELED까지 포함한 네 상태의 합이라 pending+approved+rejected와 다를 수 있다.
 */
export interface ChangeRequestStatusCounts {
  pending: number;
  approved: number;
  rejected: number;
  canceled: number;
  all: number;
}

/** 목록 응답 — 백엔드 AdminChangeRequestDto.ListResponse와 1:1 */
export interface ChangeRequestListResponse {
  content: Array<ChangeRequestInfo>;
  pageInfo: PageInfo;
  statusCounts: ChangeRequestStatusCounts;
}

export interface ChangeRequestSummary {
  pendingCount: number;
}

/**
 * 반려 사유 옵션 — 백엔드 ChangeRequestRejectReason enum에서 유형별로 걸러 내려준다
 * (사업자 정보 6종 / 정산 계좌 5종). code를 유니온으로 박지 않는 이유가 여기 있다.
 */
export interface ChangeRequestRejectReasonOption {
  code: string;
  label: string;
  /** "기타"만 true — 선택 시 상세 사유가 필수로 전환된다 */
  detailRequired: boolean;
}

/**
 * 대조표 1행 — 백엔드 AdminChangeRequestDto.DiffRow와 1:1.
 * 변경된 행만 오는 게 아니라 **유형별 고정 전체 행**이 항상 내려온다.
 */
export interface ChangeDiffRow {
  fieldKey: string;
  label: string;
  currentValue: string;
  /** null이면 이번 요청의 변경 대상이 아니다 → "변경 없음" */
  requestedValue: string | null;
  changed: boolean;
  /** 사업자등록번호만 true → "변경 요청 불가" 상수 표시 */
  locked: boolean;
}

export interface ChangeRequestEvidence {
  /** 유형에서 파생되는 상수 — 사업자등록증 / 통장 사본 */
  documentLabel: string;
  fileName: string;
  fileSizeBytes: number;
  /** 소문자·점 없음. 없으면 빈 문자열 */
  extension: string;
  /** 인증이 필요 없는 공개 S3 URL — 그대로 img src에 넣으면 된다 */
  fileUrl: string;
  uploadedAt: string;
}

export interface ChangeRequestReferenceItem {
  label: string;
  value: string;
}

/** 정산 계좌 유형에서만 내려온다 — 예금주와 사업자등록증 상호 대조 */
export interface ChangeRequestHolderCheck {
  requestedHolder: string;
  companyName: string;
  mismatch: boolean;
}

export type ChangeRequestHistoryEvent =
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELED";

export interface ChangeRequestHistoryItem {
  event: ChangeRequestHistoryEvent;
  occurredAt: string;
  actorLabel: string;
}

/** 상세 — 백엔드 AdminChangeRequestDto.DetailResponse와 1:1 */
export interface ChangeRequestDetailInfo {
  requestId: number;
  requestCode: string;
  brandName: string;
  marketId: number;
  type: ChangeRequestType;
  status: ChangeRequestStatus;
  slaExceeded: boolean;
  requestedAt: string;
  processedAt: string | null;
  requesterName: string;
  elapsedText: string | null;
  /** 브랜드가 쓴 원문. 정산 계좌는 사유가 선택값이라 null이 정상이다 */
  reason: string | null;
  diff: Array<ChangeDiffRow>;
  /** 변경 항목 라벨 — 대조 확인 안내문을 조립할 때 쓴다 */
  changedFieldLabels: Array<string>;
  evidence: ChangeRequestEvidence;
  /** 변경 대상은 아니지만 동일 사업자인지 확인할 때 함께 봐야 하는 값들 */
  referenceItems: Array<ChangeRequestReferenceItem>;
  holderCheck: ChangeRequestHolderCheck | null;
  history: Array<ChangeRequestHistoryItem>;
  /** 서버가 **현재 탭 순서 기준**으로 계산해 준다 — 목록에서 id를 들고 다닐 필요가 없다 */
  prevRequestId: number | null;
  nextRequestId: number | null;
}

export interface RejectChangeRequestData {
  reasonType: string;
  reasonDetail?: string;
}

/** 승인·반려 응답 — 처리 완료 토스트 문구를 여기서 조립한다 */
export interface ChangeRequestProcessResponse {
  requestId: number;
  requestCode: string;
  brandName: string;
  type: ChangeRequestType;
  status: ChangeRequestStatus;
  processedAt: string;
  rejectReason: string | null;
  rejectReasonDetail: string | null;
}

export const changeRequestService = {
  getChangeRequestList: async (params: ChangeRequestParams) => {
    const { data: response } = await apiInstance.get<ChangeRequestListResponse>(
      "/admin/change-requests",
      {
        params,
      }
    );

    return response;
  },
  /** 사이드바 뱃지 전용 — 목록과 달리 검색어·탭에 영향받지 않는 전체 검토 대기 건수 */
  getChangeRequestSummary: async () => {
    const { data: response } = await apiInstance.get<ChangeRequestSummary>(
      "/admin/change-requests/summary"
    );

    return response;
  },
  getChangeRequestRejectReasons: async (type: ChangeRequestType) => {
    const { data: response } = await apiInstance.get<
      Array<ChangeRequestRejectReasonOption>
    >("/admin/change-requests/reject-reasons", {
      params: { type },
    });

    return response;
  },
  /**
   * status는 조회 필터가 아니라 **이전/다음 계산 범위**다.
   * 목록에서 보던 탭을 그대로 넘겨야 상세의 이동 순서가 목록과 어긋나지 않는다.
   */
  getChangeRequestDetail: async (
    requestId: number,
    status: ChangeRequestStatusFilter
  ) => {
    const { data: response } = await apiInstance.get<ChangeRequestDetailInfo>(
      `/admin/change-requests/${requestId}`,
      {
        params: { status },
      }
    );

    return response;
  },
  approveChangeRequest: async (requestId: number) => {
    const { data: response } =
      await apiInstance.post<ChangeRequestProcessResponse>(
        `/admin/change-requests/${requestId}/approve`
      );

    return response;
  },
  rejectChangeRequest: async (
    requestId: number,
    data: RejectChangeRequestData
  ) => {
    const { data: response } =
      await apiInstance.post<ChangeRequestProcessResponse>(
        `/admin/change-requests/${requestId}/reject`,
        data
      );

    return response;
  },
};
