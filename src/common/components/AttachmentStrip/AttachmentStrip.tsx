import { PreviewModal } from "@/common/components/PreviewModal/PreviewModal";
import { useState } from "react";

interface AttachmentStripProps {
  imageUrls: Array<string>;
}

/**
 * 첨부 사진 — `첨부 사진 N장` + 72px 썸네일 한 줄, 클릭 시 라이트박스.
 *
 * 장수 상한은 화면마다 다르다(1:1 문의 5장 · 상품 문의 3장). 그 값은 서버가 이미
 * 검증하고 내려주므로 이 컴포넌트는 받은 만큼 그리고 상한을 알지 못한다 —
 * 여기에 5나 3을 박아 넣지 말 것.
 *
 * 접어 두거나 링크로 대체하지 않는 이유: 환불·상품 상태 문의는 소비자가 사진을
 * 근거로 붙이는 경우가 대부분이라 첨부가 판단의 핵심 자료다(§17-5).
 */
export default function AttachmentStrip(props: AttachmentStripProps) {
  const { imageUrls } = props;
  // null = 닫힘. 0이 첫 장이라 인덱스 자체로는 열림 여부를 판단할 수 없다
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  if (imageUrls.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mt-2.5 text-[11px] text-sz-n-500">
        첨부 사진 {imageUrls.length}장
      </div>
      <div className="mt-2.5 flex gap-2">
        {imageUrls.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => setPreviewIndex(index)}
            aria-label={`첨부 사진 ${index + 1} 확대`}
            className="size-[72px] shrink-0 overflow-hidden rounded-[6px] border border-sz-n-200 bg-sz-n-100 hover:border-sz-accent-500"
          >
            <img
              src={url}
              alt={`첨부 사진 ${index + 1}`}
              className="size-full object-cover"
            />
          </button>
        ))}
      </div>

      <PreviewModal
        isOpen={previewIndex !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewIndex(null);
          }
        }}
        imageUrl={previewIndex === null ? "" : imageUrls[previewIndex]}
        currentIndex={previewIndex ?? 0}
        fileLength={imageUrls.length}
        onIndexChange={setPreviewIndex}
      />
    </>
  );
}
