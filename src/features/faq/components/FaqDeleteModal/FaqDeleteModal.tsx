interface FaqDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 삭제 대상 질문 원문 */
  question: string;
  isSubmitting?: boolean;
  onSubmit: () => void;
}

/**
 * C3 — FAQ 삭제 확인 모달(소형 400px, 입력 필드 없음).
 *
 * 질문 원문을 문장에 박아 넣는 게 이 모달의 핵심이다 — 행이 6개만 넘어가도
 * 어느 행의 삭제를 눌렀는지 헷갈리는데, 원문이 모달에 있으면 오삭제를 막는다.
 *
 * 삭제 사유는 받지 않는다. 운영자가 만든 정적 콘텐츠라 소명할 상대가 없다
 * (소비자 게시물 삭제(§18)와 다른 지점).
 */
export default function FaqDeleteModal(props: FaqDeleteModalProps) {
  const {
    open,
    onOpenChange,
    question,
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
          <h2 className="text-[13px] font-semibold text-sz-n-900">FAQ 삭제</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="닫기"
            className="text-[13px] text-sz-n-400 hover:text-sz-n-700"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-5 text-[12px] leading-[1.7] text-sz-n-700">
          <b className="text-sz-n-900">{question}</b> 항목을 삭제합니다.
          <p className="mt-3 text-[11px] leading-[1.55] text-sz-n-500">
            소비자 앱 고객센터에서 즉시 사라지며{" "}
            <b className="text-sz-n-900">복구할 수 없습니다</b>. 같은 카테고리에
            남은 항목의 순서는 자동으로 당겨집니다.
          </p>
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
            className="inline-flex h-8 items-center rounded-[6px] bg-sz-danger-text px-3.5 text-[12px] font-medium text-white hover:bg-[#8f2828] disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-400"
          >
            {isSubmitting ? "삭제 중" : "삭제"}
          </button>
        </div>
      </div>
    </div>
  );
}
