import { CHANGE_REQUEST_LIST_QUERY_KEY } from "@/features/changeRequest/constants/queryKey";
import {
  changeRequestService,
  type ChangeRequestParams,
} from "@/features/changeRequest/services/changeRequestService";
import { useQuery } from "@tanstack/react-query";

export function useGetChangeRequestList(params: ChangeRequestParams) {
  return useQuery({
    queryKey: [CHANGE_REQUEST_LIST_QUERY_KEY, params],
    queryFn: () => changeRequestService.getChangeRequestList(params),
  });
}
