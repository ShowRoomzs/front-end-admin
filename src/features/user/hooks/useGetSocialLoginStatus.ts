import { SOCIAL_LOGIN_STATUS_QUERY_KEY } from "@/features/user/constants/queryKey";
import { commonUserService } from "@/features/user/services/commonUserService";
import { useQuery } from "@tanstack/react-query";

export function useGetSocialLoginStatus() {
  return useQuery({
    queryKey: [SOCIAL_LOGIN_STATUS_QUERY_KEY],
    queryFn: commonUserService.getSocialLoginStatus,
  });
}
