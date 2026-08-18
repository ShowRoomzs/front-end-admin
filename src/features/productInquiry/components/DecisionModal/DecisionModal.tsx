import { MODAL_SELECT_CHEVRON_STYLE } from "@/common/constants";
import {
  REASON_ETC,
  type DecisionReasonOption,
} from "@/features/productInquiry/constants/params";
import { useEffect, useState } from "react";

export type DecisionTone = "danger" | "primary";

interface DecisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** 사유 셀렉트 라벨 — "삭제 사유" · "반려 사유" */
  reasonLabel: string;
  reasons: Array<DecisionReasonOption>;
  /** 사유 셀렉트 아래 회색 보조 문구 */
  hint: string;
  /** 결과를 예고하는 박스. danger면 위험 톤, primary면 정보 톤 */
  notice: React.ReactNode;
  tone: DecisionTone;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (reason: string, detail: string) => void;
}

/**
 * C4·C5 — 삭제 처리 / 삭제 요청 반려 모달(520px).
 *
 * 두 모달은 **구조가 같고 사유 목록·색·안내 톤만 다르다**(§18-6 "구조는 삭제 모달과
 * 동일"). 그래서 컴포넌트 하나로 두고 톤을 주입한다 — 따로 만들면 한쪽만 고쳐지는
 * 일이 반복된다.
 *
 * 색이 다른 건 성격이 달라서다. 삭제는 되돌릴 수 없는 파괴적 집행이라 위험색이고,
 * 반려는 게시를 유지하는 판단이라 주 액션(파랑)이다.
 */
export default function DecisionModal(props: DecisionModalProps) {
  const {
    open,
    onOpenChange,
    title,
    reasonLabel,
    reasons,
    hint,
    notice,
    tone,
    submitLabel,
    isSubmitting = false,
    onSubmit,
  } = props;

  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");

  // 열릴 때마다 비운다 — 삭제 모달을 닫고 반려를 열면 앞의 입력이 남아 있으면 안 된다
  useEffect(() => {
    if (open) {
      setReason("");
      setDetail("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  /*
    상세 사유는 기본이 선택값이고 `기타(직접 입력)`일 때만 필수로 전환된다.
    정형 사유가 "기타"면 그 자체로는 아무 정보가 없어 집행 근거가 남지 않는다.
  */
  const isDetailRequired = reason === REASON_ETC;
  const canSubmit =
    reason !== "" && (!isDetailRequired || detail.trim().length > 0);

  const handleSubmit = () => {
    if (!canSubmit || isSubmitting) {
      return;
    }
    onSubmit(reason, detail.trim());
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
          <h2 className="text-[13px] font-semibold text-sz-n-900">{title}</h2>
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
          <label
            htmlFor="decision-reason"
            className="mb-1 block text-[12px] font-medium text-sz-n-600"
          >
            {reasonLabel}
            <span className="ml-0.5 text-sz-danger-text">*</span>
          </label>
          <select
            id="decision-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            style={MODAL_SELECT_CHEVRON_STYLE}
            className="h-8 w-full appearance-none rounded-[6px] border border-sz-n-300 bg-white py-1.5 pl-2.5 pr-[30px] text-[13px] text-sz-n-900 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          >
            <option value="">선택</option>
            {reasons.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>

          <label
            htmlFor="decision-detail"
            className="mb-1 mt-4 block text-[12px] font-medium text-sz-n-600"
          >
            상세 사유
            {isDetailRequired ? (
              <span className="ml-0.5 text-sz-danger-text">*</span>
            ) : (
              <span className="ml-1 font-normal text-sz-n-400">선택</span>
            )}
          </label>
          <textarea
            id="decision-detail"
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            maxLength={500}
            className="min-h-[64px] w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-[7px] text-[13px] leading-relaxed text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50"
          />
          <p className="mt-1.5 text-[11px] text-sz-n-500">{hint}</p>

          <div
            className={`mt-4 flex gap-2 rounded-[6px] px-3 py-2.5 text-[11px] font-medium leading-[1.6] ${
              tone === "danger"
                ? "bg-sz-danger-bg text-sz-danger-text"
                : "bg-sz-info-bg text-sz-info-text"
            }`}
          >
            <span aria-hidden>{tone === "danger" ? "!" : "i"}</span>
            <span>{notice}</span>
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
            // 미선택은 에러 문구 없이 버튼 비활성만으로 표현한다(§18-5)
            disabled={!canSubmit || isSubmitting}
            className={`inline-flex h-8 items-center rounded-[6px] px-3.5 text-[12px] font-medium text-white disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-400 ${
              tone === "danger"
                ? "bg-sz-danger-text hover:bg-[#8f2828]"
                : "bg-sz-accent-500 hover:bg-sz-accent-600"
            }`}
          >
            {isSubmitting ? "처리 중" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
