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
import type {
  DistributionRole,
  EvidenceItem,
  SettlementDetail,
  Tone,
} from "@/features/settlement/types";
import {
  md,
  minus,
  periodFull,
  plus,
  won,
  ymd,
  ymdhm,
} from "@/features/settlement/utils/format";
import {
  isBeforeConfirm,
  isPendingEvidence,
} from "@/features/settlement/utils/view";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import type { ReactNode } from "react";

type Detail = SettlementDetail;

// ── 단계 줄 ──────────────────────────────────────────

type StepState = "done" | "current" | "danger" | "skipped" | "future";

/**
 * 시안 정산 개요 머리의 단계 줄 — 주문 종결 › 정산 확인 3영업일 › 조정 협의 › 자동 확정 › 지급.
 * 조정 요청이 없던 회차는 「조정 협의」에 취소선을 긋는다.
 */
function StageLine(props: { detail: Detail }) {
  const { status, adjusted } = props.detail;
  const adjustState: StepState = adjusted ? "done" : "skipped";
  const states: Record<Detail["status"], Array<StepState>> = {
    CHECKING: ["done", "current", "future", "future", "future"],
    ADJUSTING: ["done", "done", "current", "future", "future"],
    SCHEDULED: ["done", "done", adjustState, "done", "current"],
    PAID: ["done", "done", adjustState, "done", "done"],
    FAILED: ["done", "done", adjustState, "done", "danger"],
  };
  const labels = [
    "주문 종결",
    "정산 확인 3영업일",
    "조정 협의",
    "자동 확정",
    status === "FAILED" ? "지급 · 분배 실패" : "지급",
  ];
  return (
    <span className="flex flex-nowrap items-center gap-[5px]">
      {labels.map((label, index) => {
        const state = states[status][index];
        return (
          <span key={label} className="contents">
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
  const { detail } = props;
  const rows = [
    { label: "공구", value: <B>{detail.groupBuyTitle}</B> },
    { label: "브랜드", value: detail.brandName },
    {
      label: "인플루언서",
      value: (
        <>
          {detail.showroomName}{" "}
          <TSub>· {detail.influencerBusiness ? "사업자" : "비사업자"}</TSub>
        </>
      ),
    },
    {
      label: "정산 대상 기간",
      value: (
        <span className="tabular-nums">
          {periodFull(detail.periodStart, detail.periodEnd)}
        </span>
      ),
    },
    detail.status === "CHECKING"
      ? {
          label: "주문 종결",
          value: (
            <>
              <span className="tabular-nums">
                {ymdhm(detail.ordersClosedAt)}
              </span>{" "}
              <TSub>· 전부 종결 · 정산 생성</TSub>
            </>
          ),
        }
      : {
          label: "마지막 구매확정",
          value: (
            <span className="tabular-nums">
              {ymd(detail.lastPurchaseConfirmedAt)}
            </span>
          ),
        },
  ];
  return (
    <StlCard title="정산 개요" note={<StageLine detail={detail} />} flush>
      <FieldGrid rows={rows} />
    </StlCard>
  );
}

// ── 금액 분해 ────────────────────────────────────────

/** 두 축을 한 카드에 — 브랜드 축과 인플루언서 축이 판매 리워드에서 만난다 */
export function BreakdownCard(props: { detail: Detail }) {
  const { detail } = props;
  const { breakdown } = detail;
  const { influencer } = breakdown;
  return (
    <StlCard
      title="금액 분해"
      note={
        detail.status === "CHECKING"
          ? "주문 종결 기준 확정 거래액 · 조정이 합의되면 리워드·브랜드 수취액만 바뀐다"
          : "확정 거래액 − PG − 플랫폼 − 리워드 − 리워드 부가세 = 브랜드 수취액"
      }
      flush
    >
      <div className="grid grid-cols-2 items-start">
        <div className="border-r border-sz-n-200">
          <Axis
            title="브랜드 축"
            sub="확정 거래액 기준 — 총 결제에서 반품·교환·배송비 차감"
          />
          <table className="w-full border-collapse text-[12px]">
            <tbody>
              <MRowTr label="총 결제금액" value={won(breakdown.totalPayment)} />
              {breakdown.deductions.map((item) => (
                <MRowTr
                  key={item.label}
                  kind="sub"
                  label={item.label}
                  value={minus(item.amount)}
                />
              ))}
              <MRowTr
                kind="mid"
                label="확정 거래액"
                value={won(breakdown.confirmedSales)}
              />
              <MRowTr
                kind="sub"
                label={
                  <>
                    PG 결제 수수료 <Pb>{breakdown.pgRateLabel}</Pb>
                  </>
                }
                value={minus(breakdown.pgFee)}
              />
              <MRowTr
                kind="sub"
                label={
                  <>
                    플랫폼 수수료 <Pb>{breakdown.platformRateLabel}</Pb>
                  </>
                }
                value={minus(breakdown.platformFee)}
              />
              <MRowTr
                kind="sub"
                label={
                  <>
                    판매 리워드 <Pb>{breakdown.rewardRateLabel}</Pb>
                  </>
                }
                value={minus(breakdown.reward)}
              />
              <MRowTr
                kind="sub"
                label={
                  <>
                    리워드 부가세 <Pb>{breakdown.rewardVatLabel}</Pb>
                  </>
                }
                value={minus(breakdown.rewardVat)}
              />
              <MRowTr
                kind="tot"
                label="브랜드 수취액"
                value={won(breakdown.brandPayout)}
              />
            </tbody>
          </table>
        </div>
        <div>
          <Axis
            title="인플루언서 축"
            sub={
              influencer.business
                ? "사업자 — 원천징수 없이 리워드 + 부가세"
                : `비사업자 — 리워드에서 ${influencer.withholdingRateLabel} 원천징수`
            }
          />
          <table className="w-full border-collapse text-[12px]">
            <tbody>
              <MRowTr label="판매 리워드" value={won(influencer.reward)} />
              {influencer.business ? (
                <>
                  <MRowTr
                    kind="sub"
                    label={
                      <>
                        부가세 <Pb>{influencer.vatLabel}</Pb>
                      </>
                    }
                    value={plus(influencer.vat)}
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
                      원천징수 <Pb>{influencer.withholdingRateLabel}</Pb>
                    </>
                  }
                  value={minus(influencer.withholding)}
                />
              )}
              <MRowTr
                kind="tot"
                label="인플루언서 실지급액"
                value={won(influencer.payout)}
              />
            </tbody>
          </table>
        </div>
      </div>
    </StlCard>
  );
}

// ── 3자 분배 ─────────────────────────────────────────

const ROLE_LABEL: Record<DistributionRole, string> = {
  BRAND: "브랜드",
  INFLUENCER: "인플루언서",
  PLATFORM: "플랫폼",
  PG: "결제 수수료",
};

/** PG가 각 수취자에게 직접 지급 — 합계 = 확정 거래액 − 원천징수(tfoot 검산) */
export function DistributionCard(props: { detail: Detail }) {
  const { detail } = props;
  const { distribution } = detail;
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
          {distribution ? (
            distribution.rows.map((row) => (
              <tr key={row.role}>
                <td className={LTAB_CELL}>
                  {row.name} <TSub>{ROLE_LABEL[row.role]}</TSub>
                </td>
                <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
                  {won(row.amount)}
                </td>
                <td
                  className={cn(
                    LTAB_CELL,
                    "text-[11px] tabular-nums text-sz-n-500"
                  )}
                >
                  {row.account}
                </td>
                <td className={LTAB_CELL}>
                  {row.status.kind === "BADGE" ? (
                    <StlBadge tone={row.status.tone} hideDot>
                      {row.status.label}
                    </StlBadge>
                  ) : (
                    <TSub>{row.status.label}</TSub>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={4}
                className="px-3.5 py-[30px] text-center text-sz-n-500"
              >
                자동 확정 후 표시{" "}
                <TSub>— 확인 기간이 끝나야 지급 일정과 계좌가 정해집니다</TSub>
              </td>
            </tr>
          )}
        </tbody>
        {distribution && (
          <tfoot>
            <tr>
              <td className={LTAB_FOOT}>지급 합계</td>
              <td className={cn(LTAB_FOOT, "text-right tabular-nums")}>
                {won(distribution.total)}
              </td>
              <td
                className={cn(
                  LTAB_FOOT,
                  "text-[11px] font-normal text-sz-n-500"
                )}
                colSpan={2}
              >
                확정 거래액 {won(detail.confirmedSales)} − 원천징수{" "}
                {won(distribution.withholding)}{" "}
                <TDim>(플랫폼이 납세 대리로 보유)</TDim>
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
        <div key={item.clawbackNo}>
          <FRow label={<span className="tabular-nums">{item.clawbackNo}</span>}>
            {item.productTitle} ·{" "}
            <span className="tabular-nums">{item.orderNo}</span> · {item.reason}{" "}
            <TSub>· 원 정산 {item.originSettlementNo}</TSub>
          </FRow>
          <FRow label="차감액">
            브랜드 수취액{" "}
            <B className="tabular-nums">{minus(item.brandAmount)}</B>원
            {item.rewardAmount > 0 && (
              <>
                {" "}
                · 리워드{" "}
                <B className="tabular-nums">{minus(item.rewardAmount)}</B>원
              </>
            )}{" "}
            <TSub>· 위 금액 분해에 이미 반영</TSub>
          </FRow>
        </div>
      ))}
    </StlCard>
  );
}

/** 이슈 스레드 화면이 아직 없다 — 링크 자리만 두고 「준비 중」으로 막는다 */
export function ThreadLinkPlaceholder() {
  return (
    <span
      className="ml-3 shrink-0 cursor-not-allowed text-[12px] text-sz-n-400"
      title="이슈 스레드 화면 준비 중"
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
  return (
    <StlCard
      title="조정 내역"
      note="양측 합의로만 바뀜 · 운영자는 금액을 정하지 않음"
      extra={<ThreadLinkPlaceholder />}
    >
      <FRow label="원래 금액">
        리워드{" "}
        <span className="tabular-nums">{won(adjustment.originalReward)}</span>원{" "}
        <TSub>
          · 실지급 {won(adjustment.originalInfluencerPayout)} · 브랜드 수취액{" "}
          {won(adjustment.originalBrandPayout)}
        </TSub>
      </FRow>
      <FRow label="조정 요청">
        {adjustment.requesterName} ·{" "}
        <span className="tabular-nums">{md(adjustment.requestedAt)}</span> →
        리워드 <B className="tabular-nums">{won(adjustment.requestedReward)}</B>
        원 <TSub>· {adjustment.requestReason}</TSub>
      </FRow>
      {adjustment.counter && (
        <FRow label="다른 금액 제안">
          {adjustment.counter.proposerName} ·{" "}
          <span className="tabular-nums">
            {md(adjustment.counter.proposedAt)}
          </span>{" "}
          → 리워드{" "}
          <B className="tabular-nums">{won(adjustment.counter.reward)}</B>원{" "}
          <TSub>· {adjustment.counter.reason}</TSub>
        </FRow>
      )}
      <FRow label="진행">
        <StlBadge tone="INFO" hideDot>
          {adjustment.progressLabel}
        </StlBadge>{" "}
        <TSub>
          · 합의 기한{" "}
          <span className="tabular-nums">
            {dayjs(adjustment.agreeDueAt).format("MM.DD HH:mm")}
          </span>{" "}
          · 지나면 원래 금액으로 확정
        </TSub>
      </FRow>
    </StlCard>
  );
}

// ── 증빙(MVP 수동) ───────────────────────────────────

/** 승인번호 가운데를 줄인다 — 「20261009-4100···-8817」 */
function shortApproval(value: string | null): string {
  if (!value) return "—";
  return value.length > 18
    ? `${value.slice(0, 13)}···${value.slice(-5)}`
    : value;
}

interface EvidenceRow {
  title: string;
  direction: string;
  amounts: ReactNode;
  badge: { label: string; tone: Tone };
  meta: string | null;
  action: "view" | "check" | "register" | null;
}

function evidenceRow(item: EvidenceItem, detail: Detail): EvidenceRow {
  const supplyVat = (
    <>
      공급가 <b>{won(item.supply)}원</b> · 부가세 <b>{won(item.vat)}원</b>
    </>
  );
  switch (item.kind) {
    case "WITHHOLDING_RECEIPT":
      return {
        title: "원천징수영수증",
        direction: `시스템 생성 → ${detail.showroomName}`,
        amounts: (
          <>
            지급액 <b>{won(item.supply)}원</b> · 원천징수{" "}
            <b>{won(item.withholding)}원</b>
          </>
        ),
        ...(item.state === "ISSUED"
          ? {
              badge: { label: "발행 완료", tone: "SUCCESS" as Tone },
              meta: null,
              action: "view" as const,
            }
          : item.state === "RRN_MISSING"
            ? {
                badge: { label: "주민번호 미등록", tone: "NEUTRAL" as Tone },
                meta: "인플루언서 입력 대기 · 자동 알림",
                action: null,
              }
            : {
                badge: { label: "발행 전", tone: "NEUTRAL" as Tone },
                meta: "지급 완료 시 시스템 생성",
                action: null,
              }),
      };
    case "INFLUENCER_INVOICE":
      return {
        title: "세금계산서 (정발행)",
        direction: `${detail.showroomName} → 플랫폼`,
        amounts: supplyVat,
        ...(item.state === "CHECK_PENDING"
          ? {
              badge: { label: "대조 대기", tone: "INFO" as Tone },
              meta: `승인번호 ${shortApproval(item.approvalNo)} · ${md(item.inputAt)} 입력`,
              action: "check" as const,
            }
          : item.state === "REJECTED"
            ? {
                badge: { label: "반려 · 재입력 대기", tone: "NEUTRAL" as Tone },
                meta: `${item.rejectReason ?? ""} · ${md(item.processedAt)} · ${item.processorName ?? ""}`,
                action: null,
              }
            : {
                badge: { label: "대조 확인", tone: "SUCCESS" as Tone },
                meta: `${md(item.processedAt)} · ${item.processorName ?? ""}`,
                action: "view" as const,
              }),
      };
    default:
      return {
        title: "세금계산서",
        direction: `플랫폼 → ${detail.brandName}`,
        amounts: supplyVat,
        ...(item.state === "ISSUE_PENDING"
          ? {
              badge: { label: "발행 대기", tone: "NEUTRAL" as Tone },
              meta: `기한 ${md(item.dueAt)}`,
              action: "register" as const,
            }
          : {
              badge: { label: "발행 완료", tone: "SUCCESS" as Tone },
              meta: `${md(item.processedAt)} · ${item.processorName ?? ""} 등록`,
              action: "view" as const,
            }),
      };
  }
}

function evidenceHint(detail: Detail): ReactNode {
  const { evidence, influencerBusiness, breakdown } = detail;
  const pending = evidence.some(isPendingEvidence);
  if (pending) {
    const invoiceHeld = evidence.some(
      (item) =>
        item.kind === "INFLUENCER_INVOICE" &&
        (item.state === "CHECK_PENDING" || item.state === "REJECTED")
    );
    const rrnMissing = evidence.some((item) => item.state === "RRN_MISSING");
    const brandPending = evidence.some(
      (item) => item.state === "ISSUE_PENDING"
    );
    return (
      <>
        {invoiceHeld && (
          <>
            인플루언서 건은 <b>대조 확인 전 지급 보류</b>입니다.{" "}
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
  if (influencerBusiness) {
    return (
      <>
        두 건 모두 <b>홈택스에서 수동 발행</b>된 것을 운영팀이 확인·등록했습니다
        — 인플루언서 건은 승인번호 대조, 브랜드 건은 발행본 등록. 등록 후
        스튜디오 · 파트너센터의 [다운로드]가 열립니다.
      </>
    );
  }
  return (
    <>
      리워드는 <b>플랫폼이 지급</b>합니다 —{" "}
      {breakdown.influencer.withholdingRateLabel}는 플랫폼이 다음 달 10일까지
      신고·납부합니다. 원천징수영수증은 지급 완료 시 <b>시스템이 PDF로 생성</b>
      하고, 브랜드 세금계산서는 운영팀이 <b>홈택스에서 발행해 등록</b>합니다(MVP
      · 외부 발행 서비스 없음).
    </>
  );
}

export function EvidenceCard(props: {
  detail: Detail;
  onView: () => void;
  onCheck: () => void;
  onRegister: () => void;
}) {
  const { detail, onView, onCheck, onRegister } = props;
  return (
    <StlCard title="증빙" note="MVP — 외부 발행 서비스 없음 · 홈택스 수동">
      {detail.evidence.map((item) => {
        const row = evidenceRow(item, detail);
        return (
          <IBar
            key={item.kind}
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
              row.action === "check" ? (
                <Btn variant="primary" onClick={onCheck}>
                  대조
                </Btn>
              ) : row.action === "register" ? (
                <Btn variant="secondary" onClick={onRegister}>
                  발행본 등록
                </Btn>
              ) : row.action === "view" ? (
                <Btn variant="secondary" onClick={onView}>
                  보기
                </Btn>
              ) : undefined
            }
          />
        );
      })}
      <Hint className="mt-3">{evidenceHint(detail)}</Hint>
    </StlCard>
  );
}

// ── 고정 지급비 · 정산 명세 ──────────────────────────

/** 모델 B — 브랜드가 직접 지급해 플랫폼을 지나지 않는다. 계약 조건만 읽기 전용 */
export function FixedFeeCard(props: {
  detail: Detail;
  onOpenContract: () => void;
}) {
  const { fixedFee } = props.detail;
  if (!fixedFee) return null;
  return (
    <StlCard
      title="고정 지급비"
      note="플랫폼을 지나지 않는 돈 · 계약에서 상속 · 읽기 전용"
    >
      <IBar
        items={[
          <>
            계약 금액 <b>{won(fixedFee.amount)}원</b>
          </>,
          <>
            지급 시점 <b>{fixedFee.timingLabel}</b>
          </>,
          "브랜드 직접 지급",
        ]}
        action={
          <button
            type="button"
            className={cn(FLINK_CLASS, "text-[11px]")}
            onClick={props.onOpenContract}
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
  onDownload: () => void;
}) {
  const { detail, onDownload } = props;
  const { statement } = detail;
  if (!statement) return null;
  return (
    <StlCard
      title="정산 명세"
      note={
        <>
          주문 단위 · 전체{" "}
          <b className="font-semibold">{won(statement.totalCount)}</b>건 중 최근{" "}
          {statement.rows.length}건 · 반품 건은 정산 반영액 0
        </>
      }
      extra={
        <Btn
          variant="secondary"
          className={CARD_HEAD_BTN_CLASS}
          disabled={isBeforeConfirm(detail)}
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
          {statement.rows.map((row) => (
            <tr key={row.orderNo}>
              <td className={cn(LTAB_CELL, "tabular-nums")}>{row.orderNo}</td>
              <td className={LTAB_CELL}>{row.consumerMasked}</td>
              <td className={LTAB_CELL}>{row.itemLabel}</td>
              <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
                {row.quantity}
              </td>
              <td className={cn(LTAB_CELL, "text-right tabular-nums")}>
                {won(row.payment)}
              </td>
              <td className={LTAB_CELL}>
                <StlBadge tone={row.statusTone} hideDot>
                  {row.statusLabel}
                </StlBadge>
              </td>
              <td
                className={cn(
                  LTAB_CELL,
                  "text-right tabular-nums",
                  row.applied === 0 && "text-sz-n-400"
                )}
              >
                {won(row.applied)}
              </td>
              <td
                className={cn(
                  LTAB_CELL,
                  "text-right tabular-nums",
                  row.reward === 0 && "text-sz-n-400"
                )}
              >
                {won(row.reward)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className={LTAB_FOOT} colSpan={4}>
              전체 {won(statement.totalCount)}건 합계
            </td>
            <td className={cn(LTAB_FOOT, "text-right tabular-nums")}>
              {won(statement.totalPayment)}
            </td>
            <td
              className={cn(LTAB_FOOT, "text-[11px] font-normal text-sz-n-500")}
            >
              반품 {statement.returnCount} · 교환 {statement.exchangeCount}
            </td>
            <td className={cn(LTAB_FOOT, "text-right tabular-nums")}>
              {won(statement.totalApplied)}
            </td>
            <td className={cn(LTAB_FOOT, "text-right tabular-nums")}>
              {won(statement.totalReward)}
            </td>
          </tr>
        </tfoot>
      </table>
    </StlCard>
  );
}
