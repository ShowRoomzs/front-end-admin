import { apiInstance } from "@/common/lib/apiInstance";
import type {
  ConsumerListParams,
  ConsumerListResponse,
} from "@/features/consumer/types/consumer";

export const consumerService = {
  getConsumerList: async (params: ConsumerListParams) => {
    const { data: response } = await apiInstance.get<ConsumerListResponse>(
      "/admin/users",
      { params }
    );
    return response;
  },
};
