import { PreviewContent } from "@/common/components/PreviewModal/PreviewContent";
import { useCallback, useEffect } from "react";

export interface PreviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  currentIndex: number;
  fileLength: number;
  onIndexChange?: (index: number) => void;
}

export const PreviewModal = (props: PreviewModalProps) => {
  const {
    imageUrl,
    fileLength,
    currentIndex,
    isOpen,
    onIndexChange,
    onOpenChange,
  } = props;

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onIndexChange?.(currentIndex - 1);
    }
  }, [currentIndex, onIndexChange]);

  const handleNext = useCallback(() => {
    if (currentIndex < fileLength - 1) {
      onIndexChange?.(currentIndex + 1);
    }
  }, [currentIndex, fileLength, onIndexChange]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          event.stopPropagation();
          handlePrevious();
          break;
        case "ArrowRight":
          event.preventDefault();
          event.stopPropagation();
          handleNext();
          break;
        case "Escape":
          event.preventDefault();
          event.stopPropagation();
          onOpenChange(false);
          break;
      }
    },
    [isOpen, handlePrevious, handleNext, onOpenChange]
  );

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) {
        onOpenChange(false);
      }
    },
    [onOpenChange]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !imageUrl) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        handleBackdropClick(e);
      }}
    >
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onOpenChange(false);
        }}
        className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-20"
        aria-label="닫기"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="w-8 h-8"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* File counter */}
      <div className="absolute top-6 left-6 text-white text-sm z-20">
        {currentIndex + 1} / {fileLength}
      </div>

      {/* Content */}
      <div className="relative max-w-[90vw] max-h-[90vh] w-full h-full flex items-center justify-center">
        <PreviewContent imageUrl={imageUrl} className="w-full h-full" />

        {/* Navigation arrows */}
        {fileLength > 1 && (
          <>
            {/* Previous arrow */}
            {currentIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handlePrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-3 hover:bg-black/80 transition-colors z-10"
                aria-label="이전 파일"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}

            {/* Next arrow */}
            {currentIndex < fileLength - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 text-white rounded-full p-3 hover:bg-black/80 transition-colors z-10"
                aria-label="다음 파일"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
