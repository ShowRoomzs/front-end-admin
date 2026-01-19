import type { Option } from "@/common/types";
import type {
  FilterCondition,
  FilterType,
} from "@/features/filter/services/filterService";

export const FILTER_TYPE_OPTIONS: Array<Option<FilterType>> = [
  {
    value: "COLOR",
    label: "Color",
  },
  {
    value: "RANGE",
    label: "Range",
  },
  {
    value: "BRAND",
    label: "Brand",
  },
  {
    value: "CHECKBOX",
    label: "Checkbox",
  },
];

export const FILTER_CONDITION_OPTIONS: Array<Option<FilterCondition>> = [
  {
    value: "OR",
    label: "OR",
  },
  {
    value: "AND",
    label: "AND",
  },
  {
    value: null,
    label: "NULL",
  },
];
