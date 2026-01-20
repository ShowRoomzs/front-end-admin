import Table from "@/common/components/Table/Table";
import type { Columns } from "@/common/components/Table/types";
import SocialBadge from "@/features/user/components/SocialBadge/SocialBadge";
import { useGetSocialLoginStatus } from "@/features/user/hooks/useGetSocialLoginStatus";
import {
  commonUserService,
  type ProviderType,
} from "@/features/user/services/commonUserService";
import { useCallback, useMemo } from "react";
import Toggle from "@/common/components/Toggle/Toggle";
import { queryClient } from "@/common/lib/queryClient";
import { SOCIAL_LOGIN_STATUS_QUERY_KEY } from "@/features/user/constants/queryKey";
import toast from "react-hot-toast";

interface SocialLoginStatus {
  providerType: ProviderType;
  status: boolean;
}
export default function SocialLoginManagement() {
  const { data: socialLoginStatus, isLoading } = useGetSocialLoginStatus();

  const data: Array<SocialLoginStatus> = useMemo(() => {
    if (!socialLoginStatus) {
      return [];
    }
    return Object.entries(socialLoginStatus).map(([providerType, status]) => ({
      providerType: providerType as Exclude<ProviderType, null>,
      status: status as boolean,
    }));
  }, [socialLoginStatus]);
  const handleUpdateSocialLoginStatus = useCallback(
    async (providerType: ProviderType, status: boolean) => {
      await commonUserService.updateSocialLoginStatus(providerType, status);
      queryClient.invalidateQueries({
        queryKey: [SOCIAL_LOGIN_STATUS_QUERY_KEY],
      });
      toast.success("활성 상태가 변경되었습니다.");
    },
    []
  );
  const columns: Columns<SocialLoginStatus> = useMemo(
    () => [
      {
        key: "providerType",
        label: "로그인 수단",
        width: 100,
        render: (v) => (
          <SocialBadge social={v as Exclude<ProviderType, null>} />
        ),
      },
      {
        key: "status",
        label: "활성 상태",
        width: 100,
        render: (v, record) => (
          <Toggle
            checked={v as boolean}
            onCheckedChange={(checked) => {
              handleUpdateSocialLoginStatus(record.providerType, checked);
            }}
          />
        ),
      },
    ],
    [handleUpdateSocialLoginStatus]
  );

  return (
    <div>
      <Table columns={columns} data={data} isLoading={isLoading} />
    </div>
  );
}
