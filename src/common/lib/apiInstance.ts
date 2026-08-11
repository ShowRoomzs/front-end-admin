import { COOKIE_NAME } from "@/common/constants";
import { cookie } from "@/common/lib/cookie";
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
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            await authService.refresh(refreshToken);
          cookie.set(COOKIE_NAME.ACCESS_TOKEN, newAccessToken);
          cookie.set(COOKIE_NAME.REFRESH_TOKEN, newRefreshToken);

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
    toast.error(message);
    return Promise.reject(error);
  }
);
