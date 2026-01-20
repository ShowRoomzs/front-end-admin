import { apiInstance } from "@/common/lib/apiInstance";
import type { BaseParams, PageResponse } from "@/common/types";
import type {
  SOCIAL_PROVIDER_TYPE,
  USER_STATUS_TYPE,
} from "@/features/user/constants/params";

export type ProviderType = keyof typeof SOCIAL_PROVIDER_TYPE | null; // null은 전체 조회;
export type UserStatusType = keyof typeof USER_STATUS_TYPE | null; // null은 전체 조회;

export interface CommonUserListParams extends BaseParams {
  providerType: ProviderType;
  status: UserStatusType;
  startDate: string;
  endDate: string;
}
export interface CommonUserInfo {
  userId: number;
  email: string;
  nickname: string;
  providerType: ProviderType;
  createdAt: string;
  lastLoginAt: string;
  status: UserStatusType;
}
export type CommonUserListResponse = PageResponse<CommonUserInfo>;

export type SocialLoginStatusResponse = Record<
  Exclude<ProviderType, null>,
  boolean
>;

export const commonUserService = {
  getCommonUserList: async (params: CommonUserListParams) => {
    const { data: response } = await apiInstance.get<CommonUserListResponse>(
      "/admin/users",
      {
        params,
      }
    );

    return response;
  },
  getSocialLoginStatus: async () => {
    const { data: response } = await apiInstance.get<SocialLoginStatusResponse>(
      "/admin/social/status"
    );

    return response;
  },
  updateSocialLoginStatus: async (
    providerType: ProviderType,
    status: boolean
  ) => {
    const { data: response } = await apiInstance.patch(
      `/admin/social/${providerType}/status?active=${status}`
    );

    return response;
  },
};
