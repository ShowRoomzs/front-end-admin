import {
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_VIDEO_EXTENSIONS,
} from "@/features/thread/constants/params";
import type { AttachmentType } from "@/features/thread/types";

export function getExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? (parts.pop() ?? "").toLowerCase() : "";
}

/**
 * 시안 `.file-ic` 안의 짧은 라벨 — 「PDF」 · 「IMG」 · 「MP4」.
 * 확장자를 그대로 대문자로 쓰되 이미지는 「IMG」로 묶는다(20b 첨부 칩).
 */
export function getFileIconLabel(
  extension: string,
  attachmentType: AttachmentType
) {
  if (attachmentType === "IMAGE") {
    return "IMG";
  }
  return extension ? extension.toUpperCase().slice(0, 4) : "FILE";
}

/**
 * 전송 전 로컬 파일의 첨부 종류. 서버는 같은 분류를 `attachmentType`으로 내려주므로
 * 이 함수는 아직 올리지 않은 파일(첨부 미리보기)에만 쓴다.
 */
export function getLocalAttachmentType(fileName: string): AttachmentType {
  const extension = getExtension(fileName);
  if (ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
    return "IMAGE";
  }
  if (ALLOWED_VIDEO_EXTENSIONS.includes(extension)) {
    return "VIDEO";
  }
  return "DOCUMENT";
}
