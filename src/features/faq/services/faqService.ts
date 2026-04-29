import { apiInstance } from "@/common/lib/apiInstance";
import type {
  Faq,
  FaqCategory,
  FaqListParams,
  FaqListResponse,
  FaqReorderRequest,
  FaqRequest,
} from "@/features/faq/types/faq";

export const faqService = {
  getFaqCategories: async () => {
    const { data: response } =
      await apiInstance.get<Array<FaqCategory>>("/common/faqs/categories");
    return response;
  },
  getFaqList: async (params: FaqListParams) => {
    const { data: response } = await apiInstance.get<FaqListResponse>(
      "/admin/faqs",
      { params }
    );
    return response;
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
    const response = await apiInstance.patch("/admin/faqs/reorder", data);
    return response.data;
  },
};
