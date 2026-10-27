import {
  MemberCard,
  MetaRow,
  StatusLine,
  WaitBox,
} from "@/features/memberShared/components/parts";
import {
  BTN_DANGER_OUTLINE,
  BTN_PRIMARY,
  ST_HINT_CLASS,
} from "@/features/memberShared/constants/styles";
import type { SanctionTerm } from "@/features/memberShared/types";
import { eventDateTime, wallDate } from "@/features/memberShared/utils/format";
import type { ReactNode } from "react";

/** 레일 버튼 줄(`.st-acts`) — 버튼이 칸을 나눠 갖는다 */
export function RailActions(props: { children: ReactNode }) {
  return (
    <div className="mt-4 flex gap-2 [&>button]:flex-1">{props.children}</div>
  );
}

/** `.act-in` — 현재 상태 카드 안 구분선 아래(정지 블록 · 정지 버튼) */
export function ActionArea(props: { children: ReactNode }) {
  return (
    <div className="mt-2 border-t border-sz-n-100 pt-2">{props.children}</div>
  );
}

/** `.st-hint` */
export function RailHint(props: { children: ReactNode }) {
  return <p className={ST_HINT_CLASS}>{props.children}</p>;
}

interface SanctionTermRowsProps {
  term: SanctionTerm | null;
}

/**
 * 기-02 【잠정】 정지 기간 · 자동 해제 · 이의 신청 기한 — 「목록 정지 행의 상세에서 종료일을 본다」(시안 14 rev.7).
 * 날짜는 모두 KST 벽시계라 보정하지 않는다. 기간 없이 정지된 옛 건은 종료일 줄이 없다.
 */
export function SanctionTermRows(props: SanctionTermRowsProps) {
  const { term } = props;
  if (!term) return null;

  return (
    <>
      {term.endsOn && (
        <MetaRow label="정지 기간">
          ~ {wallDate(term.endsOn)}
          {term.periodDays !== null && ` (${term.periodDays}일)`}
        </MetaRow>
      )}
      {term.autoReleaseAt && (
        <MetaRow label="자동 해제">
          {wallDate(term.autoReleaseAt)} 00:00
        </MetaRow>
      )}
      {term.appealDeadlineAt && (
        <MetaRow label="이의 신청 기한">
          {wallDate(term.appealDeadlineAt)}까지
        </MetaRow>
      )}
      <MetaRow label="소명 검토">
        접수 후{" "}
        {term.appealReviewBusinessDays === null
          ? "N영업일"
          : `${term.appealReviewBusinessDays}영업일`}
      </MetaRow>
    </>
  );
}

interface WithdrawalReviewCardProps {
  requestedAt: string;
  elapsedDays: number;
  /** 「탈퇴 사유 — …」 */
  reasonText: string | null;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
}

/**
 * 탈퇴 신청 심사 — 신청은 회원 상태가 아니라 처리해야 할 건이다(승인 전까지 실제로 활성).
 * 신청이 있을 때만 그린다. 조건 체크리스트는 두지 않고 승인 모달에서 한 번 더 보여 준다.
 */
export function WithdrawalReviewCard(props: WithdrawalReviewCardProps) {
  const {
    requestedAt,
    elapsedDays,
    reasonText,
    disabled,
    onApprove,
    onReject,
  } = props;

  return (
    <MemberCard title="탈퇴 신청 심사" note="회원 상태와 별개 · 승인 시 해지">
      <StatusLine label="심사" tone="WARNING" text="탈퇴 승인 대기" />
      <div className="pt-2">
        <MetaRow label="신청일">{eventDateTime(requestedAt)}</MetaRow>
        <MetaRow label="경과">{elapsedDays}일</MetaRow>
      </div>
      {reasonText && (
        <WaitBox>
          <b className="font-semibold">탈퇴 사유</b> — {reasonText}
        </WaitBox>
      )}
      <RailActions>
        <button
          type="button"
          className={BTN_PRIMARY}
          disabled={disabled}
          onClick={onApprove}
        >
          승인
        </button>
        <button
          type="button"
          className={BTN_DANGER_OUTLINE}
          disabled={disabled}
          onClick={onReject}
        >
          반려
        </button>
      </RailActions>
    </MemberCard>
  );
}

/** 레일 「진행 중」 칩 — 경고 톤만 경고 배경, 나머지는 중립 */
export function PendingChip(props: {
  label: string;
  count: number;
  warning: boolean;
  onClick: () => void;
}) {
  const { label, count, warning, onClick } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        warning
          ? "inline-flex items-center gap-1 rounded-[6px] bg-sz-warning-bg px-2 py-[3px] text-[11px] text-sz-warning-text hover:underline"
          : "inline-flex items-center gap-1 rounded-[6px] bg-sz-n-100 px-2 py-[3px] text-[11px] text-sz-n-700 hover:underline"
      }
    >
      {label} <b className="tabular-nums">{count}</b> ↗
    </button>
  );
}
