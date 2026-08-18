interface AnswerConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 발송될 원문 그대로 — 요약하거나 잘라내지 말 것 */
  content: string;
  isSubmitting?: boolean;
  onSubmit: () => void;
}

/**
 * A5 — 답변 등록 확인 모달(520px).
 *
 * 이 모달이 유일한 방어선이다. 등록하면 소비자에게 즉시 발송되고 수정·삭제가
 * 불가능해, 잘못된 스레드에 답하거나 오타가 난 채로 나가면 **회수 경로가 없다**.
 * 본문에 원문을 그대로 다시 보여주는 것이 이 화면의 존재 이유이므로,
 * "정말 등록하시겠습니까?" 한 줄짜리로 축약하지 말 것(§17-4).
 *
 * 파괴적 액션이 아니라 주 액션(파랑)이고, 반려 모달과 달리 **사유 입력을 받지 않는다.**
 */
export default function AnswerConfirmModal(props: AnswerConfirmModalProps) {
  const { open, onOpenChange, content, isSubmitting = false, onSubmit } = props;

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
      <div className="w-[520px] max-w-full overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]">
        <div className="flex items-center justify-between border-b border-sz-n-200 px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-sz-n-900">답변 등록</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="닫기"
            className="text-[13px] text-sz-n-400 hover:text-sz-n-700"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-5">
          <span className="mb-[5px] block text-[12px] font-medium text-sz-n-600">
            발송될 답변
          </span>
          {/* 스레드의 운영자 메시지와 같은 모양 — 발송 후 보일 형태 그대로 보여준다 */}
          <div className="max-h-[240px] overflow-y-auto whitespace-pre-wrap rounded-[6px] border border-sz-accent-100 bg-sz-accent-50 px-3.5 py-3 text-[12px] leading-[1.75] text-sz-n-700">
            {content}
          </div>
          <p className="mt-3.5 text-[11px] leading-[1.6] text-sz-n-500">
            등록하면 소비자에게 즉시 발송되고{" "}
            <b className="font-semibold text-sz-n-900">
              수정·삭제할 수 없습니다
            </b>
            . 상태는 <b className="font-semibold text-sz-n-900">답변완료</b>로
            바뀌고 접수 대기열에서 내려갑니다.
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
            className="inline-flex h-8 items-center rounded-[6px] bg-sz-accent-500 px-3.5 text-[12px] font-medium text-white hover:bg-sz-accent-600 disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-400"
          >
            {isSubmitting ? "등록 중" : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}
