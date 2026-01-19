import { apiInstance } from "@/common/lib/apiInstance";
export type FilterType = "CHECKBOX" | "COLOR" | "RANGE" | "BRAND"; // TODO : 타입 추가
export type FilterCondition = "OR" | "AND" | null;
export interface FilterValue {
  id: number | string;
  value: string;
  label: string;
  extra: string | null;
  sortOrder: number;
  isActive: boolean;
}
export interface Filter {
  id: number | string;
  filterKey: string;
  label: string;
  filterType: FilterType;
  condition: FilterCondition;
  sortOrder: number;
  isActive: boolean;
  values: Array<FilterValue>;
}

export const filterService = {
  getFilters: async () => {
    const { data: response } =
      await apiInstance.get<Array<Filter>>("/common/filters");

    return response;
  },
};
