import { COOKIE_NAME } from "@/common/constants";
import { cookie, setAuthCookie } from "@/common/lib/cookie";
import { authService } from "@/features/auth/services/authService";
import axios from "axios";
import toast from "react-hot-toast";

export const apiInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/v1`,
});
apiInstance.interceptors.request.use((config) => {
  const accessToken = cookie.get(COOKIE_NAME.ACCESS_TOKEN);
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/*
  동시에 여러 요청이 401을 받아도 갱신 요청은 하나만 나가도록 진행 중인 약속을 공유한다.
  셸이 배지 요약 5~6개를 한꺼번에 불러서, 공유하지 않으면 만료 직후 갱신이 7번 겹친다.
  서버는 만료 3일 전부터 갱신 때 리프레시 토큰을 새로 발급하므로, 겹친 갱신은 첫 번째만 통하고
  나머지는 이미 바뀐 토큰을 보내 실패한다(그 요청들이 401로 끝난다).
*/
let refreshing: Promise<string> | null = null;

function refreshAccessToken(refreshToken: string) {
  refreshing ??= authService
    .refresh(refreshToken)
    .then(({ accessToken, refreshToken: nextRefreshToken }) => {
      setAuthCookie(COOKIE_NAME.ACCESS_TOKEN, accessToken);
      setAuthCookie(COOKIE_NAME.REFRESH_TOKEN, nextRefreshToken);
      return accessToken;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

apiInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config ?? {};

    /*
      네트워크 끊김·CORS·타임아웃이면 error.response 자체가 없다.
      예전엔 여기서 바로 error.response.status를 읽어 인터셉터가 먼저 터졌고,
      정작 원래 실패 원인은 화면에 아무것도 안 뜬 채 묻혔다.
    */
    if (error.response?.status === 401) {
      const refreshToken = cookie.get(COOKIE_NAME.REFRESH_TOKEN);

      // _retry가 없으면 갱신 후 재요청이 또 401일 때 갱신→재요청이 무한히 돈다
      if (refreshToken && !config._retry) {
        config._retry = true;
        try {
          await refreshAccessToken(refreshToken);
          return await apiInstance(config);
        } catch {
          // 갱신 실패를 던지면 원래 401이 갱신 에러로 바뀌어 원인을 못 찾는다
          return Promise.reject(error);
        }
      }
      return Promise.reject(error);
    }

    const message =
      error.response?.data?.message ??
      "요청을 처리하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.";
    // 호출부가 실패를 직접 화면에 그리는 요청은 토스트를 건너뛴다(중복 알림 방지)
    if (config.suppressErrorToast !== true) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);
