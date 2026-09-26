import DetailCard from "@/common/components/DetailCard/DetailCard";
import HistoryList from "@/common/components/HistoryList/HistoryList";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { formatDateTimeShort } from "@/common/utils/formatDate";
import { FLink, MetaRow } from "@/features/contract/components/detail/Rows";
import Btn from "@/features/contract/components/shared/Btn";
import { MODUSIGN_DASHBOARD_URL } from "@/features/contract/constants/params";
import type { AdminContractDetail } from "@/features/contract/types";
import { formatKRW } from "@/features/contract/utils/format";
import { toHistoryItems } from "@/features/contract/utils/history";
import { toneToVariant } from "@/features/contract/utils/statusBadge";
import type { ReactNode } from "react";

export interface StatusRailActions {
  onApprove: () => void;
  onReject: () => void;
  onConclude: () => void;
  onExpire: () => void;
  onCancel: () => void;
  /** 계약서 제출본(생성본) 보기 */
  onOpenDraft: () => void;
  /** 체결 후 서명본(서명 PDF) 보기 */
  onOpenSigned: () => void;
}

function Hint(props: { children: ReactNode }) {
  return (
    <p className="mt-2.5 text-[11px] leading-[1.6] text-sz-n-500">
      {props.children}
    </p>
  );
}

function openDashboard() {
  window.open(MODUSIGN_DASHBOARD_URL, "_blank", "noopener,noreferrer");
}

/** 이력에서 특정 이벤트의 처리자 실명(최신 우선) */
function actorOf(detail: AdminContractDetail, eventType: string) {
  const entry = [...detail.history]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .find((item) => item.eventType === eventType);
  return entry?.actorDisplayName ?? null;
}

const CANCEL_HINT = (
  <Hint>
    <b className="font-semibold">
      검토 통과 이후 양측은 계약을 취소할 수 없습니다
    </b>{" "}
    — 취소가 필요하면 소통 스레드로 요청하고, 운영자가 확인해{" "}
    <b className="font-semibold">직권 취소</b>합니다.
  </Hint>
);

/**
 * 시안 우측 레일 「상태」 — 배지 · 메타 행 · 액션 · 힌트. 버튼 노출은 서버 `permissions`로만 정한다.
 * 필수 미충족(체결 문서 미업로드 · 기한 전 만료)은 에러 문구 없이 **버튼만 비활성**이고,
 * 이유는 메타 행의 경고색(「미업로드」)과 힌트로 읽히게 한다.
 */
function StatusCard(props: {
  detail: AdminContractDetail;
  actions: StatusRailActions;
}) {
  const { detail, actions } = props;
  const { contract, review, signature, permissions, documents, closure } =
    detail;
  const docExists = (type: string) =>
    documents.some((document) => document.type === type && document.exists);
  const draftLink = <FLink onClick={actions.onOpenDraft}>제출본 보기</FLink>;
  const signText = (value: string | null, empty: string) =>
    value ? formatDateTimeShort(value) : empty;
  const deadlineValue =
    signature.deadlinePassedDays > 0
      ? `${formatDateTimeShort(signature.deadlineAt)} · ${signature.deadlinePassedDays}일 경과`
      : formatDateTimeShort(signature.deadlineAt);

  let rows: ReactNode = null;
  let acts: ReactNode = null;
  let hint: ReactNode = null;

  switch (contract.status) {
    case "REVIEW_PENDING":
      rows = (
        <>
          <MetaRow
            label="검토 요청"
            value={formatDateTimeShort(review.requestedAt)}
          />
          <MetaRow label="대기 경과" value={review.waitingElapsed ?? "—"} />
          <MetaRow label="브랜드" value={contract.brand.name} />
          <MetaRow label="인플루언서" value={contract.creator?.name ?? "—"} />
          <MetaRow
            label="계약서"
            value={
              docExists("GENERATED_DRAFT")
                ? "제출 내용으로 생성됨"
                : "내려받을 때 생성됩니다"
            }
          />
        </>
      );
      acts = (permissions.canApprove || permissions.canReject) && (
        <div className="mt-3.5 flex gap-2">
          {permissions.canApprove && (
            <Btn
              variant="primary"
              className="flex-1"
              onClick={actions.onApprove}
            >
              검토 승인 · 서명 요청
            </Btn>
          )}
          {permissions.canReject && (
            <Btn variant="danger" className="flex-1" onClick={actions.onReject}>
              검토 반려
            </Btn>
          )}
        </div>
      );
      hint = (
        <Hint>
          승인하면 <b className="font-semibold">편집 잠금이 유지된 채</b> 서명
          진행중으로 넘어갑니다. 반려하면{" "}
          <b className="font-semibold">브랜드 편집이 다시 열립니다</b>.
        </Hint>
      );
      break;
    case "REVIEW_REJECTED": {
      const actor = actorOf(detail, "REVIEW_REJECTED");
      // 반려 상태에서는 제출본을 보여 주지 않는다(브랜드가 고쳐 다시 낼 대상이라 혼동된다)
      rows = (
        <>
          <MetaRow
            label="검토 요청"
            value={formatDateTimeShort(review.requestedAt)}
          />
          <MetaRow
            label="반려 처리"
            value={formatDateTimeShort(review.rejectedAt)}
          />
          <MetaRow label="처리자" value={actor ? `${actor} 운영자` : "—"} />
          <MetaRow label="재요청" value="대기 중" />
        </>
      );
      hint = (
        <Hint>
          반려 상태에서 운영자가 할 일은{" "}
          <b className="font-semibold">없습니다</b> — 브랜드가 수정해 다시
          요청하면 <b className="font-semibold">검토 대기</b>로 돌아옵니다.
          반려를 되돌리는 버튼은 두지 않았습니다.
        </Hint>
      );
      break;
    }
    case "SIGNING":
      rows = (
        <>
          <MetaRow label="계약서" value={draftLink} />
          <MetaRow
            label="서명 요청 발송"
            value={formatDateTimeShort(signature.requestedAt)}
          />
          <MetaRow
            label="브랜드 서명"
            value={signText(signature.brandSignedAt, "— 대기")}
          />
          <MetaRow
            label="인플루언서 서명"
            value={signText(signature.creatorSignedAt, "— 대기")}
          />
          <MetaRow
            label="서명 기한"
            value={deadlineValue}
            tone={signature.deadlinePassedDays > 0 ? "warning" : undefined}
          />
          <MetaRow
            label="기준 시각"
            value={formatDateTimeShort(signature.asOf)}
          />
        </>
      );
      acts = (
        <>
          <div className="mt-3.5 flex gap-2">
            <Btn variant="secondary" className="flex-1" onClick={openDashboard}>
              모두싸인 대시보드 ↗
            </Btn>
            <Btn
              variant="danger"
              className="flex-1"
              disabled={!permissions.canExpire}
              onClick={actions.onExpire}
            >
              만료 처리
            </Btn>
          </div>
          {permissions.canCancel && (
            <Btn
              variant="danger"
              className="mt-2 w-full"
              onClick={actions.onCancel}
            >
              직권 취소
            </Btn>
          )}
        </>
      );
      hint = (
        <>
          <Hint>
            서명 기한이 지나도 시스템이 자동으로 닫지 않습니다 —{" "}
            <b className="font-semibold">운영자가 확인해 만료시킵니다</b>. 기한
            전에는 만료 버튼이 비활성입니다.
          </Hint>
          {CANCEL_HINT}
        </>
      );
      break;
    case "CONCLUSION_PENDING": {
      const uploaded = (type: string) =>
        docExists(type) ? (
          "업로드 완료"
        ) : (
          <span className="text-sz-warning-text">미업로드</span>
        );
      rows = (
        <>
          <MetaRow label="계약서" value={draftLink} />
          <MetaRow
            label="브랜드 서명"
            value={signText(signature.brandSignedAt, "—")}
          />
          <MetaRow
            label="인플루언서 서명"
            value={signText(signature.creatorSignedAt, "—")}
          />
          <MetaRow
            label="기준 시각"
            value={formatDateTimeShort(signature.asOf)}
          />
          <MetaRow label="서명 PDF" value={uploaded("SIGNED_PDF")} />
          <MetaRow label="감사추적인증서" value={uploaded("AUDIT_TRAIL")} />
        </>
      );
      acts = (
        <>
          <div className="mt-3.5 flex gap-2">
            <Btn
              variant="primary"
              className="flex-1"
              disabled={!permissions.canConclude}
              onClick={actions.onConclude}
            >
              체결 완료 처리
            </Btn>
            <Btn variant="secondary" className="flex-1" onClick={openDashboard}>
              모두싸인 대시보드 ↗
            </Btn>
          </div>
          {permissions.canCancel && (
            <Btn
              variant="danger"
              className="mt-2 w-full"
              onClick={actions.onCancel}
            >
              직권 취소
            </Btn>
          )}
        </>
      );
      hint = (
        <>
          <Hint>
            체결 완료는 <b className="font-semibold">되돌릴 수 없습니다</b> —
            공구가 생성되기 때문입니다. 확인 모달을 반드시 거칩니다.
          </Hint>
          {CANCEL_HINT}
        </>
      );
      break;
    }
    case "CONCLUDED": {
      const actor = detail.stepper.concludedActorName;
      rows = (
        <>
          <MetaRow
            label="체결 처리"
            value={formatDateTimeShort(detail.stepper.concludedAt)}
          />
          <MetaRow label="처리자" value={actor ? `${actor} 운영자` : "—"} />
          <MetaRow
            label="생성 공구"
            value={detail.groupBuy.groupBuyNumber ?? "—"}
          />
          <MetaRow
            label="고정 지급비"
            value={
              detail.fixedFee.amount
                ? formatKRW(detail.fixedFee.amount)
                : "지급하지 않음"
            }
          />
          <MetaRow
            label="계약서"
            value={
              docExists("SIGNED_PDF") ? (
                <FLink onClick={actions.onOpenSigned}>서명본 보기</FLink>
              ) : (
                "—"
              )
            }
          />
        </>
      );
      hint = (
        <Hint>
          체결완료 이후를 닫는 상태값이{" "}
          <b className="font-semibold">없습니다</b> — 공구 진행 중 중단은{" "}
          <b className="font-semibold">공구 관리의 중단</b>으로 처리합니다.
        </Hint>
      );
      break;
    }
    case "CANCELED":
    case "EXPIRED":
    case "DECLINED": {
      const eventType = contract.status;
      const actor = actorOf(detail, eventType);
      const closeLabel =
        eventType === "CANCELED"
          ? "취소"
          : eventType === "EXPIRED"
            ? "만료 처리"
            : "거절";
      rows = (
        <>
          <MetaRow label="계약서" value={draftLink} />
          <MetaRow
            label="서명 요청 발송"
            value={formatDateTimeShort(signature.requestedAt)}
          />
          {eventType === "EXPIRED" && (
            <MetaRow
              label="서명 기한"
              value={formatDateTimeShort(signature.deadlineAt)}
            />
          )}
          <MetaRow
            label="브랜드 서명"
            value={signText(signature.brandSignedAt, "— 없음")}
          />
          <MetaRow
            label="인플루언서 서명"
            value={signText(signature.creatorSignedAt, "— 없음")}
          />
          <MetaRow
            label={closeLabel}
            value={formatDateTimeShort(closure.closedAt)}
          />
          {closure.reasonLabel && (
            <MetaRow
              label={eventType === "DECLINED" ? "거절 사유" : "취소 사유"}
              value={closure.reasonLabel}
            />
          )}
          {eventType !== "DECLINED" && (
            <MetaRow label="처리자" value={actor ? `${actor} 운영자` : "—"} />
          )}
          <MetaRow
            label="기준 시각"
            value={formatDateTimeShort(signature.asOf)}
          />
        </>
      );
      hint =
        eventType === "CANCELED" ? (
          <Hint>
            운영자 직권으로 <b className="font-semibold">취소</b>됐습니다 —
            되돌릴 수 없습니다. 같은 조건으로 진행하려면 브랜드가{" "}
            <b className="font-semibold">새 계약을 작성</b>해야 합니다.
          </Hint>
        ) : eventType === "EXPIRED" ? (
          <Hint>
            서명 기한 초과를 확인해 <b className="font-semibold">만료</b>
            시켰습니다 — 되돌릴 수 없습니다. 같은 조건으로 진행하려면 브랜드가{" "}
            <b className="font-semibold">새 계약을 작성</b>해야 합니다.
          </Hint>
        ) : (
          <Hint>
            인플루언서가 <b className="font-semibold">거절</b>해 종결됐습니다 —
            운영자가 할 일은 없습니다.
          </Hint>
        );
      break;
    }
    default:
      break;
  }

  return (
    <DetailCard title="상태">
      <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3 pt-2">
        <span className="text-[12px] text-sz-n-500">현재 상태</span>
        <StatusBadge variant={toneToVariant(contract.statusTone)}>
          {contract.statusLabel}
        </StatusBadge>
      </div>
      <div className="pt-1">
        <MetaRow label="계약번호" value={contract.contractNumber ?? "—"} />
        {rows}
      </div>
      {acts}
      {hint}
    </DetailCard>
  );
}

/** 시안 우측 sticky 레일 — 상태 카드 + 이력 카드 */
export default function StatusRail(props: {
  detail: AdminContractDetail;
  actions: StatusRailActions;
}) {
  const { detail, actions } = props;
  return (
    <div className="sticky top-0 flex flex-col gap-4">
      <StatusCard detail={detail} actions={actions} />
      <DetailCard title="이력" flushBody>
        <HistoryList items={toHistoryItems(detail.history)} />
      </DetailCard>
    </div>
  );
}
