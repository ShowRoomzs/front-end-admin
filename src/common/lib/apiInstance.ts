import { COOKIE_NAME } from "@/common/constants";
import { cookie } from "@/common/lib/cookie";
import { authService } from "@/features/auth/services/authService";
import axios from "axios";

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
    if (error.response.status === 401) {
      const refreshToken = cookie.get(COOKIE_NAME.REFRESH_TOKEN);
      if (refreshToken) {
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          await authService.refresh(refreshToken);
        cookie.set(COOKIE_NAME.ACCESS_TOKEN, newAccessToken);
        cookie.set(COOKIE_NAME.REFRESH_TOKEN, newRefreshToken);

        return apiInstance(error.config);
      }
    }
    return Promise.reject(error);
  }
);
