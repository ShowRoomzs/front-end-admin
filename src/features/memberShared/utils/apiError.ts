import axios from "axios";

/** 서버 에러 본문 — `{ code, message }` (탈퇴 조건 미충족이면 `unmet`이 붙는다) */
export interface MemberApiError {
  status: number | undefined;
  code: string | undefined;
  message: string | undefined;
}

export function readMemberApiError(error: unknown): MemberApiError {
  if (!axios.isAxiosError(error)) {
    return { status: undefined, code: undefined, message: undefined };
  }
  const body = (error.response?.data ?? {}) as {
    code?: string;
    message?: string;
  };
  return {
    status: error.response?.status,
    code: body.code,
    message: body.message,
  };
}

/**
 * 화면이 본 상태와 서버 상태가 어긋난 409 — 다른 운영자가 먼저 처리했거나 조건이 바뀌었다.
 * 모달을 닫고 상세를 다시 읽는다(서버 문구는 공용 토스트가 띄운다).
 */
export const MEMBER_STALE_CODES = [
  "BRAND_ALREADY_SUSPENDED",
  "BRAND_NOT_SUSPENDED",
  "BRAND_WITHDRAWN",
  "BRAND_WITHDRAWAL_CONDITION_UNMET",
  "BRAND_WITHDRAWAL_NOT_PENDING",
  "BRAND_WITHDRAWAL_NOT_FOUND",
  "CREATOR_ALREADY_SUSPENDED",
  "CREATOR_NOT_SUSPENDED",
  "CREATOR_WITHDRAWN",
  "CREATOR_STATE_CHANGED",
  "CREATOR_WITHDRAWAL_CONDITION_UNMET",
  "CREATOR_WITHDRAWAL_NOT_PENDING",
  "CREATOR_WITHDRAWAL_NOT_FOUND",
  "CREATOR_PRIVACY_UNMASK_NOT_AVAILABLE",
];
