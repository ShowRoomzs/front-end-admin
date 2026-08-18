import { CONSUMERS_QUERY_KEY } from "@/features/consumer/constants/queryKey";
import { consumerService } from "@/features/consumer/services/consumerService";
import type { ConsumerListParams } from "@/features/consumer/types/consumer";
import { useQuery } from "@tanstack/react-query";

export function useGetConsumerList(params: ConsumerListParams) {
  return useQuery({
    queryKey: [CONSUMERS_QUERY_KEY, params],
    queryFn: () => consumerService.getConsumerList(params),
  });
}
