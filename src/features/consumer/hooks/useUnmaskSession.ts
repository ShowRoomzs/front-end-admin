import { mockScenario } from "@/common/utils/devMock";
import { UNMASK_SESSION_FALLBACK_SECONDS } from "@/features/consumer/constants/detail";
import { useConsumerDetailMutations } from "@/features/consumer/hooks/useConsumerDetail";
import { consumerDetailService } from "@/features/consumer/services/consumerDetailService";
import type {
  ConsumerDetail,
  UserPrivacyAccessReason,
} from "@/features/consumer/types/consumerDetail";
import { useCallback, useEffect, useRef, useState } from "react";

/** DEV 목업에서 해제 상태로 시작하는 시나리오(A2 · A3) — 진입 즉시 잠그지 않는다 */
function isDevUnmaskPreset() {
  const scenario = mockScenario();
  return scenario === "unmasked" || scenario === "expiring";
}

/**
 * 마스킹 해제 세션(시안 「재마스킹 트리거 4종」) — 서버 세션은 이 소비자 1건 · 이 운영자 · 10분 고정 만료다.
 *
 * ① 다른 소비자 상세로 이동 · 화면 이탈 → 떠나는 소비자의 세션을 잠근다(privacy-lock)
 * ② 새로고침 · 재진입 → 이 화면에서 연 세션이 아니면 들어오자마자 잠근다
 * ③ 10분 경과 → 카운트다운이 0이 되면 다시 불러 마스킹 상태를 받고 「자동 잠김」을 보인다
 *    (이 경로만 직전 사유를 프리필한다)
 * ④ [지금 잠금] → 즉시 잠근다
 *
 * 남은 시간은 서버 `remainingSeconds`가 기준이다(정책값은 서버 우선) — 화면은 받은 순간부터 센다.
 */
export function useUnmaskSession(
  userId: number,
  detail: ConsumerDetail | undefined
) {
  const { unmask, lock } = useConsumerDetailMutations(userId);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [autoRelocked, setAutoRelocked] = useState(false);
  /** 이 화면에서 연 세션인가 — 아니면(새로고침 · 재진입) 들어오자마자 잠근다 */
  const openedHereRef = useRef(false);
  /** 화면을 떠날 때 잠글지 — 렌더 밖(정리 함수)에서만 읽는다 */
  const unmaskedRef = useRef(false);
  const lockMutate = lock.mutate;

  const unmasked = Boolean(detail?.identity.unmasked && detail.unmask.unmasked);
  const serverRemaining = detail?.unmask.remainingSeconds ?? null;

  // 다른 소비자로 바뀌면 상태를 비우고, 떠나는 소비자의 세션은 잠근다(①)
  useEffect(() => {
    setAutoRelocked(false);
    openedHereRef.current = false;
    return () => {
      if (unmaskedRef.current) {
        unmaskedRef.current = false;
        void consumerDetailService.lock(userId).catch(() => undefined);
      }
    };
  }, [userId]);

  useEffect(() => {
    unmaskedRef.current = unmasked;
    if (!unmasked) return;

    // ② 이 화면에서 열지 않은 세션 — 새로고침 · 재진입이라 다시 잠근다
    if (!openedHereRef.current && !isDevUnmaskPreset()) {
      lockMutate();
      return;
    }

    // ③ 카운트다운 — 서버 남은 초를 받은 순간부터 센다
    const seconds = serverRemaining ?? UNMASK_SESSION_FALLBACK_SECONDS;
    const deadline = Date.now() + seconds * 1000;
    setRemainingSeconds(seconds);
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemainingSeconds(left);
      if (left === 0) {
        window.clearInterval(timer);
        openedHereRef.current = false;
        setAutoRelocked(true);
        // 서버도 만료됐다 — 잠금을 불러 확실히 닫고 마스킹된 상세를 다시 받는다
        lockMutate();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [unmasked, serverRemaining, lockMutate]);

  const unmaskWithReason = useCallback(
    async (reason: UserPrivacyAccessReason) => {
      openedHereRef.current = true;
      try {
        await unmask.mutateAsync({ reason });
        setAutoRelocked(false);
      } catch (error) {
        openedHereRef.current = false;
        throw error;
      }
    },
    [unmask]
  );

  // ④ 지금 잠금 — 다시 열려면 사유를 새로 고른다(프리필 없음)
  const lockNow = useCallback(() => {
    openedHereRef.current = false;
    setAutoRelocked(false);
    lockMutate();
  }, [lockMutate]);

  return {
    remainingSeconds,
    autoRelocked,
    unmask: unmaskWithReason,
    lockNow,
    isUnmasking: unmask.isPending,
    isLocking: lock.isPending,
  };
}
