import { apiInstance } from "@/common/lib/apiInstance";
import { normalizeCategoryCounts } from "@/features/faq/utils/normalizeCategoryCounts";
import type {
  Faq,
  FaqCategory,
  FaqListParams,
  FaqListResponse,
  FaqReorderRequest,
  FaqRequest,
  RawFaqListResponse,
} from "@/features/faq/types/faq";

export const faqService = {
  getFaqCategories: async () => {
    const { data: response } = await apiInstance.get<Array<FaqCategory>>(
      "/common/faqs/categories"
    );
    return response;
  },
  // 카테고리 건수는 서버 버전마다 모양이 달라 경계에서 한 번만 정규화하고 넘긴다
  getFaqList: async (params: FaqListParams): Promise<FaqListResponse> => {
    const { data: response } = await apiInstance.get<RawFaqListResponse>(
      "/admin/faqs",
      { params }
    );
    return {
      ...response,
      categoryCounts: normalizeCategoryCounts(response.categoryCounts),
    };
  },
  createFaq: async (data: FaqRequest) => {
    const response = await apiInstance.post("/admin/faqs", data);
    return response.data;
  },
  getFaqDetail: async (faqId: number) => {
    const { data: response } = await apiInstance.get<Faq>(
      `/admin/faqs/${faqId}`
    );
    return response;
  },
  updateFaq: async (faqId: number, data: FaqRequest) => {
    const response = await apiInstance.put(`/admin/faqs/${faqId}`, data);
    return response.data;
  },
  deleteFaq: async (faqId: number) => {
    const response = await apiInstance.delete(`/admin/faqs/${faqId}`);
    return response.data;
  },
  reorderFaqs: async (data: FaqReorderRequest) => {
    const response = await apiInstance.patch("/admin/faqs/reorder", {
      reorderList: data,
    });
    return response.data;
  },
};
