import type { FilterOptionGroup } from "@/common/components/FilterCard/FilterCard";
import type { ProductListParams } from "@/features/product/services/productService";

export const PRODUCT_LIST_FILTER_OPTIONS: FilterOptionGroup<ProductListParams> =
  {
    검색: [
      {
        key: "q",
        type: "input",
        placeholder: "상품명을 입력해주세요.",
      },
    ],
  };
