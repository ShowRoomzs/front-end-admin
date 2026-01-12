import type { FilterOptionGroup } from "@/common/components/FilterCard/FilterCard";
import { parseMapToOptions } from "@/common/utils/parseMapToOptions";
import {
  SELLER_REGISTRATION_KEYWORD_TYPE,
  SELLER_REGISTRATION_STATUS,
} from "@/features/user/constants/params";
import type { SellerRegistrationParams } from "@/features/user/services/sellerService";

export const SELLER_REGISTRATION_FILTER_OPTIONS: FilterOptionGroup<SellerRegistrationParams> =
  {
    상태: [
      {
        key: "status",
        type: "radio",
        options: parseMapToOptions(SELLER_REGISTRATION_STATUS, true),
      },
    ],
    기간: [
      {
        key: "startDate",
        type: "dateRange",
        endKey: "endDate",
      },
    ],
    검색: [
      {
        key: "keywordType",
        type: "select",
        options: parseMapToOptions(SELLER_REGISTRATION_KEYWORD_TYPE),
      },
      {
        key: "keyword",
        type: "input",
        placeholder: "검색어를 입력해주세요.",
      },
    ],
  };
