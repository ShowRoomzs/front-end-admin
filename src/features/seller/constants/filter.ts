import type { FilterOptionGroup } from "@/common/components/FilterCard/FilterCard";
import { parseMapToOptions } from "@/common/utils/parseMapToOptions";
import {
  SELLER_REGISTRATION_KEYWORD_TYPE,
  SELLER_REGISTRATION_STATUS,
} from "@/features/seller/constants/params";
import type {
  SellerRegistrationParams,
  SellerUserListParams,
} from "@/features/seller/services/sellerService";

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

export const SELLER_USER_FILTER_OPTIONS: FilterOptionGroup<SellerUserListParams> =
  {
    카테고리: [
      {
        key: "mainCategory",
        type: "select",
        placeholder: "대표 카테고리",
        // option은 SellerUserManagement에서 동적으로 처리
      },
    ],
    검색: [
      {
        key: "marketName",
        type: "input",
        placeholder: "마켓명을 입력해 주세요.",
      },
    ],
  };
