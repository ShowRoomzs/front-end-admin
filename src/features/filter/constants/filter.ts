import type { Option } from "@/common/types";
import type {
  FilterCondition,
  FilterUIType,
} from "@/features/filter/types/filter";

export const FILTER_TYPE_OPTIONS: Array<Option<FilterUIType>> = [
  {
    value: "select",
    label: "Select",
  },
  {
    value: "radio",
    label: "Radio",
  },
  {
    value: "color",
    label: "Color",
  },
  {
    value: "brand",
    label: "Brand",
  },
  {
    value: "range",
    label: "Range",
  },
  {
    value: "checkbox",
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
