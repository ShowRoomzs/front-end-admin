import "axios";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** true면 인터셉터의 전역 오류 토스트를 끈다 — 호출부가 실패를 화면에 직접 그릴 때 */
    suppressErrorToast?: boolean;
    _retry?: boolean;
  }
}
