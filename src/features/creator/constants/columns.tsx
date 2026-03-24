import type { Columns } from "@/common/components/Table/types";
import { formatDate } from "@/common/utils/formatDate";
import type { CreatorApplicationInfo } from "@/features/creator/services/creatorService";
import type { SellerRegistrationStatus } from "@/features/seller/services/sellerService";
import RegistrationStatusBadge from "@/features/user/components/RegistrationStatusBadge/RegistrationStatusBadge";

export const CREATOR_APPLICATION_COLUMNS: Columns<CreatorApplicationInfo> = [
  {
    key: "showroomName",
    label: "쇼룸명",
  },
  {
    key: "createdAt",
    label: "신청일",
    render: (v) => formatDate(v as string),
  },
  {
    key: "showroomName",
    label: "담당자 이름 / 연락처",
    render: (_v, record) => `${record.name} / ${record.phoneNumber}`,
  },
  {
    key: "status",
    label: "상태",
    align: "center",
    render: (v) => (
      <RegistrationStatusBadge
        status={v as Exclude<SellerRegistrationStatus, null>}
      />
    ),
  },
];
