interface RelistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  isSubmitting?: boolean;
  onSubmit: () => void;
}

/** 다시 진열 확인 모달 — 사유 입력이 없는 단순 확인(400px). */
export default function RelistModal(props: RelistModalProps) {
  const {
    open,
    onOpenChange,
    productName,
    isSubmitting = false,
    onSubmit,
  } = props;

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-sz-n-900/40 p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
    >
      <div className="w-[400px] max-w-full overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]">
        <div className="flex items-center justify-between border-b border-sz-n-200 px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-sz-n-900">
            다시 진열하시겠어요?
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

        <div className="px-5 py-5 text-[12px] leading-relaxed text-sz-n-700">
          <b className="text-sz-n-900">{productName}</b>을(를) 다시 진열합니다.
          진열 즉시 소비자 화면에 다시 노출됩니다.
          <div className="mt-3 flex gap-2 rounded-[6px] bg-sz-info-bg px-3 py-2.5 text-[11px] leading-relaxed text-sz-info-text">
            <span>ⓘ</span>
            <span>
              재검토 대기 사유가 된 상품 정보 수정 내용을 이미 확인하셨는지 다시
              한번 점검해 주세요.
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-sz-n-200 px-5 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-8 items-center rounded-[6px] border border-sz-n-300 bg-white px-3.5 text-[12px] font-medium text-sz-n-900 hover:bg-sz-n-100"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="inline-flex h-8 items-center rounded-[6px] bg-sz-accent-500 px-3.5 text-[12px] font-medium text-white hover:bg-sz-accent-600 disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-400"
          >
            {isSubmitting ? "처리 중" : "다시 진열"}
          </button>
        </div>
      </div>
    </div>
  );
}
