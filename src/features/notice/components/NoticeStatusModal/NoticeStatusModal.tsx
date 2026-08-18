interface NoticeStatusModalProps {
  /** null이면 닫힘. 열 때 대상 공지의 제목과 어느 방향인지를 함께 넘긴다 */
  target: { title: string; mode: "END" | "PUBLISH" } | null;
  onClose: () => void;
  isSubmitting?: boolean;
  onSubmit: () => void;
}

const COPY = {
  END: {
    title: "공지 게시 종료",
    sentence: "공지의 게시를 종료합니다.",
    hint: (
      <>
        소비자 앱 공지사항에서 즉시 내려갑니다. 공지는 삭제되지 않고{" "}
        <b className="font-semibold text-sz-n-900">게시 종료</b> 상태로 목록에
        남아, 언제든 다시 게시할 수 있습니다.
      </>
    ),
    submit: "게시 종료",
  },
  PUBLISH: {
    title: "공지 게시",
    sentence: "공지를 다시 게시합니다.",
    hint: (
      <>
        소비자 앱 공지사항에 즉시 노출됩니다. 등록일·수정일은 그대로 유지되며,
        목록에서는 <b className="font-semibold text-sz-n-900">중요</b> 여부와
        등록일 순서에 따라 배치됩니다.
      </>
    ),
    submit: "게시",
  },
} as const;

/**
 * C5·C6 — 게시 종료 / 재게시 확인 모달(400px).
 *
 * **두 모달은 같은 컴포넌트에 문구·라벨만 반대다**(§20-5). 따로 만들면 한쪽만
 * 고쳐지는 일이 반복된다.
 *
 * 게시 종료도 **주 액션(파랑)이다.** 삭제가 아니라 노출만 중단이고 되돌릴 수 있어서,
 * 위험색을 쓰면 복구 불가로 오인된다 — §18(상품 문의 삭제, 위험색)과 갈리는 지점이다.
 * 사유도 받지 않는다: 운영자 내부 콘텐츠라 소명할 상대가 없다.
 */
export default function NoticeStatusModal(props: NoticeStatusModalProps) {
  const { target, onClose, isSubmitting = false, onSubmit } = props;

  if (!target) {
    return null;
  }

  const copy = COPY[target.mode];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-sz-n-900/40 p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-[400px] max-w-full overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]">
        <div className="flex items-center justify-between border-b border-sz-n-200 px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-sz-n-900">
            {copy.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-[13px] text-sz-n-400 hover:text-sz-n-700"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-5 text-[12px] leading-[1.7] text-sz-n-700">
          {/* 대상 제목을 문장 안에 넣는다 — 목록에서 옆 행을 눌렀는지 확인할 수 있어야 한다 */}
          <b className="font-semibold text-sz-n-900">{target.title}</b>{" "}
          {copy.sentence}
          <p className="mt-3 text-[11px] leading-[1.6] text-sz-n-500">
            {copy.hint}
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-sz-n-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
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
            {isSubmitting ? "처리 중" : copy.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
