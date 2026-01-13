import { COOKIE_NAME } from "@/common/constants";
import { cookie } from "@/common/lib/cookie";
import axios, { isAxiosError } from "axios";
import toast from "react-hot-toast";
export const authInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/v1`,
});

authInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      cookie.remove(COOKIE_NAME.ACCESS_TOKEN);
      cookie.remove(COOKIE_NAME.REFRESH_TOKEN);
      toast.error("로그인 정보가 만료되었습니다. 다시 로그인해주세요.");
      return;
    }
    if (isAxiosError(error)) {
      const message = error.response?.data.message;
      toast.error(message);
    }
    return Promise.reject(error);
  }
);
