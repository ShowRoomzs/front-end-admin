import type { Columns } from "@/common/components/Table/types";
import { formatDate } from "@/common/utils/formatDate";
import type {
  CommonUserInfo,
  ProviderType,
  UserStatusType,
} from "@/features/user/services/commonUserService";
import type {
  SellerRegistrationInfo,
  SellerRegistrationStatus,
} from "@/features/user/services/sellerService";
import SocialBadge from "@/features/user/components/SocialBadge/SocialBadge";
import RegistrationStatusBadge from "@/features/user/components/RegistrationStatusBadge/RegistrationStatusBadge";
import UserStatusBadge from "@/features/user/components/UserStatusBadge/UserStatusBadge";

export const SELLER_REGISTRATION_COLUMNS: Columns<SellerRegistrationInfo> = [
  {
    key: "sellerId",
    label: "신청 ID",
    align: "center",
  },
  {
    key: "marketName",
    label: "마켓명",
  },
  {
    key: "createdAt",
    label: "신청일",
    render: (v) => formatDate(v as string),
  },
  {
    key: "marketName",
    label: "판매 담당자 이름 / 연락처",
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

export const COMMON_USER_COLUMNS: Columns<CommonUserInfo> = [
  {
    key: "userId",
    label: "UID",
    width: 100,
    align: "center",
  },
  {
    key: "email",
    label: "이메일",
    width: 400,
  },
  {
    key: "providerType",
    label: "가입 채널",
    render: (v) => <SocialBadge social={v as Exclude<ProviderType, null>} />,
    align: "center",
    width: 100,
  },
  {
    key: "createdAt",
    label: "가입일",
    render: (v) => formatDate(v as string),
    width: 200,
  },
  {
    key: "lastLoginAt",
    label: "최근 접속일",
    render: (v) => formatDate(v as string),
    width: 200,
  },
  {
    key: "status",
    label: "활동상태",
    render: (v) => (
      <UserStatusBadge status={v as Exclude<UserStatusType, null>} />
    ),
    align: "center",
    width: 100,
  },
];
