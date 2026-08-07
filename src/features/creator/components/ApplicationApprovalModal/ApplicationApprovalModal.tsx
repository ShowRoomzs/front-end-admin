interface ApplicationApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 식별자는 계정 아이디다 — 상세 응답에 활동명이 없다 */
  accountId: string;
  isSubmitting?: boolean;
  onApprove: () => void;
}

/**
 * 입점 신청 승인 확인 모달 — 사유 입력이 없는 단순 확인(400px).
 *
 * 통지는 **이메일 단일**이다(§9-3). 브랜드는 "이메일·문자" 2종이므로 문구를
 * 그대로 가져오면 안 된다.
 */
export default function ApplicationApprovalModal(
  props: ApplicationApprovalModalProps
) {
  const {
    open,
    onOpenChange,
    accountId,
    isSubmitting = false,
    onApprove,
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
            입점 신청 승인
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
          <b className="text-sz-n-900">@{accountId}</b>의 입점 신청을
          승인하시겠습니까?
          <br />
          <br />
          승인 시 계정이 즉시 활성화되고 신청자에게 <b>이메일</b>로 통지됩니다.
          신청자는 로그인 후 온보딩(<b>쇼룸명·사업자 여부·정산계좌</b>) 입력이
          강제됩니다.
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
            onClick={onApprove}
            disabled={isSubmitting}
            className="inline-flex h-8 items-center rounded-[6px] bg-sz-accent-500 px-3.5 text-[12px] font-medium text-white hover:bg-sz-accent-600 disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-400"
          >
            {isSubmitting ? "처리 중" : "승인하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
