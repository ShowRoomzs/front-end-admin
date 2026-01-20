import { LOGIN_HISTORY_QUERY_KEY } from "@/features/user/constants/queryKey";
import {
  commonUserService,
  type LoginHistoryParams,
} from "@/features/user/services/commonUserService";
import { useQuery } from "@tanstack/react-query";

export function useGetLoginHistory(params: LoginHistoryParams) {
  return useQuery({
    queryKey: [LOGIN_HISTORY_QUERY_KEY, params],
    queryFn: () => commonUserService.getLoginHistory(params),
  });
}
