/** 서버(현재는 목업)가 돌려주는 업무 오류 — 화면은 `code`로 필드 오류와 토스트를 가른다 */
export class OrderApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "OrderApiError";
    this.code = code;
  }
}

export function getOrderErrorCode(error: unknown) {
  return error instanceof OrderApiError ? error.code : undefined;
}

export function getOrderErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : undefined;
}
