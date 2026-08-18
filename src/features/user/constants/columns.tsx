import type { Columns } from "@/common/components/Table/types";
import { formatDate } from "@/common/utils/formatDate";
import type { LoginHistoryInfo } from "@/features/user/services/commonUserService";
import { DEVICE_TYPE, LOGIN_STATUS } from "@/features/user/constants/params";

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
