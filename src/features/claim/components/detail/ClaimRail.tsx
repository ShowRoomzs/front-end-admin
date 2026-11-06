import { usePolicyValues } from "@/common/hooks/usePolicyValues";
import type { PolicyValues } from "@/common/services/policyValuesService";
import OperatorRefundForm from "@/features/claim/components/detail/OperatorRefundForm";
import {
  ClaimBadge,
  Emphasis,
  RailCard,
  RailLink,
  RailText,
} from "@/features/claim/components/shared/ClaimParts";
import {
  AUTO_RECEIVE_TEXT,
  operatorGuide,
} from "@/features/claim/constants/guides";
import { THREAD_PATH } from "@/features/claim/constants/params";
import type { ClaimActionKind } from "@/features/claim/hooks/useAdminClaimMutations";
import type { ClaimDetail } from "@/features/claim/types";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  dDay,
  md,
  mdDate,
  mdDue,
  mdHm,
  stageBadge,
  won,
} from "@/features/claim/utils/format";

interface ClaimRailProps {
  detail: ClaimDetail;
  isPending: boolean;
  onAction: (kind: ClaimActionKind, detail: string) => void;
  onOpenOrder: () => void;
  onOpenInquiry: (inquiryId: number) => void;
}

interface StatusRow {
  label: string;
  value: ReactNode;
  emphasis?: boolean;
}

/** 검수 판정 전 — 귀책이 바뀌면 운임 정산이 붙는다(기-93) */
const BEFORE_JUDGE = new Set(["COLLECT_WAIT", "COLLECTING", "INSPECTION"]);

/** 운영자 사유 환불로 종결한 이력 — 이 둘이 아니면 클레임 환불은 PG 자동이다 */
const OPERATOR_REFUND_EVENTS = new Set([
  "DISPUTE_ACCEPTED",
  "INSPECTION_UNANSWERED",
]);

/**
 * 「현재 상태」 카드 줄 — 단계마다 운영자가 확인할 값만, 시안 B1~B4 순서로.
 * B4 출처 · 귀책 · 운임 정산 · 기한 / B1 검수 기한 · 자동 알림 · 자동 입고 · 통과 시 /
 * B2 재발송비 · 이의 · 운임 정산 / B3 종결 · 환불 출처. 회수 송장은 ③ 블록이 보여 레일에 두지 않는다.
 */
function statusRows(
  detail: ClaimDetail,
  policy: PolicyValues | undefined
): Array<StatusRow> {
  const { claim } = detail;
  const row = claim.summary;
  const rows: Array<StatusRow> = [];

  // 운영자 개설(B4) — 다른 클레임과 구분되는 값
  if (row.openedByOperator && row.outcome === null) {
    rows.push({ label: "출처", value: "운영자 개설" });
  }
  // 귀책(B4) — 브랜드 귀책 건은 「착불 · 차감 없음」, 판정 전이면 뒤집힐 때의 운임 정산을 미리 적는다
  if (detail.feeBearer === "SELLER" && row.outcome === null) {
    rows.push({ label: "귀책", value: "브랜드 · 착불 · 차감 없음" });
    if (BEFORE_JUDGE.has(row.stage)) {
      rows.push({
        label: "운임 정산",
        value: "소비자 귀책으로 바뀌면 착불 운임 청구",
      });
    }
  }
  // 운영자 개설(B4) — 법정 청약철회 적용 기한
  if (detail.legalDeadline) {
    rows.push({
      label: "기한",
      value: mdDate(detail.legalDeadline.appliedDeadline),
    });
  }
  if (row.inspectDueAt && row.stage === "INSPECTION") {
    rows.push({
      label: "검수 기한",
      value:
        mdDue(row.inspectDueAt) +
        (detail.inspectOverdueBusinessDays !== null
          ? ` · ${detail.inspectOverdueBusinessDays}영업일 초과`
          : ""),
      emphasis: row.overdue,
    });
  }
  if (detail.inspectNotice.count > 0) {
    rows.push({
      label: "자동 알림",
      value: `${detail.inspectNotice.count}회${
        detail.inspectNotice.lastAt
          ? ` · ${mdHm(detail.inspectNotice.lastAt)}`
          : ""
      }`,
    });
  }
  // 【잠정】 기-17 자동 입고(B1) — 입고·검수 단계에서 규칙을 적고, 시스템이 입고했으면 그렇게 적는다
  if (row.stage === "INSPECTION") {
    rows.push({
      label: "자동 입고",
      value: claim.inspection?.autoReceived
        ? AUTO_RECEIVE_TEXT.done(policy)
        : AUTO_RECEIVE_TEXT.rule(policy),
    });
  }
  // B2 「재발송비 결제 대기 · D-12」 — 금액은 ③ 반려 보류 블록에 있다
  if (row.reshipFee && row.stage === "REJECT_HOLD") {
    rows.push({
      label: "재발송비",
      value: `${row.reshipFee.statusLabel}${
        row.reshipFee.status === "PENDING" && row.reshipFee.dueAt
          ? ` · ${dDay(row.reshipFee.dueAt)}`
          : ""
      }`,
    });
  }
  if (detail.dispute) {
    rows.push({
      label: "이의",
      value: detail.dispute.answered
        ? `답변 완료 · ${md(detail.dispute.answeredAt)}`
        : `1건 · ${md(detail.dispute.createdAt)}`,
      emphasis: !detail.dispute.answered,
    });
  }
  // B2 「운임 정산 · 인용 시 + N 소비자 환급」 — 서버 인용 전 예정액(`disputePreview.total` · 58 계획 5-13).
  // 0원(이미 브랜드 귀책)이면 붙는 운임이 없어 줄을 두지 않는다
  if (detail.canAcceptDispute && detail.disputePreview?.total) {
    rows.push({
      label: "운임 정산",
      value: `인용 시 + ${won(detail.disputePreview.total)} 소비자 환급`,
    });
  }
  // 판정 뒤 — 운임 정산 행(브랜드 정산 「± 운임 정산」) 합
  const freight = claim.inspection?.freight ?? [];
  if (freight.length > 0) {
    const sum = freight.reduce((total, item) => total + item.signedAmount, 0);
    rows.push({
      label: "운임 정산",
      value: `브랜드 정산 ${sum >= 0 ? "+" : "−"} ${won(Math.abs(sum))}`,
    });
  }
  // B3 「종결 09.08」
  if (row.outcome?.finalized && row.completedAt) {
    rows.push({ label: "종결", value: md(row.completedAt) });
  }
  if (claim.refund) {
    const amount = claim.refund.requestExpectedAmount;
    if (!row.outcome) {
      // B1 「통과 시 · PG 자동 환불 13,000원」 — 전체 반려로 보류 중이면 나갈 금액이 없어 줄을 두지 않는다
      if (!(row.stage === "REJECT_HOLD" && amount === 0)) {
        rows.push({
          label: "통과 시",
          value: `PG 자동 환불 ${won(amount)}`,
          emphasis: true,
        });
      }
    } else {
      rows.push({ label: "환불액", value: won(amount), emphasis: true });
      // B3 「환불 출처 · PG 자동」 — 이의 인용 · 검수 무응답으로 닫은 건만 운영자 사유 환불이다
      if (amount > 0) {
        const byOperator = claim.history.some((item) =>
          OPERATOR_REFUND_EVENTS.has(item.eventType)
        );
        rows.push({
          label: "환불 출처",
          value: byOperator ? "운영자 사유 환불" : "PG 자동",
        });
      }
    }
  }
  if (claim.purchaseConfirm) {
    rows.push({
      label: "구매확정",
      value: claim.purchaseConfirm.paused
        ? `타이머 정지${
            claim.purchaseConfirm.remainingDays !== null
              ? ` · 남은 ${claim.purchaseConfirm.remainingDays}일`
              : ""
          }`
        : claim.purchaseConfirm.dueAt
          ? `${md(claim.purchaseConfirm.dueAt)} 예정`
          : "진행 중",
    });
  }
  return rows;
}

/**
 * B2 인용 안내(06b rev.7 기-93) — 선불(소비자 귀책)로 신청한 반품을 인용하면 귀책이 브랜드로 바뀌어
 * 최초 배송비 차감이 취소되고 선불 반품 운임(기본 배송비 편도 정액)을 돌려준다. 원래 결제액을 넘는 부분은
 * 06c 운영자 계좌 송금이다. 착불(브랜드 귀책)로 신청한 건은 운임 정산이 없다.
 */
function DisputeFreightNote(props: { detail: ClaimDetail }) {
  const { detail } = props;
  if (detail.feeBearer !== "CONSUMER") {
    return <>인용하면 차감 없이 환불합니다 — 차감했던 재발송비는 환원합니다.</>;
  }
  const preview = detail.disputePreview;
  return (
    <>
      인용하면 귀책이 <b>브랜드</b>로 바뀌어 최초 배송비 차감이 취소되고,
      소비자가 낸 <b>선불 반품 운임</b>을 돌려줍니다(아래 운임 정산).
      <span className="mt-1.5 block rounded-[4px] border border-sz-n-200 bg-white px-2 py-1.5 text-sz-n-700">
        <b className="block text-sz-n-900">운임 정산 · 소비자 → 브랜드 귀책</b>
        최초 배송비 차감 취소 — 무료배송 주문이면 상품 금액 전액 환불
        {preview && preview.initialFeeRestored > 0 && (
          <>
            {" "}
            · 차감했던{" "}
            <b className="tabular-nums">
              {won(preview.initialFeeRestored)}
            </b>{" "}
            환원
          </>
        )}
        <br />
        선불 반품 운임{" "}
        {preview && preview.prepaidFreightRefund > 0 ? (
          <b className="tabular-nums">{won(preview.prepaidFreightRefund)}</b>
        ) : null}{" "}
        환급(기본 배송비 편도 정액) — 원래 결제액 초과분은 운영자 계좌 송금 ·
        브랜드 부담 · 다음 정산 「− 운임 정산」
      </span>
    </>
  );
}

/**
 * 상세 우측 레일 — 현재 상태 + 운영자 조치.
 * 조치 폼은 서버 판단값으로만 연다 — `canAcceptDispute`(B2 반려 이의 인용) · `canRefundUnanswered`(검수 무응답 환불).
 * 둘 다 아니면 「조치할 것이 없습니다」와 그 이유를 적는다.
 */
export default function ClaimRail(props: ClaimRailProps) {
  const { detail, isPending, onAction, onOpenOrder, onOpenInquiry } = props;
  const row = detail.claim.summary;
  const badge = stageBadge(row);
  const { data: policy } = usePolicyValues();
  const rows = statusRows(detail, policy);
  const dispute = detail.dispute;
  const navigate = useNavigate();

  const links = (
    <>
      <RailLink onClick={onOpenOrder}>주문 상세 열기 (주문 조회) ↗</RailLink>
      <RailLink onClick={() => navigate(THREAD_PATH)}>
        연결·소통 스레드 열기 ↗
      </RailLink>
      {dispute && (
        <RailLink onClick={() => onOpenInquiry(dispute.inquiryId)}>
          이의 문의 열기 (1:1 문의 #{dispute.inquiryId}) ↗
        </RailLink>
      )}
    </>
  );

  return (
    <>
      <RailCard title="현재 상태">
        <div className="mb-2 flex items-center justify-between gap-2.5 border-b border-sz-n-100 pb-3">
          <span className="shrink-0 text-[12px] text-sz-n-500">단계</span>
          <ClaimBadge tone={badge.tone}>{badge.label}</ClaimBadge>
        </div>
        {rows.length > 0 && (
          <div className="pt-2">
            {rows.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="flex justify-between gap-2.5 border-b border-sz-n-100 py-[7px] text-[12px] last:border-b-0"
              >
                <span className="text-sz-n-500">{item.label}</span>
                <span className="text-right font-medium text-sz-n-900">
                  {item.emphasis ? <b>{item.value}</b> : item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </RailCard>

      {detail.canAcceptDispute ? (
        <RailCard title="운영자 사유 환불">
          {/* 건이 바뀌면 입력값을 비운다 — 이전·다음으로 넘어가도 남은 근거가 딴 건에 붙으면 안 된다 */}
          <OperatorRefundForm
            key={`dispute-${row.claimId}`}
            reasonLabel="반려 이의 인용"
            amount={detail.disputeRefundAmount ?? 0}
            amountNote={<DisputeFreightNote detail={detail} />}
            warning={
              <>
                인용하면 반려가 <b>반품 승인과 같아집니다</b> — 재발송비 결제
                요청이 취소되고(이미 결제됐으면 <b>자동 취소</b>) 상품은
                브랜드에 남습니다. 환불은 <b>환불 관리</b>에서 재확인 후
                실행되고, 편입은 <b>철회할 수 없습니다</b>.
              </>
            }
            isPending={isPending}
            onSubmit={(text) => onAction("DISPUTE", text)}
          />
          <RailText>
            받아들이지 않으면 버튼 없이 <b>이의 문의에 답변합니다</b> — 반려는
            그대로 유지됩니다.
          </RailText>
          {links}
        </RailCard>
      ) : detail.canRefundUnanswered ? (
        <RailCard title="검수 무응답 환불">
          <OperatorRefundForm
            key={`unanswered-${row.claimId}`}
            reasonLabel="검수 무응답"
            amount={detail.unansweredRefundAmount ?? 0}
            amountNote="단가 × 수량 — 차감 없음"
            warning={
              <>
                브랜드가 검수를 하지 않아 <b>운영자가 환불</b>합니다 — 클레임은
                환불로 종결되고 상품은 브랜드에 남습니다. 귀책은 바뀌지
                않습니다. 환불은 <b>환불 관리</b>에서 재확인 후 실행되고, 편입은{" "}
                <b>철회할 수 없습니다</b>.
              </>
            }
            isPending={isPending}
            onSubmit={(text) => onAction("UNANSWERED", text)}
          />
          <RailText>
            검수 기한 경과 자동 알림 <b>{detail.inspectNotice.count}회</b>에도
            브랜드가 응답하지 않았습니다.
          </RailText>
          {links}
        </RailCard>
      ) : (
        <RailCard title="운영자 조치">
          <RailText flushTop>
            <Emphasis text={operatorGuide(detail)} />
          </RailText>
          {links}
        </RailCard>
      )}
    </>
  );
}
