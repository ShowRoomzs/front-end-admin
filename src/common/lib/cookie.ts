import { Cookies } from "react-cookie";

export const cookie = new Cookies();

/**
 * 지금 페이지에 적용되는 루트 외 경로들 — `/group-buy/4` → `["/group-buy", "/group-buy/4"]`.
 * 경로를 주지 않고 쓴 쿠키는 그때 페이지의 디렉터리(`/group-buy`)에 저장되고, 그 경로는 목록
 * (`/group-buy`)에도 적용된다 — 현재 경로 자체까지 포함해야 목록에서도 사본이 지워진다.
 */
function ancestorPaths(): Array<string> {
  const segments = window.location.pathname.split("/").filter(Boolean);
  return segments.map(
    (_, index) => `/${segments.slice(0, index + 1).join("/")}`
  );
}

/**
 * 인증 쿠키는 항상 루트(`/`)에 쓴다. 경로 없이 쓰면 상세 화면(`/group-buy/4`)에서 갱신한 토큰이
 * `/group-buy`에 따로 생기고, 만료된 뒤에도 더 구체적인 경로라 먼저 읽혀 새 토큰을 가린다
 * (갱신은 성공하는데 재요청이 계속 401). 이미 생긴 사본도 여기서 지운다.
 */
export function setAuthCookie(name: string, value: string) {
  ancestorPaths().forEach((path) => cookie.remove(name, { path }));
  cookie.set(name, value, { path: "/" });
}

/** 로그아웃 — 루트와 현재 페이지 상위 경로의 사본을 함께 지운다(어느 화면에서 눌러도 남지 않게) */
export function removeAuthCookie(name: string) {
  ancestorPaths().forEach((path) => cookie.remove(name, { path }));
  cookie.remove(name, { path: "/" });
}
