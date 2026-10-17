import Btn from "@/features/contract/components/shared/Btn";
import {
  Axis,
  B,
  CARD_HEAD_BTN_CLASS,
  FieldGrid,
  FLINK_CLASS,
  FRow,
  Hint,
  IBar,
  LTAB_CELL,
  LTAB_FOOT,
  LTAB_HEAD,
  MRowTr,
  Pb,
  StlBadge,
  StlCard,
  TDim,
  TSub,
} from "@/features/settlement/components/shared/StlParts";
import {
  ADJUSTMENT_TONE,
  BUSINESS_TYPE_LABEL,
  ITEM_STATUS_TONE,
  TAX_DOCUMENT_TONE,
} from "@/features/settlement/constants/params";
import type {
  AmountCount,
  Payout,
  SettlementDetail,
  TaxDocument,
  Tone,
} from "@/features/settlement/types";
import {
  md,
  minus,
  periodFull,
  plus,
  rate,
  won,
  ymdhm,
} from "@/features/settlement/utils/format";
import {
  accountText,
  brandInvoicesOf,
  creatorInvoiceOf,
  hasFixedFee,
  hasPendingEvidence,
  isCreatorInvoiceOpen,
  isResidentNumberMissing,
} from "@/features/settlement/utils/view";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import type { ReactNode } from "react";

type Detail = SettlementDetail;

// ── 단계 줄 ──────────────────────────────────────────

type StepState = "done" | "current" | "danger" | "skipped" | "future";

/**
 * 시안 정산 개요 머리의 단계 줄 — 주문 종결 › 정산 확인 3영업일 › 조정 협의 › 확정 › 지급.
 * 서버 `stage.current`(REVIEW · ADJUSTMENT · CONFIRMED · PAID)를 따르고, 조정 없이 확정된 회차
 * (`adjustmentSkipped`)는 「조정 협의」에 취소선을 긋는다.
 */
function StageLine(props: { detail: Detail }) {
  const { status, stage, rail } = props.detail;
  const adjustState: StepState = stage.adjustmentSkipped ? "skipped" : "done";
  const states: Record<Detail["stage"]["current"], Array<StepState>> = {
    REVIEW: ["done", "current", "future", "future", "future"],
    ADJUSTMENT: ["done", "done", "current", "future", "future"],
    CONFIRMED: [
      "done",
      "done",
      adjustState,
      "done",
      status === "PAYOUT_FAILED" ? "danger" : "current",
    ],
    PAID: ["done", "done", adjustState, "done", "done"],
  };
  const labels = [
    "주문 종결",
    "정산 확인 3영업일",
    "조정 협의",
    rail.confirmReasonLabel ??
      (stage.current === "ADJUSTMENT" ? "확정" : "자동 확정"),
    status === "PAYOUT_FAILED" ? "지급 · 분배 실패" : "지급",
  ];
  return (
    <span className="flex flex-nowrap items-center gap-[5px]">
      {labels.map((label, index) => {
        const state = states[stage.current][index];
        return (
          <span key={index} className="contents">
            {index > 0 && <span className="text-sz-n-300">›</span>}
            <span
              className={cn(
                "whitespace-nowrap",
                state === "done" && "text-sz-n-700",
                state === "current" && "font-semibold text-sz-accent-600",
                state === "danger" && "font-semibold text-sz-danger-text",
                state === "skipped" && "text-sz-n-400 line-through"
              )}
            >
              {state === "done" && "✓ "}
              {label}
            </span>
          </span>
        );
      })}
    </span>
  );
}

// ── 정산 개요 ────────────────────────────────────────

export function OverviewCard(props: { detail: Detail }) {
  const { overview } = props.detail;
  const rows = [
    {
      label: "공구",
      value: (
        <>
          <B>{overview.groupBuyTitle}</B>{" "}
          <TSub className="tabular-nums">· {overview.groupBuyNumber}</TSub>
        </>
      ),
    },
    { label: "브랜드", value: overview.brandName },
    {
      label: "인플루언서",
      value: (
        <>
          {overview.showroomName}{" "}
          <TSub>· {BUSINESS_TYPE_LABEL[overview.creatorBusinessType]}</TSub>
        </>
      ),
    },
    {
      label: "정산 대상 기간",
      value: (
        <span className="tabular-nums">
          {periodFull(overview.periodStartAt, overview.periodEndAt)}
        </span>
      ),
    },
    {
      label: "주문 종결",
      value: (
        <>
          <span className="tabular-nums">{ymdhm(overview.ordersClosedAt)}</span>{" "}
          <TSub>
            · 주문 {won(overview.closedCount)}건 전부 종결 · 정산 생성{" "}
            <span className="tabular-nums">{ymdhm(overview.createdAt)}</span>
          </TSub>
        </>
      ),
    },
  ];
  return (
    <StlCard title="정산 개요" note={<StageLine detail={props.detail} />} flush>
      <FieldGrid rows={rows} />
    </StlCard>
  );
}

// ── 금액 분해 ────────────────────────────────────────

function countLabel(label: string, value: AmountCount): string {
  return value.count > 0 ? `${label} ${value.count}건` : label;
}

/** 두 축을 한 카드에 — 브랜드 축과 인플루언서 축이 판매 리워드에서 만난다(요율은 정산 행의 스냅샷) */
export function BreakdownCard(props: { detail: Detail }) {
  const { detail } = props;
  const { brand, creator } = detail.breakdown;
  const deductions = [
    { label: countLabel("취소", brand.cancel), value: brand.cancel },
    { label: countLabel("반품", brand.return), value: brand.return },
    {
      label: countLabel("배송 예외", brand.deliveryException),
      value: brand.deliveryException,
    },
  ].filter((row) => row.value.amount > 0);
  const rewardChanged = brand.originalRewardAmount !== brand.rewardAmount;
  const isBusiness = creator.businessType === "BUSINESS";
  const withholdingRate = creator.withholding
    ? rate(creator.withholding.incomeRate + creator.withholding.localRate)
    : null;
  return (
    <StlCard
      title="금액 분해"
      note={
        detail.status === "REVIEWING"
          ? "주문 종결 기준 확정 거래액 · 조정이 합의되면 리워드·브랜드 수취액만 바뀐다"
          : "확정 거래액 − PG − 플랫폼 − 리워드 − 리워드 부가세 = 브랜드 수취액"
      }
      flush
    >
      <div className="grid grid-cols-2 items-start">
        <div className="border-r border-sz-n-200">
          <Axis
            title="브랜드 축"
            sub="확정 거래액 기준 — 총 결제에서 취소·반품·배송 예외 차감"
          />
          <table className="w-full border-collapse text-[12px]">
            <tbody>
              <MRowTr label="총 결제금액" value={won(brand.grossOrderAmount)} />
              {deductions.map((row) => (
                <MRowTr
                  key={row.label}
                  kind="sub"
                  label={row.label}
                  value={minus(row.value.amount)}
                />
              ))}
              <MRowTr
                kind="mid"
                label="확정 거래액"
                value={won(brand.confirmedSalesAmount)}
              />
              <MRowTr
                kind="sub"
                label={
                  <>
                    PG 결제 수수료 <Pb>{rate(brand.pgFee.rate)}</Pb>
                  </>
                }
                value={minus(brand.pgFee.amount)}
              />
              <MRowTr
                kind="sub"
                label={
                  <>
                    플랫폼 수수료 <Pb>{rate(brand.platformFee.rate)}</Pb>
                  </>
                }
                value={minus(brand.platformFee.amount)}
              />
              <MRowTr
                kind="sub"
                label={
                  <>
                    판매 리워드
                    {rewardChanged && (
                      <Pb>합의 · 원래 {won(brand.originalRewardAmount)}</Pb>
                    )}
                  </>
                }
                value={minus(brand.rewardAmount)}
              />
              <MRowTr
                kind="sub"
                label={
                  <>
                    리워드 부가세 <Pb>{rate(brand.rewardVat.rate)}</Pb>
                  </>
                }
                value={minus(brand.rewardVat.amount)}
              />
              {brand.reshipFee.amount > 0 && (
                <MRowTr
                  kind="sub"
                  label={countLabel("교환 재발송비", brand.reshipFee)}
                  value={plus(brand.reshipFee.amount)}
                />
              )}
              {brand.consumerDeliveryFee > 0 && (
                <MRowTr
                  kind="sub"
                  label="소비자 배송비"
                  value={plus(brand.consumerDeliveryFee)}
                />
              )}
              {brand.clawbackAmount > 0 && (
                <>
                  <MRowTr
                    kind="mid"
                    label="차감 전 브랜드 수취액"
                    value={won(brand.payoutBeforeClawback)}
                  />
                  <MRowTr
                    kind="sub"
                    label="이전 회차 차감"
                    value={minus(brand.clawbackAmount)}
                  />
                </>
              )}
              <MRowTr
                kind="tot"
                label="브랜드 수취액"
                value={won(brand.payoutAmount)}
              />
            </tbody>
          </table>
        </div>
        <div>
          <Axis
            title="인플루언서 축"
            sub={
              isBusiness
                ? "사업자 — 원천징수 없이 리워드 + 부가세"
                : `비사업자 — 리워드에서 ${withholdingRate ?? "—"} 원천징수`
            }
          />
          <table className="w-full border-collapse text-[12px]">
            <tbody>
              <MRowTr label="판매 리워드" value={won(creator.rewardAmount)} />
              {creator.clawbackAmount > 0 && (
                <MRowTr
                  kind="sub"
                  label="이전 회차 리워드 차감"
                  value={minus(creator.clawbackAmount)}
                />
              )}
              {isBusiness ? (
                <>
                  <MRowTr
                    kind="sub"
                    label={
                      <>
                        부가세 <Pb>{rate(brand.rewardVat.rate)}</Pb>
                      </>
                    }
                    value={plus(creator.vatAmount)}
                  />
                  <MRowTr
                    kind="sub"
                    label="원천징수"
                    value={<TDim>해당 없음 — 사업자</TDim>}
                  />
                </>
              ) : (
                <MRowTr
                  kind="sub"
                  label={
                    <>
                      원천징수 <Pb>{withholdingRate ?? "—"}</Pb>
                    </>
                  }
                  value={minus(creator.withholding?.amount ?? 0)}
                />
              )}
              <MRowTr
                kind="tot"
                label="인플루언서 실지급액"
                value={won(creator.payoutAmount)}
              />
            </tbody>
          </table>
        </div>
      </div>
    </StlCard>
  );
}

// ── 3자 분배 ─────────────────────────────────────────

/** 지급 상태 옆의 보조줄 — 예정일 · 지급일 · 실패 사유 · 재분배 횟수 */
function payoutMeta(row: Payout): string | null {
  const parts: Array<string> = [];
  if ((row.status === "SCHEDULED" || row.status === "BLOCKED") && row.dueDate) {
    parts.push(`${md(row.dueDate)} 예정`);
  }
  if (row.status === "PAID" && row.paidAt) parts.push(`${md(row.paidAt)}`);
  if (row.status === "FAILED") parts.push(row.failReason ?? row.failCode ?? "");
  if (row.attempt > 0) parts.push(`재분배 ${row.attempt}회`);
  const text = parts.filter(Boolean).join(" · ");
  return text || null;
}

function payoutAccount(row: Payout): ReactNode {
  const text = accountText(row);
  if (!text) {
    return row.payee === "PLATFORM" ? "—" : <TDim>등록 계좌 없음</TDim>;
  }
  return (
    <>
      {text}
      {row.accountSource === "CURRENT_PROFILE" && (
        <TDim className="block">회원 정보 현재 계좌</TDim>
      )}
    </>
  );
}

/** PG가 각 수취자에게 직접 지급 — 지급 합계 = 들어온 돈 − 원천징수(tfoot 검산) */
export function DistributionCard(props: { detail: Detail }) {
  const { detail } = props;
  const { payouts } = detail;
  const total = payouts
    ? payouts.check.total - payouts.check.withholdingAmount
    : 0;
  const extraInflow = payouts
    ? payouts.check.inflowAmount - payouts.check.confirmedSalesAmount
    : 0;
  return (
    <StlCard
      title="3자 분배"
      note={
        <>
          PG에서 각 수취자에게 <b className="font-semibold">직접</b> 지급 —
          플랫폼이 대금을 보관하지 않는다
        </>
      }
      flush
    >
      <table className="w-full table-fixed border-collapse text-[12px]">
        <colgroup>
          <col />
          <col style={{ width: 118 }} />
          <col style={{ width: 196 }} />
          <col style={{ width: 172 }} />
        </colgroup>
        <thead>
          <tr>
            <th className={LTAB_HEAD}>수취자</th>
            <th className={cn(LTAB_HEAD, "text-right")}>지급 금액</th>
            <th className={LTAB_HEAD}>지급 계좌</th>
            <th className={LTAB_HEAD}>지급 상태</th>
          </tr>
        </thead>
        <tbody className="[&>tr:first-child>td]:border-t-0">
          {payouts ? (
            <>
              {payouts.rows.map((row) => {
                const meta = payoutMeta(row);
                return (
                  <tr key={row.payoutId}>
                    <td className={LTAB_CELL}>
                      {row.payeeName} <TSub>{row.payeeLabel}</TSub>
                    </td>
                    <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
                      {won(row.amount)}
                    </td>
                    <td
                      className={cn(
                        LTAB_CELL,
                        "break-all text-[11px] tabular-nums text-sz-n-500"
                      )}
                    >
                      {payoutAccount(row)}
                    </td>
                    <td className={LTAB_CELL}>
                      {row.status === "NOT_APPLICABLE" ? (
                        <TSub>{row.statusLabel}</TSub>
                      ) : (
                        <StlBadge tone={row.statusTone} hideDot>
                          {row.statusLabel}
                        </StlBadge>
                      )}
                      {meta && (
                        <TSub className="mt-0.5 block tabular-nums">
                          {meta}
                        </TSub>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td className={LTAB_CELL}>
                  PG사 <TSub>결제 수수료</TSub>
                </td>
                <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
                  {won(payouts.pgFeeAmount)}
                </td>
                <td className={cn(LTAB_CELL, "text-[11px] text-sz-n-500")}>
                  결제금 선차감
                </td>
                <td className={LTAB_CELL}>
                  <TSub>자동 차감</TSub>
                </td>
              </tr>
            </>
          ) : (
            <tr>
              <td
                colSpan={4}
                className="px-3.5 py-[30px] text-center text-sz-n-500"
              >
                {detail.status === "ADJUSTING"
                  ? "확정 후 표시"
                  : "자동 확정 후 표시"}{" "}
                <TSub>
                  —{" "}
                  {detail.status === "ADJUSTING"
                    ? "조정 협의가 끝나 확정되어야 지급 일정과 계좌가 정해집니다"
                    : "확인 기간이 끝나야 지급 일정과 계좌가 정해집니다"}
                </TSub>
              </td>
            </tr>
          )}
        </tbody>
        {payouts && (
          <tfoot>
            <tr>
              <td className={LTAB_FOOT}>지급 합계</td>
              <td className={cn(LTAB_FOOT, "text-right tabular-nums")}>
                {won(total)}
              </td>
              <td
                className={cn(LTAB_FOOT, "text-[11px] text-sz-n-500")}
                colSpan={2}
              >
                확정 거래액 {won(payouts.check.confirmedSalesAmount)}
                {extraInflow > 0 && (
                  <> + 재발송비·배송비 {won(extraInflow)}</>
                )}{" "}
                − 원천징수 {won(payouts.check.withholdingAmount)}{" "}
                <TDim>(플랫폼이 납세 대리로 보유)</TDim>
                {!payouts.check.balanced && (
                  <span className="mt-0.5 block text-sz-danger-text">
                    검산 불일치 — 개발팀에 확인해 주세요
                  </span>
                )}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </StlCard>
  );
}

// ── 차감 반영(D3-b) · 조정 내역(D4-b) ────────────────

export function ClawbackAppliedCard(props: { detail: Detail }) {
  return (
    <StlCard
      title="차감 반영"
      note="이전 정산 뒤 환불된 건 · 이번 회차에서 자동 차감"
    >
      {props.detail.clawbacksApplied.map((item) => (
        <div key={item.clawbackNumber}>
          <FRow
            label={<span className="tabular-nums">{item.clawbackNumber}</span>}
          >
            {[item.productName, item.orderNumber].filter(Boolean).join(" · ")}
            {(item.productName || item.orderNumber) && " · "}
            {item.reasonLabel}{" "}
            {item.originSettlementNumber && (
              <TSub>· 원 정산 {item.originSettlementNumber}</TSub>
            )}
          </FRow>
          <FRow label="차감액">
            브랜드 수취액{" "}
            <B className="tabular-nums">{minus(item.brandAmount)}</B>원
            {item.creatorAmount > 0 && (
              <>
                {" "}
                · 리워드{" "}
                <B className="tabular-nums">{minus(item.creatorAmount)}</B>원
              </>
            )}{" "}
            <TSub>· 위 금액 분해에 이미 반영</TSub>
          </FRow>
        </div>
      ))}
    </StlCard>
  );
}

/** 어드민 이슈 스레드(20b) 화면이 아직 없다 — 링크 자리만 두고 안내한다 */
export function ThreadLinkPlaceholder(props: { threadId: number }) {
  return (
    <span
      className="ml-3 shrink-0 cursor-not-allowed text-[12px] text-sz-n-400"
      title={`이슈 스레드 #${props.threadId} — 어드민 소통 스레드 화면 준비 중`}
      aria-disabled="true"
    >
      이슈 스레드 열기 ↗ · 준비 중
    </span>
  );
}

/** 대화는 이슈 스레드에, 금액의 흐름은 여기 — 운영자는 금액을 정하지 않는다(§42) */
export function AdjustmentCard(props: { detail: Detail }) {
  const { adjustment } = props.detail;
  if (!adjustment) return null;
  const proposals = [...adjustment.proposals].sort((a, b) => a.seq - b.seq);
  return (
    <StlCard
      title="조정 내역"
      note="양측 합의로만 바뀜 · 운영자는 금액을 정하지 않음"
      extra={<ThreadLinkPlaceholder threadId={adjustment.threadId} />}
    >
      <FRow label="원래 금액">
        리워드{" "}
        <span className="tabular-nums">
          {won(adjustment.originalRewardAmount)}
        </span>
        원 <TSub>· 조정 가능 상한 {won(adjustment.maxRewardAmount)}원</TSub>
      </FRow>
      {proposals.map((proposal) => (
        <FRow
          key={proposal.proposalId}
          label={proposal.seq === 1 ? "조정 요청" : "다른 금액 제안"}
        >
          {proposal.proposerName} ·{" "}
          <span className="tabular-nums">{md(proposal.proposedAt)}</span> →
          리워드 <B className="tabular-nums">{won(proposal.rewardAmount)}</B>원
          {proposal.reason && <TSub> · {proposal.reason}</TSub>}
          <TSub className="block">
            {proposal.statusLabel} · 이 금액이면 실지급{" "}
            {won(proposal.preview.creatorNetAmount)} · 브랜드 수취액{" "}
            {won(proposal.preview.brandPayoutAmount)}
          </TSub>
        </FRow>
      ))}
      <FRow label="진행">
        <StlBadge tone={ADJUSTMENT_TONE[adjustment.status]} hideDot>
          {adjustment.statusLabel}
        </StlBadge>{" "}
        {adjustment.status === "OPEN" ? (
          <TSub>
            · 합의 기한{" "}
            <span className="tabular-nums">
              {dayjs(adjustment.deadlineAt).format("MM.DD HH:mm")}
            </span>
            {adjustment.remainingBusinessDays !== null &&
              ` · ${adjustment.remainingBusinessDays}영업일 남음`}{" "}
            · 지나면 원래 금액으로 확정
          </TSub>
        ) : (
          <TSub>
            · 확정 리워드{" "}
            <span className="tabular-nums">
              {won(
                adjustment.finalRewardAmount ??
                  adjustment.agreedRewardAmount ??
                  adjustment.originalRewardAmount
              )}
            </span>
            원
            {adjustment.closedAt && (
              <>
                {" "}
                ·{" "}
                <span className="tabular-nums">
                  {md(adjustment.closedAt)}
                </span>{" "}
                종결
              </>
            )}
          </TSub>
        )}
      </FRow>
    </StlCard>
  );
}

// ── 증빙(MVP 수동) ───────────────────────────────────

interface EvidenceRow {
  key: string;
  title: string;
  direction: string;
  amounts: ReactNode;
  badge: { label: string; tone: Tone };
  meta: string | null;
  action: "verify" | "register" | null;
}

function documentMeta(doc: TaxDocument): string | null {
  switch (doc.status) {
    case "SUBMITTED":
      return `승인번호 ${doc.approvalNumber ?? "—"} · ${md(doc.submittedAt)} 입력`;
    case "REJECTED":
      return `${doc.rejectReasonLabel ?? "반려"} · 재입력 대기`;
    case "PENDING_INPUT":
      return "인플루언서 입력 대기";
    case "VERIFIED":
      return `${md(doc.verifiedAt)} 확인`;
    case "PENDING_ISSUE":
      return doc.type === "WITHHOLDING_RECEIPT"
        ? "시스템 생성 중"
        : `기한 ${md(doc.dueDate)}`;
    case "ISSUED":
      return [
        doc.approvalNumber && `승인번호 ${doc.approvalNumber}`,
        doc.issuedDate && `${md(doc.issuedDate)} 발행`,
      ]
        .filter(Boolean)
        .join(" · ");
    case "GENERATED":
      return doc.issuedDate ? `${md(doc.issuedDate)} 생성` : null;
    default:
      return null;
  }
}

function documentRow(doc: TaxDocument, detail: Detail): EvidenceRow {
  const amounts =
    doc.type === "WITHHOLDING_RECEIPT" ? (
      <>
        지급액 <b>{won(doc.supplyAmount)}원</b> · 원천징수{" "}
        <b>{won(detail.breakdown.creator.withholding?.amount ?? 0)}원</b>
      </>
    ) : (
      <>
        공급가 <b>{won(doc.supplyAmount)}원</b> · 부가세{" "}
        <b>{won(doc.vatAmount)}원</b>
      </>
    );
  return {
    key: String(doc.documentId),
    title: doc.typeLabel,
    direction: `${doc.direction} · ${doc.counterpartyName}`,
    amounts,
    badge: { label: doc.statusLabel, tone: TAX_DOCUMENT_TONE[doc.status] },
    meta: documentMeta(doc),
    action: doc.actions.canVerify
      ? "verify"
      : doc.actions.canRegister
        ? "register"
        : null,
  };
}

/** 비사업자 주민번호 미등록 — 문서가 아니라 보류 사유라 증빙 카드에 가상 줄로 보인다 */
function residentNumberRow(detail: Detail): EvidenceRow {
  return {
    key: "resident-number",
    title: "원천징수영수증",
    direction: `플랫폼 → 인플루언서 · ${detail.overview.showroomName}`,
    amounts: (
      <>
        원천징수{" "}
        <b>{won(detail.breakdown.creator.withholding?.amount ?? 0)}원</b>
      </>
    ),
    badge: { label: "주민번호 미등록", tone: "NEUTRAL" },
    meta: "인플루언서 입력 대기 · 자동 알림",
    action: null,
  };
}

function evidenceHint(detail: Detail): ReactNode {
  const isBusiness = detail.overview.creatorBusinessType === "BUSINESS";
  if (hasPendingEvidence(detail)) {
    const invoiceHeld = isCreatorInvoiceOpen(creatorInvoiceOf(detail));
    const rrnMissing = isResidentNumberMissing(detail);
    const brandPending = brandInvoicesOf(detail).some(
      (doc) => doc.status === "PENDING_ISSUE"
    );
    return (
      <>
        {invoiceHeld && (
          <>
            인플루언서 건은 <b>승인번호 확인 전 지급 보류</b>입니다.{" "}
          </>
        )}
        {rrnMissing && (
          <>
            주민번호가 등록되기 전에는 <b>인플루언서 몫이 지급 보류</b>
            입니다(인플루언서에게 자동 알림).{" "}
          </>
        )}
        {brandPending && (
          <>
            브랜드 건은 지급과 무관하며 <b>공급일 다음 달 10일</b>까지
            발행합니다 — 등록하면 파트너센터 [다운로드]가 열립니다.
          </>
        )}
      </>
    );
  }
  if (isBusiness) {
    return (
      <>
        두 건 모두 <b>홈택스에서 수동 발행</b>된 것을 운영팀이 확인·등록했습니다
        — 인플루언서 건은 승인번호 대조, 브랜드 건은 발행본 등록. 등록 후
        스튜디오 · 파트너센터의 [다운로드]가 열립니다.
      </>
    );
  }
  const withholding = detail.breakdown.creator.withholding;
  const brandIssued = brandInvoicesOf(detail).some(
    (doc) => doc.status === "ISSUED"
  );
  return (
    <>
      리워드는 <b>플랫폼이 지급</b>합니다 —{" "}
      {withholding
        ? rate(withholding.incomeRate + withholding.localRate)
        : "원천세"}
      는 플랫폼이 다음 달 10일까지 신고·납부합니다. 원천징수영수증은 지급 완료
      시 <b>시스템이 PDF로 생성</b>하고, 브랜드 세금계산서는 운영팀이{" "}
      <b>홈택스에서 발행해 등록</b>
      {brandIssued ? "했습니다" : "합니다"}(MVP · 외부 발행 서비스 없음).
    </>
  );
}

export function EvidenceCard(props: {
  detail: Detail;
  onVerify: (doc: TaxDocument) => void;
  onRegister: (doc: TaxDocument) => void;
}) {
  const { detail, onVerify, onRegister } = props;
  const rows = detail.taxDocuments.map((doc) => ({
    doc,
    row: documentRow(doc, detail),
  }));
  const virtual = isResidentNumberMissing(detail)
    ? [{ doc: null, row: residentNumberRow(detail) }]
    : [];
  return (
    <StlCard title="증빙" note="MVP — 외부 발행 서비스 없음 · 홈택스 수동">
      {[...rows, ...virtual].map(({ doc, row }) => (
        <IBar
          key={row.key}
          className="mt-2 first:mt-0"
          items={[
            <b key="title">{row.title}</b>,
            row.direction,
            row.amounts,
            <>
              <StlBadge tone={row.badge.tone} hideDot>
                {row.badge.label}
              </StlBadge>
              {row.meta && (
                <span className="tabular-nums text-sz-n-500">{row.meta}</span>
              )}
            </>,
          ]}
          action={
            doc && row.action === "verify" ? (
              <Btn variant="primary" onClick={() => onVerify(doc)}>
                대조
              </Btn>
            ) : doc && row.action === "register" ? (
              <Btn variant="secondary" onClick={() => onRegister(doc)}>
                발행본 등록
              </Btn>
            ) : undefined
          }
        />
      ))}
      <Hint className="mt-3">{evidenceHint(detail)}</Hint>
    </StlCard>
  );
}

// ── 고정 지급비 · 정산 명세 ──────────────────────────

/** 모델 B — 브랜드가 직접 지급해 플랫폼을 지나지 않는다. 계약 조건만 읽기 전용 */
export function FixedFeeCard(props: {
  detail: Detail;
  onOpenContract: (contractId: number) => void;
}) {
  const { fixedFee } = props.detail;
  if (!fixedFee || !hasFixedFee(props.detail)) return null;
  return (
    <StlCard
      title="고정 지급비"
      note="플랫폼을 지나지 않는 돈 · 계약에서 상속 · 읽기 전용"
    >
      <IBar
        items={[
          <>
            계약 금액 <b>{won(fixedFee.amount ?? 0)}원</b>
          </>,
          <>
            지급 시점 <b>{fixedFee.triggerLabel ?? "—"}</b>
          </>,
          "브랜드 직접 지급",
        ]}
        action={
          <button
            type="button"
            className={cn(FLINK_CLASS, "text-[13px]")}
            onClick={() => props.onOpenContract(fixedFee.contractId)}
          >
            계약 상세 보기 ↗
          </button>
        }
      />
      <Hint className="mt-3">
        고정 지급비는 브랜드가 인플루언서에게 <b>직접</b> 지급하므로 플랫폼은
        지급 여부를 알 수 없고 <b>정산 분해에도 넣지 않습니다</b>. 지급 기록은
        계약 관리의 브랜드 자기 신고뿐입니다.
      </Hint>
    </StlCard>
  );
}

/** 주문 단위 명세 최근 5건 — 반품 건은 정산 반영액 0(차감 근거가 행 단위로 보인다) */
export function StatementCard(props: {
  detail: Detail;
  isDownloading: boolean;
  onDownload: () => void;
}) {
  const { detail, isDownloading, onDownload } = props;
  const { items } = detail;
  if (items.rows.length === 0) return null;
  const rewardChanged =
    items.footer.itemRewardTotal !== items.footer.rewardAmount;
  return (
    <StlCard
      title="정산 명세"
      note={
        <>
          주문 단위 · 전체 <b className="font-semibold">{won(items.total)}</b>건
          중 최근 {items.rows.length}건 · 반품 건은 정산 반영액 0
        </>
      }
      extra={
        <Btn
          variant="secondary"
          className={CARD_HEAD_BTN_CLASS}
          disabled={!detail.actions.canDownloadStatement}
          isLoading={isDownloading}
          onClick={onDownload}
        >
          명세 다운로드
        </Btn>
      }
      flush
    >
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr>
            <th className={LTAB_HEAD}>주문번호</th>
            <th className={LTAB_HEAD}>소비자</th>
            <th className={LTAB_HEAD}>상품 · 옵션</th>
            <th className={cn(LTAB_HEAD, "text-right")}>수량</th>
            <th className={cn(LTAB_HEAD, "text-right")}>결제금액</th>
            <th className={LTAB_HEAD}>상태</th>
            <th className={cn(LTAB_HEAD, "text-right")}>정산 반영액</th>
            <th className={cn(LTAB_HEAD, "text-right")}>리워드</th>
          </tr>
        </thead>
        <tbody className="[&>tr:first-child>td]:border-t-0">
          {items.rows.map((row) => (
            <tr key={row.itemId}>
              <td className={cn(LTAB_CELL, "tabular-nums")}>
                {row.orderNumber}
              </td>
              <td className={LTAB_CELL}>{row.consumerNameMasked}</td>
              <td className={LTAB_CELL}>
                {row.productName}
                {row.optionName && <TSub> · {row.optionName}</TSub>}
              </td>
              <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
                {row.quantity}
                {row.returnedQuantity > 0 && (
                  <TSub className="block">반품 {row.returnedQuantity}</TSub>
                )}
              </td>
              <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
                {won(row.paidAmount)}
              </td>
              <td className={LTAB_CELL}>
                <StlBadge tone={ITEM_STATUS_TONE[row.status]} hideDot>
                  {row.statusLabel}
                </StlBadge>
              </td>
              <td
                className={cn(
                  LTAB_CELL,
                  "text-right tabular-nums",
                  row.settledAmount === 0 && "text-sz-n-400"
                )}
              >
                {won(row.settledAmount)}
              </td>
              <td
                className={cn(
                  LTAB_CELL,
                  "text-right tabular-nums",
                  row.rewardAmount === 0 && "text-sz-n-400"
                )}
              >
                {won(row.rewardAmount)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className={LTAB_FOOT} colSpan={4}>
              전체 {won(items.total)}건 합계
            </td>
            <td className={cn(LTAB_FOOT, "text-right tabular-nums")}>
              {won(items.footer.paidAmount)}
            </td>
            <td className={cn(LTAB_FOOT, "text-[11px] text-sz-n-500")}>
              반품 {items.returnCount} · 교환 {items.exchangeCount}
            </td>
            <td className={cn(LTAB_FOOT, "text-right tabular-nums")}>
              {won(items.footer.settledAmount)}
            </td>
            <td className={cn(LTAB_FOOT, "text-right tabular-nums")}>
              {won(items.footer.itemRewardTotal)}
              {rewardChanged && (
                <TSub className="block font-normal">
                  합의 리워드 {won(items.footer.rewardAmount)}
                </TSub>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </StlCard>
  );
}
