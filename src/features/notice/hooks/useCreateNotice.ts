import { useMutation } from "@tanstack/react-query";
import { noticeService } from "@/features/notice/services/noticeService";
import type { CreateNoticeRequest } from "@/features/notice/types/notice";
import { queryClient } from "@/common/lib/queryClient";
import { NOTICES_QUERY_KEY } from "@/features/notice/constants/queryKey";

export function useCreateNotice() {
  return useMutation({
    mutationFn: (data: CreateNoticeRequest) => noticeService.createNotice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTICES_QUERY_KEY] });
    },
  });
}