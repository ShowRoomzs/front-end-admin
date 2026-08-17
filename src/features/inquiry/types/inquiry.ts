import type { BaseParams, PageInfo } from "@/common/types";

/** 저장되는 상태 2종. 처리중·종료는 두지 않는다(§17-1 운영 확정) */
export type InquiryStatus = "WAITING" | "ANSWERED";

/** 목록 탭 — ALL은 필터 없음을 뜻하는 의사값이라 저장 상태가 아니다 */
export type InquiryStatusFilter = "ALL" | InquiryStatus;

/** CS 분류 5종 — FAQ 카테고리와 enum을 공유한다(§17-2-1) */
export type CsCategoryCode = string;

export interface InquiryTypeOption {
  code: CsCategoryCode;
  label: string;
}

export interface InquiryListItem {
  inquiryId: number;
  type: CsCategoryCode;
  typeName: string;
  /** 제목 필드가 없다 — 목록은 내용을 한 줄 말줄임으로 보여준다 */
  content: string;
  writerName: string;
  createdAt: string;
  /** 미답변이면 null */
  answeredAt: string | null;
  /** 서버 계산값. 미답변이면 "아직 안 된 시간", 답변 건이면 "걸린 시간" — 항상 값이 있다 */
  elapsedText: string;
  /** 미답변 && 경과 3일 초과 */
  slaExceeded: boolean;
  status: InquiryStatus;
}

/** 상태 탭 건수 — 유형·검색어는 반영하고 상태 조건만 뺀 값 */
export interface InquiryStatusCounts {
  waiting: number;
  answered: number;
  all: number;
}

export interface InquiryListResponse {
  content: Array<InquiryListItem>;
  pageInfo: PageInfo;
  statusCounts: InquiryStatusCounts;
}

export interface InquiryListParams extends BaseParams {
  status: InquiryStatusFilter;
  /** null = 전체 유형 */
  type: CsCategoryCode | null;
  keyword: string;
}

/**
 * 상세 조회에 함께 넘기는 목록 필터.
 *
 * 서버가 이 범위 안에서 이전/다음을 계산하므로, 상세는 목록의 쿼리스트링을 그대로
 * 물려받아야 이동 순서가 목록과 어긋나지 않는다(§16 변경 요청과 같은 방식).
 */
export type InquiryDetailParams = Omit<InquiryListParams, "page" | "size">;

export interface InquirySummary {
  unansweredCount: number;
}

export interface InquiryThreadMessage {
  /** USER = 소비자, OPERATOR = 운영자(액센트 배경) */
  role: "USER" | "OPERATOR";
  authorName: string;
  sentAt: string;
  content: string;
  /** 소비자 메시지에만 존재, 최대 5장 */
  imageUrls: Array<string> | null;
}

export interface InquiryHistoryEvent {
  event: "RECEIVED" | "ANSWERED";
  occurredAt: string;
  /** 예: "소비자(김민서)" · "운영자(김운영)" */
  actorLabel: string;
}

export interface InquiryDetail {
  inquiryId: number;
  inquiryNumber: string;
  type: CsCategoryCode;
  typeName: string;
  status: InquiryStatus;
  slaExceeded: boolean;
  userId: number;
  userName: string;
  /** 앱에서 주문 없이도 문의할 수 있어 선택값이다 — 없으면 화면에 `—` */
  orderId: number | null;
  createdAt: string;
  answeredAt: string | null;
  elapsedText: string;
  /** "미답변 경과" 또는 "응답 소요" — 서버가 상태에 맞는 라벨을 내려준다 */
  elapsedLabel: string;
  /** 답변완료 상태에서만 값이 있다 */
  operatorName: string | null;
  thread: Array<InquiryThreadMessage>;
  history: Array<InquiryHistoryEvent>;
  /**
   * 현재 탭·필터 기준 이전/다음 문의 ID.
   *
   * 서버가 계산해 주므로 프론트가 형제 id를 들고 다니지 않는다 — 상세 조회 시
   * 목록의 status·type·keyword를 그대로 넘기면 된다(§16 변경 요청과 같은 방식).
   * 경계 건은 null이고, 그때는 해당 버튼을 렌더링하지 않는다(비활성 아님).
   */
  prevInquiryId: number | null;
  nextInquiryId: number | null;
}

export interface InquiryAnswerRequest {
  content: string;
}

export interface InquiryAnswerResponse {
  inquiryId: number;
  inquiryNumber: string;
  status: InquiryStatus;
  answeredAt: string;
  operatorName: string;
  /** 답변 등록 직후 남은 미답변 건수 — GNB 배지를 이 값으로 갱신한다 */
  unansweredCount: number;
}
