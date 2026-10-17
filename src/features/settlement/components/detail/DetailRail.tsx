import Btn from "@/features/contract/components/shared/Btn";
import {
  Hint,
  HistoryTimeline,
  MRow,
  StlBadge,
  StlCard,
  TDim,
  WaitBox,
} from "@/features/settlement/components/shared/StlParts";
import {
  STATUS_LABEL,
  STATUS_TONE,
} from "@/features/settlement/constants/params";
import type {
  EvidenceItem,
  SettlementDetail,
} from "@/features/settlement/types";
import { md, won, ymd, ymdhm } from "@/features/settlement/utils/format";
import {
  isInfluencerHeld,
  isPendingEvidence,
} from "@/features/settlement/utils/view";
import type { ReactNode } from "react";

type Detail = SettlementDetail;

export interface RailActions {
  onRedistribute: () => void;
  onAccountCheck: () => void;
  onCheckInvoice: () => void;
  onRegisterInvoice: () => void;
  onDownloadStatement: () => void;
  accountCheckPending: boolean;
}

function findEvidence(detail: Detail, kind: EvidenceItem["kind"]) {
  return detail.evidence.find((item) => item.kind === kind);
}

/** 지급(예정)일 — 사업자 대조 · 주민번호가 남으면 인플루언서 몫만 뒤로 밀린다(§41-5) */
function payoutDateText(detail: Detail): ReactNode {
  if (detail.status !== "SCHEDULED") return ymd(detail.payoutAt);
  if (isInfluencerHeld(detail)) {
    return (
      <>
        브랜드 <span className="tabular-nums">{md(detail.payoutAt)}</span> ·
        인플루언서 {detail.influencerBusiness ? "대조 후" : "주민번호 등록 후"}
      </>
    );
  }
  if (
    detail.influencerPayoutAt &&
    detail.influencerPayoutAt !== detail.payoutAt
  ) {
    return (
      <>
        브랜드 <span className="tabular-nums">{md(detail.payoutAt)}</span> ·
        인플루언서{" "}
        <span className="tabular-nums">{md(detail.influencerPayoutAt)}</span>{" "}
        (예정)
      </>
    );
  }
  return <span className="tabular-nums">{ymd(detail.payoutAt)} (예정)</span>;
}

function dateRows(detail: Detail): Array<{ label: string; value: ReactNode }> {
  switch (detail.status) {
    case "CHECKING":
      return [
        { label: "확인 마감", value: ymdhm(detail.checkDueAt) },
        { label: "지급(예정)일", value: "확정 후 계산" },
      ];
    case "ADJUSTING":
      return [
        { label: "합의 기한", value: ymdhm(detail.adjustment?.agreeDueAt) },
        { label: "지급(예정)일", value: "—" },
      ];
    default:
      return [
        { label: "자동 확정일", value: ymd(detail.confirmedAt) },
        { label: "지급(예정)일", value: payoutDateText(detail) },
      ];
  }
}

/** §41-5 계정 정지 연동 지급 정지 — 「정지됐는데 돈은 들어오나요」에 한 줄로 답한다(표시만) */
function payoutStopRows(detail: Detail) {
  if (!detail.payoutStop) return [];
  const stopped = (
    <span className="font-semibold text-sz-warning-text">지급 정지</span>
  );
  const kept = "유지 · 사유가 정산 정보와 무관";
  return detail.payoutStop.party === "BRAND"
    ? [
        { label: "브랜드 몫 지급", value: stopped },
        { label: "리워드 지급", value: kept },
      ]
    : [
        { label: "리워드 지급", value: stopped },
        { label: "브랜드 몫 지급", value: kept },
      ];
}

/** D7 지급 보류 조건 목록 — ✕ 막는 것 · ✓ 끝난 것 · ○ 지급과 무관한 것 */
function HoldConditions(props: { detail: Detail }) {
  const { detail } = props;
  const invoice = findEvidence(detail, "INFLUENCER_INVOICE");
  const receipt = findEvidence(detail, "WITHHOLDING_RECEIPT");
  const brand = findEvidence(detail, "BRAND_INVOICE");

  const lines: Array<ReactNode> = [];
  if (detail.influencerBusiness) {
    if (invoice?.state === "CHECK_PENDING") {
      lines.push("✕ 세금계산서 대조 대기 — 인플루언서 지급 보류");
    } else if (invoice?.state === "REJECTED") {
      lines.push("✕ 세금계산서 반려 · 재입력 대기 — 인플루언서 지급 보류");
    } else {
      lines.push(<TDim>✓ 세금계산서 대조 확인</TDim>);
    }
    lines.push(<TDim>✓ 주민번호 — 해당 없음(사업자)</TDim>);
  } else {
    lines.push(<TDim>✓ 세금계산서 — 해당 없음(비사업자)</TDim>);
    lines.push(
      receipt?.state === "RRN_MISSING" ? (
        "✕ 주민번호 미등록 — 인플루언서 지급 보류"
      ) : (
        <TDim>✓ 주민번호 등록</TDim>
      )
    );
  }
  if (brand) {
    lines.push(
      brand.state === "ISSUE_PENDING" ? (
        <TDim>
          ○ 브랜드 세금계산서 발행 대기 — 지급과 무관 · 기한 {md(brand.dueAt)}
        </TDim>
      ) : (
        <TDim>✓ 브랜드 세금계산서 발행 완료</TDim>
      )
    );
  }
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
 * 우측 레일 「현재 상태」 — 배지 · 금액 3종 · 날짜 2 · 안내 · 액션(§45-5).
 * 돈은 이 화면에서 나가지 않는다 — 확정 · 보류 · 보류 해제 · 지급 앞당기기 버튼이 없고,
 * 운영자 액션은 재분배 · 승인번호 대조 · 브랜드 세금계산서 등록뿐이다.
 */
export function CurrentStateCard(props: {
  detail: Detail;
  actions: RailActions;
}) {
  const { detail, actions } = props;
  const rows = [
    { label: "확정 거래액", value: `${won(detail.confirmedSales)}원` },
    { label: "브랜드 수취액", value: `${won(detail.brandPayout)}원` },
    { label: "인플루언서 실지급", value: `${won(detail.influencerPayout)}원` },
    ...dateRows(detail),
    ...payoutStopRows(detail),
  ];

  const download = (disabled = false) => (
    <Btn
      variant="secondary"
      className="w-full flex-1"
      disabled={disabled}
      onClick={actions.onDownloadStatement}
    >
      정산 명세 다운로드
    </Btn>
  );

  let notice: ReactNode = null;
  let buttons: ReactNode = null;

  switch (detail.status) {
    case "CHECKING":
      notice = (
        <WaitBox>
          <b>정산 확인 기간</b>입니다 —{" "}
          <b className="tabular-nums">
            {md(detail.checkDueAt)} {ymdhm(detail.checkDueAt).slice(-5)}
          </b>
          까지 양측이 금액을 보고 <b>정산 조정</b>을 요청할 수 있습니다. 요청이
          없으면 다음 날 <b>자동 확정</b>됩니다.
        </WaitBox>
      );
      buttons = download(true);
      break;
    case "ADJUSTING": {
      const adjustment = detail.adjustment;
      notice = adjustment && (
        <>
          <WaitBox>
            <b>정산 조정 요청</b> — {adjustment.requesterName} ·{" "}
            {ymd(adjustment.requestedAt)} · 리워드{" "}
            {won(adjustment.originalReward)} →{" "}
            <b>{won(adjustment.requestedReward)}원</b>
            <br />
            보류 <b>전액</b> · 합의 기한{" "}
            <b className="tabular-nums">{md(adjustment.agreeDueAt)}</b> · 협의는{" "}
            <b>이슈 스레드</b>에서 양측이 합니다.
          </WaitBox>
          <Hint className="mt-0">
            양측이 이슈 스레드에서 <b>금액에 합의</b>하면 합의 금액으로 바뀌고{" "}
            <b>보류가 자동 해제</b>됩니다. 합의 기한(
            <b className="tabular-nums">{md(adjustment.agreeDueAt)}</b>)까지
            합의가 없으면 <b>원래 금액</b>으로 확정됩니다 — 이 화면에서 해제하지
            않습니다.
          </Hint>
        </>
      );
      // 이슈 스레드 화면이 아직 없다 — 자리만 두고 막는다
      buttons = (
        <Btn
          variant="secondary"
          className="w-full flex-1"
          disabled
          title="이슈 스레드 화면 준비 중"
        >
          이슈 스레드 열기 ↗ · 준비 중
        </Btn>
      );
      break;
    }
    case "SCHEDULED": {
      const hasPending = detail.evidence.some(isPendingEvidence);
      const checkPending =
        findEvidence(detail, "INFLUENCER_INVOICE")?.state === "CHECK_PENDING";
      const issuePending =
        findEvidence(detail, "BRAND_INVOICE")?.state === "ISSUE_PENDING";
      if (hasPending) {
        notice = <HoldConditions detail={detail} />;
      } else {
        notice = (
          <Hint className="mt-0">
            확인 기간에 조정 요청이 없어 <b>자동 확정</b>됐습니다. 지급은
            예정일에 <b>PG가 자동 분배</b>합니다.
          </Hint>
        );
      }
      buttons =
        checkPending || issuePending ? (
          <>
            {checkPending && (
              <Btn
                variant="primary"
                className="w-full flex-1"
                onClick={actions.onCheckInvoice}
              >
                승인번호 대조
              </Btn>
            )}
            {issuePending && (
              <Btn
                variant="secondary"
                className="w-full flex-1"
                onClick={actions.onRegisterInvoice}
              >
                브랜드 세금계산서 등록
              </Btn>
            )}
          </>
        ) : (
          download()
        );
      break;
    }
    case "PAID":
      notice = (
        <Hint className="mt-0">
          {detail.influencerBusiness ? (
            <>
              사업자 건은 <b>원천징수영수증이 없습니다</b> — 증빙은 인플루언서가{" "}
              <b>플랫폼 앞으로</b> 발행한 세금계산서와 플랫폼이 브랜드에게
              발행한 세금계산서입니다.
            </>
          ) : (
            <>
              지급이 끝난 회차는 <b>금액을 수정할 수 없습니다</b>.
              오지급·과지급이 확인되면 <b>별건 조정</b>으로 처리합니다.
            </>
          )}
        </Hint>
      );
      buttons = download();
      break;
    case "FAILED": {
      const failure = detail.failure;
      notice = failure && (
        <>
          <WaitBox danger>
            <b>
              {failure.shareLabel} 몫 {won(failure.amount)}원 미전달
            </b>{" "}
            — PG 반환 사유 <b>{failure.reason}</b> · {ymd(failure.returnedAt)} ·{" "}
            <b>{failure.elapsedDays}일 경과</b>
            <br />
            {failure.shareLabel === "인플루언서"
              ? "브랜드·플랫폼"
              : "나머지"}{" "}
            몫은 <b>정상 지급</b>됐습니다.
          </WaitBox>
          <Hint className="mt-0">
            재분배는 <b>확정 금액을 그대로</b> 다시 보냅니다 — 금액 재계산이
            아닙니다.
            {failure.redistributionRequestedAt && (
              <>
                {" "}
                <b className="tabular-nums">
                  {ymdhm(failure.redistributionRequestedAt)}
                </b>{" "}
                재지시 — PG 처리 중입니다(즉시 입금되지 않습니다).
              </>
            )}
          </Hint>
        </>
      );
      buttons = (
        <>
          <Btn
            variant="primary"
            className="w-full flex-1"
            disabled={Boolean(failure?.redistributionRequestedAt)}
            onClick={actions.onRedistribute}
          >
            재분배
          </Btn>
          <Btn
            variant="secondary"
            className="w-full flex-1"
            isLoading={actions.accountCheckPending}
            onClick={actions.onAccountCheck}
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
          <StlBadge tone={STATUS_TONE[detail.status]}>
            {STATUS_LABEL[detail.status]}
          </StlBadge>
        </div>
        <div className="pt-2">
          {rows.map((row) => (
            <MRow key={row.label} label={row.label} value={row.value} />
          ))}
        </div>
        {notice && <div className="mt-2">{notice}</div>}
        <div className="mt-2 border-t border-sz-n-100 pt-2">
          <div className="mt-4 flex gap-2">{buttons}</div>
        </div>
      </div>
    </StlCard>
  );
}

export function HistoryCard(props: { detail: Detail }) {
  const items = [...props.detail.history]
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((entry) => ({
      label: entry.label,
      meta: [ymdhm(entry.at), entry.actor, entry.note]
        .filter(Boolean)
        .join(" · "),
      tone: entry.tone,
    }));
  return (
    <StlCard title="처리 이력" note="최신순">
      <HistoryTimeline items={items} />
    </StlCard>
  );
}
