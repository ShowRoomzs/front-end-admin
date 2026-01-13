import { COMMON_USER_LIST_QUERY_KEY } from "@/features/user/constants/queryKey";
import {
  commonUserService,
  type CommonUserListParams,
} from "@/features/user/services/commonUserService";
import { useQuery } from "@tanstack/react-query";

export function useGetCommonUserList(params: CommonUserListParams) {
  return useQuery({
    queryKey: [COMMON_USER_LIST_QUERY_KEY, params],
    queryFn: () => commonUserService.getCommonUserList(params),
  });
}
