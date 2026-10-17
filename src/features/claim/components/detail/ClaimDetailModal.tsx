import ClaimRail from "@/features/claim/components/detail/ClaimRail";
import ClaimSections from "@/features/claim/components/detail/ClaimSections";
import { ClaimBadge } from "@/features/claim/components/shared/ClaimParts";
import {
  ORDER_LIST_PATH,
  THREAD_PATH,
} from "@/features/claim/constants/params";
import { useRefundByOperator } from "@/features/claim/hooks/useAdminClaimMutations";
import { useGetClaimDetail } from "@/features/claim/hooks/useAdminClaimQueries";
import type { OperatorRefundRequest } from "@/features/claim/types";
import { useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

interface ClaimDetailModalProps {
  claimNo: string;
  /** 현재 목록의 이웃 건 — 없으면 해당 버튼을 그리지 않는다(RecordNav와 같은 관례) */
  prevClaimNo?: string;
  nextClaimNo?: string;
  onNavigate: (claimNo: string) => void;
  onClose: () => void;
}

const NAV_BTN_CLASS =
  "inline-flex h-8 items-center gap-[5px] whitespace-nowrap rounded-[6px] border border-sz-n-300 bg-white px-3 text-[12px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100 hover:text-sz-n-900";

/**
 * B1~B4 — 반품·교환 상세. 목록 위에 뜨는 1040px 모달이다(시안 `.modal.wide`).
 * 좌측은 단계마다 다른 블록, 우측은 현재 상태 + 운영자 조치. 목록의 이전·다음 건으로 넘어갈 수 있다.
 *
 * 바깥 영역을 눌러도 닫지 않는다 — 사유 환불을 쓰던 입력이 빗나간 클릭 한 번에 날아가면 안 된다.
 * 닫는 경로는 ✕ · Esc 둘이다.
 */
export default function ClaimDetailModal(props: ClaimDetailModalProps) {
  const { claimNo, prevClaimNo, nextClaimNo, onNavigate, onClose } = props;
  const navigate = useNavigate();
  const { data: detail, isLoading, isError } = useGetClaimDetail(claimNo);
  const refund = useRefundByOperator();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [handleKeyDown]);

  const handleRefund = (body: OperatorRefundRequest) => {
    refund.mutate(
      { claimNo, body },
      {
        onSuccess: () => toast.success("환불 대기로 편입했습니다."),
        onError: (error) =>
          toast.error(
            error instanceof Error
              ? error.message
              : "환불 대기 편입에 실패했습니다."
          ),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(26,27,31,0.4)]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="claim-detail-title"
        className="flex max-h-[calc(100vh-32px)] w-[1040px] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-[8px] bg-white shadow-[0_8px_24px_rgba(26,27,31,0.12),0_2px_6px_rgba(26,27,31,0.08)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-sz-n-200 px-5 py-3.5 text-[13px] font-semibold text-sz-n-900">
          <h2 id="claim-detail-title" className="text-[13px] font-semibold">
            반품·교환 상세{" "}
            <span className="font-medium tabular-nums tracking-[-0.1px] text-sz-n-600">
              {claimNo}
            </span>{" "}
            {detail && (
              <ClaimBadge tone={detail.headerBadge.tone} hideDot>
                {detail.headerBadge.label}
              </ClaimBadge>
            )}
          </h2>
          <div className="flex items-center gap-1.5">
            {prevClaimNo && (
              <button
                type="button"
                className={NAV_BTN_CLASS}
                onClick={() => onNavigate(prevClaimNo)}
              >
                ‹ 이전
              </button>
            )}
            {nextClaimNo && (
              <button
                type="button"
                className={NAV_BTN_CLASS}
                onClick={() => onNavigate(nextClaimNo)}
              >
                다음 ›
              </button>
            )}
            {(prevClaimNo || nextClaimNo) && (
              <span className="mx-0.5 h-[18px] w-px bg-sz-n-300" />
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="text-[13px] text-sz-n-400 hover:text-sz-n-600"
            >
              ✕
            </button>
          </div>
        </div>

        {detail ? (
          <div className="grid min-h-0 grid-cols-[1fr_320px] items-start gap-4 overflow-y-auto bg-sz-n-50 p-4 text-[12px] leading-[1.7] text-sz-n-700">
            <div className="min-w-0">
              <ClaimSections detail={detail} />
            </div>
            <div className="sticky top-0 min-w-0">
              <ClaimRail
                detail={detail}
                isRefunding={refund.isPending}
                onRefund={handleRefund}
                onOpenOrder={() =>
                  navigate({
                    pathname: ORDER_LIST_PATH,
                    search: `?keyword=${encodeURIComponent(detail.orderNo)}`,
                  })
                }
                onOpenThread={() => navigate(THREAD_PATH)}
              />
            </div>
          </div>
        ) : (
          <div className="bg-sz-n-50 px-6 py-[72px] text-center text-[12px] text-sz-n-500">
            {isLoading && !isError
              ? "불러오는 중…"
              : "상세를 불러오지 못했습니다."}
          </div>
        )}
      </div>
    </div>
  );
}
