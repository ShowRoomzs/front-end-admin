import { apiInstance } from "@/common/lib/apiInstance";
import type { BaseParams, PageResponse } from "@/common/types";
import type {
  DEVICE_TYPE,
  LOGIN_STATUS,
  SOCIAL_PROVIDER_TYPE,
} from "@/features/user/constants/params";

export type ProviderType = keyof typeof SOCIAL_PROVIDER_TYPE | null; // null은 전체 조회;

export type LoginStatus = keyof typeof LOGIN_STATUS;
export type SocialLoginStatusResponse = Record<
  Exclude<ProviderType, null>,
  boolean
>;
export type DeviceType = keyof typeof DEVICE_TYPE;

export interface LoginHistoryParams extends BaseParams {
  startDate: string;
  endDate: string;
  deviceType: DeviceType | null;
  country: string;
  city: string;
  status: LoginStatus | null;
}
export interface LoginHistoryInfo {
  id: number;
  userId: number;
  email: string;
  loginAt: string;
  clientIp: string;
  deviceType: DeviceType;
  country: string;
  city: string;
  status: LoginStatus;
}
export type LoginHistoryListResponse = PageResponse<LoginHistoryInfo>;
export interface Region {
  country: string;
  cities: Array<string>;
}

export const commonUserService = {
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
  getRegionList: async () => {
    const { data: response } = await apiInstance.get<Array<Region>>(
      "/admin/history/login/filters/locations"
    );

    return response;
  },
  getLoginHistory: async (params: LoginHistoryParams) => {
    const { data: response } = await apiInstance.get<LoginHistoryListResponse>(
      "/admin/history/login",
      {
        params,
      }
    );

    return response;
  },
};
