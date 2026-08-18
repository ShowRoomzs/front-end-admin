import type { BaseParams, PageInfo } from "@/common/types";

/** 유형 3종 — **등록 후 문서 속성으로 고정**된다(§21-2) */
export type TermsType =
  "TERMS_OF_SERVICE" | "PRIVACY_POLICY" | "MARKETING_CONSENT";

export type TermsTypeFilter = "ALL" | TermsType;

/**
 * 대상 4종 — 유형과 함께 **등록 후 고정**이다.
 *
 * 대상이 바뀌면 동의 대상 집단이 달라져 같은 문서로 볼 수 없다. 수정 경로를 만들지 말고
 * 문서를 새로 등록하게 해야 한다(§21-2).
 */
export type TermsTarget = "ALL" | "USER" | "BRAND" | "INFLUENCER";

/**
 * 문서 상태 3종.
 *
 * `SUPERSEDED`(구버전)는 후속 **문서**로 대체된 문서 전체를 뜻한다 — 같은 문서 안에서
 * 교체된 지난 **버전**(`TermsVersionStatus.PAST`, "과거 버전")과 층이 다르므로
 * 두 용어를 섞지 말 것(§21-1).
 */
export type TermsDocumentStatus = "EFFECTIVE" | "SCHEDULED" | "SUPERSEDED";

/** 버전 상태 3종 — 문서 상태와 다른 축이다 */
export type TermsVersionStatus = "SCHEDULED" | "EFFECTIVE" | "PAST";

export interface TermsListItem {
  documentId: number;
  name: string;
  type: TermsType;
  typeName: string;
  target: TermsTarget;
  targetName: string;
  /** 접두 v 없는 값 — 폼 입력·검증에 쓴다 */
  versionNumber: string | null;
  /** 화면 표기용(`v3.1`) — 그대로 출력한다 */
  version: string | null;
  status: TermsDocumentStatus | null;
  statusName: string | null;
  effectiveDate: string | null;
  /** 구버전 문서는 false — 그때 관리 열을 비운다(§21-3) */
  canRegisterNewVersion: boolean;
}

/** 서버 `AdminTermsTypeCount` — 탭 코드·표시명·건수를 담은 배열의 한 칸 */
export interface TermsTypeCountItem {
  type: TermsTypeFilter;
  displayName: string;
  count: number;
}

export interface RawTermsListResponse {
  content: Array<TermsListItem>;
  pageInfo: PageInfo;
  typeCounts?: Array<TermsTypeCountItem>;
  scheduledCount: number;
  supersededCount: number;
}

export type TermsTypeCounts = Partial<Record<TermsTypeFilter, number>>;

export interface TermsListResponse {
  content: Array<TermsListItem>;
  pageInfo: PageInfo;
  typeCounts: TermsTypeCounts;
  scheduledCount: number;
  supersededCount: number;
}

export interface TermsListParams extends BaseParams {
  type: TermsTypeFilter;
  keyword: string;
}

/** 버전 이력 행 — 클릭하면 버전 상세로 간다 */
export interface TermsVersionHistoryItem {
  versionId: number;
  versionNumber: string;
  version: string;
  effectiveDate: string;
  registrantName: string;
  registeredAt: string;
  status: TermsVersionStatus;
  statusName: string;
}

export interface TermsDocumentDetail {
  documentId: number;
  name: string;
  type: TermsType;
  typeName: string;
  target: TermsTarget;
  targetName: string;
  status: TermsDocumentStatus;
  statusName: string;
  versionNumber: string | null;
  version: string | null;
  effectiveDate: string | null;
  registrantName: string | null;
  /** 시행 원문 — **조회 전용이다.** 수정 API가 존재하지 않는다 */
  content: string | null;
  /** 보관 중인 과거 버전 수 — 동의 기록이 참조하므로 삭제하지 않는다 */
  pastVersionCount: number;
  /** 시행일 최신순 */
  versions: Array<TermsVersionHistoryItem>;
  canRegisterNewVersion: boolean;
}

export interface TermsVersionDetail {
  documentId: number;
  documentName: string;
  type: TermsType;
  typeName: string;
  target: TermsTarget;
  targetName: string;
  versionId: number;
  versionNumber: string;
  version: string;
  status: TermsVersionStatus;
  statusName: string;
  effectiveStartDate: string;
  /** 다음 버전 시행일의 하루 전 — 시행중·시행 예정이면 null */
  effectiveEndDate: string | null;
  content: string;
  registrantName: string;
  registeredAt: string;
  nextVersion: string | null;
  /** 교체일 = 다음 버전의 시행일 */
  replacedAt: string | null;
  /** 더 오래된 버전 */
  previousVersionId: number | null;
  /** 더 최신 버전 */
  nextVersionId: number | null;
}

/** 신규 문서 등록 — 버전 번호를 받지 않는다(v1.0 자동 부여) */
export interface TermsDocumentRegisterRequest {
  name: string;
  type: TermsType;
  target: TermsTarget;
  /** `YYYY-MM-DD` — 오늘 이후만 */
  effectiveDate: string;
  content: string;
}

/** 새 버전 등록 — 문서명·유형·대상은 문서 속성이라 보내지 않는다 */
export interface TermsVersionRegisterRequest {
  /** 접두 `v` 없이 숫자와 점만. 중복·역행은 서버가 검증한다 */
  versionNumber: string;
  effectiveDate: string;
  content: string;
}
