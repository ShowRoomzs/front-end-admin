import {
  CONSUMER_DETAIL_QUERY_KEY,
  CONSUMER_HISTORIES_QUERY_KEY,
  CONSUMER_MEMOS_QUERY_KEY,
  CONSUMER_REASON_OPTIONS_QUERY_KEY,
  CONSUMER_TERMS_QUERY_KEY,
  CONSUMERS_QUERY_KEY,
} from "@/features/consumer/constants/queryKey";
import {
  ConsumerDetailOutdatedError,
  consumerDetailService,
} from "@/features/consumer/services/consumerDetailService";
import type {
  ConsumerDetail,
  ConsumerReleaseRequest,
  ConsumerStatusResult,
  ConsumerSuspendRequest,
  ConsumerUnmaskRequest,
} from "@/features/consumer/types/consumerDetail";
import { ApiNotReadyError } from "@/common/utils/devMock";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

const detailKey = (userId: number) => [CONSUMER_DETAIL_QUERY_KEY, userId];

/** 「준비 중」 오류는 다시 불러도 같다 — 재시도로 로딩만 길어지지 않게 한다 */
function retryUnlessNotReady(failureCount: number, error: Error) {
  if (
    error instanceof ConsumerDetailOutdatedError ||
    error instanceof ApiNotReadyError
  ) {
    return false;
  }
  return failureCount < 2;
}

export function useConsumerDetail(userId: number) {
  return useQuery({
    queryKey: detailKey(userId),
    queryFn: () => consumerDetailService.getDetail(userId),
    enabled: Number.isFinite(userId) && userId > 0,
    retry: retryUnlessNotReady,
    /*
      마스킹 해제 상태는 이 운영자의 세션에 묶인 값이라, 창을 다시 볼 때마다 몰래 다시 부르면
      카운트다운이 서버 남은 초로 튀어 버린다. 갱신은 조치 · 만료 시점에만 명시적으로 한다.
    */
    refetchOnWindowFocus: false,
  });
}

/** 모달 셀렉트 사유 · 정지 미리보기 — 모달을 열 때만 부른다 */
export function useConsumerReasonOptions(enabled: boolean) {
  return useQuery({
    queryKey: [CONSUMER_REASON_OPTIONS_QUERY_KEY],
    queryFn: consumerDetailService.getReasonOptions,
    enabled,
    // 미리보기 기한(appealDeadlineAt)이 응답 시각 기준이라 모달을 열 때마다 새로 받는다
    staleTime: 0,
  });
}

/** 처리 이력 전체 — 상세가 실은 최신 5건보다 많을 때만 */
export function useConsumerHistories(userId: number, enabled: boolean) {
  return useQuery({
    queryKey: [CONSUMER_HISTORIES_QUERY_KEY, userId],
    queryFn: () => consumerDetailService.getHistories(userId),
    enabled,
  });
}

/** 관리자 메모 전체 — 상세가 실은 최신 3건보다 많을 때만 */
export function useConsumerMemos(userId: number, enabled: boolean) {
  return useQuery({
    queryKey: [CONSUMER_MEMOS_QUERY_KEY, userId],
    queryFn: () => consumerDetailService.getMemos(userId),
    enabled,
  });
}

/** 【서버 없음】 약관 동의 내역 — 배포본은 ApiNotReadyError */
export function useConsumerTerms(userId: number) {
  return useQuery({
    queryKey: [CONSUMER_TERMS_QUERY_KEY, userId],
    queryFn: () => consumerDetailService.getTermsAgreements(userId),
    retry: retryUnlessNotReady,
  });
}

/** 상세 · 이력 · 메모 · 목록(상태 · 건수)을 함께 다시 부른다 */
function invalidateConsumer(queryClient: QueryClient, userId: number) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: detailKey(userId) }),
    queryClient.invalidateQueries({
      queryKey: [CONSUMER_HISTORIES_QUERY_KEY, userId],
    }),
    queryClient.invalidateQueries({
      queryKey: [CONSUMER_MEMOS_QUERY_KEY, userId],
    }),
  ]);
}

/** 정지 · 해제 응답(상태 카드 + 이력 5건)을 상세 캐시에 바로 반영하고, 나머지는 다시 부른다 */
function applyStatusResult(
  queryClient: QueryClient,
  userId: number,
  result: ConsumerStatusResult
) {
  queryClient.setQueryData<ConsumerDetail>(detailKey(userId), (previous) =>
    previous
      ? {
          ...previous,
          status: result.statusCard.status,
          statusCard: result.statusCard,
          histories: result.histories,
        }
      : previous
  );
  void invalidateConsumer(queryClient, userId);
  void queryClient.invalidateQueries({ queryKey: [CONSUMERS_QUERY_KEY] });
}

export function useConsumerDetailMutations(userId: number) {
  const queryClient = useQueryClient();

  const unmask = useMutation({
    mutationFn: (body: ConsumerUnmaskRequest) =>
      consumerDetailService.unmask(userId, body),
    onSuccess: (detail) => {
      // 응답이 해제된 상세 전체다 — 다시 부르지 않고 그대로 넣는다
      queryClient.setQueryData(detailKey(userId), detail);
      void queryClient.invalidateQueries({
        queryKey: [CONSUMER_HISTORIES_QUERY_KEY, userId],
      });
    },
  });

  const lock = useMutation({
    mutationFn: () => consumerDetailService.lock(userId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: detailKey(userId) }),
  });

  const suspend = useMutation({
    mutationFn: (body: ConsumerSuspendRequest) =>
      consumerDetailService.suspend(userId, body),
    onSuccess: (result) => applyStatusResult(queryClient, userId, result),
  });

  const release = useMutation({
    mutationFn: (body: ConsumerReleaseRequest) =>
      consumerDetailService.release(userId, body),
    onSuccess: (result) => applyStatusResult(queryClient, userId, result),
  });

  const createMemo = useMutation({
    mutationFn: (content: string) =>
      consumerDetailService.createMemo(userId, { content }),
    onSuccess: () => invalidateConsumer(queryClient, userId),
  });

  const updateMemo = useMutation({
    mutationFn: (params: { memoId: number; content: string }) =>
      consumerDetailService.updateMemo(userId, params.memoId, {
        content: params.content,
      }),
    onSuccess: () => invalidateConsumer(queryClient, userId),
  });

  const deleteMemo = useMutation({
    mutationFn: (memoId: number) =>
      consumerDetailService.deleteMemo(userId, memoId),
    onSuccess: () => invalidateConsumer(queryClient, userId),
  });

  return {
    unmask,
    lock,
    suspend,
    release,
    createMemo,
    updateMemo,
    deleteMemo,
  };
}
