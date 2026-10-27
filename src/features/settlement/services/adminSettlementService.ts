import { apiInstance } from "@/common/lib/apiInstance";
import {
  DEV_MOCK_ENABLED,
  mockDelay,
  mockScenario,
} from "@/common/utils/devMock";
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams";
import { LEGACY_RESIDENT_NUMBER_MISSING } from "@/features/settlement/constants/params";
import type {
  BrandInvoicePayload,
  ClawbackListItem,
  CompanyInfo,
  EvidenceListItem,
  RedistributePayload,
  SettlementDetail,
  SettlementListItem,
  SettlementListParams,
  SettlementListResponse,
  SettlementSummary,
  VerifyPayload,
} from "@/features/settlement/types";

/**
 * 어드민 정산 관리 — `/v1/admin/settlements`(백엔드 AdminSettlementController · 44 어드민 설계서 7절).
 *
 * - 목록은 탭 하나의 엔드포인트다 — 정산 탭은 정산 행, `EVIDENCE`는 증빙 문서 행, `CLAWBACK`은 차감 행.
 * - 쓰기 3종(M3 · M4 · M5)은 갱신된 상세를 돌려준다. 실패 문구는 화면이 에러 코드로 직접 그리므로
 *   공용 토스트를 끈다(`suppressErrorToast`).
 * - 공구 쪽 `POST /admin/group-buys/{id}/settlement/confirm`은 폐기된 「운영자 확정」 흐름이라 쓰지 않는다.
 *
 * DEV 목업(개발 서버 전용 · 배포본은 항상 실호출) — origin/main(1021 반영)의 새 응답이 개발 서버에 아직 없다.
 * 백엔드 배포 후 목업 분기와 `mocks/settlementMock.ts`를 삭제한다.
 * - 상세 `?mock=` : `fees`(D1 + 배송비 · 재발송비 · 반품 시 차감한 최초 배송비) · `freight`(D3 − 운임 정산 ·
 *   옛 주민번호 보류 코드 섞임) · `adjusting`(D4 · 이슈 스레드 링크) · `withdrawn`(기-14 철회 확정) ·
 *   `evidence`(D7 사업자 · M4 대조 · M5 등록)
 * - 목록 차감 탭 `?mock=clawback` : L6(차감 예정 · 미회수 「베타: 플랫폼 손실 처리」 · 재계산 가상 행)
 * - 목록 증빙 탭 `?mock=evidence-legacy` : L5에 옛 서버의 주민번호 미등록 가상 행이 섞인 응답(걸러 내는지)
 * - 운영자 사업자 정보(`GET /common/company-info`)는 DEV에서 늘 목업이다(M4 공급받는자).
 */
const BASE = "/admin/settlements";

/**
 * 기-12 — 옛 서버가 내리던 「주민번호 미등록」 가상 행을 걸러 낸다. 건수 · 지급 보류 수도 그만큼 뺀다
 * (이 페이지에서 걸러 낸 만큼만 — 증빙 탭은 기한순이라 가상 행(기한 없음)은 끝 페이지에 몰린다).
 * 서버(origin/main)는 이미 내리지 않으므로 배포 뒤에는 아무것도 빠지지 않는다.
 */
function withoutLegacyEvidence(
  data: SettlementListResponse<EvidenceListItem>
): SettlementListResponse<EvidenceListItem> {
  const content = data.content.filter(
    (row) => (row.type as string) !== LEGACY_RESIDENT_NUMBER_MISSING
  );
  const removed = data.content.length - content.length;
  if (removed === 0) return data;
  const minus = (value: number | undefined) =>
    value === undefined ? undefined : Math.max(0, value - removed);
  return {
    ...data,
    content,
    pageInfo: {
      ...data.pageInfo,
      totalResults: Math.max(0, data.pageInfo.totalResults - removed),
    },
    toolbar: data.toolbar && {
      ...data.toolbar,
      count: minus(data.toolbar.count),
      payoutBlockedCount: minus(data.toolbar.payoutBlockedCount),
    },
  };
}

/** 고정 정렬 탭은 sort를 보내지 않는다(서버도 무시한다) · 증빙 탭은 검색을 받지 않는다 */
function listQuery(params: SettlementListParams): URLSearchParams {
  return paramsToSearchParams({
    tab: params.tab,
    keyword: params.tab === "EVIDENCE" ? "" : params.keyword.trim(),
    sort: params.tab === "ALL" ? params.sort : "",
    page: params.page,
    size: params.size,
  });
}

export const adminSettlementService = {
  /** 탭 숫자 · GNB 배지 — 검색 조건과 무관한 전체 기준 */
  getSummary: async () => {
    const { data } = await apiInstance.get<SettlementSummary>(
      `${BASE}/summary`
    );
    return data;
  },

  getSettlementList: async (params: SettlementListParams) => {
    const { data } = await apiInstance.get<
      SettlementListResponse<SettlementListItem>
    >(BASE, { params: listQuery(params) });
    return data;
  },

  getEvidenceList: async (params: SettlementListParams) => {
    if (DEV_MOCK_ENABLED && mockScenario() === "evidence-legacy") {
      const { MOCK_LEGACY_EVIDENCE_LIST } =
        await import("@/features/settlement/mocks/settlementMock");
      return withoutLegacyEvidence(await mockDelay(MOCK_LEGACY_EVIDENCE_LIST));
    }
    const { data } = await apiInstance.get<
      SettlementListResponse<EvidenceListItem>
    >(BASE, { params: listQuery({ ...params, tab: "EVIDENCE" }) });
    return withoutLegacyEvidence(data);
  },

  getClawbackList: async (params: SettlementListParams) => {
    if (DEV_MOCK_ENABLED && mockScenario() === "clawback") {
      const { MOCK_CLAWBACK_LIST } =
        await import("@/features/settlement/mocks/settlementMock");
      return mockDelay(MOCK_CLAWBACK_LIST);
    }
    const { data } = await apiInstance.get<
      SettlementListResponse<ClawbackListItem>
    >(BASE, { params: listQuery({ ...params, tab: "CLAWBACK" }) });
    return data;
  },

  getDetail: async (settlementId: number) => {
    const scenario = DEV_MOCK_ENABLED ? mockScenario() : null;
    if (scenario) {
      const { MOCK_DETAILS } =
        await import("@/features/settlement/mocks/settlementMock");
      const mock = MOCK_DETAILS[scenario];
      if (mock) return mockDelay(mock);
    }
    const { data } = await apiInstance.get<SettlementDetail>(
      `${BASE}/${settlementId}`,
      // 없는 정산(404)은 화면이 「찾을 수 없습니다」로 그린다
      { suppressErrorToast: true }
    );
    return data;
  },

  /**
   * 운영자 사업자 정보 `GET /v1/common/company-info`(인증 불요 · 1021 설계서 10-1) — M4 공급받는자(기-35).
   * origin/main에만 있고 개발 서버에 아직 없다 — DEV는 목업(백엔드 배포 후 삭제). 실패하면 화면이 대체값을 쓴다.
   */
  getCompanyInfo: async () => {
    if (DEV_MOCK_ENABLED) {
      const { MOCK_COMPANY_INFO } =
        await import("@/features/settlement/mocks/settlementMock");
      return mockDelay(MOCK_COMPANY_INFO);
    }
    const { data } = await apiInstance.get<CompanyInfo>(
      "/common/company-info",
      { suppressErrorToast: true }
    );
    return data;
  },

  /** 정산 명세(xlsx) — 확정 전이면 409 SETTLEMENT_STATEMENT_NOT_READY */
  downloadStatement: async (settlementId: number) => {
    const { data } = await apiInstance.get<Blob>(
      `${BASE}/${settlementId}/statement.xlsx`,
      { responseType: "blob", suppressErrorToast: true }
    );
    return data;
  },

  /**
   * 원천세 신고 자료(xlsx · 월 `YYYY-MM`) — 주민등록번호가 들어 있어 서버가 내려받을 때마다 반출 기록을 남긴다.
   */
  downloadWithholdingReport: async (month: string) => {
    const { data } = await apiInstance.get<Blob>(`${BASE}/withholding-report`, {
      params: { month },
      responseType: "blob",
      suppressErrorToast: true,
    });
    return data;
  },

  /** M3 재분배 — 확정 금액 그대로 PG에 다시 지시한다(재계산 없음) */
  redistribute: async (settlementId: number, payload: RedistributePayload) => {
    const { data } = await apiInstance.post<SettlementDetail>(
      `${BASE}/${settlementId}/payouts/${payload.payoutId}/redistribute`,
      { accountSource: payload.accountSource },
      { suppressErrorToast: true }
    );
    return data;
  },

  /** M4 승인번호 대조 — 운영자는 번호를 입력하지 않고 결과만 고른다 */
  verifyTaxInvoice: async (settlementId: number, payload: VerifyPayload) => {
    const { data } = await apiInstance.post<SettlementDetail>(
      `${BASE}/${settlementId}/tax-documents/${payload.documentId}/verify`,
      { result: payload.result },
      { suppressErrorToast: true }
    );
    return data;
  },

  /** M5 브랜드 세금계산서 발행본 등록(multipart) — 정상 등록 뒤에는 다시 부르지 않는다 */
  issueBrandInvoice: async (
    settlementId: number,
    payload: BrandInvoicePayload
  ) => {
    const form = new FormData();
    form.append("file", payload.file);
    form.append("approvalNumber", payload.approvalNumber);
    form.append("issuedDate", payload.issuedDate);
    const { data } = await apiInstance.post<SettlementDetail>(
      `${BASE}/${settlementId}/tax-documents/${payload.documentId}/issue`,
      form,
      { suppressErrorToast: true }
    );
    return data;
  },
};
