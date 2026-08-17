import { apiInstance } from "@/common/lib/apiInstance";
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
  // 서버가 건수를 배열로 주므로 경계에서 맵으로 바꿔 넘긴다(탭마다 find를 돌지 않도록)
  getFaqList: async (params: FaqListParams): Promise<FaqListResponse> => {
    const { data: response } = await apiInstance.get<RawFaqListResponse>(
      "/admin/faqs",
      { params }
    );
    return {
      ...response,
      categoryCounts: response.categoryCounts
        ? Object.fromEntries(
            response.categoryCounts.map((item) => [item.category, item.count])
          )
        : undefined,
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
