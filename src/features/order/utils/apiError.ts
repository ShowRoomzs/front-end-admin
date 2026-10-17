import axios from "axios";

/*
  서버 업무 오류(`ErrorResponse { code, message }`). 기본은 apiInstance 인터셉터가 서버 메시지를
  토스트로 띄우므로 화면은 따로 알리지 않는다. 폼 안에 직접 그리는 오류(송장 형식 · 중복)만
  `suppressErrorToast`로 토스트를 끄고 이 함수로 code · message를 읽는다.
*/
interface ErrorBody {
  code?: string;
  message?: string;
}

export function getOrderErrorCode(error: unknown) {
  return axios.isAxiosError<ErrorBody>(error)
    ? error.response?.data?.code
    : undefined;
}

export function getOrderErrorMessage(error: unknown) {
  return axios.isAxiosError<ErrorBody>(error)
    ? error.response?.data?.message
    : undefined;
}
