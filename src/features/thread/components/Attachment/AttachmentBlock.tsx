import { DownloadIcon } from "@/features/thread/components/icons";
import type { AttachmentSummary } from "@/features/thread/types";
import { getFileIconLabel } from "@/features/thread/utils/attachment";
import { downloadAttachments } from "@/features/thread/utils/download";
import { formatBytes, formatDuration } from "@/features/thread/utils/format";
import { cn } from "@/lib/utils";

interface AttachmentBlockProps {
  attachments: Array<AttachmentSummary>;
  /** 오른쪽(운영팀) 말풍선 — 묶음을 오른쪽에 붙인다 */
  alignEnd?: boolean;
  onClickImage: (images: Array<AttachmentSummary>, index: number) => void;
  onPlayVideo: (attachment: AttachmentSummary) => void;
}

/**
 * 메시지 첨부 — 이미지는 썸네일 그리드, 영상 · 문서는 시안 20b `.files/.file` 줄이다.
 * 클릭 동작은 종류마다 다르다: 이미지 = 라이트박스 · 영상 = 재생 · 문서 = 다운로드.
 * 우측 아이콘은 항상 다운로드다. 2개 이상이면 「전체 다운로드」(가려진 사진 포함 실제 개수).
 */
export default function AttachmentBlock(props: AttachmentBlockProps) {
  const { attachments, alignEnd = false, onClickImage, onPlayVideo } = props;

  if (attachments.length === 0) {
    return null;
  }

  const sorted = [...attachments].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
  const images = sorted.filter((item) => item.attachmentType === "IMAGE");
  const files = sorted.filter((item) => item.attachmentType !== "IMAGE");
  // 검증 실패(REJECTED) 첨부는 S3 객체가 없어 받을 수 없다 — 섞으면 전체가 400이다
  const downloadable = sorted
    .filter((item) => item.status === "UPLOADED")
    .map((item) => item.attachmentId);

  return (
    <div
      className={cn(
        "mt-2 flex w-[300px] max-w-full flex-col gap-2",
        alignEnd && "ml-auto"
      )}
    >
      {images.length > 0 && (
        <ImageThumbs
          images={images}
          onClick={(index) => onClickImage(images, index)}
        />
      )}

      {files.map((file) => {
        const isRejected = file.status === "REJECTED";
        const isVideo = file.attachmentType === "VIDEO";
        const meta = isRejected
          ? "업로드 검증에 실패한 파일입니다"
          : [
              file.durationSeconds !== null &&
                formatDuration(file.durationSeconds),
              formatBytes(file.sizeBytes),
            ]
              .filter(Boolean)
              .join(" · ");
        return (
          <div
            key={file.attachmentId}
            className="flex items-center gap-2.5 rounded-[6px] border border-sz-n-200 bg-white py-[9px] pl-3 pr-1.5 text-left"
          >
            <button
              type="button"
              disabled={isRejected}
              onClick={() =>
                isVideo
                  ? onPlayVideo(file)
                  : downloadAttachments([file.attachmentId])
              }
              className="flex min-w-0 flex-1 items-center gap-2.5 text-left disabled:cursor-not-allowed"
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-[6px] text-[9px] font-bold",
                  isRejected
                    ? "bg-sz-danger-bg text-sz-danger-text"
                    : "bg-sz-accent-50 text-sz-accent-600"
                )}
              >
                {getFileIconLabel(file.extension, file.attachmentType)}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12px] text-sz-n-900">
                {file.originalName}
              </span>
              <span
                className={cn(
                  "shrink-0 text-[11px]",
                  isRejected ? "text-sz-danger-text" : "text-sz-n-500"
                )}
              >
                {meta}
              </span>
            </button>
            {!isRejected && (
              <button
                type="button"
                onClick={() => downloadAttachments([file.attachmentId])}
                aria-label={`${file.originalName} 다운로드`}
                className="flex size-7 shrink-0 items-center justify-center rounded-[6px] text-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-700"
              >
                <DownloadIcon />
              </button>
            )}
          </div>
        );
      })}

      {attachments.length >= 2 && downloadable.length > 0 && (
        <button
          type="button"
          onClick={() => downloadAttachments(downloadable)}
          className={cn(
            "inline-flex h-7 w-fit items-center gap-1.5 rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[11px] font-medium text-sz-n-600 hover:bg-sz-n-100 hover:text-sz-n-900",
            alignEnd && "ml-auto"
          )}
        >
          <DownloadIcon className="size-[13px]" />
          전체 다운로드 ({attachments.length})
        </button>
      )}
    </div>
  );
}

/** 이미지 썸네일 — 최대 6칸, 7장 이상이면 마지막 칸에 「+N」 */
function ImageThumbs(props: {
  images: Array<AttachmentSummary>;
  onClick: (index: number) => void;
}) {
  const { images, onClick } = props;
  const visible = images.slice(0, 6);
  const overflow = images.length - visible.length;

  if (images.length === 1) {
    return (
      <button
        type="button"
        onClick={() => onClick(0)}
        className="block h-[130px] w-[180px] overflow-hidden rounded-[6px] border border-sz-n-200 bg-sz-n-100 hover:border-sz-accent-500"
      >
        <img
          src={images[0].fileUrl ?? ""}
          alt={images[0].originalName}
          className="size-full object-cover"
          loading="lazy"
        />
      </button>
    );
  }

  return (
    <div className="grid w-fit grid-cols-3 gap-[3px] overflow-hidden rounded-[6px]">
      {visible.map((image, index) => (
        <button
          key={image.attachmentId}
          type="button"
          onClick={() => onClick(index)}
          className="relative size-[88px] bg-sz-n-200"
        >
          <img
            src={image.fileUrl ?? ""}
            alt={image.originalName}
            className="size-full object-cover"
            loading="lazy"
          />
          {overflow > 0 && index === visible.length - 1 && (
            <span className="absolute inset-0 flex items-center justify-center bg-sz-n-900/55 text-[13px] font-semibold text-white">
              +{overflow}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
