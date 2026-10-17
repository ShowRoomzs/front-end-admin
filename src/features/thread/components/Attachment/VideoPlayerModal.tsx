import type { AttachmentSummary } from "@/features/thread/types";
import { useEffect } from "react";

interface VideoPlayerModalProps {
  attachment: AttachmentSummary | null;
  onClose: () => void;
}

/** 영상 재생 오버레이 — 재생 · 탐색 · 전체화면은 브라우저 기본 컨트롤에 맡긴다 */
export default function VideoPlayerModal(props: VideoPlayerModalProps) {
  const { attachment, onClose } = props;

  useEffect(() => {
    if (!attachment) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [attachment, onClose]);

  if (!attachment?.fileUrl) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="absolute right-6 top-6 text-2xl text-white hover:text-sz-n-300"
      >
        ✕
      </button>
      <div className="absolute left-6 top-6 max-w-[60%] truncate text-[13px] text-white">
        {attachment.originalName}
      </div>
      <video
        src={attachment.fileUrl}
        controls
        autoPlay
        className="max-h-[80vh] max-w-[80vw] rounded-[6px] bg-black"
      />
    </div>
  );
}
