import { apiInstance } from "@/common/lib/apiInstance";
import type { CreateNoticeRequest } from "@/features/notice/types/notice";

export const noticeService = {
  createNotice: async (data: CreateNoticeRequest) => {
    const response = await apiInstance.post("/admin/notices", data); 
    return response.data;
  },
};