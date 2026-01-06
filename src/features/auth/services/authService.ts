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
      "/seller/auth/login", // TODO : endpoint 수정 필요
      {
        email,
        password,
      }
    );

    return response;
  },
  refresh: async (refreshToken: string) => {
    const { data: response } = await authInstance.post<LoginResponse>(
      "/seller/auth/refresh",
      {
        refreshToken,
      }
    );

    return response;
  },
};
