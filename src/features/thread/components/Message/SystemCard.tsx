import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { CONTRACT_DETAIL_PATH } from "@/features/thread/constants/params";
import {
  BTN_SECONDARY,
  FLINK_CLASS,
} from "@/features/thread/components/styles";
import type {
  IssuePanel,
  MessageCard,
  MessageItem,
  SettlementParty,
} from "@/features/thread/types";
import {
  dayKey,
  formatAmount,
  formatDateTime,
  formatMonthDayTime,
  formatTime,
  won,
  withSubjectParticle,
} from "@/features/thread/utils/format";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export interface SystemCardContext {
  /** 이슈 스레드의 패널 — 정산 조정 카드의 「답할 쪽」 · 요청자 이름을 여기서 읽는다 */
  issue: IssuePanel | null;
  /** 로드된 제안 카드 중 가장 최근 회차 — 그보다 앞선 제안 카드는 흐리게 남긴다(20b A2) */
  latestProposalSeq: number | null;
  onResendNotice: (messageId: number) => void;
  /** 알림 전송 중인 카드 */
  resendingMessageId: number | null;
}

/** 시안 `.sysm` — 가운데 정렬 절차 카드. `warn`은 운영자 조치가 남은 요청(tone = WARNING) */
function SysCard(props: {
  title: string;
  warn?: boolean;
  children?: ReactNode;
}) {
  const { title, warn = false, children } = props;
  return (
    <div
      className={cn(
        "max-w-[86%] shrink-0 self-center rounded-[8px] border px-3.5 py-2.5 text-[12px] leading-[1.65] text-sz-n-700",
        warn
          ? "border-transparent bg-sz-warning-bg"
          : "border-sz-n-200 bg-white"
      )}
    >
      <div
        className={cn(
          "mb-1 text-[11px] font-semibold",
          warn ? "text-sz-warning-text" : "text-sz-n-500"
        )}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

/** 시안 `.sysm.line` — 테두리 없는 한 줄 기록(D-1 통지 · 응답 기록) */
function SysLine(props: { children: ReactNode }) {
  return (
    <div className="shrink-0 self-center text-center text-[11px] font-semibold text-sz-n-500">
      {props.children}
    </div>
  );
}

function ContractLink(props: { contractId: number | null }) {
  if (props.contractId === null) {
    return null;
  }
  return (
    <Link
      to={`${CONTRACT_DETAIL_PATH}/${props.contractId}`}
      className={FLINK_CLASS}
    >
      계약 상세 ↗
    </Link>
  );
}

/** 같은 날이면 「08:55」, 아니면 「08.15 08:55」 */
function timeNear(date: string, base: string) {
  return dayKey(date) === dayKey(base)
    ? formatTime(date)
    : formatMonthDayTime(date);
}

function partyName(issue: IssuePanel | null, party: SettlementParty) {
  if (!issue) {
    return null;
  }
  return party === "SELLER" ? issue.brand.name : issue.influencer.name;
}

function otherParty(party: SettlementParty): SettlementParty {
  return party === "SELLER" ? "CREATOR" : "SELLER";
}

/** 재발송 요청 카드 — [재발송 완료 알림 보내기] · 전송됨 · 닫힘 */
function ResendRequestCard(props: {
  message: MessageItem;
  card: MessageCard;
  context: SystemCardContext;
}) {
  const { message, card, context } = props;
  const detail = card.detail ?? {};
  const action = card.action;
  const isSending = context.resendingMessageId === message.messageId;

  return (
    <SysCard title={card.title} warn={card.tone === "WARNING"}>
      {card.contractNumber && (
        <b className="tabular-nums">{card.contractNumber}</b>
      )}{" "}
      {card.groupBuyTitle}
      {detail.requesterName &&
        ` · ${withSubjectParticle(detail.requesterName)} 계약 관리에서 요청`}
      {detail.requestedAt && (
        <>
          {" · "}
          <span className="tabular-nums">{formatTime(detail.requestedAt)}</span>
        </>
      )}{" "}
      <ContractLink contractId={card.contractId} />
      {action?.state === "PENDING" && (
        <div className="mt-[9px] flex items-center gap-2">
          <button
            type="button"
            className={BTN_SECONDARY}
            disabled={!action.canExecute || isSending}
            onClick={() => context.onResendNotice(message.messageId)}
          >
            {isSending && (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            )}
            재발송 완료 알림 보내기
          </button>
          <span className="text-[11px] text-sz-n-500">
            모두싸인에서 재발송한 뒤 누르세요
          </span>
        </div>
      )}
      {action?.state === "DONE" && (
        <div className="mt-[9px] flex items-center gap-2">
          <span className="text-[11px] font-semibold text-sz-success-text">
            ✓ 재발송 완료 알림 전송됨
          </span>
          <span className="text-[11px] tabular-nums text-sz-n-500">
            {[
              action.doneAt && timeNear(action.doneAt, message.createdAt),
              action.doneByName,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
      )}
      {/* CLOSED — 알림 전에 계약이 서명 단계를 벗어났다. 다시 보낼 안내가 없어 버튼을 두지 않는다 */}
    </SysCard>
  );
}

/** 직권 취소 결과 카드 */
function AdminCanceledCard(props: { card: MessageCard }) {
  const { card } = props;
  const detail = card.detail ?? {};
  const tail = [
    detail.processedAt && formatTime(detail.processedAt),
    detail.processedByName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <SysCard title={card.title}>
      {card.contractNumber && (
        <span className="tabular-nums">{card.contractNumber}</span>
      )}{" "}
      {card.groupBuyTitle}
      {detail.reasonLabel && ` · 사유: ${detail.reasonLabel}`}
      {tail && ` · ${tail}`}
      {detail.notifiedBothParties && " · 양측에 통지됐습니다."}{" "}
      <ContractLink contractId={card.contractId} />
    </SysCard>
  );
}

/** 정산 조정 요청 · 다른 금액 제안 카드(시안 `.med`) — 응답 결과는 아래 줄에 굳는다 */
function ProposalCard(props: {
  message: MessageItem;
  card: MessageCard;
  context: SystemCardContext;
}) {
  const { message, card, context } = props;
  const adjustment = card.detail?.adjustment ?? {};
  const action = card.action;
  const proposerName = adjustment.proposerName ?? message.senderName;
  const responderName = adjustment.proposerType
    ? partyName(context.issue, otherParty(adjustment.proposerType))
    : null;
  const isSuperseded =
    adjustment.seq !== undefined &&
    context.latestProposalSeq !== null &&
    adjustment.seq < context.latestProposalSeq;

  return (
    <div
      className={cn(
        "shrink-0 self-stretch overflow-hidden rounded-[8px] border border-sz-accent-500 bg-white",
        isSuperseded && "opacity-55"
      )}
    >
      <div className="flex items-center gap-2 bg-sz-accent-50 px-3.5 py-[9px] text-[12px] font-semibold text-sz-accent-600">
        {[card.title, proposerName].filter(Boolean).join(" · ")}
        <span className="ml-auto text-[11px] font-normal tabular-nums text-sz-n-500">
          {formatDateTime(message.createdAt)}
        </span>
      </div>
      <div className="px-3.5 pb-1.5 pt-1">
        {adjustment.rewardAmount !== undefined && (
          <ProposalRow label="요청 금액">
            인플루언서 리워드{" "}
            {adjustment.originalRewardAmount !== undefined && (
              <>
                <span className="tabular-nums">
                  {formatAmount(adjustment.originalRewardAmount)}
                </span>
                {" → "}
              </>
            )}
            <b className="tabular-nums">
              {formatAmount(adjustment.rewardAmount)}
            </b>
            원
          </ProposalRow>
        )}
        {adjustment.reason && (
          <ProposalRow label="사유">{adjustment.reason}</ProposalRow>
        )}
        {adjustment.deadlineAt && (
          <ProposalRow label="합의 기한">
            <span className="tabular-nums">
              {formatDateTime(adjustment.deadlineAt)}
            </span>{" "}
            <span className="text-[11px] text-sz-n-500">
              · 개설 + 10영업일 · 기한까지 합의가 없으면 원래 금액으로 정산
            </span>
          </ProposalRow>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-3.5 border-t border-sz-n-200 bg-sz-n-50 px-3.5 py-[9px] text-[11px] text-sz-n-600">
          {action.state === "PENDING" ? (
            <>
              <StatusBadge variant="neutral" hideDot>
                {responderName ? `${responderName} 응답 대기` : "응답 대기"}
              </StatusBadge>
              <span>동의 · 다른 금액 제안 · 반대</span>
            </>
          ) : (
            <span className="inline-flex items-center gap-[5px]">
              <StatusBadge
                // 결과 문구는 서버가 정한다 — 「동의」만 합의로 이어진 응답이라 성공색
                variant={action.resultLabel === "동의" ? "success" : "neutral"}
                hideDot
              >
                {action.state === "DONE" && responderName
                  ? `${responderName} ${action.resultLabel ?? ""}`.trim()
                  : (action.resultLabel ?? "")}
              </StatusBadge>
              {action.doneAt && (
                <span className="tabular-nums">
                  {formatMonthDayTime(action.doneAt)}
                </span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ProposalRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 border-b border-sz-n-100 py-[7px] text-[12px] leading-[1.6] last:border-b-0">
      <div className="w-16 shrink-0 whitespace-nowrap text-sz-n-500">
        {props.label}
      </div>
      <div className="flex-1 text-sz-n-900">{props.children}</div>
    </div>
  );
}

/**
 * 시스템 카드 — 절차의 기록. 계약 카드 2종(재발송 요청 · 직권 취소)과 정산 조정 카드 8종.
 * 제목 · 결과 문구는 서버 값을 그대로 쓴다.
 */
export default function SystemCard(props: {
  message: MessageItem;
  context: SystemCardContext;
}) {
  const { message, context } = props;
  const card = message.card;

  if (!card) {
    return message.content ? <SysLine>{message.content}</SysLine> : null;
  }

  const adjustment = card.detail?.adjustment ?? {};
  const settlementNumber =
    adjustment.settlementNumber ??
    context.issue?.settlement.settlementNumber ??
    "";

  switch (card.cardType) {
    case "CONTRACT_RESEND_REQUEST":
      return (
        <ResendRequestCard message={message} card={card} context={context} />
      );
    case "CONTRACT_ADMIN_CANCELED":
      return <AdminCanceledCard card={card} />;
    case "SETTLEMENT_ADJUSTMENT_REQUEST":
    case "SETTLEMENT_ADJUSTMENT_COUNTER":
      return <ProposalCard message={message} card={card} context={context} />;
    case "SETTLEMENT_ADJUSTMENT_OPENED": {
      const requester = context.issue
        ? partyName(context.issue, context.issue.requesterType)
        : null;
      return (
        <SysCard title={card.title}>
          {requester ? `${withSubjectParticle(requester)} ` : ""}정산 확인
          기간에 <b>정산 조정</b>을 요청했습니다.{" "}
          <span className="tabular-nums">{settlementNumber}</span>은 합의가 끝날
          때까지 <b>전액 보류</b>됩니다.
        </SysCard>
      );
    }
    case "SETTLEMENT_ADJUSTMENT_ACCEPTED":
    case "SETTLEMENT_ADJUSTMENT_REJECTED":
      return (
        <SysLine>
          {[adjustment.responderName ?? message.senderName, card.title]
            .filter(Boolean)
            .join(" ")}
          {adjustment.rewardAmount !== undefined &&
            ` · ${won(adjustment.rewardAmount)}`}
        </SysLine>
      );
    case "SETTLEMENT_ADJUSTMENT_DEADLINE_NOTICE":
      return <SysLine>{card.title} · 양측</SysLine>;
    case "SETTLEMENT_ADJUSTMENT_AGREED": {
      const amount =
        adjustment.finalRewardAmount ??
        context.issue?.settlement.agreedRewardAmount;
      return (
        <SysCard title={card.title}>
          양측이{" "}
          {amount !== undefined && amount !== null && (
            <b className="tabular-nums">{won(amount)}</b>
          )}
          에 합의해 <span className="tabular-nums">{settlementNumber}</span>의
          리워드가 바뀌고 보류가 해제됐습니다. 이슈는 자동으로 닫혔습니다.
        </SysCard>
      );
    }
    case "SETTLEMENT_ADJUSTMENT_EXPIRED": {
      const amount =
        adjustment.finalRewardAmount ??
        context.issue?.settlement.originalRewardAmount;
      const deadline = adjustment.deadlineAt ?? context.issue?.deadlineAt;
      return (
        <SysCard title={card.title}>
          {deadline && `합의 기한(${formatMonthDayTime(deadline)})까지 `}
          합의가 없어 <span className="tabular-nums">
            {settlementNumber}
          </span>은{" "}
          <b>
            원래 계약 금액
            {amount !== undefined && amount !== null && `(${won(amount)})`}
          </b>
          으로 확정되고 보류가 해제됐습니다. 이슈는 자동으로 닫혔습니다.
        </SysCard>
      );
    }
    default:
      return <SysCard title={card.title}>{message.content}</SysCard>;
  }
}
