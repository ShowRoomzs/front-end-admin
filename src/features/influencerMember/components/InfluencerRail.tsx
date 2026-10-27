import { ModalShell } from "@/common/components/ModalShell/ModalShell";
import { INFLUENCER_UNMASK_INFO } from "@/features/influencerMember/constants/copy";
import type {
  AdminCreatorDetail,
  CreatorPrivacyAccessReason,
} from "@/features/influencerMember/types";
import {
  ActionArea,
  RailActions,
  RailHint,
  SanctionTermRows,
} from "@/features/memberShared/components/detail/RailBlocks";
import {
  FieldLabel,
  ModalWarn,
  ReasonSelect,
} from "@/features/memberShared/components/modals/ModalParts";
import {
  MemberCard,
  MetaRow,
  StatusLine,
} from "@/features/memberShared/components/parts";
import {
  BTN_DANGER_OUTLINE,
  BTN_PRIMARY,
  BTN_SECONDARY,
  FLINK_CLASS,
  T_SUB_CLASS,
} from "@/features/memberShared/constants/styles";
import type { AdminReasonOption } from "@/features/memberShared/types";
import {
  eventDate,
  eventDateTime,
  wallMonthDay,
} from "@/features/memberShared/utils/format";
import { useState } from "react";

/** 서버 한 줄 설명 「유지 · 사유가 정산 정보와 무관」 — 앞말만 값으로, 나머지는 보조 글씨(시안 C1) */
function PayoutNote(props: { note: string }) {
  const [head, ...rest] = props.note.split(" · ");
  return (
    <>
      {head}
      {rest.length > 0 && (
        <span className={`${T_SUB_CLASS} font-normal`}>
          {" "}
          · {rest.join(" · ")}
        </span>
      )}
    </>
  );
}

interface InfluencerStatusCardProps {
  detail: AdminCreatorDetail;
  onSuspend: () => void;
  onRelease: () => void;
  onOpenThread: (threadId: number) => void;
}

/**
 * 현재 상태 — 상태 · 정지 블록 · 조치 버튼을 한 카드에(시안 18 rev.2). 탈퇴 계정은 버튼이 없다.
 * 「이슈 스레드」 줄은 열린 정산 조정 협의(합의 기한 · 스레드)다.
 */
export function InfluencerStatusCard(props: InfluencerStatusCardProps) {
  const { detail, onSuspend, onRelease, onOpenThread } = props;
  const { rail } = detail;
  const status = rail.currentStatus;
  const suspension = status.suspension;
  const adjustments = rail.openAdjustments;
  const firstAdjustment = adjustments[0];
  const threadId = rail.operatorChannelThreadId;
  // 레일 버튼 판정 — 서버 상태로 가른다(정지면 해제, 활성이면 정지, 탈퇴면 없음)
  const canSuspend = status.status === "ACTIVE";
  const canRelease = status.status === "SUSPENDED";

  if (status.status === "WITHDRAWN") {
    return (
      <MemberCard title="현재 상태">
        <StatusLine label="회원" tone={status.tone} text={status.label} />
        <div className="pt-2">
          <MetaRow label="탈퇴일">
            {eventDateTime(status.withdrawal?.withdrawnAt)}
          </MetaRow>
          <MetaRow label="가입일">{eventDate(status.joinedAt)}</MetaRow>
          <MetaRow label="처리자">
            {status.withdrawal?.operatorName ?? "—"}
          </MetaRow>
        </div>
      </MemberCard>
    );
  }

  return (
    <MemberCard title="현재 상태">
      <StatusLine label="회원" tone={status.tone} text={status.label} />
      <div className="pt-2">
        <MetaRow label="가입일">{eventDate(status.joinedAt)}</MetaRow>
        <MetaRow label="입점 승인">
          {eventDate(status.onboardingApprovedAt)}
        </MetaRow>
        <MetaRow label="최근 접속">{eventDateTime(status.lastLoginAt)}</MetaRow>
        {firstAdjustment && (
          <MetaRow label="이슈 스레드">
            조정 협의 {adjustments.length}건
            {firstAdjustment.deadlineAt && (
              <>
                {" "}
                · 기한{" "}
                <span className="tabular-nums">
                  {wallMonthDay(firstAdjustment.deadlineAt)}
                </span>
              </>
            )}{" "}
            {firstAdjustment.threadId !== null && (
              <button
                type="button"
                className={FLINK_CLASS}
                onClick={() =>
                  firstAdjustment.threadId !== null &&
                  onOpenThread(firstAdjustment.threadId)
                }
              >
                ↗
              </button>
            )}
          </MetaRow>
        )}
      </div>
      <ActionArea>
        {suspension && (
          <>
            <MetaRow label="정지 사유">{suspension.reasonLabel}</MetaRow>
            <MetaRow label="처리자">{suspension.operatorName ?? "—"}</MetaRow>
            <MetaRow label="정지 일시">
              {eventDateTime(suspension.suspendedAt)}
            </MetaRow>
            <SanctionTermRows term={suspension.term} />
            <MetaRow label="리워드 지급">
              <PayoutNote
                note={
                  suspension.payoutNote ??
                  (suspension.payoutHeld ? "지급 정지" : "유지")
                }
              />
            </MetaRow>
            <RailHint>
              {suspension.reasonDetail && <>{suspension.reasonDetail} </>}
              소명은 <b>운영팀 소통 스레드</b>로 접수됩니다.{" "}
              {threadId !== null && (
                <button
                  type="button"
                  className={FLINK_CLASS}
                  onClick={() => onOpenThread(threadId)}
                >
                  스레드 열기 ↗
                </button>
              )}
            </RailHint>
          </>
        )}
        {canRelease && (
          <RailActions>
            <button type="button" className={BTN_PRIMARY} onClick={onRelease}>
              정지 해제
            </button>
          </RailActions>
        )}
        {canSuspend && (
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
    </MemberCard>
  );
}

interface UnmaskModalProps {
  /** 마스킹된 이름(「김*연」) */
  maskedName: string;
  reasons: Array<AdminReasonOption>;
  /** 직전 해제 사유 — 프리필 */
  lastReason: CreatorPrivacyAccessReason | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (reason: CreatorPrivacyAccessReason) => void;
}

/**
 * M4 마스킹 해제 사유 — 정형 사유 4종 필수 · 상세 사유 · 기타 없음(사유 축은 통계로 집계된다).
 * 해제는 이 인플루언서 1건 · 이 운영자 · 10분 고정 만료이고 열람 사실은 처리 이력에 즉시 남는다.
 */
export function UnmaskModal(props: UnmaskModalProps) {
  const { maskedName, reasons, lastReason, isPending, onClose, onSubmit } =
    props;
  const [reason, setReason] = useState<string>(lastReason ?? "");

  return (
    <ModalShell
      isOpen
      title="마스킹 해제"
      width={520}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={BTN_SECONDARY} onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className={BTN_PRIMARY}
            disabled={!reason || isPending}
            onClick={() => onSubmit(reason as CreatorPrivacyAccessReason)}
          >
            해제
          </button>
        </>
      }
    >
      <div className="text-[12px] leading-[1.7] text-sz-n-700">
        <b>{maskedName}</b> 인플루언서의 <b>이름 · 생년월일 · 휴대폰</b>을
        해제합니다.
        <FieldLabel required>해제 사유</FieldLabel>
        <ReasonSelect
          ariaLabel="해제 사유"
          reasons={reasons}
          value={reason}
          onChange={setReason}
          placeholder="사유 선택"
        />
        <ModalWarn tone="info">{INFLUENCER_UNMASK_INFO}</ModalWarn>
      </div>
    </ModalShell>
  );
}
