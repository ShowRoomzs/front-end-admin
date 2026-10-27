import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import {
  CONTRACT_DETAIL_PATH,
  GROUP_BUY_DETAIL_PATH,
  ISSUE_TYPE_CODE,
  ISSUE_TYPE_LABEL,
  SETTLEMENT_DETAIL_PATH,
} from "@/features/thread/constants/params";
import {
  BTN_SECONDARY,
  FLINK_CLASS,
  IP_TITLE_CLASS,
  MK_CLASS,
  MROW_CLASS,
  MV_CLASS,
  TSUB_CLASS,
} from "@/features/thread/components/styles";
import type { IssuePanel as IssuePanelData } from "@/features/thread/types";
import {
  formatAmount,
  formatDateTime,
  formatKstMonthDay,
  won,
} from "@/features/thread/utils/format";
import { toBadgeVariant } from "@/features/thread/utils/tone";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

interface IssuePanelProps {
  issue: IssuePanelData;
  /** 「브랜드–인플루언서 1:1 스레드 열람」 — 같은 화면에서 그 스레드를 연다 */
  onOpenPairThread: (threadId: number) => void;
}

function Row(props: { label: string; children: ReactNode }) {
  return (
    <div className={MROW_CLASS}>
      <span className={MK_CLASS}>{props.label}</span>
      <span className={MV_CLASS}>{props.children}</span>
    </div>
  );
}

function Section(props: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-sz-n-100 px-4 py-3.5 last:border-b-0">
      <div className={IP_TITLE_CLASS}>{props.title}</div>
      {props.children}
    </section>
  );
}

/** 진행 단계 점 — 완료 = 회색 채움 · 현재 = 인디고 · 예정 · 건너뜀 = 빈 점 */
function Step(props: { label: string; note: string | null; state: string }) {
  const { label, note, state } = props;
  // SKIPPED(만료 — 합의 · 반영 없음)를 완료처럼 칠하면 「합의가 있었다」로 읽힌다 — 빈 점에 취소선
  const isSkipped = state === "SKIPPED";
  return (
    <div
      className={cn(
        "flex items-start gap-[9px] py-[5px] text-[11px]",
        state === "DONE" && "text-sz-n-600",
        state === "CURRENT" && "font-semibold text-sz-n-900",
        (state === "TODO" || isSkipped) && "text-sz-n-400"
      )}
    >
      <span
        className={cn(
          "mt-[3px] size-[9px] shrink-0 rounded-full border-[1.5px]",
          state === "DONE" && "border-sz-n-400 bg-sz-n-400",
          state === "CURRENT" && "border-sz-accent-500 bg-sz-accent-500",
          state !== "DONE" && state !== "CURRENT" && "border-sz-n-300 bg-white"
        )}
      />
      <span>
        <span className={cn(isSkipped && "line-through")}>{label}</span>
        {note && (
          <span className="mt-px block font-normal text-sz-n-500">{note}</span>
        )}
      </span>
    </div>
  );
}

/**
 * 이슈 스레드 우측 패널(시안 20b `.ip`) — 정산 영향 · 이슈 정보 · 진행 단계 · 참고. 조치 버튼 없음.
 * 상태 문구(holdLabel · 단계 label/note)는 서버 값을 그대로 쓴다.
 */
export default function IssuePanel(props: IssuePanelProps) {
  const { issue, onOpenPairThread } = props;
  const navigate = useNavigate();
  const { settlement } = issue;
  const proposal = settlement.currentProposal;
  const requester =
    issue.requesterType === "SELLER" ? issue.brand.name : issue.influencer.name;
  const responder =
    issue.requesterType === "SELLER" ? issue.influencer.name : issue.brand.name;

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-l border-sz-n-200 bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section title="정산 영향">
          <Row label="정산 회차">
            <span className="tabular-nums">{settlement.settlementNumber}</span>
          </Row>
          <div className="mb-0.5 mt-1.5">
            <button
              type="button"
              className={cn(BTN_SECONDARY, "w-full")}
              onClick={() =>
                navigate(`${SETTLEMENT_DETAIL_PATH}/${settlement.settlementId}`)
              }
            >
              정산 상세 보기 ↗
            </button>
          </div>
          <Row label="상태">
            <StatusBadge variant={toBadgeVariant(settlement.holdTone)} hideDot>
              {settlement.holdLabel}
            </StatusBadge>
          </Row>
          <Row label="원래 리워드">
            <span className="tabular-nums">
              {won(settlement.originalRewardAmount)}
            </span>
          </Row>
          {issue.status === "OPEN" && proposal && (
            <Row label={proposal.seq > 1 ? "현재 제안" : "요청 금액"}>
              <span className="tabular-nums">
                → {won(proposal.rewardAmount)}
              </span>{" "}
              <span className={TSUB_CLASS}>
                {proposal.responderName} 동의 시
              </span>
            </Row>
          )}
          {issue.status === "AGREED" &&
            settlement.agreedRewardAmount !== null && (
              <Row label="합의 금액">
                <b className="tabular-nums">
                  {won(settlement.agreedRewardAmount)}
                </b>
                {settlement.finalCreatorNetAmount !== null && (
                  <span className={TSUB_CLASS}>
                    {" "}
                    · 실지급 {formatAmount(settlement.finalCreatorNetAmount)}
                  </span>
                )}
              </Row>
            )}
          {(issue.status === "EXPIRED" || issue.status === "WITHDRAWN") && (
            <Row label="확정 금액">
              <b className="tabular-nums">
                {won(
                  settlement.finalRewardAmount ??
                    settlement.originalRewardAmount
                )}
              </b>
              <span className={TSUB_CLASS}> · 원래 금액</span>
            </Row>
          )}
          <p className="mt-1.5 text-[11px] leading-[1.55] text-sz-n-500">
            {issue.status === "OPEN" &&
              (proposal && proposal.seq > 1 ? (
                <>
                  제안을 주고받아도{" "}
                  <b className="text-sz-n-900">합의 기한은 그대로</b>
                  입니다.
                </>
              ) : (
                <>
                  상대가 <b className="text-sz-n-900">동의</b>하면 금액이 바뀌고
                  보류가 풀리며 이슈가 닫힙니다.
                </>
              ))}
            {issue.status === "AGREED" &&
              "합의와 동시에 반영됐습니다 — 남은 처리가 없습니다."}
            {issue.status === "EXPIRED" && (
              <>
                합의가 없어 <b className="text-sz-n-900">원래 금액</b>으로
                확정됐습니다.
              </>
            )}
            {/* 기-14 요청 철회 — 시안 20b에 없는 상태라 만료 문장의 틀을 따른다 */}
            {issue.status === "WITHDRAWN" && (
              <>
                요청이 철회돼 <b className="text-sz-n-900">원래 금액</b>으로
                확정됐습니다.
              </>
            )}
          </p>
        </Section>

        <Section title="이슈 정보">
          <Row label="유형">
            {ISSUE_TYPE_LABEL}{" "}
            <span className={TSUB_CLASS}>{ISSUE_TYPE_CODE}</span>
          </Row>
          <Row label="공구">
            <Link
              to={`${GROUP_BUY_DETAIL_PATH}/${issue.groupBuy.groupBuyId}`}
              className={cn(FLINK_CLASS, "font-normal")}
            >
              {issue.groupBuy.title} ↗
            </Link>
          </Row>
          {issue.contract && (
            <Row label="계약">
              <Link
                to={`${CONTRACT_DETAIL_PATH}/${issue.contract.contractId}`}
                className={cn(FLINK_CLASS, "font-normal tabular-nums")}
              >
                {issue.contract.contractNumber} ↗
              </Link>
            </Row>
          )}
          <Row label="요청">
            {requester} → {responder}
          </Row>
          <Row label="개설">
            <span className="tabular-nums">
              {formatDateTime(issue.openedAt)}
            </span>{" "}
            <span className={TSUB_CLASS}>· 정산 확인 기간 중</span>
          </Row>
          <Row label="합의 기한">
            <span className="tabular-nums">
              {formatKstMonthDay(issue.deadlineAt)}
              {issue.status === "OPEN" &&
                issue.remainingBusinessDays !== null &&
                ` · D-${issue.remainingBusinessDays}`}
            </span>
            {issue.status === "EXPIRED" && (
              <span className={TSUB_CLASS}> · 경과</span>
            )}
          </Row>
        </Section>

        <Section title="진행 단계">
          <div className="mt-0.5 flex flex-col">
            {issue.steps.map((step) => (
              <Step
                key={step.key}
                label={step.label}
                note={step.note}
                state={step.state}
              />
            ))}
          </div>
        </Section>

        <Section title="참고">
          <div className="flex flex-col gap-[7px] text-[11px]">
            {issue.links.pairThreadId !== null && (
              <button
                type="button"
                className={cn(FLINK_CLASS, "w-fit text-left")}
                onClick={() =>
                  onOpenPairThread(issue.links.pairThreadId as number)
                }
              >
                브랜드–인플루언서 1:1 스레드 열람 ↗
              </button>
            )}
            {/* 브랜드 · 인플루언서 회원 상세 라우트가 아직 없다 — 링크 없이 글자로 둔다 */}
            <span className="text-sz-n-400">{issue.brand.name} 회원 상세</span>
            <span className="text-sz-n-400">
              {issue.influencer.name} 회원 상세
            </span>
          </div>
        </Section>
      </div>
    </aside>
  );
}
