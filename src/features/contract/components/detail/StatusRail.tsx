import DetailCard from "@/common/components/DetailCard/DetailCard";
import HistoryList from "@/common/components/HistoryList/HistoryList";
import Notice from "@/common/components/Notice/Notice";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { formatDateTimeShort } from "@/common/utils/formatDate";
import { FLink, MetaRow } from "@/features/contract/components/detail/Rows";
import Btn from "@/features/contract/components/shared/Btn";
import { MODUSIGN_DASHBOARD_URL } from "@/features/contract/constants/params";
import {
  TERMINABLE_HINT,
  TERMINATED_HINT,
} from "@/features/contract/constants/provisional";
import type { AdminContractDetail } from "@/features/contract/types";
import {
  isHeldDeadlineOverdue,
  isSignatureOverdue,
  overdueDaysText,
} from "@/features/contract/utils/contractView";
import { formatMonthDayTime } from "@/features/contract/utils/datetime";
import { formatKRW } from "@/features/contract/utils/format";
import { toHistoryItems } from "@/features/contract/utils/history";
import {
  statusLabelOf,
  toneToVariant,
} from "@/features/contract/utils/statusBadge";
import type { ReactNode } from "react";

export interface StatusRailActions {
  onApprove: () => void;
  onReject: () => void;
  onCreateGroupBuy: () => void;
  onExpire: () => void;
  onCancel: () => void;
  onTerminate: () => void;
  /** B3-s 「회원 상세 ↗」 — 정지된 당사자의 회원 화면 */
  onOpenMember: (party: "BRAND" | "CREATOR") => void;
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

const PARTY_LABEL = { BRAND: "브랜드", CREATOR: "인플루언서" } as const;

/**
 * B3-s(기-07) — 당사자 계정 정지 중 서명 기한 경과. 시스템은 모두싸인 쪽 기한을 모르므로 운영자가
 * 모두싸인에서 기한을 늘려 다시 보내고 서명 현황을 갱신하게 안내한다. 정지 당사자는 서버 `sanctionHold.party`.
 */
function HeldOverdueNotice(props: {
  detail: AdminContractDetail;
  onOpenMember: StatusRailActions["onOpenMember"];
}) {
  const { detail, onOpenMember } = props;
  const party = detail.contract.sanctionHold?.party ?? null;
  const who =
    party === "BOTH"
      ? "브랜드 · 인플루언서"
      : party
        ? PARTY_LABEL[party]
        : "당사자";
  const target = party === "CREATOR" ? "CREATOR" : party ? "BRAND" : null;
  return (
    <Notice tone="warn" className="mt-3">
      <b className="font-semibold">! {who} 계정이 정지된 상태</b>에서 서명
      기한이 지났습니다 — 모두싸인에서{" "}
      <b className="font-semibold">기한 연장 · 재발송</b>을 한 뒤 서명 현황을
      갱신하세요.{" "}
      {target && (
        <FLink onClick={() => onOpenMember(target)}>회원 상세 ↗</FLink>
      )}
    </Notice>
  );
}

/** 처리 대기 해지 요청(파트너 [해지 요청]) — 레일에 한 줄로 알린다(시안에 없는 행 · C7 「요청」과 같은 값) */
function terminationRequestRow(detail: AdminContractDetail) {
  const request = detail.terminationRequest;
  if (!request) {
    return null;
  }
  return (
    <MetaRow
      label="해지 요청"
      value={
        <span className="text-sz-warning-text">
          {[request.requesterName, formatMonthDayTime(request.requestedAt)]
            .filter(Boolean)
            .join(" · ")}
        </span>
      }
    />
  );
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
    case "SIGNING": {
      // B3-s — 정지 중 경과는 만료 확인 화면으로 넘기지 않고 평소 레일에 안내를 더한다
      const heldOverdue = isHeldDeadlineOverdue(detail);
      // 시안 C5 뒤 화면 — 기한이 지나면 할 일은 만료 확인 하나다(대시보드·직권 취소 버튼을 내린다)
      if (isSignatureOverdue(detail)) {
        const days = signature.deadlinePassedDays;
        rows = (
          <>
            <MetaRow label="계약서" value={draftLink} />
            <MetaRow
              label="서명 요청 발송"
              value={formatDateTimeShort(signature.requestedAt)}
            />
            <MetaRow
              label="브랜드 서명"
              value={signText(signature.brandSignedAt, "— 없음")}
            />
            <MetaRow
              label="인플루언서 서명"
              value={signText(signature.creatorSignedAt, "— 없음")}
            />
            <MetaRow
              label="서명 기한"
              value={formatDateTimeShort(signature.deadlineAt)}
            />
            <MetaRow label="기한 경과" value={overdueDaysText(detail)} />
          </>
        );
        acts = (
          <Btn
            variant="danger"
            className="mt-3.5 w-full"
            disabled={!permissions.canExpire}
            onClick={actions.onExpire}
          >
            만료 처리
          </Btn>
        );
        hint = (
          <Hint>
            서명 기한이{" "}
            {days > 0 ? (
              <>
                <b className="font-semibold">{days}일</b> 지났습니다
              </>
            ) : (
              "지났습니다"
            )}{" "}
            — 운영자가 확인해 종결시켜야 목록에서 내려갑니다.
          </Hint>
        );
        break;
      }
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
            value={
              heldOverdue ? (
                // 시안 B3-s 「2026.08.21 23:55 · 경과」
                <>
                  {formatDateTimeShort(signature.deadlineAt)} ·{" "}
                  <span className="text-sz-warning-text">경과</span>
                </>
              ) : (
                formatDateTimeShort(signature.deadlineAt)
              )
            }
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
          {heldOverdue && (
            <HeldOverdueNotice
              detail={detail}
              onOpenMember={actions.onOpenMember}
            />
          )}
          <Hint>
            서명 기한이 지나도 시스템이 자동으로 닫지 않습니다 —{" "}
            <b className="font-semibold">운영자가 확인해 만료시킵니다</b>. 기한
            전에는 만료 버튼이 비활성입니다.
          </Hint>
          {/* 시안 B3-s는 정지 안내가 이 자리를 대신한다 */}
          {!heldOverdue && CANCEL_HINT}
        </>
      );
      break;
    }
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
          {terminationRequestRow(detail)}
        </>
      );
      acts = (
        <>
          <div className="mt-3.5 flex gap-2">
            <Btn
              variant="primary"
              className="flex-1"
              // 배포 전 서버는 `canCreateGroupBuy` 없이 같은 값의 `canConclude`만 내린다
              disabled={
                !(permissions.canCreateGroupBuy ?? permissions.canConclude)
              }
              onClick={actions.onCreateGroupBuy}
            >
              공구 생성
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
          {/* 1021 이후 서버는 성립한 계약(공구 생성 대기)의 종결을 취소가 아니라 해지로 받는다 */}
          {permissions.canTerminate && (
            <Btn
              variant="danger"
              className="mt-2 w-full"
              onClick={actions.onTerminate}
            >
              해지 처리
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
          {permissions.canCancel && CANCEL_HINT}
          {permissions.canTerminate && <Hint>{TERMINABLE_HINT}</Hint>}
        </>
      );
      break;
    }
    case "CONCLUDED": {
      const actor = detail.stepper.concludedActorName;
      rows = (
        <>
          <MetaRow
            label="공구 생성"
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
          {terminationRequestRow(detail)}
        </>
      );
      // 시안 B5 — 오픈 전에만 [해지 처리](서버 `canTerminate`). 오픈 뒤에는 버튼 없이 힌트만 남는다
      acts = permissions.canTerminate && (
        <Btn
          variant="danger"
          className="mt-3.5 w-full"
          onClick={actions.onTerminate}
        >
          해지 처리
        </Btn>
      );
      hint = <Hint>{TERMINABLE_HINT}</Hint>;
      break;
    }
    case "TERMINATED": {
      // 시안 B7 — 성립했으므로 계약서는 서명본이 남는다. 요청 · 처리는 「무드코스메틱 · 김운영」
      const termination = detail.termination;
      const requester =
        termination?.requesterName ?? (termination ? "운영자 처리" : null);
      rows = (
        <>
          <MetaRow
            label="계약서"
            value={
              docExists("SIGNED_PDF") ? (
                <FLink onClick={actions.onOpenSigned}>서명본 보기</FLink>
              ) : (
                draftLink
              )
            }
          />
          <MetaRow
            label="서명 요청 발송"
            value={formatDateTimeShort(signature.requestedAt)}
          />
          <MetaRow
            label="브랜드 서명"
            value={signText(signature.brandSignedAt, "— 없음")}
          />
          <MetaRow
            label="인플루언서 서명"
            value={signText(signature.creatorSignedAt, "— 없음")}
          />
          <MetaRow
            label="해지"
            value={formatDateTimeShort(
              termination?.terminatedAt ?? closure.closedAt
            )}
          />
          <MetaRow
            label="해지 사유"
            value={termination?.reasonLabel ?? closure.reasonLabel ?? "—"}
          />
          <MetaRow
            label="요청 · 처리"
            value={
              [
                requester,
                termination?.operatorName ?? actorOf(detail, "TERMINATED"),
              ]
                .filter(Boolean)
                .join(" · ") || "—"
            }
          />
          <MetaRow
            label="기준 시각"
            value={formatDateTimeShort(signature.asOf)}
          />
        </>
      );
      hint = <Hint>{TERMINATED_HINT}</Hint>;
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
          {eventType === "CANCELED" && detail.cancelRequest?.requesterType ? (
            // 시안 B6 「요청 · 처리: 무드코스메틱 · 김운영」 — 직권이면 요청자 대신 「직권」, 기록 이전 건은 처리자만
            <MetaRow
              label="요청 · 처리"
              value={[
                detail.cancelRequest.requesterType === "ADMIN"
                  ? "운영자 직권"
                  : detail.cancelRequest.requesterName,
                detail.cancelRequest.processedByName ?? actor,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          ) : (
            eventType !== "DECLINED" && (
              <MetaRow label="처리자" value={actor ? `${actor} 운영자` : "—"} />
            )
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
          {statusLabelOf(contract.status, contract.statusLabel)}
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
        <HistoryList
          items={toHistoryItems(detail.history, {
            cancelRequest: detail.cancelRequest,
            groupBuyNumber: detail.groupBuy.groupBuyNumber,
            groupBuyClosed: detail.termination?.groupBuyClosed,
          })}
        />
      </DetailCard>
    </div>
  );
}
