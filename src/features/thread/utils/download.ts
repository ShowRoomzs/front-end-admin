import { adminThreadService } from "@/features/thread/services/adminThreadService";

/** 여러 건을 연달아 저장할 때 간격 — 한 틱에 몰아 쏘면 브라우저가 뒤쪽을 버린다 */
const SEQUENTIAL_DOWNLOAD_GAP = 400;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 저장 시작. `download` 속성은 다른 오리진(S3)이라 무시되므로 붙이지 않는다 —
 * 서버가 URL 서명에 심은 `Content-Disposition: attachment`가 저장과 파일명을 정한다.
 */
function triggerDownload(url: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

/**
 * 첨부 저장 — `fileUrl`(CDN)로 받지 않고 매번 서버에서 새로 서명받는다.
 * CDN 키가 UUID라 파일명이 깨지고, Content-Disposition이 없어 새 탭 미리보기로 열린다.
 * 실패 사유는 apiInstance 인터셉터가 토스트로 띄운다.
 */
export async function downloadAttachments(attachmentIds: Array<number>) {
  if (attachmentIds.length === 0) {
    return;
  }
  let files: Awaited<ReturnType<typeof adminThreadService.getDownloadUrls>>;
  try {
    files = await adminThreadService.getDownloadUrls(attachmentIds);
  } catch {
    return;
  }
  for (const [index, file] of files.entries()) {
    if (index > 0) {
      await delay(SEQUENTIAL_DOWNLOAD_GAP);
    }
    triggerDownload(file.downloadUrl);
  }
}
