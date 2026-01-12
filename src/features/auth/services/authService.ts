import { authInstance } from "@/common/lib/authInstance";
interface LoginResponse {
  tokenType: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn: number;
  isNewMember: boolean;
  role: string; // todo : 수정
}
export const authService = {
  login: async (email: string, password: string) => {
    const { data: response } = await authInstance.post<LoginResponse>(
      "/admin/auth/login",
      {
        email,
        password,
      }
    );

    return response;
  },
  refresh: async (refreshToken: string) => {
    const { data: response } = await authInstance.post<LoginResponse>(
      "/admin/auth/refresh",
      {
        refreshToken,
      }
    );

    return response;
  },
};
