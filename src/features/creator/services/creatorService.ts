import dayjs from "dayjs";
import { apiInstance } from "@/common/lib/apiInstance";
import type { BaseParams, PageInfo } from "@/common/types";
import {
  CREATOR_REAPPLY_COOLDOWN_DAYS,
  CREATOR_REJECTION_REASONS,
  type CREATOR_APPLICATION_STATUS,
} from "@/features/creator/constants/params";

export type CreatorApplicationStatus =
  keyof typeof CREATOR_APPLICATION_STATUS | null; // null은 전체 조회

/** 목록 검색 조건 — 백엔드 CreatorApplicationSearchCondition + PagingRequest와 1:1 */
export interface CreatorApplicationParams extends BaseParams {
  status: CreatorApplicationStatus;
  /** 계정 이름(닉네임)·계정 아이디 부분 일치 OR 검색 */
  keyword: string;
}

export type SnsType = "INSTAGRAM" | "TIKTOK" | "X" | "YOUTUBE";

/** 목록 행 — 백엔드 CreatorApplicationResponse와 1:1 */
export interface CreatorApplicationInfo {
  applicationId: number;
  /**
   * 이름은 activityName이지만 실체는 **소비자 계정 닉네임**이다
   * (백엔드: `ca.getUser().getNickname()`). 활동명은 신청서가 수집하지 않는다(§9-1·§3-4).
   *
   * 화면에는 목록·상세 어디에도 노출하지 않는다. 응답에 실제로 담겨 오는 값이라
   * 계약 문서용으로 타입에만 남겨 둔다.
   */
  activityName: string | null;
  /**
   * 본인확인 실명 — 목록 컬럼(§9-1)에 필요하지만 **백엔드 CreatorApplicationResponse에
   * 아직 없다**. 필드가 추가되면 그대로 표시되도록 옵셔널로 열어 둔다(그전까지 "—").
   */
  realName?: string | null;
  email: string | null;
  snsType: SnsType;
  channelUrl: string;
  /** 주요 식별 컬럼 (기능요구사항 §9-1) */
  accountId: string;
  /** 반려 시 파기되어 null */
  followerCount: number | null;
  appliedAt: string;
  processedAt: string | null;
  status: CreatorApplicationStatus;
  rejectReason: string | null;
}

/** 상태별 건수 — 검색어는 반영, 상태 필터는 미반영 */
export interface CreatorApplicationStatusCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

/** 목록 응답 — 백엔드 CreatorApplicationListResponse와 1:1 */
export interface CreatorApplicationListResponse {
  content: Array<CreatorApplicationInfo>;
  pageInfo: PageInfo;
  statusCounts: CreatorApplicationStatusCounts;
}

/**
 * 반려 사유 유형 — 백엔드 CreatorRejectionReasonType과 1:1.
 *
 * 브랜드(seller)의 RejectionReason과는 **별개 enum**이다. 브랜드는 서류 중심,
 * 인플루언서는 채널·실적 중심이라 값이 하나도 겹치지 않는다(기능요구사항 §9-4).
 */
export type CreatorRejectionReasonType =
  | "CHANNEL_PERFORMANCE_UNVERIFIABLE"
  | "IDENTITY_INFO_MISMATCH"
  | "SUSPECTED_FAKE_FOLLOWERS"
  | "OTHER";

export type CreatorProcessingHistoryType =
  "APPLICATION_RECEIVED" | "APPLICATION_APPROVED" | "APPLICATION_REJECTED";

export interface CreatorProcessingHistoryItem {
  type: CreatorProcessingHistoryType;
  label: string;
  processedAt: string | null;
  /** 승인/반려 시에만 */
  processorEmail: string | null;
}

/**
 * 상세 — 백엔드 CreatorApplicationDetailResponse와 1:1.
 *
 * 반려(REJECTED) 건은 개인정보가 파기되어 실명·생년월일·팔로워 수·업무 이메일이
 * null로 내려온다. 연락처만 phoneNumberHash에 단방향 해시로 보존된다(§9-5).
 * 계정 아이디·채널 주소는 공개 식별자라 반려 후에도 파기하지 않는다.
 */
export interface CreatorApplicationDetailInfo {
  applicationId: number;
  status: Exclude<CreatorApplicationStatus, null>;
  appliedAt: string;
  processedAt: string | null;
  processorEmail: string | null;
  rejectReasonType: string | null;
  rejectReasonDetail: string | null;

  // 본인 인증 — PASS 미연동 상태라 아직 더미값이 내려온다
  name: string | null;
  birthday: string | null;
  phoneNumber: string | null;
  /** 반려 시에만 값이 있는 단방향 해시 (복원 불가) */
  phoneNumberHash: string | null;
  verificationMethod: string | null;
  verificationMethodLabel: string | null;

  // 활동 채널
  snsType: SnsType;
  channelUrl: string;
  accountId: string;
  followerCount: number | null;
  businessEmail: string | null;

  // 약관 동의 — 필수 약관 3종은 노출하지 않고 마케팅 동의만 본다(§9-2)
  marketingAgree: boolean | null;

  processingHistory: Array<CreatorProcessingHistoryItem> | null;
}

/**
 * 반려 통지 미리보기 — `GET /admin/creator/applications/{id}/reject-preview`
 * (`CreatorRejectionNoticeResponse`). 실제 발송 메일과 같은 템플릿으로 만든다.
 * 날짜 두 개는 KST 날짜(`LocalDate`, `YYYY-MM-DD`)라 시각 보정을 하지 않는다.
 */
export interface CreatorRejectionNoticePreview {
  reasonType: CreatorRejectionReasonType;
  /** 운영자 화면 라벨 */
  internalLabel: string;
  /** 신청자에게 가는 사유 라벨 */
  noticeLabel: string;
  rejectedOn: string;
  reapplyAvailableOn: string;
  subject: string;
  /** 줄바꿈(\n) 단락 — 상세 사유는 담기지 않는다 */
  body: string;
}

export interface CreatorApplicationRejectData {
  rejectReasonType: CreatorRejectionReasonType;
  rejectReasonDetail?: string;
}

export const creatorService = {
  getCreatorApplicationList: async (params: CreatorApplicationParams) => {
    const { data: response } =
      await apiInstance.get<CreatorApplicationListResponse>(
        "/admin/creator/applications",
        { params }
      );

    return response;
  },
  getCreatorApplicationDetail: async (applicationId: number) => {
    const { data: response } =
      await apiInstance.get<CreatorApplicationDetailInfo>(
        `/admin/creator/applications/${applicationId}`
      );

    return response;
  },
  /** 승인은 사유 입력이 없다 — 바디 없이 호출한다(§9-3) */
  approveCreatorApplication: async (applicationId: number) => {
    await apiInstance.post(
      `/admin/creator/applications/${applicationId}/approve`
    );
  },
  rejectCreatorApplication: async (
    applicationId: number,
    data: CreatorApplicationRejectData
  ) => {
    await apiInstance.post(
      `/admin/creator/applications/${applicationId}/reject`,
      data
    );
  },
  /**
   * 반려 통지 미리보기(기-36 C1).
   *
   * 이 API는 개발 서버에 아직 배포되지 않았다(back-end main 10-24). 실패하면
   * 같은 규칙(사유별 통지 라벨 · 오늘 + 14일)으로 화면에서 만든다 — 가짜 값이
   * 아니라 서버 템플릿과 같은 계산이라 배포 전에도 운영자가 볼 수 있다.
   * 백엔드 배포 후에는 catch 분기를 지워도 된다.
   */
  getRejectionNoticePreview: async (
    applicationId: number,
    reasonType: CreatorRejectionReasonType
  ): Promise<CreatorRejectionNoticePreview> => {
    try {
      const { data } = await apiInstance.get<CreatorRejectionNoticePreview>(
        `/admin/creator/applications/${applicationId}/reject-preview`,
        { params: { reasonType } }
      );
      return data;
    } catch {
      const reason = CREATOR_REJECTION_REASONS.find(
        (item) => item.value === reasonType
      );
      const today = dayjs();
      return {
        reasonType,
        internalLabel: reason?.label ?? reasonType,
        noticeLabel: reason?.noticeLabel ?? reasonType,
        rejectedOn: today.format("YYYY-MM-DD"),
        reapplyAvailableOn: today
          .add(CREATOR_REAPPLY_COOLDOWN_DAYS, "day")
          .format("YYYY-MM-DD"),
        subject: "",
        body: "",
      };
    }
  },
};
