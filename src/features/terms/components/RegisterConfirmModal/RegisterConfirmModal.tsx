import { FieldRow } from "@/common/components/DetailCard/DetailCard";
import { formatDateOnly } from "@/common/utils/formatDate";

interface RegisterConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  documentName: string;
  /** 화면 표기 그대로(`v3.2`) */
  version: string;
  /** `YYYY-MM-DD` */
  effectiveDate: string;
  /** 교체 대상 버전 — 신규 문서 등록에는 없다 */
  replacingVersion?: string | null;
  isSubmitting?: boolean;
  onSubmit: () => void;
}

/**
 * C7 — 등록 확인 모달(520px). 신규 문서 등록과 새 버전 등록이 공유한다.
 *
 * **무엇이 언제부터 무엇을 대체하는지**를 한 번 더 보여주는 것이 이 모달의 존재
 * 이유다(§21-5) — 등록 후에는 원문을 고칠 수 없어 되돌리려면 또 새 버전을 올려야 한다.
 * 파괴적 액션이 아니므로 주 액션(파랑)이다.
 */
export default function RegisterConfirmModal(props: RegisterConfirmModalProps) {
  const {
    open,
    onOpenChange,
    title,
    documentName,
    version,
    effectiveDate,
    replacingVersion,
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

        <div className="px-5 py-4">
          <FieldRow label="문서">{documentName}</FieldRow>
          <FieldRow label={replacingVersion ? "새 버전" : "버전"}>
            <span className="tabular-nums">{version}</span>
          </FieldRow>
          <FieldRow label="시행일">
            <span className="tabular-nums">
              {formatDateOnly(effectiveDate)}
            </span>
          </FieldRow>
          {/* 교체 대상은 개정에만 있다 — 신규 문서는 대체할 것이 없다 */}
          {replacingVersion && (
            <FieldRow label="교체 대상">
              <span className="tabular-nums">{replacingVersion}</span>
            </FieldRow>
          )}

          <p className="mt-3.5 text-[11px] leading-[1.6] text-sz-n-500">
            시행일 이전에는 등록만 되고 소비자 화면에 노출되지 않습니다. 시행일
            00:00에 시스템이 자동으로 교체하며,{" "}
            {replacingVersion ? (
              <>
                기존 {replacingVersion}은 삭제되지 않고{" "}
                <b className="font-semibold text-sz-n-900">과거 버전</b>으로
                보관됩니다.
              </>
            ) : (
              <>
                등록한 원문은{" "}
                <b className="font-semibold text-sz-n-900">
                  수정할 수 없습니다
                </b>{" "}
                — 내용을 고치려면 새 버전을 등록해야 합니다.
              </>
            )}
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
