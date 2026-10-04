import DetailCard from "@/common/components/DetailCard/DetailCard";
import Notice from "@/common/components/Notice/Notice";
import { formatDateTimeShort } from "@/common/utils/formatDate";
import { FieldRow, FLink } from "@/features/contract/components/detail/Rows";
import SignatureEditor, {
  type SignDraft,
} from "@/features/contract/components/detail/SignatureEditor";
import Stepper from "@/features/contract/components/detail/Stepper";
import Btn from "@/features/contract/components/shared/Btn";
import { GROUP_BUY_STATUS_LABEL } from "@/features/contract/constants/params";
import { rejectReasonLabel } from "@/features/contract/constants/labels";
import type { AdminContractDetail } from "@/features/contract/types";
import {
  buildStepper,
  CLOSED_STATUSES,
  isSignatureOverdue,
  SIGNING_PHASE,
} from "@/features/contract/utils/contractView";
import {
  formatMonthDayTime,
  toParts,
} from "@/features/contract/utils/datetime";

export interface SignDrafts {
  brand: SignDraft;
  creator: SignDraft;
}

interface ProgressCardProps {
  detail: AdminContractDetail;
  drafts: SignDrafts;
  onDraftsChange: (next: SignDrafts) => void;
  isDirty: boolean;
  /** 입력이 저장 규칙(발송 ≤ 서명 ≤ 지금)을 지키는지 — 어기면 저장만 막는다 */
  canSave: boolean;
  onRevert: () => void;
  onSave: () => void;
  onHandleResend: () => void;
  isHandlingResend: boolean;
  onOpenThread?: () => void;
  onOpenGroupBuy: () => void;
}

function cardNote(detail: AdminContractDetail) {
  switch (detail.contract.status) {
    case "REVIEW_PENDING":
    case "REVIEW_REJECTED":
      return "운영자 검토 → 양측 동시 서명 요청";
    case "SIGNING":
      return "모두싸인 확인값 입력 — 이 화면의 값이 양측 화면에 그대로 나갑니다";
    case "CONCLUSION_PENDING":
      return "양측 서명 확인 완료 — 체결 처리가 남았습니다";
    case "CONCLUDED":
      return "체결 완료 — 공구가 생성됐습니다";
    case "CANCELED":
      return "취소로 종결 — 취소 시점의 서명 기록만 남습니다";
    case "EXPIRED":
      return "만료로 종결 — 만료 시점의 서명 기록만 남습니다";
    case "DECLINED":
      return "인플루언서 거절로 종결 — 거절 시점의 서명 기록만 남습니다";
    default:
      return undefined;
  }
}

function closedText(detail: AdminContractDetail) {
  switch (detail.contract.status) {
    case "CANCELED":
      return "서명 없음 · 취소로 종결";
    case "EXPIRED":
      return "서명 없음 · 만료로 종결";
    case "DECLINED":
      return "서명 없음 · 거절로 종결";
    default:
      return undefined;
  }
}

/** 시안 `.s-asof` — 현재 양측 화면에 나간 기준 시각 + 저장한 운영자 */
function AsOf(props: { detail: AdminContractDetail }) {
  const { signature } = props.detail;
  return (
    <div className="text-[11px] text-sz-n-500">
      현재 양측 화면에 나간 기준 시각 ·{" "}
      <span className="tabular-nums">
        {signature.asOf ? formatDateTimeShort(signature.asOf) : "아직 저장 전"}
      </span>
      {signature.asOfActorName && (
        <b className="ml-1 font-semibold text-sz-n-700">
          {signature.asOfActorName}
        </b>
      )}
    </div>
  );
}

/**
 * 시안 좌측 첫 카드 「검토 진행 / 서명 진행」 — 스텝퍼 + 상태별 본문.
 * 서명 현황 입력(`.sbox.edit`)은 서명 진행중·체결 처리 대기에서만 열리고 체결 완료부터 잠긴다.
 */
export default function ProgressCard(props: ProgressCardProps) {
  const {
    detail,
    drafts,
    onDraftsChange,
    isDirty,
    canSave,
    onRevert,
    onSave,
    onHandleResend,
    isHandlingResend,
    onOpenThread,
    onOpenGroupBuy,
  } = props;
  const { contract, review, signature, permissions, resend, groupBuy } = detail;
  const status = contract.status;
  const isSigningPhase = SIGNING_PHASE.includes(status);
  const isClosed = CLOSED_STATUSES.includes(status);
  const editable = isSigningPhase && permissions.canUpdateSignature;
  const rejectedBy =
    [...detail.history]
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .find((item) => item.eventType === "REVIEW_REJECTED")?.actorDisplayName ??
    null;
  const title =
    status === "REVIEW_PENDING" || status === "REVIEW_REJECTED"
      ? "검토 진행"
      : "서명 진행";

  return (
    <DetailCard title={title} note={cardNote(detail)}>
      <div className="pt-3">
        <Stepper steps={buildStepper(detail)} />

        {/* 시안 C5 뒤 화면 — 만료는 자동이 아니라 반영 누락을 한 번 더 의심하게 한다 */}
        {isSignatureOverdue(detail) && (
          <Notice tone="warn" className="mt-4">
            <b className="font-semibold">서명 기한이 지났습니다.</b> 모두싸인에
            서명이 들어왔는지 다시 확인한 뒤 만료 처리하세요 — 화면에 반영되지
            않았을 뿐 서명이 완료돼 있을 수 있습니다.
          </Notice>
        )}

        {status === "REVIEW_PENDING" && (
          <Notice tone="info" className="mt-4">
            <b className="font-semibold">
              승인하면 모두싸인에 계약 내용을 직접 입력해 양측에 서명 요청을
              보냅니다.
            </b>{" "}
            API를 쓰지 않으므로 이 화면이 요청을 보내지 않습니다 — 승인은{" "}
            <b className="font-semibold">「보냈다」는 기록</b>이고, 실제 발송은
            운영자가 모두싸인에서 합니다.
          </Notice>
        )}

        {status === "REVIEW_REJECTED" && (
          <>
            <Notice tone="warn" className="mt-4">
              <b className="font-semibold">반려 처리가 완료됐습니다.</b> 브랜드
              화면의 편집이 다시 열렸고 아래 사유가{" "}
              <b className="font-semibold">그대로 노출</b>됩니다 — 브랜드가
              수정해 다시 요청하면 이 목록에 재등장합니다.
            </Notice>
            <div className="mt-3">
              <FieldRow
                label="반려 사유"
                sub={review.rejectReason?.detail ?? undefined}
              >
                {rejectReasonLabel(review.rejectReason?.code)}
              </FieldRow>
              <FieldRow label="반려 처리">
                <span className="tabular-nums">
                  {formatDateTimeShort(review.rejectedAt)}
                </span>
                {rejectedBy && ` · ${rejectedBy} 운영자`}
              </FieldRow>
            </div>
          </>
        )}

        {(isSigningPhase || isClosed) && (
          <div className="mt-4">
            <SignatureEditor
              brandName={contract.brand.name}
              creatorName={contract.creator?.name ?? "—"}
              brand={editable ? drafts.brand : null}
              creator={editable ? drafts.creator : null}
              brandSavedAt={signature.brandSignedAt}
              creatorSavedAt={signature.creatorSignedAt}
              editable={editable}
              closedText={closedText(detail)}
              onChange={onDraftsChange}
              makeDefault={() => toParts(null)}
            />
          </div>
        )}

        {isSigningPhase && (
          <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-sz-n-100 pt-3.5">
            <AsOf detail={detail} />
            {editable && (status === "SIGNING" || isDirty) && (
              <div className="flex shrink-0 gap-2">
                <Btn variant="secondary" disabled={!isDirty} onClick={onRevert}>
                  되돌리기
                </Btn>
                <Btn
                  variant="primary"
                  disabled={!isDirty || !canSave}
                  onClick={onSave}
                >
                  서명 현황 저장
                </Btn>
              </div>
            )}
          </div>
        )}
        {status === "SIGNING" && (
          <Notice tone="warn" className="mt-3">
            <b className="font-semibold">
              저장하면 저장 시각이 양측 화면의 「확인 시점 기준」이 됩니다.
            </b>{" "}
            모두싸인 대시보드를 <b className="font-semibold">보지 않고</b>{" "}
            저장하면 기준 시각만 새로워지고 내용은 그대로라, 양측은 확인된
            값이라고 믿습니다 — 반드시{" "}
            <b className="font-semibold">대시보드를 확인한 뒤</b> 저장하세요.
          </Notice>
        )}
        {isSigningPhase && resend.pendingCount > 0 && (
          <Notice tone="info" className="mt-3">
            <b className="font-semibold">
              서명 안내 재발송 요청 {resend.pendingCount}건
            </b>{" "}
            —{" "}
            {resend.lastRequesterType === "SELLER"
              ? contract.brand.name
              : resend.lastRequesterType === "CREATOR"
                ? (contract.creator?.name ?? "인플루언서")
                : "당사자"}
            이{" "}
            <span className="tabular-nums">
              {formatMonthDayTime(resend.lastRequestedAt)}
            </span>
            에 [서명 안내 다시 받기]를 눌러{" "}
            <b className="font-semibold">운영팀 소통 스레드에 자동 등록</b>
            됐습니다. 모두싸인에서 재발송한 뒤 기록하면{" "}
            <b className="font-semibold">
              스레드에 재발송 완료 답글이 함께 남습니다
            </b>
            .
            <div className="mt-[9px] flex gap-2">
              {permissions.canHandleResend && (
                <Btn
                  variant="secondary"
                  isLoading={isHandlingResend}
                  onClick={onHandleResend}
                >
                  재발송 처리 기록
                </Btn>
              )}
              {onOpenThread && (
                <Btn variant="secondary" onClick={onOpenThread}>
                  소통 스레드 열기 ↗
                </Btn>
              )}
            </div>
          </Notice>
        )}
        {status === "CONCLUSION_PENDING" && (
          <Notice tone="info" className="mt-4">
            <b className="font-semibold">양측 서명이 확인됐습니다.</b>{" "}
            모두싸인에서{" "}
            <b className="font-semibold">
              서명 PDF와 감사추적인증서를 내려받아
            </b>{" "}
            아래에 올린 뒤 체결 완료를 처리하세요. 처리하는 순간{" "}
            <b className="font-semibold">계약이 성립하고 공구가 생성</b>됩니다.
          </Notice>
        )}

        {status === "CONCLUDED" && (
          <>
            <Notice tone="info" className="mt-4">
              <b className="font-semibold">
                계약이 성립하고 공구가 생성됐습니다.
              </b>{" "}
              이후 공구 오픈 승인·중단은{" "}
              <b className="font-semibold">공구 관리</b> 소관이며 이 화면에서는
              조건과 서명 기록만 조회합니다.
            </Notice>
            <div className="mt-3">
              <FieldRow
                label="생성된 공구"
                sub={
                  groupBuy.status ? (
                    <>
                      공구 상태{" "}
                      <b className="font-semibold">
                        {GROUP_BUY_STATUS_LABEL[groupBuy.status] ??
                          groupBuy.status}
                      </b>
                      {/* 준비중 공구는 인플루언서 게시물 등록이 다음 단계다(시안 B5) */}
                      {groupBuy.status === "PREPARING" &&
                        " · 인플루언서 게시물 등록 대기"}
                    </>
                  ) : undefined
                }
              >
                {groupBuy.groupBuyNumber ? (
                  <>
                    <span className="tabular-nums">
                      {groupBuy.groupBuyNumber}
                    </span>{" "}
                    {contract.title}{" "}
                    <FLink onClick={onOpenGroupBuy}>공구 관리에서 보기</FLink>
                  </>
                ) : (
                  "연결된 공구 없음"
                )}
              </FieldRow>
            </div>
          </>
        )}

        {/* 거절은 시안이 없어 인플루언서가 남긴 사유를 여기서 보인다(취소 사유는 레일에 있다 — 시안 B6) */}
        {status === "DECLINED" && detail.closure.memo && (
          <div className="mt-3">
            <FieldRow label="거절 사유" sub={detail.closure.memo}>
              {detail.closure.reasonLabel ?? "—"}
            </FieldRow>
          </div>
        )}
      </div>
    </DetailCard>
  );
}
