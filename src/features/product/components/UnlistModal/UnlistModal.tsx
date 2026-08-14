import { MODAL_SELECT_CHEVRON_STYLE } from "@/common/constants";
import { PRODUCT_HIDE_REASONS } from "@/features/product/constants/params";
import type { ProductHideReasonType } from "@/features/product/services/productService";
import { useEffect, useState } from "react";

interface UnlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  isSubmitting?: boolean;
  onSubmit: (reasonType: ProductHideReasonType, reasonDetail: string) => void;
}

/**
 * 미진열 처리 모달(480px).
 *
 * ⚠️ 인플루언서 입점 심사의 반려 모달과 **문구를 섞어 쓰면 안 된다**.
 * 그쪽 반려 사유는 신청자에게 비공개지만, 상품 미진열 사유는 브랜드가
 * 무엇을 고쳐야 하는지 알아야 하므로 **브랜드에게 그대로 노출**된다(기능요구사항 §11-11).
 *
 * - 미진열 사유: 필수
 * - 상세 사유: 기본은 선택. "기타(직접 입력)"을 고르면 필수
 */
export default function UnlistModal(props: UnlistModalProps) {
  const {
    open,
    onOpenChange,
    productName,
    isSubmitting = false,
    onSubmit,
  } = props;

  const [reasonType, setReasonType] = useState<ProductHideReasonType | "">("");
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
    onSubmit(reasonType as ProductHideReasonType, reasonDetail.trim());
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
      <div className="w-[480px] max-w-full overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]">
        <div className="flex items-center justify-between border-b border-sz-n-200 px-5 py-3.5">
          <h2 className="text-[13px] font-semibold text-sz-n-900">
            미진열 처리
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
          <b className="text-sz-n-900">{productName}</b>을(를) 미진열 처리합니다.
          소비자 화면 노출이 즉시 중단됩니다.
          <label
            htmlFor="hide-reason-type"
            className="mb-1 mt-4 block text-[12px] font-medium text-sz-n-600"
          >
            미진열 사유<span className="ml-0.5 text-sz-danger-text">*</span>
          </label>
          <select
            id="hide-reason-type"
            value={reasonType}
            onChange={(event) =>
              setReasonType(event.target.value as ProductHideReasonType | "")
            }
            style={MODAL_SELECT_CHEVRON_STYLE}
            className="h-8 w-full appearance-none rounded-[6px] border border-sz-n-300 bg-white py-1.5 pl-2.5 pr-[30px] text-[13px] text-sz-n-900 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          >
            <option value="">사유 선택</option>
            {PRODUCT_HIDE_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>

          <label
            htmlFor="hide-reason-detail"
            className="mb-1 mt-4 block text-[12px] font-medium text-sz-n-600"
          >
            상세 사유
            {isDetailRequired ? (
              <span className="ml-0.5 text-sz-danger-text">*</span>
            ) : (
              <span className="ml-1 font-normal text-sz-n-500">(선택)</span>
            )}
          </label>
          <textarea
            id="hide-reason-detail"
            value={reasonDetail}
            onChange={(event) => setReasonDetail(event.target.value)}
            placeholder="브랜드가 확인할 수 있도록 구체적으로 적어주세요."
            className={`min-h-[80px] w-full resize-y rounded-[6px] border bg-white px-2.5 py-1.5 text-[13px] leading-relaxed text-sz-n-900 outline-none placeholder:text-sz-n-400 ${
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
              진행중인 공구가 있어도 <b>공구 게시물·계약은 유지</b>되며 소비자
              노출만 중단됩니다. 공구 자체 중단은 공구 관리에서 별도로
              처리하세요.
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
            {isSubmitting ? "처리 중" : "미진열 처리"}
          </button>
        </div>
      </div>
    </div>
  );
}
