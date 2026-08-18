import type { FilterOptionGroup } from "@/common/components/FilterCard/FilterCard";
import { parseMapToOptions } from "@/common/utils/parseMapToOptions";
import { DEVICE_TYPE, LOGIN_STATUS } from "@/features/user/constants/params";
import type { LoginHistoryParams } from "@/features/user/services/commonUserService";

export const LOGIN_HISTORY_FILTER_OPTIONS: FilterOptionGroup<LoginHistoryParams> =
  {
    기간: [
      {
        key: "startDate",
        endKey: "endDate",
        type: "dateRange",
      },
    ],
    지역: [
      {
        key: "country",
        endKey: "city",
        type: "region",
      },
    ],
    "기기 유형": [
      {
        key: "deviceType",
        type: "select",
        options: parseMapToOptions(DEVICE_TYPE, true),
      },
    ],
    "로그인 상태": [
      {
        key: "status",
        type: "select",
        options: parseMapToOptions(LOGIN_STATUS, true),
      },
    ],
  };
