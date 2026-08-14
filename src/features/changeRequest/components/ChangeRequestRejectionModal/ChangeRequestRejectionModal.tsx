import { MODAL_SELECT_CHEVRON_STYLE } from "@/common/constants";
import { CHANGE_REQUEST_TYPE_LABELS } from "@/features/changeRequest/constants/params";
import type {
  ChangeRequestRejectReasonOption,
  ChangeRequestType,
} from "@/features/changeRequest/services/changeRequestService";
import { useEffect, useState } from "react";

const REASON_DETAIL_MAX = 500;

interface ChangeRequestRejectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandName: string;
  type: ChangeRequestType;
  /** 유형별 목록이라 부모가 조회해 넘긴다 — 프론트 상수가 아니다 */
  reasons: Array<ChangeRequestRejectReasonOption>;
  isReasonsLoading?: boolean;
  isSubmitting?: boolean;
  onReject: (reasonType: string, reasonDetail: string) => void;
}

/**
 * C8·C9 — 반려 모달(520px).
 *
 * 입점 심사 반려 모달과 **정책이 정반대**다: 저기는 사유가 내부 전용이지만
 * 여기서 고른 문구는 브랜드 파트너센터 배너와 통지 이메일에 **가공 없이 그대로** 실린다.
 * 그래서 운영자용 축약어를 쓰지 않고 문장형으로 유지한다(§16-5).
 *
 * 상세 사유의 필수 여부는 `"OTHER"`를 하드코딩하지 않고 서버가 준 `detailRequired`를 본다 —
 * 사유 목록과 그 규칙의 SoT가 서버 enum이기 때문이다.
 */
export default function ChangeRequestRejectionModal(
  props: ChangeRequestRejectionModalProps
) {
  const {
    open,
    onOpenChange,
    brandName,
    type,
    reasons,
    isReasonsLoading = false,
    isSubmitting = false,
    onReject,
  } = props;

  const [reasonType, setReasonType] = useState("");
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

  const selectedReason = reasons.find((reason) => reason.code === reasonType);
  const isDetailRequired = selectedReason?.detailRequired ?? false;
  const isDetailMissing = isDetailRequired && reasonDetail.trim().length === 0;
  const canSubmit = reasonType !== "" && !isDetailMissing;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    onReject(reasonType, reasonDetail.trim());
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
            변경 요청 반려
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
          <b className="text-sz-n-900">{brandName}</b>의{" "}
          {CHANGE_REQUEST_TYPE_LABELS[type]} 변경 요청을 반려하시겠습니까?
          <br />
          반려 사유는 브랜드 파트너센터 배너와 이메일로 전달되며, 브랜드는{" "}
          <b className="text-sz-n-900">대기기간 없이 즉시 재요청</b>할 수
          있습니다.
          <label
            htmlFor="change-request-reason-type"
            className="mb-1 mt-4 block text-[12px] font-medium text-sz-n-600"
          >
            반려 사유<span className="ml-0.5 text-sz-danger-text">*</span>
          </label>
          <select
            id="change-request-reason-type"
            value={reasonType}
            onChange={(event) => setReasonType(event.target.value)}
            disabled={isReasonsLoading}
            style={MODAL_SELECT_CHEVRON_STYLE}
            className="h-8 w-full appearance-none rounded-[6px] border border-sz-n-300 bg-white py-1.5 pl-2.5 pr-[30px] text-[13px] text-sz-n-900 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50 disabled:bg-sz-n-100 disabled:text-sz-n-400"
          >
            <option value="">
              {isReasonsLoading ? "불러오는 중…" : "반려 사유 선택"}
            </option>
            {reasons.map((reason) => (
              <option key={reason.code} value={reason.code}>
                {reason.label}
              </option>
            ))}
          </select>
          <label
            htmlFor="change-request-reason-detail"
            className="mb-1 mt-4 block text-[12px] font-medium text-sz-n-600"
          >
            상세 사유
            {isDetailRequired ? (
              <span className="ml-0.5 text-sz-danger-text">*</span>
            ) : (
              <span className="ml-1 font-normal text-sz-n-400">(선택)</span>
            )}
          </label>
          <textarea
            id="change-request-reason-detail"
            value={reasonDetail}
            maxLength={REASON_DETAIL_MAX}
            onChange={(event) => setReasonDetail(event.target.value)}
            placeholder="브랜드에게 전달할 상세 사유를 입력하세요."
            className={`min-h-[88px] w-full resize-y rounded-[6px] border bg-white px-2.5 py-1.5 text-[13px] leading-relaxed text-sz-n-900 outline-none placeholder:text-sz-n-400 ${
              isDetailMissing
                ? "border-sz-danger-text focus:ring-[3px] focus:ring-sz-danger-bg"
                : "border-sz-n-300 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
            }`}
          />
          <div className="mt-1.5 flex items-start justify-between gap-3">
            <p
              className={`text-[11px] ${
                isDetailMissing ? "text-sz-danger-text" : "text-sz-n-500"
              }`}
            >
              {isDetailMissing
                ? `"${selectedReason?.label}"를 선택한 경우 상세 사유는 필수입니다.`
                : "입력한 내용은 브랜드 배너와 통지 이메일에 그대로 노출됩니다."}
            </p>
            <span className="shrink-0 text-[11px] tabular-nums text-sz-n-400">
              {reasonDetail.length}/{REASON_DETAIL_MAX}
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
