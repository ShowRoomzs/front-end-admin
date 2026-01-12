export const SELLER_REGISTRATION_STATUS = {
  PENDING: "승인 대기",
  APPROVED: "승인",
  REJECTED: "반려",
} as const;

export const SELLER_REGISTRATION_KEYWORD_TYPE = {
  SELLER_ID: "신청 ID",
  MARKET_NAME: "마켓명",
  NAME: "판매 담당자 이름",
  PHONE_NUMBER: "연락처",
} as const;
