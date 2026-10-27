import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import {
  BRAND_PAYOUT_HELD_HINT,
  BRAND_WITHDRAWN_HINT,
} from "@/features/brandMember/constants/copy";
import type {
  AdminBrandDetail,
  AdminBrandPendingChip,
} from "@/features/brandMember/types";
import {
  ActionArea,
  PendingChip,
  RailActions,
  RailHint,
  SanctionTermRows,
  WithdrawalReviewCard,
} from "@/features/memberShared/components/detail/RailBlocks";
import {
  MemberCard,
  MetaRow,
  StatusLine,
  WaitBox,
} from "@/features/memberShared/components/parts";
import {
  BTN_DANGER_OUTLINE,
  BTN_PRIMARY,
  FLINK_CLASS,
} from "@/features/memberShared/constants/styles";
import { eventDate, eventDateTime } from "@/features/memberShared/utils/format";

interface BrandStatusCardProps {
  detail: AdminBrandDetail;
  onSuspend: () => void;
  onRelease: () => void;
  onOpenThread: (threadId: number) => void;
}

/**
 * 현재 상태 — 상태와 그 상태를 바꾸는 버튼을 한 카드에 둔다(계정 상태 관리 카드를 없앴다 · 시안 15 rev.7).
 * 정지 버튼은 흰 배경 + 위험색 글자, 해제는 복구라 인디고. 탈퇴 계정은 버튼 자체가 없다.
 */
export function BrandStatusCard(props: BrandStatusCardProps) {
  const { detail, onSuspend, onRelease, onOpenThread } = props;
  const status = detail.rail.currentStatus;
  const { sanction, withdrawal, actions } = status;
  const withdrawn = status.memberStatus === "WITHDRAWN";

  return (
    <MemberCard title="현재 상태">
      <StatusLine label="회원" tone={status.tone} text={status.label} />
      {withdrawn ? (
        <>
          <div className="pt-2">
            <MetaRow label="탈퇴 확정">
              {eventDateTime(withdrawal?.approvedAt)}
            </MetaRow>
            <MetaRow label="승인자">
              {withdrawal?.approvedByName ?? "—"}
            </MetaRow>
            <MetaRow label="신청일">
              {eventDateTime(withdrawal?.requestedAt)}
            </MetaRow>
            <MetaRow label="가입일">{eventDate(status.joinedAt)}</MetaRow>
          </div>
          {(withdrawal?.message || withdrawal?.reasonLabel) && (
            <WaitBox>
              <b className="font-semibold">탈퇴 사유</b> —{" "}
              {withdrawal.message ?? withdrawal.reasonLabel}
            </WaitBox>
          )}
          <RailHint>{BRAND_WITHDRAWN_HINT}</RailHint>
        </>
      ) : (
        <>
          <div className="pt-2">
            <MetaRow label="가입일">{eventDate(status.joinedAt)}</MetaRow>
            <MetaRow label="입점 승인">{eventDate(status.approvedAt)}</MetaRow>
            <MetaRow label="최근 접속">
              {eventDateTime(status.lastLoginAt)}
            </MetaRow>
          </div>
          <ActionArea>
            {sanction && (
              <>
                <MetaRow label="정지 사유">{sanction.reasonLabel}</MetaRow>
                <MetaRow label="처리자">
                  {sanction.suspendedByName ?? "—"}
                </MetaRow>
                <MetaRow label="정지 일시">
                  {eventDateTime(sanction.suspendedAt)}
                </MetaRow>
                <SanctionTermRows term={sanction.term} />
                <MetaRow label="브랜드 몫 지급">
                  <StatusBadge
                    variant={sanction.payoutHeld ? "warning" : "neutral"}
                    hideDot
                  >
                    {sanction.payoutHeld ? "지급 정지" : "지급 유지"}
                  </StatusBadge>
                </MetaRow>
                {(sanction.reasonDetail || sanction.payoutHeld) && (
                  <RailHint>
                    {sanction.reasonDetail}{" "}
                    {sanction.payoutHeld && (
                      <>
                        {BRAND_PAYOUT_HELD_HINT}
                        <span className="ml-1 rounded-[10px] bg-sz-neutral-bg px-[9px] py-0.5 text-[10px] font-medium text-sz-neutral-text">
                          근거 대기-PG 계약
                        </span>
                      </>
                    )}
                  </RailHint>
                )}
                {sanction.threadId !== null && (
                  <RailHint>
                    소명은 <b>운영팀 소통 스레드</b>로 받습니다.{" "}
                    <button
                      type="button"
                      className={FLINK_CLASS}
                      onClick={() =>
                        sanction.threadId !== null &&
                        onOpenThread(sanction.threadId)
                      }
                    >
                      스레드 열기 ↗
                    </button>
                  </RailHint>
                )}
              </>
            )}
            {actions.canRelease && (
              <RailActions>
                <button
                  type="button"
                  className={BTN_PRIMARY}
                  onClick={onRelease}
                >
                  정지 해제
                </button>
              </RailActions>
            )}
            {actions.canSuspend && (
              <RailActions>
                <button
                  type="button"
                  className={BTN_DANGER_OUTLINE}
                  onClick={onSuspend}
                >
                  계정 이용 정지
                </button>
              </RailActions>
            )}
          </ActionArea>
        </>
      )}
    </MemberCard>
  );
}

/**
 * 진행 중 — 「이 브랜드 밀린 거 있어?」에 한 자리에서 답한다(1건 이상인 칩만 · 각각 해당 화면으로).
 * 탈퇴 심사 중이고 칩이 없으면 카드를 그리지 않는다(탈퇴 조건상 늘 0건이고 심사 카드가 같은 사실을 말한다).
 */
export function BrandPendingCard(props: {
  chips: Array<AdminBrandPendingChip>;
  onOpen: (chip: AdminBrandPendingChip) => void;
}) {
  const { chips, onOpen } = props;

  return (
    <MemberCard title="진행 중" note="응대 전 확인" flush>
      <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5">
        {chips.length === 0 ? (
          <span className="text-[11px] text-sz-n-500">진행 중인 건 없음</span>
        ) : (
          <>
            {chips.map((chip) => (
              <PendingChip
                key={chip.key}
                label={chip.label}
                count={chip.count}
                warning={chip.tone === "WARNING"}
                onClick={() => onOpen(chip)}
              />
            ))}
            <span className="text-[11px] text-sz-n-500">그 외 0건</span>
          </>
        )}
      </div>
    </MemberCard>
  );
}

export function BrandWithdrawalReviewCard(props: {
  detail: AdminBrandDetail;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { detail, onApprove, onReject } = props;
  const review = detail.rail.withdrawalReview;
  if (!review) return null;

  return (
    <WithdrawalReviewCard
      requestedAt={review.requestedAt}
      elapsedDays={review.elapsedDays}
      reasonText={review.message ?? review.reasonLabel}
      disabled={!detail.rail.currentStatus.actions.canReviewWithdrawal}
      onApprove={onApprove}
      onReject={onReject}
    />
  );
}
