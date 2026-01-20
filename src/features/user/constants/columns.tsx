import type { Columns } from "@/common/components/Table/types";
import { formatDate } from "@/common/utils/formatDate";
import type {
  CommonUserInfo,
  LoginHistoryInfo,
  ProviderType,
  UserStatusType,
} from "@/features/user/services/commonUserService";
import SocialBadge from "@/features/user/components/SocialBadge/SocialBadge";
import UserStatusBadge from "@/features/user/components/UserStatusBadge/UserStatusBadge";
import { DEVICE_TYPE, LOGIN_STATUS } from "@/features/user/constants/params";

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

export const LOGIN_HISTORY_COLUMNS: Columns<LoginHistoryInfo> = [
  {
    key: "userId",
    label: "ID",
    width: 100,
  },
  {
    key: "email",
    label: "이메일",
    width: 200,
  },
  {
    key: "loginAt",
    label: "로그인 일시",
    render: (v) => formatDate(v as string),
    width: 200,
  },
  {
    key: "clientIp",
    label: "IP 주소",
    width: 200,
  },
  {
    key: "deviceType",
    label: "디바이스 정보",
    render: (v) => DEVICE_TYPE[v as keyof typeof DEVICE_TYPE],
    width: 150,
  },
  {
    key: "country",
    label: "국가/지역",
    render: (_v, record) => (
      <span>
        {record.country}/{record.city}
      </span>
    ),
    width: 200,
  },
  {
    key: "status",
    label: "상태",
    render: (v) => <span>{LOGIN_STATUS[v as keyof typeof LOGIN_STATUS]}</span>,
    width: 100,
  },
];
