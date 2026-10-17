import OperatorRefundForm from "@/features/claim/components/detail/OperatorRefundForm";
import {
  ClaimBadge,
  Emphasis,
  RailCard,
  RailLink,
  RailText,
} from "@/features/claim/components/shared/ClaimParts";
import { operatorGuide } from "@/features/claim/constants/guides";
import type { ClaimActionKind } from "@/features/claim/hooks/useAdminClaimMutations";
import type { ClaimDetail } from "@/features/claim/types";
import { dDay, md, mdHm, stageBadge, won } from "@/features/claim/utils/format";

interface ClaimRailProps {
  detail: ClaimDetail;
  isPending: boolean;
  onAction: (kind: ClaimActionKind, detail: string) => void;
  onOpenOrder: () => void;
  onOpenInquiry: (inquiryId: number) => void;
}

interface StatusRow {
  label: string;
  value: string;
  emphasis?: boolean;
}

/** 「현재 상태」 카드 줄 — 단계마다 운영자가 확인할 값만(시안 B1~B4) */
function statusRows(detail: ClaimDetail): Array<StatusRow> {
  const { claim } = detail;
  const row = claim.summary;
  const rows: Array<StatusRow> = [];

  if (row.stage === "COLLECT_WAIT") {
    rows.push({
      label: "회수 송장",
      value: row.collection?.trackingNumber ? "입력 완료" : "소비자 입력 대기",
    });
  }
  if (row.inspectDueAt && row.stage === "INSPECTION") {
    rows.push({
      label: "검수 기한",
      value:
        md(row.inspectDueAt) +
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
  if (row.reshipFee && row.stage === "REJECT_HOLD") {
    rows.push({
      label: "재발송비",
      value: `${won(row.reshipFee.amount)} · ${row.reshipFee.statusLabel}${
        row.reshipFee.status === "PENDING" && row.reshipFee.dueAt
          ? ` · ${dDay(row.reshipFee.dueAt)}`
          : ""
      }`,
    });
  }
  if (detail.dispute) {
    rows.push({
      label: "소비자 이의",
      value: detail.dispute.answered
        ? `답변 완료 · ${md(detail.dispute.answeredAt)}`
        : `접수 · ${md(detail.dispute.createdAt)}`,
      emphasis: !detail.dispute.answered,
    });
  }
  if (claim.refund) {
    rows.push({
      label: row.outcome ? "환불액" : "통과 시 PG 자동 환불",
      value: won(claim.refund.requestExpectedAmount),
      emphasis: true,
    });
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
 * 상세 우측 레일 — 현재 상태 + 운영자 조치.
 * 조치 폼은 서버 판단값으로만 연다 — `canAcceptDispute`(B2 반려 이의 인용) · `canRefundUnanswered`(검수 무응답 환불).
 * 둘 다 아니면 「조치할 것이 없습니다」와 그 이유를 적는다.
 */
export default function ClaimRail(props: ClaimRailProps) {
  const { detail, isPending, onAction, onOpenOrder, onOpenInquiry } = props;
  const row = detail.claim.summary;
  const badge = stageBadge(row);
  const rows = statusRows(detail);
  const dispute = detail.dispute;

  const links = (
    <>
      <RailLink onClick={onOpenOrder}>주문 상세 열기 (주문 조회) ↗</RailLink>
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
            {rows.map((item) => (
              <div
                key={item.label}
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
            amountNote={
              <>
                인용하면 귀책이 <b>브랜드</b>로 바뀌어 차감 없이 환불합니다 —
                차감했던 재발송비는 환원합니다.
              </>
            }
            warning={
              <>
                인용하면 반려가 <b>환불로 종결</b>됩니다 — 재발송비 결제 요청은
                소멸하고, 이미 결제됐으면 <b>자동 취소</b>됩니다. 상품은
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
