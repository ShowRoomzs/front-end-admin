import { SELLER_REJECTION_REASONS } from "@/features/seller/constants/params";
import type { RejectionReason } from "@/features/seller/services/sellerService";
import { useEffect, useState } from "react";

interface ApplicationRejectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketName: string;
  isSubmitting?: boolean;
  onReject: (reasonType: RejectionReason, reasonDetail: string) => void;
}

/**
 * 입점 신청 반려 모달(520px).
 *
 * - 반려 사유 유형: 필수
 * - 상세 사유: 기본은 선택. 단 "기타(직접 입력)"을 고르면 필수가 된다
 *   (유형만으로는 신청자가 무엇을 고쳐야 할지 알 수 없기 때문)
 */
export default function ApplicationRejectionModal(
  props: ApplicationRejectionModalProps
) {
  const {
    open,
    onOpenChange,
    marketName,
    isSubmitting = false,
    onReject,
  } = props;

  const [reasonType, setReasonType] = useState<RejectionReason | "">("");
  const [reasonDetail, setReasonDetail] = useState("");

  // 모달을 닫으면 입력을 초기화한다
  useEffect(() => {
    if (!open) {
      setReasonType("");
      setReasonDetail("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const isDetailRequired = reasonType === "OTHER";
  const isDetailMissing = isDetailRequired && reasonDetail.trim().length === 0;
  const canSubmit = reasonType !== "" && !isDetailMissing;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    onReject(reasonType as RejectionReason, reasonDetail.trim());
  };

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
          <h2 className="text-[13px] font-semibold text-sz-n-900">
            입점 신청 반려
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
          <b className="text-sz-n-900">{marketName}</b>의 입점 신청을 반려합니다.
          반려 사유는 신청자에게 <b>이메일·문자로만</b> 전달됩니다.

          <label
            htmlFor="rejection-reason-type"
            className="mb-1.5 mt-4 block text-[12px] font-semibold text-sz-n-600"
          >
            반려 사유<span className="ml-0.5 text-sz-danger-text">*</span>
          </label>
          <select
            id="rejection-reason-type"
            value={reasonType}
            onChange={(event) =>
              setReasonType(event.target.value as RejectionReason | "")
            }
            className="h-9 w-full rounded-[6px] border border-sz-n-300 bg-white px-3 text-[13px] text-sz-n-900 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          >
            <option value="">반려 사유 선택</option>
            {SELLER_REJECTION_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>

          <label
            htmlFor="rejection-reason-detail"
            className="mb-1.5 mt-4 block text-[12px] font-semibold text-sz-n-600"
          >
            상세 사유
            {isDetailRequired ? (
              <span className="ml-0.5 text-sz-danger-text">*</span>
            ) : (
              <span className="ml-1 font-normal text-sz-n-500">(선택)</span>
            )}
          </label>
          <textarea
            id="rejection-reason-detail"
            value={reasonDetail}
            onChange={(event) => setReasonDetail(event.target.value)}
            placeholder="통지 이메일·문자에 그대로 발송됩니다. 어떤 서류를 어떻게 보완해야 하는지 적어주세요."
            className={`min-h-[96px] w-full resize-y rounded-[6px] border bg-white px-3 py-2 text-[13px] leading-relaxed text-sz-n-900 outline-none placeholder:text-sz-n-400 ${
              isDetailMissing
                ? "border-sz-danger-text focus:ring-[3px] focus:ring-sz-danger-bg"
                : "border-sz-n-300 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
            }`}
          />
          <p
            className={`mt-1.5 text-[11px] ${
              isDetailMissing ? "text-sz-danger-text" : "text-sz-n-500"
            }`}
          >
            사유를 <b>기타(직접 입력)</b>로 선택한 경우 상세 사유는{" "}
            <b>필수</b>입니다.
          </p>

          <div className="mt-4 flex gap-2 rounded-[6px] bg-sz-danger-bg px-3 py-2.5 text-[11px] font-medium leading-relaxed text-sz-danger-text">
            <span>⚠</span>
            <span>
              반려 즉시 <b>계정과 제출 정보가 파기</b>되며, 신청자는 처음부터
              회원가입을 다시 진행합니다(동일 이메일 재가입 허용).{" "}
              <b>이 처리는 되돌릴 수 없습니다.</b>
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
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="inline-flex h-8 items-center rounded-[6px] bg-sz-danger-text px-3.5 text-[12px] font-medium text-white hover:bg-[#8f2828] disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-400"
          >
            {isSubmitting ? "처리 중" : "반려 처리"}
          </button>
        </div>
      </div>
    </div>
  );
}
