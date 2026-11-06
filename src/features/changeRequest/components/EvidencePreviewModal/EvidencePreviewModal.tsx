import { formatDateTimeShort } from "@/common/utils/formatDate";
import { formatFileSize } from "@/common/utils/formatFileSize";
import ComparePanel from "@/features/changeRequest/components/EvidencePreviewModal/ComparePanel";
import { PREVIEWABLE_IMAGE_EXTENSIONS } from "@/features/changeRequest/constants/params";
import type {
  ChangeDiffRow,
  ChangeRequestApprovalImpact,
  ChangeRequestCompareItem,
  ChangeRequestEvidence,
  ChangeRequestHolderCheck,
  ChangeRequestReferenceItem,
  ChangeRequestType,
} from "@/features/changeRequest/services/changeRequestService";
import { useEffect, useRef, useState } from "react";

const VIEWER_BTN =
  "inline-flex h-7 items-center gap-[5px] rounded-[6px] border-none bg-white/10 px-2.5 text-[11px] font-medium text-white/85 hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

/** 확대 · 축소(시안 「− 100% +」) — 박스에 맞춘 크기를 100%로 본다 */
const ZOOM_DEFAULT = 100;
const ZOOM_MIN = 50;
const ZOOM_MAX = 300;
const ZOOM_STEP = 25;

/**
 * [내려받기] — 증빙은 공개 S3 URL이고 다른 오리진이라 `download` 속성이 무시된다.
 * 파일을 받아 blob URL로 저장해야 서버 파일명(`fileName`)이 붙는다. S3 CORS로 못 받으면
 * 새 탭으로 연다(브라우저가 저장 여부를 정한다).
 */
async function downloadEvidence(url: string, fileName: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(String(response.status));
    }
    const objectUrl = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // 클릭 직후 바로 풀면 일부 브라우저가 저장을 놓친다
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

interface EvidencePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evidence: ChangeRequestEvidence;
  diffRows: Array<ChangeDiffRow>;
  referenceItems: Array<ChangeRequestReferenceItem>;
  type: ChangeRequestType;
  holderCheck: ChangeRequestHolderCheck | null;
  /** 인플루언서 사업자 구분 변경(C5b)만 — 서류와 대조할 본인확인 정보 */
  compareItems?: Array<ChangeRequestCompareItem> | null;
  approvalImpact?: ChangeRequestApprovalImpact | null;
}

/**
 * C5·C5b·C6 — 증빙 미리보기 + 대조 패널(`ComparePanel`).
 *
 * 이미지만 띄우는 라이트박스가 아니다. 운영자가 확인해야 하는 건 요청 값만이 아니라
 * **동일 사업자인지 · 예금주가 사업자 명의와 맞는지**라서, 변경 대상이 아닌 참고 항목까지
 * 같은 화면에 병기해 모달을 여닫지 않고 대조를 끝내게 한다(§16-3).
 *
 * 입점 심사의 `DocumentPreviewModal`과 왼쪽 뷰어 동작은 같지만 오른쪽 패널이 다른 물건이다 —
 * 저기는 평면 `{label, value}` 목록이고 여기는 `현재값 → 요청값` 쌍이라 공용화하지 않았다.
 * 증빙도 1장뿐이라 썸네일 스트립과 n/total 이동이 없다.
 */
export default function EvidencePreviewModal(props: EvidencePreviewModalProps) {
  const {
    open,
    onOpenChange,
    evidence,
    diffRows,
    referenceItems,
    type,
    holderCheck,
    compareItems,
    approvalImpact,
  } = props;

  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [hasImageError, setHasImageError] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const imageBoxRef = useRef<HTMLDivElement>(null);
  const [imageBoxSize, setImageBoxSize] = useState({ width: 0, height: 0 });

  // 100%는 "박스에 맞춘 크기"(원본보다 키우지는 않는다)이고 확대·축소는 그 배율이다.
  // 90°/270° 회전이면 가로·세로가 서로 바뀌므로 맞춤 배율도 바뀐 치수로 잰다.
  const isSideways = ((rotation % 180) + 180) % 180 === 90;
  const naturalWidth = naturalSize?.width ?? 0;
  const naturalHeight = naturalSize?.height ?? 0;
  const visualWidth = isSideways ? naturalHeight : naturalWidth;
  const visualHeight = isSideways ? naturalWidth : naturalHeight;
  const fitScale =
    visualWidth && visualHeight && imageBoxSize.width && imageBoxSize.height
      ? Math.min(
          imageBoxSize.width / visualWidth,
          imageBoxSize.height / visualHeight,
          1
        )
      : 1;
  const scale = fitScale * (zoom / 100);
  const imageWidth = naturalWidth * scale;
  const imageHeight = naturalHeight * scale;
  // 회전은 레이아웃 크기를 바꾸지 않으므로, 스크롤 영역은 회전된 치수로 직접 잡는다
  const frameWidth = isSideways ? imageHeight : imageWidth;
  const frameHeight = isSideways ? imageWidth : imageHeight;

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

  // 모달을 닫았다 열면 회전·확대·로드 실패 상태가 남지 않도록 초기화한다
  useEffect(() => {
    if (!open) {
      setRotation(0);
      setZoom(ZOOM_DEFAULT);
      setHasImageError(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  const extension = evidence.extension.toLowerCase();
  const isPreviewable =
    PREVIEWABLE_IMAGE_EXTENSIONS.includes(extension) && !hasImageError;

  const metaParts = [
    formatFileSize(evidence.fileSizeBytes),
    extension ? extension.toUpperCase() : null,
    naturalSize ? `${naturalSize.width} × ${naturalSize.height}` : null,
    `업로드 ${formatDateTimeShort(evidence.uploadedAt)}`,
  ].filter(Boolean);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-sz-n-900/40 p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div className="w-[1080px] max-w-full overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]">
        <div className="flex items-center justify-between border-b border-sz-n-200 px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-sz-n-900">
            첨부 증빙 미리보기
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
        <div className="grid h-[620px] grid-cols-[minmax(0,1fr)_340px]">
          <div className="relative flex min-w-0 flex-col bg-sz-n-900">
            {/* 이미지 영역을 absolute로 부모 크기에 고정한다. 내용물 크기에 따라 박스가
                커지면 ResizeObserver가 커진 값을 max-width로 돌려줘 무한 확대가 된다. */}
            <div className="relative min-h-0 flex-1">
              {/* 확대하면 박스보다 커지므로 스크롤로 훑어본다 */}
              <div ref={imageBoxRef} className="absolute inset-5 overflow-auto">
                {isPreviewable ? (
                  <div
                    className="relative"
                    style={{
                      width: Math.max(frameWidth, imageBoxSize.width),
                      height: Math.max(frameHeight, imageBoxSize.height),
                    }}
                  >
                    <img
                      src={evidence.fileUrl}
                      alt={evidence.documentLabel}
                      onError={() => setHasImageError(true)}
                      onLoad={(event) =>
                        setNaturalSize({
                          width: event.currentTarget.naturalWidth,
                          height: event.currentTarget.naturalHeight,
                        })
                      }
                      style={{
                        width: imageWidth || undefined,
                        height: imageHeight || undefined,
                        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                        // 원본 크기를 알기 전에는 맞춤 크기를 못 잡으니 감춰 둔다
                        visibility: naturalSize ? "visible" : "hidden",
                      }}
                      className="absolute left-1/2 top-1/2 max-w-none shadow-[0_4px_18px_rgba(0,0,0,.4)] transition-transform"
                    />
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-1.5 text-[22px] leading-none text-white/30">
                      ⚠
                    </div>
                    <div className="text-[12px] text-white/70">
                      {hasImageError
                        ? "이미지를 불러오지 못했습니다."
                        : "이 형식은 미리보기를 지원하지 않습니다."}
                    </div>
                    <div className="mt-0.5 text-[11px] text-white/40">
                      [원본 열기]로 확인해 주세요.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex h-12 items-center justify-between gap-3 border-t border-white/10 bg-white/5 px-3.5">
              <span
                className="min-w-0 flex-1 truncate text-[11px] text-white/60"
                title={evidence.fileName}
              >
                {evidence.fileName}
              </span>

              {/* 회전 · 확대는 이미지일 때만 의미가 있다 */}
              {isPreviewable && (
                <>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      className={VIEWER_BTN}
                      onClick={() => setRotation((prev) => prev - 90)}
                    >
                      ↺ 90°
                    </button>
                    <button
                      type="button"
                      className={VIEWER_BTN}
                      onClick={() => setRotation((prev) => prev + 90)}
                    >
                      ↻ 90°
                    </button>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      className={VIEWER_BTN}
                      aria-label="축소"
                      disabled={zoom <= ZOOM_MIN}
                      onClick={() =>
                        setZoom((prev) => Math.max(ZOOM_MIN, prev - ZOOM_STEP))
                      }
                    >
                      −
                    </button>
                    <span className="min-w-[38px] px-1.5 text-center text-[11px] text-white/60">
                      {zoom}%
                    </span>
                    <button
                      type="button"
                      className={VIEWER_BTN}
                      aria-label="확대"
                      disabled={zoom >= ZOOM_MAX}
                      onClick={() =>
                        setZoom((prev) => Math.min(ZOOM_MAX, prev + ZOOM_STEP))
                      }
                    >
                      +
                    </button>
                  </div>
                </>
              )}

              <div className="flex shrink-0 items-center gap-1.5">
                <a
                  href={evidence.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={VIEWER_BTN}
                >
                  원본 열기 ↗
                </a>
                {evidence.fileUrl && (
                  <button
                    type="button"
                    className={VIEWER_BTN}
                    onClick={() =>
                      void downloadEvidence(evidence.fileUrl, evidence.fileName)
                    }
                  >
                    내려받기
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 대조 패널 */}
          <div className="overflow-y-auto border-l border-sz-n-200 bg-white p-4">
            <div className="text-[13px] font-semibold text-sz-n-900">
              {evidence.documentLabel}
            </div>
            <div className="mb-4 text-[11px] text-sz-n-500">
              {metaParts.join(" · ")}
            </div>
            <ComparePanel
              type={type}
              diffRows={diffRows}
              referenceItems={referenceItems}
              holderCheck={holderCheck}
              compareItems={compareItems}
              approvalImpact={approvalImpact}
            />
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
