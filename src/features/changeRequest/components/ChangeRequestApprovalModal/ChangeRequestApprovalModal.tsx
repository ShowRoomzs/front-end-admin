import { CHANGE_REQUEST_TYPE_LABELS } from "@/features/changeRequest/constants/params";
import type { ChangeRequestType } from "@/features/changeRequest/services/changeRequestService";

interface ChangeRequestApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandName: string;
  type: ChangeRequestType;
  isSubmitting?: boolean;
  onApprove: () => void;
}

/**
 * C7 — 승인 확인 모달(400px).
 *
 * 되돌릴 수 없는 집행 액션이라 확인 단계를 건너뛰는 경로를 만들지 않는다(§16-4).
 * 정산 계좌는 잘못 승인하면 돈이 다른 계좌로 나가므로 **회차 영향**까지 여기서 못 박는다.
 */
export default function ChangeRequestApprovalModal(
  props: ChangeRequestApprovalModalProps
) {
  const {
    open,
    onOpenChange,
    brandName,
    type,
    isSubmitting = false,
    onApprove,
  } = props;

  if (!open) {
    return null;
  }

  const isSettlement = type === "SETTLEMENT_ACCOUNT";
  const typeLabel = CHANGE_REQUEST_TYPE_LABELS[type];

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
            변경 요청 승인
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
          <b className="text-sz-n-900">{brandName}</b>의 {typeLabel} 변경 요청을
          승인하시겠습니까?
          <div className="mt-4 flex gap-2 rounded-[6px] bg-sz-danger-bg px-3 py-2.5 text-[11px] font-medium leading-relaxed text-sz-danger-text">
            <span>!</span>
            <span>
              {isSettlement ? (
                <>
                  승인 즉시 새 계좌가 반영됩니다.{" "}
                  <b>이미 확정된 정산 회차는 기존 계좌로 지급</b>되며, 되돌리려면
                  브랜드가 다시 요청해야 합니다.
                </>
              ) : (
                <>
                  승인 즉시 변경 값이 브랜드 계정에 반영되고 통지 이메일이
                  나갑니다. <b>이 처리는 되돌릴 수 없습니다.</b>
                </>
              )}
            </span>
          </div>
          <p className="mt-3 text-[11px] text-sz-n-500">
            {isSettlement
              ? "통장 사본과 예금주 대조를 마쳤는지 확인하세요."
              : "첨부 서류와 변경 요청 값의 대조를 마쳤는지 확인하세요."}
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
