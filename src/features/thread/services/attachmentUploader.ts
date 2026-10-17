import { adminThreadService } from "@/features/thread/services/adminThreadService";
import type { AttachmentSummary } from "@/features/thread/types";
import { getLocalAttachmentType } from "@/features/thread/utils/attachment";

/**
 * 영상 재생시간을 브라우저에서 읽는다 — 서버는 파일 바이트를 보지 않아(S3 직접 업로드)
 * 완료 통지에 실어 보낸다. 못 읽는 코덱이면 없이 보낸다(표시용 참고값).
 */
function readVideoDuration(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");

    const cleanUp = (duration?: number) => {
      URL.revokeObjectURL(objectUrl);
      resolve(duration);
    };

    video.preload = "metadata";
    video.onloadedmetadata = () =>
      cleanUp(
        Number.isFinite(video.duration) && video.duration > 0
          ? Math.round(video.duration)
          : undefined
      );
    video.onerror = () => cleanUp(undefined);
    video.src = objectUrl;
  });
}

/**
 * S3로 파일 바이트를 직접 PUT한다. fetch는 업로드 진행률 이벤트가 없어 XHR을 쓴다.
 */
function putToStorage(params: {
  uploadUrl: string;
  contentType: string;
  file: File;
  onProgress: (percent: number) => void;
  signal?: AbortSignal;
}) {
  const { uploadUrl, contentType, file, onProgress, signal } = params;

  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    // 서명에 포함된 값과 정확히 같아야 한다 — 다르면 SignatureDoesNotMatch
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`업로드에 실패했습니다 (${xhr.status})`));
    xhr.onerror = () =>
      reject(new Error("업로드 중 네트워크 오류가 발생했습니다"));
    xhr.onabort = () =>
      reject(new DOMException("업로드가 취소되었습니다", "AbortError"));

    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}

/**
 * 첨부 업로드 3단계 — presign 발급 → S3 직접 PUT → 완료 통지(서버가 실측 재검증).
 * 완료 응답의 `status`가 REJECTED일 수 있다(200 응답의 값) — 호출부가 확인한다.
 */
export async function uploadAttachment(params: {
  threadId: number;
  file: File;
  onProgress: (percent: number) => void;
  signal?: AbortSignal;
}): Promise<AttachmentSummary> {
  const { threadId, file, onProgress, signal } = params;

  const presign = await adminThreadService.createPresignedUpload(threadId, {
    fileName: file.name,
    contentType: file.type || "application/octet-stream",
    sizeBytes: file.size,
  });

  await putToStorage({
    uploadUrl: presign.uploadUrl,
    contentType: presign.requiredContentType,
    file,
    onProgress,
    signal,
  });

  const durationSeconds =
    getLocalAttachmentType(file.name) === "VIDEO"
      ? await readVideoDuration(file)
      : undefined;

  return adminThreadService.completeUpload(presign.attachmentId, {
    durationSeconds,
  });
}
