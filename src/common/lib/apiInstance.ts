import { COOKIE_NAME } from "@/common/constants";
import { cookie } from "@/common/lib/cookie";
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
