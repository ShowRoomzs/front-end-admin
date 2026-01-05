import axios, { isAxiosError } from "axios";
import toast from "react-hot-toast";
export const authInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/v1`,
});

authInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    if (isAxiosError(error)) {
      const message = error.response?.data.message;
      toast.error(message);
    }
    return Promise.reject(error);
  }
);
