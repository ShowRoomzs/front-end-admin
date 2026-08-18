import { apiInstance } from "@/common/lib/apiInstance";
import type {
  InquiryAnswerRequest,
  InquiryAnswerResponse,
  InquiryDetail,
  InquiryDetailParams,
  InquiryListParams,
  InquiryListResponse,
  InquirySummary,
  InquiryTypeOption,
} from "@/features/inquiry/types/inquiry";

const BASE_PATH = "/admin/inquiries";

export const inquiryService = {
  getInquiryList: async (params: InquiryListParams) => {
    const { data: response } = await apiInstance.get<InquiryListResponse>(
      BASE_PATH,
      { params }
    );
    return response;
  },
  /** GNB 배지용 미답변 건수 — 목록을 열지 않은 화면에서도 필요해 별도 엔드포인트다(§17-7) */
  getInquirySummary: async () => {
    const { data: response } = await apiInstance.get<InquirySummary>(
      `${BASE_PATH}/summary`
    );
    return response;
  },
  /**
   * 유형 셀렉트 옵션. 하드코딩하지 않는다 — FAQ 카테고리와 enum을 공유하므로
   * 한쪽이 바뀌면 서버가 내려주는 목록만 달라지면 된다(§17-2-1 단일 소스 원칙).
   */
  getInquiryTypes: async () => {
    const { data: response } = await apiInstance.get<Array<InquiryTypeOption>>(
      `${BASE_PATH}/types`
    );
    return response;
  },
  getInquiryDetail: async (inquiryId: number, params: InquiryDetailParams) => {
    const { data: response } = await apiInstance.get<InquiryDetail>(
      `${BASE_PATH}/${inquiryId}`,
      { params }
    );
    return response;
  },
  registerAnswer: async (inquiryId: number, data: InquiryAnswerRequest) => {
    const { data: response } = await apiInstance.post<InquiryAnswerResponse>(
      `${BASE_PATH}/${inquiryId}/answer`,
      data
    );
    return response;
  },
};
