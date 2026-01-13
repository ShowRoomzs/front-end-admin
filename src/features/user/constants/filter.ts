import type { FilterOptionGroup } from "@/common/components/FilterCard/FilterCard";
import { parseMapToOptions } from "@/common/utils/parseMapToOptions";
import {
  SELLER_REGISTRATION_KEYWORD_TYPE,
  SELLER_REGISTRATION_STATUS,
  SOCIAL_PROVIDER_TYPE,
  USER_STATUS_TYPE,
} from "@/features/user/constants/params";
import type { CommonUserListParams } from "@/features/user/services/commonUserService";
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

export const COMMON_USER_FILTER_OPTIONS: FilterOptionGroup<CommonUserListParams> =
  {
    "가입 채널": [
      {
        key: "providerType",
        type: "radio",
        options: parseMapToOptions(SOCIAL_PROVIDER_TYPE, true),
      },
    ],
    가입일: [
      {
        key: "startDate",
        endKey: "endDate",
        type: "dateRange",
      },
    ],
    "활동 상태": [
      {
        key: "status",
        type: "select",
        options: parseMapToOptions(USER_STATUS_TYPE, true),
      },
    ],
  };
