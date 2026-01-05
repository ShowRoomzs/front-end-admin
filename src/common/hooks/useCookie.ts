import { useCallback, useMemo } from "react";
import { useCookies } from "react-cookie";

export function useCookie<T>(
  key: string
): [T | undefined, (value: T) => void, () => void] {
  const [cookies, setCookies, removeCookie] = useCookies([key]);

  const value = useMemo(() => cookies[key] || undefined, [cookies, key]);
  const setValue = useCallback(
    (value: T) => {
      setCookies(key, value);
    },
    [setCookies, key]
  );
  const remove = useCallback(() => {
    removeCookie(key);
  }, [key, removeCookie]);

  return [value, setValue, remove];
}
