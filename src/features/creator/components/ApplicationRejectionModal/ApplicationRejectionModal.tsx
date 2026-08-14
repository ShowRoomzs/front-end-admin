import { MODAL_SELECT_CHEVRON_STYLE } from "@/common/constants";
import { CREATOR_REJECTION_REASONS } from "@/features/creator/constants/params";
import type { CreatorRejectionReasonType } from "@/features/creator/services/creatorService";
import { useEffect, useState } from "react";

interface ApplicationRejectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 식별자는 계정 아이디다 — 상세 응답에 활동명이 없다 */
  accountId: string;
  isSubmitting?: boolean;
  onReject: (
    reasonType: CreatorRejectionReasonType,
    reasonDetail: string
  ) => void;
}

/**
 * 입점 신청 반려 모달(520px).
 *
 * ⚠️ 구조는 브랜드 반려 모달과 같지만 **문구를 절대 복사해 오면 안 된다**(§3-2).
 * 브랜드는 반려 사유를 이메일·문자로 신청자에게 전달하지만, 인플루언서는
 * 선택형 사유와 상세 서술 **모두 신청자에게 비공개**인 내부 기록이다.
 * 실제로 브랜드 문구가 복사돼 "통지에 발송됩니다"라고 안내하던 정책 위반
 * 버그가 있었다(§3-6).
 *
 * - 반려 사유 유형: 필수
 * - 상세 사유: 기본은 선택. "기타(직접 입력)"을 고르면 필수
 */
export default function ApplicationRejectionModal(
  props: ApplicationRejectionModalProps
) {
  const {
    open,
    onOpenChange,
    accountId,
    isSubmitting = false,
    onReject,
  } = props;

  const [reasonType, setReasonType] = useState<
    CreatorRejectionReasonType | ""
  >("");
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
    onReject(reasonType as CreatorRejectionReasonType, reasonDetail.trim());
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
          <b className="text-sz-n-900">@{accountId}</b>의 입점 신청을 반려합니다.
          반려 사유는 <b>내부 기록용</b>이며 신청자에게 별도로 안내되지 않습니다.
          <label
            htmlFor="rejection-reason-type"
            className="mb-1 mt-4 block text-[12px] font-medium text-sz-n-600"
          >
            반려 사유<span className="ml-0.5 text-sz-danger-text">*</span>
            <span className="ml-1 font-normal text-sz-n-500">
              (내부 기록용 · 신청자 미노출)
            </span>
          </label>
          <select
            id="rejection-reason-type"
            value={reasonType}
            onChange={(event) =>
              setReasonType(
                event.target.value as CreatorRejectionReasonType | ""
              )
            }
            style={MODAL_SELECT_CHEVRON_STYLE}
            className="h-8 w-full appearance-none rounded-[6px] border border-sz-n-300 bg-white py-1.5 pl-2.5 pr-[30px] text-[13px] text-sz-n-900 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          >
            <option value="">반려 사유 선택</option>
            {CREATOR_REJECTION_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>

          <label
            htmlFor="rejection-reason-detail"
            className="mb-1 mt-4 block text-[12px] font-medium text-sz-n-600"
          >
            상세 사유
            {isDetailRequired ? (
              <span className="ml-0.5 text-sz-danger-text">*</span>
            ) : (
              <span className="ml-1 font-normal text-sz-n-500">
                (선택 · 내부 기록용 · 신청자 미노출)
              </span>
            )}
          </label>
          <textarea
            id="rejection-reason-detail"
            value={reasonDetail}
            onChange={(event) => setReasonDetail(event.target.value)}
            placeholder="신청자에게는 발송되지 않습니다. 내부 심사 기록·재발 방지용으로 구체적으로 남겨주세요."
            className={`min-h-[88px] w-full resize-y rounded-[6px] border bg-white px-2.5 py-1.5 text-[13px] leading-relaxed text-sz-n-900 outline-none placeholder:text-sz-n-400 ${
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
              반려 즉시 <b>제출 정보가 파기</b>되며, 이번 신청 건은 종료됩니다.
              신청자는 <b>반려일로부터 14일 후</b>에만 완전히 새 신청서로
              재신청할 수 있습니다. <b>이 처리는 되돌릴 수 없습니다.</b>
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
