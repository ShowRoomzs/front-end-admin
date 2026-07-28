import { useCallback, useEffect, useRef, useState } from "react";

export interface CompareRow {
  label: string;
  value: string;
}

export interface SellerDocument {
  key: string;
  /** 서류 이름 (예: 사업자등록증 사본) */
  label: string;
  fileName: string;
  url: string;
  /** 이 서류와 대조해야 할 신청서 입력값 */
  compareRows: Array<CompareRow>;
}

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: Array<SellerDocument>;
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

const VIEWER_BTN =
  "inline-flex h-7 items-center gap-[5px] rounded-[6px] border-none bg-white/10 px-2.5 text-[11px] font-medium text-white/85 hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

/**
 * 첨부 서류 미리보기 — 라이트박스 + 우측 대조 패널.
 *
 * 심사의 본질이 "신청서 입력값 ↔ 서류" 대조이므로 이미지만 확대하지 않고
 * 선택된 서류에 대응하는 입력값을 나란히 보여준다.
 * 줌은 MVP 제외 — 대신 [원본 열기]로 브라우저 기본 확대를 쓴다.
 */
export default function DocumentPreviewModal(props: DocumentPreviewModalProps) {
  const { open, onOpenChange, documents, currentIndex, onIndexChange } = props;
  const [rotation, setRotation] = useState(0);
  const [hasImageError, setHasImageError] = useState(false);
  const imageBoxRef = useRef<HTMLDivElement>(null);
  const [imageBoxSize, setImageBoxSize] = useState({ width: 0, height: 0 });

  const document_ = documents[currentIndex];

  // 90°/270° 회전이면 이미지의 실제 가로·세로가 서로 바뀌므로, 그 상태에서
  // 원래 박스에 맞추려면 max-width/max-height도 서로 바꿔줘야 잘리지 않는다.
  const isSideways = ((rotation % 180) + 180) % 180 === 90;
  const imageMaxWidth = isSideways ? imageBoxSize.height : imageBoxSize.width;
  const imageMaxHeight = isSideways ? imageBoxSize.width : imageBoxSize.height;

  useEffect(() => {
    const el = imageBoxRef.current;
    if (!el || !open) {
      return;
    }
    const updateSize = () =>
      setImageBoxSize({ width: el.clientWidth, height: el.clientHeight });
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  // 서류를 바꾸면 이전 서류의 로드 실패 상태가 남지 않도록 초기화한다
  useEffect(() => {
    setHasImageError(false);
  }, [document_?.url]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  }, [currentIndex, onIndexChange]);

  const handleNext = useCallback(() => {
    if (currentIndex < documents.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  }, [currentIndex, documents.length, onIndexChange]);

  // 서류를 바꾸면 회전 상태는 초기화한다
  useEffect(() => {
    setRotation(0);
  }, [currentIndex]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        handlePrev();
      } else if (event.key === "ArrowRight") {
        handleNext();
      } else if (event.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handlePrev, handleNext, onOpenChange]);

  if (!open || !document_) {
    return null;
  }

  const fileExtension =
    document_.fileName.split(".").pop()?.toUpperCase() ?? "IMAGE";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-sz-n-900/40 p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div className="w-[1040px] max-w-full overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]">
        <div className="flex items-center justify-between border-b border-sz-n-200 px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-sz-n-900">
            첨부 서류 미리보기
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="닫기"
            className="text-[13px] text-sz-n-400 hover:text-sz-n-700"
          >
            ✕
          </button>
        </div>

        {/* min-w-0: 1fr 트랙은 최소 크기가 auto라, 이게 없으면 큰 이미지가
            트랙 자체를 밀어내 모달 밖으로 넘친다 */}
        <div className="grid h-[600px] grid-cols-[minmax(0,1fr)_320px]">
          {/* 라이트박스 */}
          <div className="relative flex min-w-0 flex-col bg-sz-n-900">
            {/* 이미지 영역은 absolute로 부모 크기에 고정한다.
                내용물 크기에 따라 박스가 커지면 ResizeObserver가 다시 커진 값을
                max-width로 돌려줘 무한히 확대되는 되먹임이 생기기 때문. */}
            <div className="relative min-h-0 flex-1">
              <div
                ref={imageBoxRef}
                className="absolute inset-5 flex items-center justify-center overflow-hidden"
              >
                {hasImageError ? (
                  <div className="text-center">
                    <div className="mb-1.5 text-[22px] leading-none text-white/30">
                      ⚠
                    </div>
                    <div className="text-[12px] text-white/70">
                      이미지를 불러오지 못했습니다.
                    </div>
                    <div className="mt-0.5 text-[11px] text-white/40">
                      [원본 열기]로 확인해 주세요.
                    </div>
                  </div>
                ) : (
                  <img
                    src={document_.url}
                    alt={document_.label}
                    onError={() => setHasImageError(true)}
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      maxWidth: imageMaxWidth || "100%",
                      maxHeight: imageMaxHeight || "100%",
                    }}
                    className="object-contain shadow-[0_4px_18px_rgba(0,0,0,.4)] transition-transform"
                  />
                )}
              </div>
            </div>

            <div className="flex h-12 items-center justify-between border-t border-white/10 bg-white/5 px-3.5">
              <div className="flex gap-1.5">
                {documents.map((item, index) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onIndexChange(index)}
                    aria-label={item.label}
                    className={`h-6 w-[34px] rounded-[3px] border-[1.5px] ${
                      index === currentIndex
                        ? "border-white bg-white/35"
                        : "border-transparent bg-white/15"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className={VIEWER_BTN}
                  onClick={() => setRotation((prev) => prev + 90)}
                >
                  ↻ 90°
                </button>
                <button
                  type="button"
                  className={VIEWER_BTN}
                  onClick={() => setRotation((prev) => prev - 90)}
                >
                  ↺ 90°
                </button>
                <a
                  href={document_.url}
                  target="_blank"
                  rel="noreferrer"
                  className={VIEWER_BTN}
                >
                  원본 열기 ↗
                </a>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className={VIEWER_BTN}
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                >
                  ‹
                </button>
                <span className="px-1.5 text-[11px] text-white/60">
                  {currentIndex + 1} / {documents.length}
                </span>
                <button
                  type="button"
                  className={VIEWER_BTN}
                  onClick={handleNext}
                  disabled={currentIndex === documents.length - 1}
                >
                  ›
                </button>
              </div>
            </div>
          </div>

          {/* 대조 패널 */}
          <div className="overflow-y-auto border-l border-sz-n-200 bg-white p-4">
            <div className="text-[13px] font-semibold text-sz-n-900">
              {document_.label}
            </div>
            <div className="mb-4 text-[11px] text-sz-n-500">
              {fileExtension}
            </div>

            <div className="mb-2 border-b border-sz-n-200 pb-1.5 text-[11px] font-semibold text-sz-n-500">
              서류와 대조할 입력값
            </div>
            {document_.compareRows.map((row) => (
              <div
                key={row.label}
                className="border-b border-sz-n-100 py-2.5 last:border-b-0"
              >
                <div className="mb-0.5 text-[11px] text-sz-n-500">
                  {row.label}
                </div>
                <div className="text-[13px] font-medium text-sz-n-900">
                  {row.value}
                </div>
              </div>
            ))}

            <div className="mt-4 flex gap-[7px] rounded-[6px] bg-sz-n-100 px-3 py-2.5 text-[11px] leading-relaxed text-sz-n-600">
              <span>ⓘ</span>
              <span>
                표시되는 항목은 <b>선택한 서류에 따라 바뀝니다.</b>
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-sz-n-200 px-5 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-8 items-center rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
