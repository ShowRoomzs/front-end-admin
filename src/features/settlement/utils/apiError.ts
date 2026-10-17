import axios from "axios";

/*
  정산 쓰기 · 다운로드는 공용 토스트를 끄고(suppressErrorToast) 화면이 에러 코드로 직접 안내한다.
  파일 응답(responseType: "blob")은 실패해도 본문이 Blob이라 JSON을 꺼내 읽어야 한다.
*/

interface ErrorBody {
  code?: string;
  message?: string;
}

export interface SettlementApiError {
  status: number | undefined;
  code: string | undefined;
  message: string | undefined;
}

export async function readApiError(
  error: unknown
): Promise<SettlementApiError> {
  if (!axios.isAxiosError(error)) {
    return { status: undefined, code: undefined, message: undefined };
  }
  const status = error.response?.status;
  const data: unknown = error.response?.data;
  if (data instanceof Blob) {
    try {
      const body = JSON.parse(await data.text()) as ErrorBody;
      return { status, code: body.code, message: body.message };
    } catch {
      return { status, code: undefined, message: undefined };
    }
  }
  const body = (data ?? {}) as ErrorBody;
  return { status, code: body.code, message: body.message };
}

export const NETWORK_ERROR_MESSAGE =
  "요청을 처리하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.";

/**
 * 파일 저장 — 실서버 CORS가 Content-Disposition을 노출하지 않아 파일명은 서버 규칙으로 직접 짓는다
 * (정산명세_{정산번호}.xlsx · 원천세신고자료_{YYYY-MM}.xlsx).
 */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // 클릭 직후 바로 풀면 일부 브라우저가 저장을 놓친다
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
