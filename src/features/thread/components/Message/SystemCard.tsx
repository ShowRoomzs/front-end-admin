import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import {
  CARD_COPY,
  CONTRACT_DETAIL_PATH,
  GROUP_BUY_DETAIL_PATH,
  PARTY_LABEL,
} from "@/features/thread/constants/params";
import {
  BTN_SECONDARY,
  FLINK_CLASS,
} from "@/features/thread/components/styles";
import type {
  AdminChannelTab,
  IssuePanel,
  MessageCard,
  MessageItem,
  SettlementParty,
} from "@/features/thread/types";
import {
  dayKey,
  formatAmount,
  formatDateTime,
  formatKstDateTime,
  formatKstDay,
  formatKstMonthDayTime,
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
  /** 운영팀 채널의 탭 — 옛 정지 카드(회원 유형 없음)의 차단 범위 문구를 고른다. 이슈 · 쌍 스레드는 null */
  channelTab: AdminChannelTab | null;
  /** 정지 · 해제 카드의 「회원 상세 ↗」 — 회원 id가 없으면 null(링크를 그리지 않는다) */
  memberDetailPath: string | null;
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

function GroupBuyLink(props: { groupBuyId: number | undefined }) {
  if (props.groupBuyId === undefined) {
    return null;
  }
  return (
    <Link
      to={`${GROUP_BUY_DETAIL_PATH}/${props.groupBuyId}`}
      className={FLINK_CLASS}
    >
      공구 상세 ↗
    </Link>
  );
}

function MemberLink(props: { path: string | null }) {
  if (props.path === null) {
    return null;
  }
  return (
    <Link to={props.path} className={FLINK_CLASS}>
      회원 상세 ↗
    </Link>
  );
}

/** 「10:40 김운영」 — 처리 시각(UTC 이벤트) + 처리 운영자. 자동 처리는 운영자가 없다 */
function processedTail(
  processedAt: string | undefined,
  by: string | undefined
) {
  return [processedAt && formatTime(processedAt), by].filter(Boolean).join(" ");
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

/**
 * 계약 취소 · 해지 동의 확인(20a A8 ② · 기-06) — 요청하지 않은 쪽 채널에 붙는다. 버튼이 없다:
 * 상대가 답글로 동의하면 운영자가 계약 관리 C6 · C7의 「상대방 동의 확인」을 체크한다.
 */
function ConsentRequestCard(props: { card: MessageCard }) {
  const { card } = props;
  const detail = card.detail ?? {};
  const notice = detail.notice ?? {};
  const kind =
    notice.kind === "CANCEL" || notice.kind === "TERMINATE"
      ? notice.kind
      : null;
  const requester =
    detail.requesterName ??
    (detail.requesterType ? PARTY_LABEL[detail.requesterType] : null);
  // 해지는 사유 라벨 + 요청 메모, 취소는 운영자가 적은 요지 하나(라벨 = 본문) — 같으면 한 번만
  const reason = [
    detail.reasonLabel,
    notice.body !== detail.reasonLabel ? notice.body : null,
  ]
    .filter(Boolean)
    .join(" — ");

  return (
    <SysCard title={kind ? CARD_COPY.consentTitle[kind] : card.title}>
      {card.groupBuyTitle && <b>{card.groupBuyTitle}</b>}
      {card.contractNumber && (
        <span className="tabular-nums">({card.contractNumber})</span>
      )}
      {requester && kind && (
        <>
          {" · "}
          {withSubjectParticle(requester)}{" "}
          <b>{CARD_COPY.consentAction[kind]}</b>를 요청했습니다
          {reason && `(사유: ${reason})`}.
        </>
      )}
      <br />
      {kind && `${CARD_COPY.consentGuide[kind]} `}
      <ContractLink contractId={card.contractId} />
    </SysCard>
  );
}

/** 계약 해지 결과(기-05) — 양측 채널. 직권 취소 결과 카드와 같은 한 줄 + 설명 · 공구 종결 */
function TerminatedCard(props: { card: MessageCard }) {
  const { card } = props;
  const detail = card.detail ?? {};
  const notice = detail.notice ?? {};
  const tail = processedTail(detail.processedAt, detail.processedByName);

  return (
    <SysCard title={card.title}>
      {card.contractNumber && (
        <span className="tabular-nums">{card.contractNumber}</span>
      )}{" "}
      {card.groupBuyTitle}
      {detail.reasonLabel && ` · 사유: ${detail.reasonLabel}`}
      {tail && ` · ${tail}`}
      {/* 해지 결과 카드는 서버가 늘 양측 채널에 붙인다(1021 설계서 1-4) */}
      {" · 양측에 통지됐습니다."}
      {notice.body && (
        <>
          <br />
          {notice.body}
        </>
      )}
      {notice.groupBuyClosed && (
        <>
          <br />
          {CARD_COPY.terminatedGroupBuyClosed}
        </>
      )}{" "}
      <ContractLink contractId={card.contractId} />
    </SysCard>
  );
}

/**
 * 직권 중단 사전 통지 · 소명 요청(20a A8 ① · 기-21) — 공구 관리 M6 발송과 함께 양측 채널에 붙는다.
 * 집행 예정 · 소명 기한은 운영자가 M6에서 넣은 KST 시각이다. 버튼이 없다 — 집행 · 철회는 공구 상세에서 한다.
 */
function SuspensionNoticeCard(props: { card: MessageCard }) {
  const { card } = props;
  const detail = card.detail ?? {};
  const notice = detail.notice ?? {};
  const reason = notice.reasonClauseLabel ?? detail.reasonLabel;
  const schedule = [
    notice.executeScheduledAt &&
      `집행 예정 ${formatKstMonthDayTime(notice.executeScheduledAt)}`,
    notice.appealDeadlineAt &&
      `소명 기한 ${formatKstMonthDayTime(notice.appealDeadlineAt)}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const counterparty =
    notice.counterpartyNoticed &&
    notice.counterpartyType &&
    notice.counterpartyName
      ? `${PARTY_LABEL[notice.counterpartyType]}(${notice.counterpartyName})`
      : null;

  return (
    <SysCard title={card.title}>
      {card.groupBuyTitle && <b>{card.groupBuyTitle}</b>}
      {notice.groupBuyNumber && (
        <span className="tabular-nums">({notice.groupBuyNumber})</span>
      )}
      {reason && (
        <>
          {" · 사유 "}
          <b>{reason}</b>
        </>
      )}
      {(schedule || counterparty) && (
        <>
          <br />
          <span className="tabular-nums">{schedule}</span>
          {counterparty &&
            `${schedule ? " — " : ""}${counterparty}에도 같은 통지가 갔습니다.`}
        </>
      )}
      <br />
      {CARD_COPY.suspensionGuide}{" "}
      <GroupBuyLink groupBuyId={notice.groupBuyId} />
    </SysCard>
  );
}

/** 정지 카드의 회원 유형 — 1017 이후 카드는 스냅샷, 옛 카드는 채널 탭으로 가린다 */
function suspendedMemberType(
  memberType: string | undefined,
  channelTab: AdminChannelTab | null
): "BRAND" | "CREATOR" | null {
  if (memberType === "BRAND" || memberType === "CREATOR") {
    return memberType;
  }
  if (channelTab === "BRAND") {
    return "BRAND";
  }
  return channelTab === "INFLUENCER" ? "CREATOR" : null;
}

/**
 * 계정 이용 정지(20a A7 · 기-01 · 02) — 정지 순간 자동 등록되고, 그 아래 답글이 곧 소명이다.
 * 해제 버튼은 두지 않는다(해제는 회원 상세에서만). 옛 카드는 사유 한 문장(`reasonLabel`)만 있다.
 * 정지 기간 시작은 처리 시각(UTC 이벤트), 자동 해제 · 이의 신청 기한은 KST 벽시계다.
 */
function SuspendedCard(props: {
  card: MessageCard;
  context: SystemCardContext;
}) {
  const { card, context } = props;
  const detail = card.detail ?? {};
  const sanction = detail.sanction ?? {};
  const reason = sanction.reasonLabel ?? detail.reasonLabel;
  const by = [
    detail.processedAt && formatMonthDayTime(detail.processedAt),
    detail.processedByName,
  ]
    .filter(Boolean)
    .join(" ");
  const memberType = suspendedMemberType(
    sanction.memberType,
    context.channelTab
  );
  const scope = memberType ? CARD_COPY.suspendedScope[memberType] : null;
  const term = [
    sanction.autoReleaseAt &&
      `정지 기간 ${detail.processedAt ? `${formatDateTime(detail.processedAt)} ` : ""}~ ${formatKstDateTime(sanction.autoReleaseAt)}${sanction.periodDays ? ` (${sanction.periodDays}일)` : ""}`,
    sanction.appealDeadlineAt &&
      `이의 신청 기한 ${formatKstDay(sanction.appealDeadlineAt)}까지`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <SysCard title={card.title}>
      {reason && (
        <>
          사유: <b>{reason}</b>
          {sanction.reasonDetail && ` — ${sanction.reasonDetail}`}
        </>
      )}
      {by && (
        <>
          {reason && " · "}
          <span className="tabular-nums">{by}</span>
        </>
      )}
      {term && (
        <>
          <br />
          <span className="tabular-nums">{term}</span>
        </>
      )}
      {scope && (
        <>
          <br />
          {scope.blocked} <b>{scope.keep}</b>해 주세요.{" "}
          {sanction.payoutHeld
            ? CARD_COPY.suspendedPayoutHeld
            : CARD_COPY.suspendedPayoutKept}
        </>
      )}
      <br />
      {CARD_COPY.suspendedAppeal} <MemberLink path={context.memberDetailPath} />
    </SysCard>
  );
}

/** 정지 해제 — 회원 상세에서 해제하거나 종료일 다음 날 시스템이 해제하면 되돌아온다(운영자 없음) */
function ReleasedCard(props: {
  card: MessageCard;
  context: SystemCardContext;
}) {
  const { card, context } = props;
  const detail = card.detail ?? {};
  const sanction = detail.sanction ?? {};
  const reason = sanction.reasonLabel ?? detail.reasonLabel;
  const tail = processedTail(detail.processedAt, detail.processedByName);

  return (
    <SysCard title={card.title}>
      {reason && `사유: ${reason}`}
      {sanction.reasonDetail && ` — ${sanction.reasonDetail}`}
      {tail && (
        <>
          {reason && " · "}
          <span className="tabular-nums">{tail}</span>
        </>
      )}{" "}
      <MemberLink path={context.memberDetailPath} />
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
            {/* 합의 기한은 KST 23:59:59 벽시계 — UTC로 바꾸면 다음 날 08:59로 밀린다 */}
            <span className="tabular-nums">
              {formatKstDateTime(adjustment.deadlineAt)}
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
 * 시스템 카드 — 절차의 기록. 운영팀 채널 카드(재발송 요청 · 직권 취소 · 동의 확인 · 해지 · 직권 중단 통지 ·
 * 정지 · 정지 해제)와 정산 조정 카드 9종. 제목 · 결과 문구는 서버 값을 그대로 쓴다 — 동의 확인 카드만
 * 서버 제목이 취소 · 해지를 함께 적어(「계약 취소 · 해지 동의 확인」) 종류별 제목으로 나눈다(시안 A8).
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
          {deadline && `합의 기한(${formatKstMonthDayTime(deadline)})까지 `}
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
    case "SETTLEMENT_ADJUSTMENT_WITHDRAWN": {
      // 철회는 요청한 쪽만 할 수 있다(1021 설계서 6-4) — 패널의 요청자가 곧 철회한 쪽
      const amount =
        adjustment.finalRewardAmount ??
        context.issue?.settlement.originalRewardAmount;
      const requester = context.issue
        ? partyName(context.issue, context.issue.requesterType)
        : null;
      return (
        <SysCard title={card.title}>
          {requester ? `${withSubjectParticle(requester)} ` : ""}요청을 철회해{" "}
          <span className="tabular-nums">{settlementNumber}</span>은{" "}
          <b>
            원래 계약 금액
            {amount !== undefined && amount !== null && `(${won(amount)})`}
          </b>
          으로 확정되고 보류가 해제됐습니다. 이슈는 자동으로 닫혔습니다.
        </SysCard>
      );
    }
    case "CONTRACT_CLOSE_CONSENT_REQUEST":
      return <ConsentRequestCard card={card} />;
    case "CONTRACT_TERMINATED":
      return <TerminatedCard card={card} />;
    case "GROUP_BUY_SUSPENSION_NOTICE":
      return <SuspensionNoticeCard card={card} />;
    case "ACCOUNT_SUSPENDED":
      return <SuspendedCard card={card} context={context} />;
    case "ACCOUNT_SUSPENSION_RELEASED":
      return <ReleasedCard card={card} context={context} />;
    default:
      // 모르는 카드(서버가 앞서 배포된 경우) — 제목 · 본문만 그린다. 대화 전체를 깨뜨리지 않는다
      return <SysCard title={card.title}>{message.content}</SysCard>;
  }
}
