import type {
  InquiryListParams,
  InquiryStatusCounts,
} from "@/features/inquiry/types/inquiry";

/** 시안 툴바 우측 표시 건수 드롭다운(.sel-sm) */
export const INQUIRY_PAGE_SIZES = [20, 50, 100];

/**
 * 기본 진입 탭이 **전체**인 건 §17-2의 결정이다.
 *
 * 심사 화면(§16)은 처리할 것부터 보여주려고 대기 탭으로 들어가지만, CS는
 * "직전에 뭐라고 답했더라"를 다시 찾는 조회 수요가 훨씬 잦다. 접수 탭으로
 * 되돌리지 말 것 — 미답변 압박은 툴바의 `미답변 N건`과 경과·SLA가 맡는다.
 */
export const INQUIRY_INITIAL_PARAMS: InquiryListParams = {
  page: 1,
  size: INQUIRY_PAGE_SIZES[0],
  status: "ALL",
  type: null,
  keyword: "",
};

/** 목록 응답이 오기 전 탭 배지에 쓰는 자리값 */
export const INQUIRY_EMPTY_COUNTS: InquiryStatusCounts = {
  waiting: 0,
  answered: 0,
  all: 0,
};
