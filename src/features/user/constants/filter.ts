import type { FilterOptionGroup } from "@/common/components/FilterCard/FilterCard";
import { parseMapToOptions } from "@/common/utils/parseMapToOptions";
import {
  SOCIAL_PROVIDER_TYPE,
  USER_STATUS_TYPE,
} from "@/features/user/constants/params";
import type { CommonUserListParams } from "@/features/user/services/commonUserService";

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
