import { apiInstance } from "@/common/lib/apiInstance";
import { paramsToSearchParams } from "@/common/utils/paramsToSearchParams";
import type {
  BrandInvoicePayload,
  ClawbackListItem,
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
 */
const BASE = "/admin/settlements";

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
    const { data } = await apiInstance.get<
      SettlementListResponse<EvidenceListItem>
    >(BASE, { params: listQuery({ ...params, tab: "EVIDENCE" }) });
    return data;
  },

  getClawbackList: async (params: SettlementListParams) => {
    const { data } = await apiInstance.get<
      SettlementListResponse<ClawbackListItem>
    >(BASE, { params: listQuery({ ...params, tab: "CLAWBACK" }) });
    return data;
  },

  getDetail: async (settlementId: number) => {
    const { data } = await apiInstance.get<SettlementDetail>(
      `${BASE}/${settlementId}`,
      // 없는 정산(404)은 화면이 「찾을 수 없습니다」로 그린다
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
