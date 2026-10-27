import { ModalShell } from "@/common/components/ModalShell/ModalShell";
import {
  FieldLabel,
  ModalWarn,
  ReasonSelect,
  ReasonTextarea,
} from "@/features/memberShared/components/modals/ModalParts";
import { REASON_DETAIL_MAX_LENGTH } from "@/features/memberShared/constants/params";
import {
  BTN_DANGER,
  BTN_DANGER_OUTLINE,
  BTN_PRIMARY,
  BTN_SECONDARY,
} from "@/features/memberShared/constants/styles";
import type {
  AdminReasonOption,
  MemberReleasePayload,
  MemberWithdrawalRejectPayload,
} from "@/features/memberShared/types";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

interface WithdrawalApproveModalProps {
  onClose: () => void;
  /** 「<b>무드코스메틱</b>의 탈퇴를 승인합니다.」 */
  intro: ReactNode;
  /** 회색 요약 박스 — 신청 · 경과 · 조건 건수(0이 아니면 경고색) · (인플루언서) 탈퇴 사유 */
  summary: ReactNode;
  warning: ReactNode;
  /** 브랜드는 꽉 찬 위험색, 인플루언서는 인디고(시안 15 · 18 M2) */
  confirmVariant: "danger" | "primary";
  isPending: boolean;
  onConfirm: () => void;
}

/**
 * M2 탈퇴 승인 — 조건 검증 결과를 실행 직전에 한 번 더 보여 주고, 되돌릴 수 없음을 적는다.
 * 사유 입력은 받지 않는다(승인은 조건 충족의 확인이다). 서버가 승인 직전에 조건을 다시 판정한다.
 */
export function WithdrawalApproveModal(props: WithdrawalApproveModalProps) {
  const {
    onClose,
    intro,
    summary,
    warning,
    confirmVariant,
    isPending,
    onConfirm,
  } = props;

  return (
    <ModalShell
      isOpen
      title="탈퇴 승인"
      width={520}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={BTN_SECONDARY} onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className={confirmVariant === "danger" ? BTN_DANGER : BTN_PRIMARY}
            disabled={isPending}
            onClick={onConfirm}
          >
            승인
          </button>
        </>
      }
    >
      <div className="text-[12px] leading-[1.7] text-sz-n-700">
        {intro}
        <div className="mt-2.5 rounded-[6px] bg-sz-n-50 px-3 py-2.5 text-[11px] leading-[1.8] text-sz-n-700">
          {summary}
        </div>
        <ModalWarn>{warning}</ModalWarn>
      </div>
    </ModalShell>
  );
}

interface WithdrawalRejectModalProps {
  onClose: () => void;
  intro: ReactNode;
  reasons: Array<AdminReasonOption>;
  /** 「브랜드에 전달할 안내」 · 「인플루언서에게 전달할 안내」 */
  noteLabel: string;
  info: ReactNode;
  /** 브랜드는 인디고(되돌리는 조치), 인플루언서는 흰 배경 + 위험색 글자(시안 15 · 18 M3) */
  confirmVariant: "primary" | "dangerOutline";
  isPending: boolean;
  onSubmit: (payload: MemberWithdrawalRejectPayload) => void;
}

/**
 * M3 탈퇴 반려(기-04 【잠정】) — 사유 필수 · 선택지가 탈퇴 조건과 같은 축이라 무엇이 걸렸는지 회원이 바로 안다.
 * 기타면 안내가 필수다. 반려하면 계정은 활성으로 돌아가고 재신청할 수 있다.
 */
export function WithdrawalRejectModal(props: WithdrawalRejectModalProps) {
  const {
    onClose,
    intro,
    reasons,
    noteLabel,
    info,
    confirmVariant,
    isPending,
    onSubmit,
  } = props;
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const selected = useMemo(
    () => reasons.find((option) => option.code === reason),
    [reasons, reason]
  );
  const noteMissing = !!selected?.detailRequired && !note.trim();
  const canSubmit = !!selected && !noteMissing && !isPending;

  return (
    <ModalShell
      isOpen
      title="탈퇴 반려"
      width={520}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={BTN_SECONDARY} onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className={
              confirmVariant === "primary" ? BTN_PRIMARY : BTN_DANGER_OUTLINE
            }
            disabled={!canSubmit}
            onClick={() =>
              selected &&
              onSubmit({
                reason: selected.code,
                note: note.trim() || undefined,
              })
            }
          >
            반려
          </button>
        </>
      }
    >
      <div className="text-[12px] leading-[1.7] text-sz-n-700">
        {intro}
        <FieldLabel required>반려 사유</FieldLabel>
        <ReasonSelect
          ariaLabel="반려 사유"
          reasons={reasons}
          value={reason}
          onChange={setReason}
          placeholder="사유 선택"
        />
        <FieldLabel
          required={!!selected?.detailRequired}
          optional={!selected?.detailRequired}
        >
          {noteLabel}
        </FieldLabel>
        <ReasonTextarea
          ariaLabel={noteLabel}
          value={note}
          onChange={setNote}
          maxLength={REASON_DETAIL_MAX_LENGTH}
        />
        <ModalWarn tone="info">{info}</ModalWarn>
      </div>
    </ModalShell>
  );
}

interface ReleaseModalProps {
  onClose: () => void;
  /** 대상 이름(브랜드명 · 쇼룸명) */
  name: string;
  reasons: Array<AdminReasonOption>;
  isPending: boolean;
  onSubmit: (payload: MemberReleasePayload) => void;
}

/**
 * 정지 해제 확인 — 시안에는 해제 모달이 없다(레일 [정지 해제] 단독). 즉시 모든 기능이 다시 열리는 조치라
 * 한 번 확인을 받고, 서버가 받는 선택 항목(해제 사유 · 메모)을 함께 남긴다. 사유를 비우면 서버가 「소명 · 시정 확인」으로 본다.
 */
export function ReleaseModal(props: ReleaseModalProps) {
  const { onClose, name, reasons, isPending, onSubmit } = props;
  const [reason, setReason] = useState(reasons[0]?.code ?? "");
  const [note, setNote] = useState("");

  return (
    <ModalShell
      isOpen
      title="정지 해제"
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
            disabled={isPending}
            onClick={() =>
              onSubmit({
                reason: reason || undefined,
                note: note.trim() || undefined,
              })
            }
          >
            정지 해제
          </button>
        </>
      }
    >
      <div className="text-[12px] leading-[1.7] text-sz-n-700">
        <b>{name}</b>의 계정 이용 정지를 해제합니다.
        <FieldLabel>해제 사유</FieldLabel>
        <ReasonSelect
          ariaLabel="해제 사유"
          reasons={reasons}
          value={reason}
          onChange={setReason}
        />
        <FieldLabel optional>메모</FieldLabel>
        <ReasonTextarea
          ariaLabel="해제 메모"
          value={note}
          onChange={setNote}
          maxLength={REASON_DETAIL_MAX_LENGTH}
        />
        <ModalWarn tone="info">
          해제하면 막혀 있던 기능이 <b>즉시 다시 열리고</b> 운영팀 소통 스레드에
          「정지 해제」 카드가 올라갑니다. 정지 이력과 사유는 그대로 보존됩니다.
        </ModalWarn>
      </div>
    </ModalShell>
  );
}
