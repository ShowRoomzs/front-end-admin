import { formatDateTimeShort } from "@/common/utils/formatDate";
import { formatFileSize } from "@/common/utils/formatFileSize";
import { PREVIEWABLE_IMAGE_EXTENSIONS } from "@/features/changeRequest/constants/params";
import type {
  ChangeDiffRow,
  ChangeRequestEvidence,
  ChangeRequestHolderCheck,
  ChangeRequestReferenceItem,
  ChangeRequestType,
} from "@/features/changeRequest/services/changeRequestService";
import { useEffect, useRef, useState } from "react";

const VIEWER_BTN =
  "inline-flex h-7 items-center gap-[5px] rounded-[6px] border-none bg-white/10 px-2.5 text-[11px] font-medium text-white/85 hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";

interface EvidencePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evidence: ChangeRequestEvidence;
  diffRows: Array<ChangeDiffRow>;
  referenceItems: Array<ChangeRequestReferenceItem>;
  type: ChangeRequestType;
  holderCheck: ChangeRequestHolderCheck | null;
}

/**
 * C5·C6 — 증빙 미리보기 + 요청 값 대조 패널.
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
  } = props;

  const [rotation, setRotation] = useState(0);
  const [hasImageError, setHasImageError] = useState(false);
  const [naturalSize, setNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const imageBoxRef = useRef<HTMLDivElement>(null);
  const [imageBoxSize, setImageBoxSize] = useState({ width: 0, height: 0 });

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

  // 모달을 닫았다 열면 회전·로드 실패 상태가 남지 않도록 초기화한다
  useEffect(() => {
    if (!open) {
      setRotation(0);
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
  const changedRows = diffRows.filter((row) => row.changed);
  const isSettlement = type === "SETTLEMENT_ACCOUNT";

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
              <div
                ref={imageBoxRef}
                className="absolute inset-5 flex items-center justify-center overflow-hidden"
              >
                {isPreviewable ? (
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
                      transform: `rotate(${rotation}deg)`,
                      maxWidth: imageMaxWidth || "100%",
                      maxHeight: imageMaxHeight || "100%",
                    }}
                    className="object-contain shadow-[0_4px_18px_rgba(0,0,0,.4)] transition-transform"
                  />
                ) : (
                  <div className="text-center">
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

            <div className="flex h-12 items-center justify-between border-t border-white/10 bg-white/5 px-3.5">
              <div className="flex items-center gap-1.5">
                {/* 회전은 이미지일 때만 의미가 있다 */}
                {isPreviewable && (
                  <>
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
                  </>
                )}
              </div>

              <a
                href={evidence.fileUrl}
                target="_blank"
                rel="noreferrer"
                className={VIEWER_BTN}
              >
                원본 열기 ↗
              </a>
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

            <div className="mb-2 border-b border-sz-n-200 pb-1.5 text-[11px] font-semibold text-sz-n-500">
              서류와 대조할 요청 값
            </div>
            {changedRows.length === 0 ? (
              <p className="py-2.5 text-[12px] text-sz-n-500">
                변경 요청된 항목이 없습니다.
              </p>
            ) : (
              changedRows.map((row) => (
                <div
                  key={row.fieldKey}
                  className="border-b border-sz-n-100 py-2.5 last:border-b-0"
                >
                  <div className="mb-0.5 text-[11px] text-sz-n-500">
                    {row.label}
                  </div>
                  <div className="mb-px text-[11px] text-sz-n-500 line-through decoration-sz-n-400">
                    {row.currentValue || "—"}
                  </div>
                  <div className="text-[13px] font-semibold leading-snug text-sz-accent-600">
                    {row.requestedValue}
                  </div>
                </div>
              ))
            )}

            {referenceItems.length > 0 && (
              <>
                <div className="mb-2 mt-4 border-b border-sz-n-200 pb-1.5 text-[11px] font-semibold text-sz-n-500">
                  {isSettlement
                    ? "대조 기준 (사업자 정보)"
                    : "참고 항목 (변경 대상 아님)"}
                </div>
                {referenceItems.map((item) => (
                  <div
                    key={item.label}
                    className="border-b border-sz-n-100 py-2.5 last:border-b-0"
                  >
                    <div className="mb-0.5 text-[11px] text-sz-n-500">
                      {item.label}
                    </div>
                    <div className="text-[13px] font-medium text-sz-n-900">
                      {item.value}
                    </div>
                  </div>
                ))}
              </>
            )}

            {holderCheck?.mismatch ? (
              <div className="mt-4 flex gap-[7px] rounded-[6px] bg-sz-danger-bg px-3 py-2.5 text-[11px] leading-relaxed text-sz-danger-text">
                <span>!</span>
                <span>
                  <b>예금주 불일치 주의</b> — 요청 예금주가{" "}
                  <b>{holderCheck.requestedHolder}</b>인데 사업자등록증 상호는{" "}
                  <b>{holderCheck.companyName}</b>입니다. 법인 사업자는 법인 명의
                  계좌만 등록할 수 있으니, 통장 사본의 예금주 표기를 확인하고
                  다르면 반려하세요.
                </span>
              </div>
            ) : (
              <div className="mt-4 flex gap-[7px] rounded-[6px] bg-sz-n-100 px-3 py-2.5 text-[11px] leading-relaxed text-sz-n-600">
                <span>ⓘ</span>
                <span>
                  {isSettlement ? (
                    <>
                      위 <b>대조 기준</b>은 예금주가 사업자 명의와 맞는지
                      확인하는 데 씁니다.
                    </>
                  ) : (
                    <>
                      위 <b>참고 항목</b>은 변경 대상이 아니지만{" "}
                      <b>동일 사업자인지</b> 확인하는 데 씁니다 — 사업자등록번호가
                      다르면 반려하고 신규 입점으로 안내하세요.
                    </>
                  )}
                </span>
              </div>
            )}
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
