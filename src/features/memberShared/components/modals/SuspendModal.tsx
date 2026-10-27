import { ModalShell } from "@/common/components/ModalShell/ModalShell";
import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import {
  FieldLabel,
  ModalHint,
  ModalWarn,
  ReasonSelect,
  ReasonTextarea,
} from "@/features/memberShared/components/modals/ModalParts";
import { REASON_DETAIL_MAX_LENGTH } from "@/features/memberShared/constants/params";
import {
  BTN_DANGER,
  BTN_SECONDARY,
  INPUT_CLASS,
} from "@/features/memberShared/constants/styles";
import type {
  AdminReasonOption,
  MemberSuspendPayload,
  SuspensionTermPreview,
} from "@/features/memberShared/types";
import {
  inputDateLabel,
  todayKst,
  wallDate,
} from "@/features/memberShared/utils/format";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

interface SuspendModalProps {
  onClose: () => void;
  reasons: Array<AdminReasonOption>;
  /** 사유 목록 API의 `suspensionTerm` — 이의 신청 기한 · 소명 검토 미리보기 */
  term: SuspensionTermPreview | undefined;
  /**
   * 「브랜드 몫 지급」 줄 — 사유를 고르면 서버 `holdsPayout`으로 자동으로 정해진다(운영자 스위치 아님).
   * 인플루언서 M1에는 이 줄이 없다(시안 18).
   */
  payoutLabel?: string;
  /** 차단 · 허용 범위 · 지급 · 소명 경로 · 기-03 안내(회원 유형별 문구) */
  warning: ReactNode;
  isPending: boolean;
  onSubmit: (payload: MemberSuspendPayload) => void;
}

/**
 * M1 계정 이용 정지(기-01 · 기-02 【잠정】).
 * 정지 사유 필수(선택 전 버튼 비활성) · 상세 사유는 기타일 때만 필수 · 정지 기간 종료일 필수 —
 * 시작일은 오늘로 고정이고(미래 시작은 받지 않는다) 종료일 다음 날 00:00에 서버가 자동 해제한다.
 * 최종 실행 버튼만 꽉 찬 위험색이다.
 */
export function SuspendModal(props: SuspendModalProps) {
  const { onClose, reasons, term, payoutLabel, warning, isPending, onSubmit } =
    props;
  const [today] = useState(todayKst);
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [endsOn, setEndsOn] = useState("");

  const selected = useMemo(
    () => reasons.find((option) => option.code === reason),
    [reasons, reason]
  );
  const detailMissing = !!selected?.detailRequired && !detail.trim();
  const endsOnInvalid = !endsOn || endsOn < today;
  const canSubmit =
    !!selected && !detailMissing && !endsOnInvalid && !isPending;

  const submit = () => {
    if (!selected || !canSubmit) return;
    onSubmit({
      reason: selected.code,
      reasonDetail: detail.trim() || undefined,
      endsOn,
    });
  };

  return (
    <ModalShell
      isOpen
      title="계정 이용 정지"
      width={520}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={BTN_SECONDARY} onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className={BTN_DANGER}
            disabled={!canSubmit}
            onClick={submit}
          >
            계정 이용 정지
          </button>
        </>
      }
    >
      <div className="text-[12px] leading-[1.7] text-sz-n-700">
        <FieldLabel first required>
          정지 사유
        </FieldLabel>
        <ReasonSelect
          ariaLabel="정지 사유"
          reasons={reasons}
          value={reason}
          onChange={setReason}
          placeholder="사유 선택"
        />

        <FieldLabel
          required={!!selected?.detailRequired}
          optional={!selected?.detailRequired}
        >
          상세 사유
        </FieldLabel>
        <ReasonTextarea
          ariaLabel="상세 사유"
          value={detail}
          onChange={setDetail}
          maxLength={REASON_DETAIL_MAX_LENGTH}
          invalid={detailMissing && detail.length > 0}
        />
        <ModalHint>
          “기타(직접 입력)”를 선택한 경우에만 상세 사유가 필수입니다.
        </ModalHint>

        <FieldLabel required>정지 기간</FieldLabel>
        <div className="flex items-center gap-2">
          <input
            className={`${INPUT_CLASS} w-[118px] tabular-nums`}
            value={inputDateLabel(today)}
            disabled
            aria-label="정지 시작일"
          />
          <span className="text-[11px] text-sz-n-500">~</span>
          <input
            type="date"
            className={`${INPUT_CLASS} w-[136px] tabular-nums`}
            min={today}
            value={endsOn}
            onChange={(event) => setEndsOn(event.target.value)}
            aria-label="정지 종료일"
          />
          <span className="text-[11px] text-sz-n-500">
            종료일 다음 날 00:00 <b>자동 해제</b>
          </span>
        </div>

        <div className="mt-2.5 rounded-[6px] border border-sz-n-200 px-3 py-[9px] text-[12px] leading-[1.8]">
          <div className="flex gap-2">
            <span className="w-[84px] shrink-0 text-sz-n-600">
              이의 신청 기한
            </span>
            <span>
              통지 후 <b>{term?.appealBusinessDays ?? "N"}영업일 이상</b>
              {term && (
                <>
                  {" · "}
                  <span className="tabular-nums">
                    {wallDate(term.appealDeadlineAt)}
                  </span>
                  까지
                </>
              )}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="w-[84px] shrink-0 text-sz-n-600">소명 검토</span>
            <span>
              접수 후{" "}
              {typeof term?.appealReviewBusinessDays === "number" ? (
                <b>{term.appealReviewBusinessDays}영업일</b>
              ) : (
                <>
                  <b>N영업일</b>{" "}
                  <span className="text-sz-n-400">[정책값 미정]</span>
                </>
              )}
            </span>
          </div>
        </div>

        {payoutLabel && selected && (
          <div className="mt-3 flex items-center gap-2 rounded-[6px] border border-sz-n-200 px-3 py-[9px] text-[12px]">
            <span className="w-[84px] shrink-0 text-sz-n-600">
              {payoutLabel}
            </span>
            {selected.holdsPayout ? (
              <>
                <StatusBadge variant="warning" hideDot>
                  지급 정지
                </StatusBadge>
                <span className="text-[11px] text-sz-n-500">
                  이 사유는 계좌·사업자 확인이 필요해 자동 정지됩니다
                </span>
                <span className="ml-1 rounded-[10px] bg-sz-neutral-bg px-[9px] py-0.5 text-[10px] font-medium text-sz-neutral-text">
                  근거 대기-PG 계약
                </span>
              </>
            ) : (
              <>
                <StatusBadge variant="neutral" hideDot>
                  지급 유지
                </StatusBadge>
                <span className="text-[11px] text-sz-n-500">
                  이 사유는 지급을 멈추지 않습니다
                </span>
              </>
            )}
          </div>
        )}

        <ModalWarn>{warning}</ModalWarn>
      </div>
    </ModalShell>
  );
}
