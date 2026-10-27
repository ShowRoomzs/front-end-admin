import {
  FlagChip,
  PhotoFill,
} from "@/features/post/components/shared/PostParts";
import type { AdminPostImage } from "@/features/post/types";
import { dateTime } from "@/features/post/utils/view";
import { cn } from "@/lib/utils";
import { useCallback, useEffect } from "react";

interface PhotoViewerProps {
  images: Array<AdminPostImage>;
  index: number;
  /** 하단 메타 — 「게시물 제목 · 쇼룸명」 */
  caption: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** 「신고 지목」 표시 토글 — 영구 삭제 게시물도 허용(보관 중 자료에 표식을 남길 수 있다) */
  onToggleFlag?: (image: AdminPostImage) => void;
  isFlagPending?: boolean;
}

/**
 * C11 사진 원본 뷰어 — 크롭 없이 게시 비율 그대로 크게 보여 준다(가장자리 가격 · 효능 문구 확인용).
 * 조치 버튼은 두지 않는다(조치는 상세 레일에서만 · 노출 중지는 게시물 단위다).
 * 「신고 지목」은 조치가 아니라 읽기 보조 표식이라 원본을 보며 켜고 끈다.
 */
export default function PhotoViewer(props: PhotoViewerProps) {
  const {
    images,
    index,
    caption,
    onIndexChange,
    onClose,
    onToggleFlag,
    isFlagPending = false,
  } = props;
  const total = images.length;
  const image = images[index];

  const go = useCallback(
    (next: number) => {
      if (total === 0) return;
      onIndexChange((next + total) % total);
    },
    [onIndexChange, total]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") go(index - 1);
      if (event.key === "ArrowRight") go(index + 1);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [go, index, onClose]);

  if (!image) {
    return null;
  }

  const resolution =
    image.width && image.height ? `${image.width}×${image.height}` : null;
  const ratio =
    image.width && image.height ? image.width / image.height : 4 / 5;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="사진 원본 보기"
      className="fixed inset-0 z-50 flex flex-col bg-sz-n-900"
    >
      <div className="flex items-center justify-between px-6 py-3.5 text-[12px] text-white">
        <span className="flex flex-wrap items-center gap-x-1">
          <b className="font-semibold">
            사진 {index + 1} / {total}
          </b>
          {[
            image.fileName,
            resolution,
            image.uploadedAt && `${dateTime(image.uploadedAt)} 업로드`,
          ]
            .filter(Boolean)
            .map((part) => (
              <span key={String(part)}>· {part}</span>
            ))}
          {image.reportFlagged && <FlagChip className="ml-2" />}
        </span>
        <span className="flex items-center gap-2">
          {onToggleFlag && (
            <button
              type="button"
              disabled={isFlagPending}
              onClick={() => onToggleFlag(image)}
              className="inline-flex h-7 items-center gap-[5px] rounded-[6px] bg-white/10 px-2.5 text-[11px] font-medium text-white/85 hover:bg-white/20 hover:text-white disabled:opacity-50"
            >
              {image.reportFlagged ? "신고 지목 해제" : "신고 지목 표시"}
            </button>
          )}
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center text-[16px] text-white"
          >
            ✕
          </button>
        </span>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center gap-5">
        <button
          type="button"
          aria-label="이전 사진"
          onClick={() => go(index - 1)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-[18px] text-white hover:bg-white/25"
        >
          ‹
        </button>
        <div
          className="relative flex h-full max-h-[640px] max-w-[calc(100vw-200px)] items-center justify-center overflow-hidden rounded-[6px] bg-sz-n-200"
          style={{ aspectRatio: String(ratio) }}
        >
          <PhotoFill
            url={image.originalUrl ?? image.imageUrl}
            fallback={`사진 ${index + 1} · 원본`}
            fit="contain"
          />
        </div>
        <button
          type="button"
          aria-label="다음 사진"
          onClick={() => go(index + 1)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-[18px] text-white hover:bg-white/25"
        >
          ›
        </button>
      </div>

      <div className="pb-1 pt-3 text-center text-[11px] text-white/70">
        {caption}
      </div>
      <div className="flex flex-wrap justify-center gap-1.5 px-6 pb-5 pt-3.5">
        {images.map((item, itemIndex) => (
          <button
            key={item.imageId}
            type="button"
            aria-label={`사진 ${itemIndex + 1}`}
            onClick={() => onIndexChange(itemIndex)}
            className={cn(
              "relative aspect-[4/5] w-10 overflow-hidden rounded-[3px] bg-sz-n-300",
              itemIndex === index
                ? "opacity-100 outline outline-2 outline-offset-1 outline-white"
                : "opacity-55"
            )}
          >
            <PhotoFill url={item.imageUrl ?? item.originalUrl} fallback="" />
            {/* 신고 지목 장은 하단 줄에도 표시한다(C11) */}
            {item.reportFlagged && (
              <span className="absolute inset-x-0 bottom-0 h-1 bg-sz-danger-text" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
