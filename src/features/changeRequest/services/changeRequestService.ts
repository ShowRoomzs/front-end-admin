import { apiInstance } from "@/common/lib/apiInstance";
import type { BaseParams, PageInfo } from "@/common/types";
import {
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock";

/*
  어드민 변경 요청 API — 백엔드 `AdminChangeRequestController` · `AdminChangeRequestDto`(origin/main)와 1:1.
  배포본은 항상 실호출한다.

  엔드포인트 6개는 개발 서버(api.showroomz.shop)에 이미 있다. 다만 개발 서버는 옛 응답(브랜드 2종 ·
  `brandName` · `marketId`)만 주고, origin/main에서 붙은 것 — 요청자(`requester`) · 인플루언서 유형 3종
  (TO_BUSINESS · TO_INDIVIDUAL · CREATOR_ACCOUNT) · `compareItems` · `approvalImpact` · `source` 등 — 은
  아직 배포되지 않았다. 그래서 새 필드는 전부 optional로 받고(`utils/requester.ts`가 옛 응답을 메운다),
  로컬 화면 확인용으로 **개발 서버(`pnpm dev`)에서만** 목업 어댑터(`mocks/changeRequestMock.ts`)를 쓴다.

  ⚠ 백엔드 배포 후 삭제: `changeRequestMock()` 분기와 `mocks/changeRequestMock.ts`.

  DEV 목업 시나리오(`?mock=<값>`):
  - (없음) · `cr`          C1 목록(브랜드 4 · 인플루언서 3 · 검토 대기 5) — 행마다 상세가 다르다
                           ○○코스메틱 C3 · 예린 뷰티 C3a · 다은 데스크 C3b · 하린_뷰티랩 C4b · 글로우랩 C4(예금주 불일치 · C6)
                           네이처핏(승인) · 수분케어랩(반려) — 처리 완료 상세
  - `cr-empty`             C2 검토 대기 0건(빈 상태)
  - `cr-holder-mismatch`   C4b 인플루언서 계좌의 요청 예금주가 본인 실명과 다르다(불일치 경고)
  - `cr-no-account-change` C3b 「승인하면」 계좌 변경 필요 없음(서버 현재 값 — §55 B-9 전에는 항상 false)
  - `live`                 목업을 끄고 개발 서버를 실호출한다
  승인 · 반려는 목업 안의 상태를 바꿔 다음 상태로 넘어간다(새로고침하면 처음으로).
*/
function changeRequestMock(): string | null {
  if (!DEV_MOCK_ENABLED) return null;
  const scenario = mockScenario();
  if (scenario === "live") return null;
  return scenario?.startsWith("cr") ? scenario : "cr";
}

async function loadMock() {
  // 배포 빌드에서 목업 모듈이 청크로 남지 않게 상수 조건으로 막는다(번들러가 이 분기를 지운다)
  if (!import.meta.env.DEV) throw new Error("mock disabled");
  return import("../mocks/changeRequestMock");
}

/**
 * 요청 유형 — 백엔드 ChangeRequestType enum과 1:1.
 * 브랜드 2종(BUSINESS_INFO · SETTLEMENT_ACCOUNT) + 인플루언서 3종(사업자 전환 · 비사업자 전환 · 계좌 변경 · 기-22).
 */
export type ChangeRequestType =
  | "BUSINESS_INFO"
  | "SETTLEMENT_ACCOUNT"
  | "TO_BUSINESS"
  | "TO_INDIVIDUAL"
  | "CREATOR_ACCOUNT";

/** 요청자 — 백엔드 ChangeRequesterType enum과 1:1(브랜드 = 파트너센터 · 인플루언서 = 쇼룸 스튜디오) */
export type ChangeRequesterType = "BRAND" | "CREATOR";

/**
 * 요청 상태 — 백엔드 ChangeRequestStatus enum과 1:1.
 * CANCELED는 요청자가 검토 중에 스스로 철회한 건이라 전체 탭에서만 나타난다.
 */
export type ChangeRequestStatus =
  "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";

/**
 * 목록 탭 = 조회 필터 — 백엔드 AdminChangeRequestStatusFilter와 1:1.
 * 상태(ChangeRequestStatus)와 다른 타입이다: 취소 탭은 없고, ALL만 CANCELED를 포함한다.
 */
export type ChangeRequestStatusFilter =
  "PENDING" | "APPROVED" | "REJECTED" | "ALL";

export interface ChangeRequestParams extends BaseParams {
  status: ChangeRequestStatusFilter;
  /** 브랜드명 · 쇼룸명 부분 일치(서버가 둘 다 찾는다) */
  keyword: string;
  /** 서버는 받지만 시안 목록에 필터 UI가 없다(rev.2에서 유형 필터 삭제) — 비워 둔다 */
  requesterType?: ChangeRequesterType;
  type?: ChangeRequestType;
}

/** 요청자 — 백엔드 AdminChangeRequestDto.Requester와 1:1 */
export interface ChangeRequestRequester {
  type: ChangeRequesterType;
  /** BRAND → marketId · CREATOR → creatorId */
  id: number | null;
  /** 브랜드명 또는 쇼룸명(현재 값) */
  name: string;
}

/** 목록 행 — 백엔드 AdminChangeRequestDto.ListItem과 1:1 */
export interface ChangeRequestInfo {
  requestId: number;
  /** 목록에는 표시하지 않는다(rev.4에서 제거) — 상세 전용 */
  requestCode: string;
  /** origin/main 신규 — 개발 서버(옛 응답)에는 없다 */
  requester?: ChangeRequestRequester | null;
  /** deprecated — 브랜드 요청만(인플루언서 요청은 null). requester.name을 쓴다 */
  brandName: string | null;
  type: ChangeRequestType;
  /** origin/main 신규 — 「계좌 변경 (인플루언서)」 등. 화면은 FE 라벨을 쓰고 모르는 유형일 때만 이걸 쓴다 */
  typeLabel?: string | null;
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
  /** origin/main 신규 — 어드민 홈 「브랜드 N」 */
  brandPendingCount?: number;
  /** origin/main 신규 — 어드민 홈 「인플루언서 N」 */
  creatorPendingCount?: number;
}

/**
 * 반려 사유 옵션 — 백엔드 ChangeRequestRejectReason enum에서 유형별로 걸러 내려준다
 * (사업자 정보 6종 / 계좌 5종 / 사업자 구분 변경 6종). code를 유니온으로 박지 않는 이유가 여기 있다.
 */
export interface ChangeRequestRejectReasonOption {
  code: string;
  label: string;
  /** "기타"만 true — 선택 시 상세 사유가 필수로 전환된다 */
  detailRequired: boolean;
}

/**
 * 대조표 행 성격 — 백엔드 DiffRow.source.
 * REQUEST(요청 항목) · LIVE(현재 값 · 바뀌지 않음) · DERIVED(구분 변경에 따라 바뀜) ·
 * DOCUMENT(서버가 값을 갖지 않음 — 서류로 운영자 확인) · CHECK(규칙 판정 — holderCheck)
 */
export type ChangeDiffRowSource =
  "REQUEST" | "LIVE" | "DERIVED" | "DOCUMENT" | "CHECK";

/**
 * 대조표 1행 — 백엔드 AdminChangeRequestDto.DiffRow와 1:1.
 * 변경된 행만 오는 게 아니라 **유형별 고정 전체 행**이 항상 내려온다.
 */
export interface ChangeDiffRow {
  fieldKey: string;
  label: string;
  /** 인플루언서 사업자 전환의 사업자등록번호처럼 현재 값이 없으면 null */
  currentValue: string | null;
  /** null이면 이번 요청의 변경 대상이 아니다 → "변경 없음" */
  requestedValue: string | null;
  changed: boolean;
  /** 사업자등록번호만 true → "변경 요청 불가" 상수 표시 */
  locked: boolean;
  /** origin/main 신규 — 옛 응답(브랜드)에는 없다. 없으면 REQUEST로 본다 */
  source?: ChangeDiffRowSource | string | null;
}

export interface ChangeRequestEvidence {
  /** 유형에서 파생되는 상수 — 사업자등록증 / 통장 사본 / 폐업사실증명원 */
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
  value: string | null;
}

/** 예금주 대조 규칙 — 인플루언서 건만(대표자명 또는 상호 / 본인 실명) */
export type ChangeRequestHolderRule = "REPRESENTATIVE_NAME" | "REAL_NAME";

/**
 * 예금주 대조 — 브랜드 정산 계좌는 requestedHolder · companyName,
 * 인플루언서 건은 currentHolder(= 본인 인증 실명) · rule을 쓴다.
 */
export interface ChangeRequestHolderCheck {
  currentHolder?: string | null;
  rule?: ChangeRequestHolderRule | string | null;
  requestedHolder?: string | null;
  companyName?: string | null;
  /** 브랜드: 예금주 ≠ 상호 · 인플루언서 계좌: 요청 예금주 ≠ 본인 실명 */
  mismatch: boolean;
}

/** 서류와 대조할 값(C5b) — 인플루언서 건만. serverCheck가 MATCH인 행에만 「일치」를 그린다 */
export interface ChangeRequestCompareItem {
  key: string;
  label: string;
  /** 개업일 · 폐업일처럼 서버가 모르는 값은 null(서류로 확인) */
  value: string | null;
  /** 서류의 날짜가 이 시각보다 앞서야 한다 — 요청 시각(now() 이벤트 → UTC 벽시계) */
  mustBeBefore: string | null;
  serverCheck: "MATCH" | "MISMATCH" | string | null;
}

/** 기존 구분으로 끝나는 정산(지급 완료가 아닌 것) */
export interface ChangeRequestRetainedSettlement {
  settlementId: number;
  settlementNumber: string;
  status: string;
}

/** 「승인하면」 카드(C3a · C3b · C7b) — 인플루언서 사업자 구분 변경 · 검토 대기일 때만 */
export interface ChangeRequestApprovalImpact {
  /** NEXT_SETTLEMENT — 정산 생성 시점 스냅샷이라 「다음 정산부터」 */
  appliesFrom: string;
  /** WithholdingType — WITHHOLDING_3_3 · TAX_INVOICE 등 */
  payoutMethodBefore: string;
  payoutMethodAfter: string;
  retainedSettlements: Array<ChangeRequestRetainedSettlement>;
  /** 상호 명의 계좌를 받기 전(§55 B-9)에는 서버가 항상 false를 준다 */
  accountChangeRequired: boolean;
  accountHolderRuleAfter: ChangeRequestHolderRule | string | null;
}

export type ChangeRequestHistoryEvent =
  "REQUESTED" | "APPROVED" | "REJECTED" | "CANCELED";

export interface ChangeRequestHistoryItem {
  event: ChangeRequestHistoryEvent;
  /** now() 이벤트 시각 — UTC 벽시계(formatDateTimeShort가 parseServerDateTime으로 바꾼다) */
  occurredAt: string;
  /** 「브랜드 파트너센터」 · 「쇼룸 스튜디오」 · 운영자 이름 */
  actorLabel: string;
}

/** 상세 — 백엔드 AdminChangeRequestDto.DetailResponse와 1:1 */
export interface ChangeRequestDetailInfo {
  requestId: number;
  requestCode: string;
  /** origin/main 신규 — 개발 서버(옛 응답)에는 없다 */
  requester?: ChangeRequestRequester | null;
  /** deprecated — 브랜드 요청만. requester.name을 쓴다 */
  brandName: string | null;
  /** deprecated — 브랜드 요청만. requester.id를 쓴다 */
  marketId: number | null;
  type: ChangeRequestType;
  status: ChangeRequestStatus;
  slaExceeded: boolean;
  requestedAt: string;
  processedAt: string | null;
  /** 브랜드 담당자 이름 스냅샷 — 인플루언서 요청은 null(화면은 「인플루언서 본인」) */
  requesterName: string | null;
  elapsedText: string | null;
  /** 요청자가 쓴 원문. 계좌 변경은 사유가 선택값이라 null이 정상이다 */
  reason: string | null;
  diff: Array<ChangeDiffRow>;
  /** 변경 항목 라벨 — 대조 확인 안내문을 조립할 때 쓴다 */
  changedFieldLabels: Array<string>;
  evidence: ChangeRequestEvidence;
  /** 변경 대상은 아니지만 함께 봐야 하는 값들(동일 사업자 · 예금주 대조 기준) */
  referenceItems: Array<ChangeRequestReferenceItem>;
  holderCheck: ChangeRequestHolderCheck | null;
  /** origin/main 신규 — 인플루언서 건만 */
  compareItems?: Array<ChangeRequestCompareItem> | null;
  /** origin/main 신규 — 인플루언서 사업자 구분 변경 · 검토 대기일 때만 */
  approvalImpact?: ChangeRequestApprovalImpact | null;
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
  /** origin/main 신규 */
  requester?: ChangeRequestRequester | null;
  /** deprecated — 브랜드 요청만 */
  brandName: string | null;
  type: ChangeRequestType;
  status: ChangeRequestStatus;
  processedAt: string;
  rejectReason: string | null;
  rejectReasonDetail: string | null;
}

export const changeRequestService = {
  /** GET /v1/admin/change-requests */
  getChangeRequestList: async (params: ChangeRequestParams) => {
    const scenario = changeRequestMock();
    if (scenario) {
      const { mockChangeRequestList } = await loadMock();
      return mockDelay(mockChangeRequestList(scenario, params));
    }
    const { data: response } = await apiInstance.get<ChangeRequestListResponse>(
      "/admin/change-requests",
      {
        params: {
          ...params,
          // 빈 값은 보내지 않는다 — 필터를 안 건 것과 같다
          keyword: params.keyword || undefined,
          requesterType: params.requesterType || undefined,
          type: params.type || undefined,
        },
      }
    );

    return response;
  },
  /** GET /v1/admin/change-requests/summary — 사이드바 뱃지 전용(검색어·탭에 영향받지 않는 전체 검토 대기 건수) */
  getChangeRequestSummary: async () => {
    const scenario = changeRequestMock();
    if (scenario) {
      const { mockChangeRequestSummary } = await loadMock();
      return mockDelay(mockChangeRequestSummary(scenario));
    }
    const { data: response } = await apiInstance.get<ChangeRequestSummary>(
      "/admin/change-requests/summary"
    );

    return response;
  },
  /** GET /v1/admin/change-requests/reject-reasons?type= */
  getChangeRequestRejectReasons: async (type: ChangeRequestType) => {
    const scenario = changeRequestMock();
    if (scenario) {
      const { mockChangeRequestRejectReasons } = await loadMock();
      return mockDelay(mockChangeRequestRejectReasons(type));
    }
    const { data: response } = await apiInstance.get<
      Array<ChangeRequestRejectReasonOption>
    >("/admin/change-requests/reject-reasons", {
      params: { type },
    });

    return response;
  },
  /**
   * GET /v1/admin/change-requests/{requestId}?status=
   * status는 조회 필터가 아니라 **이전/다음 계산 범위**다.
   * 목록에서 보던 탭을 그대로 넘겨야 상세의 이동 순서가 목록과 어긋나지 않는다.
   */
  getChangeRequestDetail: async (
    requestId: number,
    status: ChangeRequestStatusFilter
  ) => {
    const scenario = changeRequestMock();
    if (scenario) {
      const { mockChangeRequestDetail } = await loadMock();
      return mockDelay(mockChangeRequestDetail(scenario, requestId, status));
    }
    const { data: response } = await apiInstance.get<ChangeRequestDetailInfo>(
      `/admin/change-requests/${requestId}`,
      {
        params: { status },
      }
    );

    return response;
  },
  /** POST /v1/admin/change-requests/{requestId}/approve */
  approveChangeRequest: async (requestId: number) => {
    const scenario = changeRequestMock();
    if (scenario) {
      const { mockApproveChangeRequest } = await loadMock();
      return mockDelay(mockApproveChangeRequest(requestId));
    }
    const { data: response } =
      await apiInstance.post<ChangeRequestProcessResponse>(
        `/admin/change-requests/${requestId}/approve`
      );

    return response;
  },
  /** POST /v1/admin/change-requests/{requestId}/reject */
  rejectChangeRequest: async (
    requestId: number,
    data: RejectChangeRequestData
  ) => {
    const scenario = changeRequestMock();
    if (scenario) {
      const { mockRejectChangeRequest } = await loadMock();
      return mockDelay(mockRejectChangeRequest(requestId, data));
    }
    const { data: response } =
      await apiInstance.post<ChangeRequestProcessResponse>(
        `/admin/change-requests/${requestId}/reject`,
        data
      );

    return response;
  },
};
