/*
  백엔드 API가 아직 없는 화면의 데이터 원천.

  개발 서버(`pnpm dev`)에서만 목업으로 채우고, 배포본에서는 각 화면이 「준비 중」을 띄운다 —
  운영자에게 가짜 금액·가짜 거래가 보이면 안 된다. API가 생기면 각 서비스 함수의 본문만 바꾼다.
  목업 데이터와 분기는 각 기능의 서비스 한 곳에 가둔다(화면 컴포넌트는 이 파일을 모른다).
*/

export const DEV_MOCK_ENABLED = import.meta.env.DEV;

/** 목업 응답에 네트워크 지연을 흉내 낸다 — 로딩 상태를 눈으로 확인할 수 있게 */
export function mockDelay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(value)), ms);
  });
}

/**
 * 시안의 다른 상태를 보고 싶을 때 주소에 `?mock=<값>`을 붙인다(개발 서버 전용).
 * 배포본에서는 항상 `null`이다. 시나리오 값은 각 기능의 서비스 파일 상단에 적는다.
 */
export function mockScenario(): string | null {
  if (!DEV_MOCK_ENABLED) return null;
  return new URLSearchParams(window.location.search).get("mock");
}

export class ApiNotReadyError extends Error {
  constructor(feature: string) {
    super(`${feature} API가 아직 준비되지 않았습니다.`);
    this.name = "ApiNotReadyError";
  }
}
