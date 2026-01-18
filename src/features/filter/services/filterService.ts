import { apiInstance } from "@/common/lib/apiInstance";

export const filterService = {
  getFilters: async () => {
    const {data : response } =await apiInstance.get("/common/filters")

    return response
  },
};