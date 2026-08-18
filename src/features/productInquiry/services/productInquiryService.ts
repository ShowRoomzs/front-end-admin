import { apiInstance } from "@/common/lib/apiInstance";
import type {
  ProductInquiryDeleteExecuteRequest,
  ProductInquiryDetail,
  ProductInquiryDetailParams,
  ProductInquiryListParams,
  ProductInquiryListResponse,
  ProductInquiryRejectRequest,
  ProductInquiryTypeOption,
} from "@/features/productInquiry/types/productInquiry";

const BASE_PATH = "/admin/product-inquiries";

export const productInquiryService = {
  getProductInquiryList: async (params: ProductInquiryListParams) => {
    const { data: response } =
      await apiInstance.get<ProductInquiryListResponse>(BASE_PATH, { params });
    return response;
  },
  getProductInquiryTypes: async () => {
    const { data: response } = await apiInstance.get<
      Array<ProductInquiryTypeOption>
    >(`${BASE_PATH}/types`);
    return response;
  },
  getProductInquiryDetail: async (
    inquiryId: number,
    params: ProductInquiryDetailParams
  ) => {
    const { data: response } = await apiInstance.get<ProductInquiryDetail>(
      `${BASE_PATH}/${inquiryId}`,
      { params }
    );
    return response;
  },
  /** 삭제 집행 — 삭제 요청 유무와 무관하게 운영자가 직접 할 수 있다 */
  executeDelete: async (
    inquiryId: number,
    data: ProductInquiryDeleteExecuteRequest
  ) => {
    await apiInstance.post(
      `${BASE_PATH}/${inquiryId}/delete-request/execute`,
      data
    );
  },
  /** 삭제 요청 반려 — 요청이 있는 건에만 성립한다 */
  rejectDeleteRequest: async (
    inquiryId: number,
    data: ProductInquiryRejectRequest
  ) => {
    await apiInstance.post(
      `${BASE_PATH}/${inquiryId}/delete-request/reject`,
      data
    );
  },
};
