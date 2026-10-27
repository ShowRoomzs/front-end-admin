import { APPLIES_FROM_LABELS } from "@/features/changeRequest/constants/params";
import type {
  ChangeRequestApprovalImpact,
  ChangeRequestHolderCheck,
  ChangeRequestType,
} from "@/features/changeRequest/services/changeRequestService";
import { getRequestPhrase } from "@/features/changeRequest/utils/requester";
import type { ReactNode } from "react";

interface ChangeRequestApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 브랜드명 또는 쇼룸명 */
  requesterName: string;
  type: ChangeRequestType;
  approvalImpact?: ChangeRequestApprovalImpact | null;
  holderCheck?: ChangeRequestHolderCheck | null;
  isSubmitting?: boolean;
  onApprove: () => void;
}

/**
 * C7 · C7b — 승인 확인 모달(400px).
 *
 * 되돌릴 수 없는 집행 액션이라 확인 단계를 건너뛰는 경로를 만들지 않는다(§16-4).
 * 계좌 변경은 잘못 승인하면 돈이 다른 계좌로 나가므로 **회차 영향**까지 여기서 못 박는다.
 * 인플루언서 사업자 구분 변경(C7b)은 세무 처리가 바뀌는 승인이라 상세의 「승인하면」 카드 내용을
 * 한 번 더 보여준다 — 적용 시점 · 계좌 변경 필요 → 지급 보류.
 */
export default function ChangeRequestApprovalModal(
  props: ChangeRequestApprovalModalProps
) {
  const {
    open,
    onOpenChange,
    requesterName,
    type,
    approvalImpact,
    holderCheck,
    isSubmitting = false,
    onApprove,
  } = props;

  if (!open) {
    return null;
  }

  const { warning, hint } = getApprovalCopy(type, approvalImpact, holderCheck);

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
          <b className="text-sz-n-900">{requesterName}</b>의{" "}
          {getRequestPhrase(type)}을 승인하시겠습니까?
          <div className="mt-4 flex gap-2 rounded-[6px] bg-sz-danger-bg px-3 py-2.5 text-[11px] font-medium leading-relaxed text-sz-danger-text">
            <span>!</span>
            <span>{warning}</span>
          </div>
          {hint && <p className="mt-3 text-[11px] text-sz-n-500">{hint}</p>}
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

function getApprovalCopy(
  type: ChangeRequestType,
  approvalImpact?: ChangeRequestApprovalImpact | null,
  holderCheck?: ChangeRequestHolderCheck | null
): { warning: ReactNode; hint: string | null } {
  const appliesFrom =
    APPLIES_FROM_LABELS[approvalImpact?.appliesFrom ?? "NEXT_SETTLEMENT"] ??
    "다음 정산부터";

  switch (type) {
    case "SETTLEMENT_ACCOUNT":
      return {
        warning:
          "승인 즉시 새 계좌가 반영됩니다. 이미 확정된 정산 회차는 기존 계좌로 지급되며, 되돌리려면 브랜드가 다시 요청해야 합니다.",
        hint: "통장 사본과 예금주 대조를 마쳤는지 확인하세요.",
      };
    case "CREATOR_ACCOUNT":
      // 기-22 — 흐름은 브랜드 정산 계좌와 같고, 지급 단위가 「지급 요청」이라 문장만 다르다(C4b 안내와 같은 말)
      return {
        warning:
          "승인 즉시 새 계좌가 반영됩니다. 지급 요청이 이미 나간 정산은 기존 계좌로 지급되며, 되돌리려면 인플루언서가 다시 요청해야 합니다.",
        hint: "통장 사본의 예금주와 본인 실명 대조를 마쳤는지 확인하세요.",
      };
    case "TO_INDIVIDUAL":
      return {
        warning: (
          <>
            승인하면 <b>{appliesFrom}</b> 비사업자(원천징수 3.3%)로 처리됩니다.
            {approvalImpact?.accountChangeRequired && (
              <>
                {" "}
                지금 정산 계좌 예금주가{" "}
                <b>
                  상호
                  {holderCheck?.currentHolder
                    ? `(${holderCheck.currentHolder})`
                    : ""}
                </b>
                라, 인플루언서가 <b>본인 실명 계좌</b>로 바꾸기 전까지 확정된
                정산은 <b>지급 보류</b>됩니다. 스튜디오에 「계좌 변경 필요」가
                표시됩니다.
              </>
            )}{" "}
            되돌리려면 인플루언서가 다시 요청해야 합니다.
          </>
        ),
        hint: null,
      };
    case "TO_BUSINESS":
      return {
        warning: (
          <>
            승인하면 <b>{appliesFrom}</b> 개인사업자(세금계산서 · 리워드 +
            부가세 10%)로 처리됩니다. 인플루언서가{" "}
            <b>SHOWROOMZ 앞으로 세금계산서</b>를 발행해야 지급됩니다. 되돌리려면
            인플루언서가 다시 요청해야 합니다.
          </>
        ),
        hint: null,
      };
    default:
      return {
        warning: (
          <>
            승인 즉시 변경 값이 브랜드 계정에 반영되고 통지 이메일이 나갑니다.{" "}
            <b>이 처리는 되돌릴 수 없습니다.</b>
          </>
        ),
        hint: "첨부 서류와 변경 요청 값의 대조를 마쳤는지 확인하세요.",
      };
  }
}
