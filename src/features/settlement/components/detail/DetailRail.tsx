import Btn from "@/features/contract/components/shared/Btn";
import {
  FLINK_CLASS,
  Hint,
  HistoryTimeline,
  MRow,
  StlBadge,
  StlCard,
  TDim,
  WaitBox,
} from "@/features/settlement/components/shared/StlParts";
import {
  BRAND_DETAIL_PATH,
  BRAND_SUSPENDED,
  CONFIRM_REASON_TEXT,
  HISTORY_TONE,
  TAX_INVOICE_UNVERIFIED,
} from "@/features/settlement/constants/params";
import { THREAD_PAGE_PATH } from "@/features/thread/constants/params";
import type { SettlementDetail } from "@/features/settlement/types";
import {
  elapsedDays,
  md,
  mdDue,
  won,
  ymd,
  ymdhm,
  ymdhmDue,
} from "@/features/settlement/utils/format";
import {
  activeBlockReasons,
  brandInvoicesOf,
  creatorInvoiceOf,
  hasPendingEvidence,
} from "@/features/settlement/utils/view";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type Detail = SettlementDetail;

export interface RailActions {
  onRedistribute: () => void;
  onVerifyInvoice: () => void;
  onRegisterInvoice: () => void;
  onDownloadStatement: () => void;
  isDownloading: boolean;
}

function payoutRow(detail: Detail, payee: "BRAND" | "CREATOR") {
  return detail.payouts?.rows.find((row) => row.payee === payee);
}

/**
 * 브랜드 몫이 브랜드 계정 정지로 멈췄는가(D8) — 서버는 브랜드 행을 BLOCKED + 사유 코드 BRAND_SUSPENDED로
 * 내린다(PayoutHoldTransitions). 정산 상태는 지급 예정 그대로다.
 */
function brandSuspendedRow(detail: Detail) {
  const brand = payoutRow(detail, "BRAND");
  return brand?.status === "BLOCKED" && brand.failCode === BRAND_SUSPENDED
    ? brand
    : undefined;
}

/** 인플루언서 몫이 세금계산서 대조 대기 하나로만 보류됐는가 — 그때만 「대조 후」(시안 D7) */
function isWaitingInvoiceCheck(detail: Detail): boolean {
  const reasons = activeBlockReasons(detail).filter(
    (reason) => reason.code !== BRAND_SUSPENDED
  );
  return (
    creatorInvoiceOf(detail)?.status === "SUBMITTED" &&
    reasons.length > 0 &&
    reasons.every((reason) => reason.code === TAX_INVOICE_UNVERIFIED)
  );
}

/** 보류된 인플루언서 몫의 날짜 자리 — 대조 대기면 「대조 후」, 그 밖의 사유는 「보류 해제 후」 */
function creatorHeldText(detail: Detail): string {
  return isWaitingInvoiceCheck(detail) ? "대조 후" : "보류 해제 후";
}

/** 지급(예정)일 — 인플루언서 몫이 보류되거나 다른 날 나가면 몫별로 적는다(§41-5) */
function payoutDateText(detail: Detail): ReactNode {
  const { rail } = detail;
  if (detail.status === "PAID") return ymd(rail.paidAt);
  if (detail.status !== "PAYOUT_SCHEDULED") return ymd(rail.payoutDueDate);
  const brand = payoutRow(detail, "BRAND");
  const creator = payoutRow(detail, "CREATOR");
  const brandDate = brand?.dueDate ?? rail.payoutDueDate;
  if (creator?.status === "BLOCKED") {
    return (
      <>
        브랜드 <span className="tabular-nums">{md(brandDate)}</span> ·
        인플루언서 {creatorHeldText(detail)}
      </>
    );
  }
  if (creator?.dueDate && brandDate && creator.dueDate !== brandDate) {
    return (
      <>
        브랜드 <span className="tabular-nums">{md(brandDate)}</span> ·
        인플루언서 <span className="tabular-nums">{md(creator.dueDate)}</span>{" "}
        (예정)
      </>
    );
  }
  return <span className="tabular-nums">{ymd(rail.payoutDueDate)} (예정)</span>;
}

function dateRows(detail: Detail): Array<{ label: string; value: ReactNode }> {
  const { rail } = detail;
  switch (detail.status) {
    case "REVIEWING":
      return [
        { label: "확인 마감", value: ymdhmDue(rail.reviewDueAt) },
        { label: "지급(예정)일", value: "확정 후 계산" },
      ];
    case "ADJUSTING":
      return [
        { label: "합의 기한", value: ymdhmDue(rail.deadlineAt) },
        { label: "지급(예정)일", value: "—" },
      ];
    default: {
      const confirmRow = {
        // 지급 예정은 확정 사유를 앞말로(「자동 확정일」), 지급이 끝난 회차는 「정산 확정일」
        label:
          detail.status === "PAYOUT_SCHEDULED"
            ? `${rail.confirmReasonLabel ?? "자동 확정"}일`
            : "정산 확정일",
        value: ymd(rail.confirmedAt),
      };
      const suspended =
        detail.status === "PAYOUT_SCHEDULED"
          ? brandSuspendedRow(detail)
          : undefined;
      if (suspended) {
        // D8 — 지급(예정)일 한 줄 대신 몫별로: 인플루언서 몫은 예정대로, 브랜드 몫은 보조 배지
        const creator = payoutRow(detail, "CREATOR");
        return [
          confirmRow,
          {
            label: "인플루언서 몫",
            value:
              creator?.status === "BLOCKED" ? (
                `${creatorHeldText(detail)} 지급`
              ) : (
                <span className="tabular-nums">
                  {ymd(creator?.dueDate ?? rail.payoutDueDate)} 지급 (예정)
                </span>
              ),
          },
          {
            label: "브랜드 몫",
            value: (
              <StlBadge tone={suspended.statusTone} hideDot>
                지급 정지
              </StlBadge>
            ),
          },
        ];
      }
      return [
        confirmRow,
        {
          // 지급 완료여도 라벨은 「지급(예정)일」 그대로(시안 07b D1)
          label: "지급(예정)일",
          value: (
            <>
              {payoutDateText(detail)}
              {rail.payoutBasis && detail.status === "PAYOUT_SCHEDULED" && (
                <span className="mt-0.5 block text-[11px] font-normal text-sz-n-500">
                  {rail.payoutBasis}
                </span>
              )}
            </>
          ),
        },
      ];
    }
  }
}

/** D7 지급 보류 조건 목록 — ✕ 막는 것 · ✓ 끝난 것 · ○ 지급과 무관한 것 */
function HoldConditions(props: { detail: Detail }) {
  const { detail } = props;
  const invoice = creatorInvoiceOf(detail);
  const lines: Array<ReactNode> = [];
  if (detail.overview.creatorBusinessType === "BUSINESS") {
    switch (invoice?.status) {
      case "SUBMITTED":
        lines.push("✕ 세금계산서 대조 대기 — 인플루언서 지급 보류");
        break;
      case "REJECTED":
        lines.push("✕ 세금계산서 반려 · 재입력 대기 — 인플루언서 지급 보류");
        break;
      case "PENDING_INPUT":
        lines.push("✕ 세금계산서 입력 대기 — 인플루언서 지급 보류");
        break;
      default:
        lines.push(<TDim>✓ 세금계산서 확인</TDim>);
    }
  } else {
    // 기-12 — 주민번호 미등록은 지급 보류 조건이 아니다(줄 자체를 두지 않는다)
    lines.push(<TDim>✓ 세금계산서 — 해당 없음(비사업자)</TDim>);
  }
  // PG 셀러 등록 대기 · 예금주 불일치 · 인플루언서 계정 정지 등 — 서버 라벨을 그대로
  // (브랜드 계정 정지는 D8 안내 박스가 따로 말한다)
  activeBlockReasons(detail)
    .filter(
      (reason) =>
        reason.code !== TAX_INVOICE_UNVERIFIED &&
        reason.code !== BRAND_SUSPENDED
    )
    .forEach((reason) => lines.push(`✕ ${reason.label} — 지급 보류`));
  brandInvoicesOf(detail).forEach((doc) =>
    lines.push(
      doc.status === "PENDING_ISSUE" ? (
        <TDim>
          ○ {doc.typeLabel} 발행 대기 — 지급과 무관 · 기한 {md(doc.dueDate)}
        </TDim>
      ) : (
        <TDim>
          ✓ {doc.typeLabel} {doc.statusLabel}
        </TDim>
      )
    )
  );
  return (
    <WaitBox>
      <b>지급 보류 조건</b>
      {lines.map((line, index) => (
        <div key={index}>{line}</div>
      ))}
    </WaitBox>
  );
}

/**
 * D8 브랜드 몫 지급 정지 — 정지 · 해제는 회원 관리 소관이라 버튼 없이 안내와 브랜드 상세 링크만 둔다.
 * 해제 다음 영업일 지급은 서버 규칙(BrandSanctionService → PayoutHoldTransitions NEXT_BUSINESS_DAY)이다.
 * 정지 사유 · 처리자는 정산 응답에 없어 쓰지 않고, 날짜는 서버가 남긴 「브랜드 몫 · …」 지급 보류 이력에서 읽는다.
 */
function BrandSuspendedNotice(props: {
  detail: Detail;
  payeeLabel: string;
  amount: number;
}) {
  const { detail, payeeLabel, amount } = props;
  const navigate = useNavigate();
  const blockedAt = detail.history.find(
    (entry) =>
      entry.eventType === "PAYOUT_BLOCKED" &&
      entry.detail?.startsWith(`${payeeLabel} 몫`)
  )?.occurredAt;
  return (
    <>
      <WaitBox>
        <b>브랜드 계정 정지</b>
        {blockedAt && (
          <>
            {" "}
            · <span className="tabular-nums">{ymd(blockedAt)}</span>
          </>
        )}
        <br />
        브랜드 몫 <b className="tabular-nums">{won(amount)}원</b>은 지급 요청을
        보내지 않습니다. 정지가 풀리면 <b>다음 영업일</b>에 지급됩니다.{" "}
        <button
          type="button"
          className={FLINK_CLASS}
          onClick={() =>
            navigate(`${BRAND_DETAIL_PATH}/${detail.overview.marketId}`)
          }
        >
          브랜드 상세 보기 ↗
        </button>
      </WaitBox>
      <Hint className="mt-0">
        이 화면에서 지급을 재개하지 않습니다 — 회원 관리에서 정지를 해제하면
        자동으로 이어집니다.
      </Hint>
    </>
  );
}

/**
 * 우측 레일 「현재 상태」 — 배지 · 금액 3종 · 날짜 2 · 안내 · 액션(§45-5).
 * 돈은 이 화면에서 나가지 않는다 — 확정 · 보류 · 보류 해제 · 지급 앞당기기 버튼이 없고,
 * 운영자 액션은 재분배 · 승인번호 대조 · 브랜드 세금계산서 등록뿐이다(판정은 서버 `actions`).
 */
export function CurrentStateCard(props: {
  detail: Detail;
  actions: RailActions;
}) {
  const { detail, actions } = props;
  const { rail } = detail;
  const navigate = useNavigate();
  const blockReasons = activeBlockReasons(detail);
  const rows = [
    { label: "확정 거래액", value: `${won(rail.confirmedSalesAmount)}원` },
    { label: "브랜드 수취액", value: `${won(rail.brandPayoutAmount)}원` },
    { label: "인플루언서 실지급", value: `${won(rail.creatorPayoutAmount)}원` },
    ...dateRows(detail),
  ];

  const download = (
    <Btn
      variant="secondary"
      className="w-full flex-1"
      disabled={!detail.actions.canDownloadStatement}
      isLoading={actions.isDownloading}
      onClick={actions.onDownloadStatement}
    >
      정산 명세 다운로드
    </Btn>
  );

  // 증빙 액션은 상태와 무관하게 서버 판정을 따른다(지급 완료 뒤 브랜드 발행 대기도 있다)
  const evidenceButtons =
    detail.actions.canVerifyInvoice ||
    detail.actions.canRegisterBrandInvoice ? (
      <>
        {detail.actions.canVerifyInvoice && (
          <Btn
            variant="primary"
            className="w-full flex-1"
            onClick={actions.onVerifyInvoice}
          >
            승인번호 대조
          </Btn>
        )}
        {detail.actions.canRegisterBrandInvoice && (
          <Btn
            variant="secondary"
            className="w-full flex-1"
            onClick={actions.onRegisterInvoice}
          >
            브랜드 세금계산서 등록
          </Btn>
        )}
      </>
    ) : null;

  let notice: ReactNode = null;
  let primary: ReactNode = null;

  switch (detail.status) {
    case "REVIEWING":
      notice = (
        <WaitBox>
          <b>정산 확인 기간</b>입니다 —{" "}
          <b className="tabular-nums">{mdDue(rail.reviewDueAt)}</b>
          까지 양측이 금액을 보고 <b>정산 조정</b>을 요청할 수 있습니다. 요청이
          없으면 다음 날 <b>자동 확정</b>됩니다.
        </WaitBox>
      );
      primary = download;
      break;
    case "ADJUSTING": {
      const adjustment = detail.adjustment;
      const proposals = adjustment
        ? [...adjustment.proposals].sort((a, b) => a.seq - b.seq)
        : [];
      // 시안 D4 — 다른 금액 제안이 오가도 레일은 처음 요청 금액을 보인다(흐름은 조정 내역 카드에)
      const first = proposals[0];
      const requester =
        adjustment?.requesterType === "SELLER"
          ? detail.overview.brandName
          : detail.overview.showroomName;
      notice = adjustment && (
        <>
          <WaitBox>
            <b>정산 조정 요청</b> — {requester} · {ymd(adjustment.openedAt)} ·
            리워드 {won(adjustment.originalRewardAmount)}
            {first && (
              <>
                {" "}
                → <b>{won(first.rewardAmount)}원</b>
              </>
            )}
            <br />
            보류 <b>전액</b> · 합의 기한{" "}
            <b className="tabular-nums">{mdDue(adjustment.deadlineAt)}</b> ·
            협의는 <b>이슈 스레드</b>에서 양측이 합니다.
          </WaitBox>
          <Hint className="mt-0">
            양측이 이슈 스레드에서 <b>금액에 합의</b>하면 합의 금액으로 바뀌고{" "}
            <b>보류가 자동 해제</b>됩니다. 합의 기한(
            <b className="tabular-nums">{mdDue(adjustment.deadlineAt)}</b>)까지
            합의가 없으면 <b>원래 금액</b>으로 확정됩니다 — 이 화면에서 해제하지
            않습니다.
          </Hint>
        </>
      );
      // 20b 이슈 스레드로 같은 탭에서 연다(다른 상세의 스레드 링크와 같은 관례 · 「↗」는 다른 화면으로 간다는 표시)
      primary = adjustment?.threadId ? (
        <Btn
          variant="secondary"
          className="w-full flex-1"
          onClick={() =>
            navigate(`${THREAD_PAGE_PATH}?threadId=${adjustment.threadId}`)
          }
        >
          이슈 스레드 열기 ↗
        </Btn>
      ) : (
        download
      );
      break;
    }
    case "PAYOUT_SCHEDULED": {
      const suspended = brandSuspendedRow(detail);
      const holdConditions =
        hasPendingEvidence(detail) ||
        blockReasons.some((reason) => reason.code !== BRAND_SUSPENDED) ? (
          <HoldConditions detail={detail} />
        ) : null;
      if (suspended) {
        notice = (
          <>
            <BrandSuspendedNotice
              detail={detail}
              payeeLabel={suspended.payeeLabel}
              amount={suspended.amount}
            />
            {holdConditions && <div className="mt-2">{holdConditions}</div>}
          </>
        );
      } else {
        notice = holdConditions ?? (
          <Hint className="mt-0">
            {(rail.confirmReason && CONFIRM_REASON_TEXT[rail.confirmReason]) ??
              "정산이 확정됐습니다."}{" "}
            지급은 예정일에 <b>PG가 자동 분배</b>합니다.
          </Hint>
        );
      }
      primary = evidenceButtons ? null : download;
      break;
    }
    case "PAID": {
      const invoice = creatorInvoiceOf(detail);
      const checkedAt =
        invoice?.status === "VERIFIED" && invoice.verifiedAt
          ? md(invoice.verifiedAt)
          : null;
      notice = (
        <Hint className="mt-0">
          {detail.overview.creatorBusinessType === "BUSINESS" ? (
            <>
              사업자 건은 <b>원천징수영수증이 없습니다</b> — 증빙은 인플루언서가{" "}
              <b>플랫폼 앞으로</b> 발행한 세금계산서
              {checkedAt && (
                <>
                  (대조 확인 <span className="tabular-nums">{checkedAt}</span>)
                </>
              )}
              와 플랫폼이 브랜드에게 발행한 세금계산서입니다.
            </>
          ) : (
            <>
              지급이 끝난 회차는 <b>금액을 수정할 수 없습니다</b>.
              오지급·과지급이 확인되면 <b>별건 조정</b>으로 처리합니다.
            </>
          )}
        </Hint>
      );
      primary = evidenceButtons ? null : download;
      break;
    }
    case "PAYOUT_FAILED": {
      const failed = rail.failedPayout;
      const days = elapsedDays(failed?.failedAt);
      const others =
        detail.payouts?.rows.filter(
          (row) => row.payoutId !== failed?.payoutId
        ) ?? [];
      const othersSettled =
        others.length > 0 &&
        others.every(
          (row) => row.status === "PAID" || row.status === "NOT_APPLICABLE"
        );
      // 「브랜드·플랫폼 몫은」 — 실제로 지급 완료된 몫 이름만(시안 D5)
      const paidPayees = others
        .filter((row) => row.status === "PAID")
        .map((row) => row.payeeLabel)
        .join("·");
      const exhausted = failed ? failed.attempt >= failed.retryLimit : false;
      notice = failed && (
        <>
          <WaitBox danger>
            <b>
              {failed.payeeLabel} 몫 {won(failed.amount)}원 미전달
            </b>{" "}
            — PG 반환 사유 <b>{failed.failReason ?? failed.failCode ?? "—"}</b>{" "}
            · {ymd(failed.failedAt)}
            {days !== null && (
              <>
                {" "}
                · <b>{days}일 경과</b>
              </>
            )}
            {othersSettled && paidPayees && (
              <>
                <br />
                {paidPayees} 몫은 <b>정상 지급</b>됐습니다.
              </>
            )}
          </WaitBox>
          <Hint className="mt-0">
            재분배는 <b>확정 금액을 그대로</b> 다시 보냅니다 — 금액 재계산이
            아닙니다.
            {exhausted && (
              <>
                {" "}
                재분배 상한에 닿아 <b>수동 이체 절차</b>로 처리합니다.
              </>
            )}
          </Hint>
        </>
      );
      primary = (
        <>
          <Btn
            variant="primary"
            className="w-full flex-1"
            disabled={!detail.actions.canRedistribute}
            onClick={actions.onRedistribute}
          >
            재분배
          </Btn>
          {/* 알림 모듈 전이라 서버 엔드포인트가 없다(44 어드민 설계서 7-5 · 12절 #4) */}
          <Btn
            variant="secondary"
            className="w-full flex-1"
            disabled
            title="계좌 확인 요청은 알림 기능이 생기면 열립니다"
          >
            계좌 확인 요청
          </Btn>
        </>
      );
      break;
    }
  }

  return (
    <StlCard title="현재 상태" flush>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3">
          <span className="shrink-0 text-[12px] text-sz-n-500">정산</span>
          <StlBadge tone={rail.statusTone}>{rail.statusLabel}</StlBadge>
        </div>
        <div className="pt-2">
          {rows.map((row) => (
            <MRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
        {notice && <div className="mt-2">{notice}</div>}
        <div className="mt-2 border-t border-sz-n-100 pt-2">
          <div className="mt-4 flex flex-col gap-2">
            {primary && <div className="flex gap-2">{primary}</div>}
            {evidenceButtons && (
              <div className="flex gap-2">{evidenceButtons}</div>
            )}
          </div>
        </div>
      </div>
    </StlCard>
  );
}

/** 처리 이력 — 서버가 최신순으로 내린다 · 운영자는 「이름(운영자)」 */
export function HistoryCard(props: { detail: Detail }) {
  const items = props.detail.history.map((entry) => {
    const actor =
      entry.actorType === "ADMIN" && entry.actorLabel !== "운영자"
        ? `${entry.actorLabel}(운영자)`
        : entry.actorLabel;
    return {
      label: entry.label,
      meta: [ymdhm(entry.occurredAt), actor, entry.detail]
        .filter(Boolean)
        .join(" · "),
      tone: HISTORY_TONE[entry.eventType] ?? "NEUTRAL",
    };
  });
  return (
    <StlCard title="처리 이력" note="최신순">
      {items.length > 0 ? (
        <HistoryTimeline items={items} />
      ) : (
        <div className="px-4 py-3 text-[12px] text-sz-n-500">
          이력이 없습니다.
        </div>
      )}
    </StlCard>
  );
}
