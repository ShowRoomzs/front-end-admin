import { policyValuesService } from "@/common/services/policyValuesService";
import type { PolicyValues } from "@/common/services/policyValuesService";
import { useQuery } from "@tanstack/react-query";

/** 서버 설정값이라 자주 바뀌지 않는다 — 한 번 받아 오래 쓴다 */
export function usePolicyValues() {
  return useQuery({
    queryKey: ["common-policy-values"],
    queryFn: policyValuesService.get,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}

/**
 * 「3영업일」처럼 숫자를 끼운 문구 — 값이 없으면(설정 없음 · 아직 로딩 · 실패) 시안의 「N영업일」로 둔다.
 * `unit`은 영업일 외에 「일」 같은 단위를 쓸 때 바꾼다.
 */
export function policyDaysText(
  values: PolicyValues | undefined,
  key: keyof PolicyValues,
  unit = "영업일"
) {
  const value = values?.[key];
  return typeof value === "number" ? `${value}${unit}` : `N${unit}`;
}
