import { apiInstance } from "@/common/lib/apiInstance";
import type { BaseParams, PageResponse } from "@/common/types";
import type { SellerRegistrationStatus } from "@/features/seller/services/sellerService";

export type { SellerRegistrationStatus as CreatorApplicationStatus };

export interface UpdateCreatorApplicationStatusData {
  status: Exclude<SellerRegistrationStatus, "PENDING" | null>;
}

export type SnsType = string;

export interface CreatorApplicationInfo {
  creatorId: number;
  showroomName: string;
  createdAt: string;
  name: string;
  phoneNumber: string;
  status: SellerRegistrationStatus;
  rejectionReason: string | null;
}

export interface CreatorApplicationDetail {
  creatorId: number;
  email: string;
  showroomName: string;
  createdAt: string;
  activityName: string;
  platformType: SnsType;
  platformUrl: string;
  name: string;
  phoneNumber: string;
  status: SellerRegistrationStatus;
  rejectionReason: string | null;
}

export interface CreatorApplicationParams extends BaseParams {
  status: SellerRegistrationStatus;
  startDate: string;
  endDate: string;
}

type CreatorApplicationListResponse = PageResponse<CreatorApplicationInfo>;

export const creatorService = {
  getCreatorApplicationList: async (params: CreatorApplicationParams) => {
    const { data: response } =
      await apiInstance.get<CreatorApplicationListResponse>(
        "/admin/creators/applications",
        { params }
      );
    return response;
  },
  getCreatorApplicationDetail: async (creatorId: number) => {
    const { data: response } =
      await apiInstance.get<CreatorApplicationDetail>(
        `/admin/creators/applications/${creatorId}`
      );
    return response;
  },
  updateCreatorApplicationStatus: async (
    creatorId: number,
    data: UpdateCreatorApplicationStatusData
  ) => {
    const { data: response } = await apiInstance.patch(
      `/admin/creators/applications/${creatorId}/status`,
      data
    );
    return response;
  },
};
