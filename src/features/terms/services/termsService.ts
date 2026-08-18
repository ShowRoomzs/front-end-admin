import { apiInstance } from "@/common/lib/apiInstance";
import type {
  RawTermsListResponse,
  TermsDocumentDetail,
  TermsDocumentRegisterRequest,
  TermsListParams,
  TermsListResponse,
  TermsVersionDetail,
  TermsVersionRegisterRequest,
} from "@/features/terms/types/terms";

const BASE_PATH = "/admin/terms";

/**
 * 약관 API에는 **수정·삭제 엔드포인트가 없다.**
 *
 * 서버에도 없고 여기에도 두지 않는다 — 동의 기록이 "동의한 버전"을 참조하므로 원문이
 * 바뀌면 누가 무엇에 동의했는지가 무너진다(§21 성격). 개정은 새 버전 등록뿐이다.
 */
export const termsService = {
  // 유형 탭 건수를 배열로 주므로 경계에서 맵으로 바꿔 넘긴다
  getTermsList: async (params: TermsListParams): Promise<TermsListResponse> => {
    const { data: response } = await apiInstance.get<RawTermsListResponse>(
      BASE_PATH,
      { params }
    );
    return {
      ...response,
      typeCounts: Object.fromEntries(
        (response.typeCounts ?? []).map((item) => [item.type, item.count])
      ),
    };
  },
  getTermsDocument: async (documentId: number) => {
    const { data: response } = await apiInstance.get<TermsDocumentDetail>(
      `${BASE_PATH}/${documentId}`
    );
    return response;
  },
  getTermsVersion: async (documentId: number, versionId: number) => {
    const { data: response } = await apiInstance.get<TermsVersionDetail>(
      `${BASE_PATH}/${documentId}/versions/${versionId}`
    );
    return response;
  },
  registerDocument: async (data: TermsDocumentRegisterRequest) => {
    const response = await apiInstance.post(BASE_PATH, data);
    return response.data;
  },
  registerVersion: async (
    documentId: number,
    data: TermsVersionRegisterRequest
  ) => {
    const response = await apiInstance.post(
      `${BASE_PATH}/${documentId}/versions`,
      data
    );
    return response.data;
  },
};
