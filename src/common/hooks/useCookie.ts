import { useCallback, useMemo } from "react";
import { useCookies } from "react-cookie";

export function useCookie<T>(
  key: string
): [T | undefined, (value: T) => void, () => void] {
  const [cookies, setCookies, removeCookie] = useCookies([key]);

  const value = useMemo(() => cookies[key] || undefined, [cookies, key]);
  /*
    경로를 주지 않으면 쿠키가 지금 페이지의 디렉터리에 생긴다. 로그인 화면은 어느 주소에서나 뜨므로
    `/settlement/group-buy`에서 로그인하면 토큰이 `/settlement`에만 남고, 다른 메뉴를 새로고침하면
    토큰이 안 보여 로그인 화면으로 돌아간다. 인증 쿠키는 항상 루트에 쓴다(`setAuthCookie`와 같은 규칙).
  */
  const setValue = useCallback(
    (value: T) => {
      setCookies(key, value, { path: "/" });
    },
    [setCookies, key]
  );
  const remove = useCallback(() => {
    removeCookie(key, { path: "/" });
  }, [key, removeCookie]);

  return [value, setValue, remove];
}
