import { USER_STATUS_TYPE } from "@/features/user/constants/params";
import type { UserStatusType } from "@/features/user/services/commonUserService";
import { cn } from "@/lib/utils";

interface UserStatusBadgeProps {
  status: Exclude<UserStatusType, null>;
}

export default function UserStatusBadge(props: UserStatusBadgeProps) {
  const { status } = props;

  const getClassNameByStatus = (status: Exclude<UserStatusType, null>) => {
    switch (status) {
      case "NORMAL":
        return "text-green-800";
      case "DORMANT":
        return "text-yellow-800";
      case "WITHDRAWN":
        return "text-red-800";
    }
  };
  return (
    <span className={cn("font-medium", getClassNameByStatus(status))}>
      {USER_STATUS_TYPE[status]}
    </span>
  );
}
