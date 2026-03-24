import type { FilterOptionGroup } from "@/common/components/FilterCard/FilterCard";
import { parseMapToOptions } from "@/common/utils/parseMapToOptions";
import { SELLER_REGISTRATION_STATUS } from "@/features/seller/constants/params";
import type { CreatorApplicationParams } from "@/features/creator/services/creatorService";

export const CREATOR_APPLICATION_FILTER_OPTIONS: FilterOptionGroup<CreatorApplicationParams> =
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
  };
