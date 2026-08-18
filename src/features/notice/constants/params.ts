import type { FileType } from "@/common/services/fileService";
import type { NoticeListParams } from "@/features/notice/types/notice";

export const NOTICE_PAGE_SIZES = [20, 50, 100];

export const NOTICE_INITIAL_PARAMS: NoticeListParams = {
  page: 1,
  size: NOTICE_PAGE_SIZES[0],
  status: "ALL",
  keyword: "",
};

/**
 * 공지 본문 이미지의 업로드 타입.
 *
 * **임시값이다.** 백엔드 `ImageType.ADMIN_ALLOWED_TYPES`가 현재 `CATEGORY` 하나만
 * 허용해서, 어드민이 쓸 수 있는 업로드 타입이 이것뿐이다. 공지 전용 `NOTICE` 타입이
 * 추가되면(§20-6 #2 · 김화창 확인 대기) **이 상수만 바꾸면 된다** — 그래서 에디터
 * 호출부에 문자열을 흩뿌리지 않고 한 곳에 모아 두었다.
 */
export const NOTICE_IMAGE_UPLOAD_TYPE: FileType = "CATEGORY";
