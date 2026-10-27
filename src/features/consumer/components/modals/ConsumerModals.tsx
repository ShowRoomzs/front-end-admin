import { ModalShell } from "@/common/components/ModalShell/ModalShell";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/common/constants";
import { formatDateTimeShort } from "@/common/utils/formatDate";
import {
  PENDING_TARGET_PATHS,
  PROVISIONAL,
  SUSPEND_DETAIL_MAX_LENGTH,
} from "@/features/consumer/constants/detail";
import {
  BTN_DANGER,
  BTN_PRIMARY,
  BTN_SECONDARY,
  FLINK_CLASS,
  INPUT_CLASS,
  MHINT_CLASS,
  MLABEL_CLASS,
  MODAL_SELECT_CLASS,
  MODAL_TEXTAREA_CLASS,
  MWARN_DANGER_CLASS,
  MWARN_INFO_CLASS,
} from "@/features/consumer/constants/styles";
import { useConsumerReasonOptions } from "@/features/consumer/hooks/useConsumerDetail";
import type {
  ConsumerDetail,
  ConsumerMemo,
  ConsumerSuspendRequest,
  UserPrivacyAccessReason,
  UserReleaseReason,
  UserSuspensionReason,
} from "@/features/consumer/types/consumerDetail";
import { formatKstDate } from "@/features/consumer/utils/detailView";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

function Label(props: {
  children: ReactNode;
  required?: boolean;
  optional?: string;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={props.htmlFor} className={MLABEL_CLASS}>
      {props.children}
      {props.required && <span className="ml-0.5 text-sz-danger-text">*</span>}
      {props.optional && (
        <span className="ml-1 font-normal text-sz-n-400">{props.optional}</span>
      )}
    </label>
  );
}

function Warn(props: { tone: "danger" | "info"; children: ReactNode }) {
  return (
    <div
      className={
        props.tone === "danger" ? MWARN_DANGER_CLASS : MWARN_INFO_CLASS
      }
    >
      <span>{props.tone === "danger" ? "!" : "i"}</span>
      <span>{props.children}</span>
    </div>
  );
}

/** 모달 본문 기본 글씨(시안 `.modal-b`) */
const BODY_CLASS =
  "max-h-[70vh] overflow-y-auto p-5 text-[12px] leading-[1.7] text-sz-n-700";

// ── M1 계정 이용 정지 ────────────────────────────────────────────

interface SuspendModalProps {
  isOpen: boolean;
  /** 모달을 연 날(KST · yyyy-MM-dd) — 정지 시작일은 오늘 고정 */
  today: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (body: ConsumerSuspendRequest) => void;
}

/**
 * M1 — 계정 이용 정지(기-01 · 02 【잠정】). 버튼이 이미 목적지를 말하므로 「변경할 상태」 셀렉트가 없다.
 * 사유 필수 · 기타면 상세 필수 · 정지 기간(종료일) 필수 — 종료일 다음 날 00:00 자동 해제.
 * 이의 신청 기한 · 소명 검토 일수는 서버 미리보기(`reason-options.suspensionTerm`)를 그대로 쓴다.
 */
export function SuspendModal(props: SuspendModalProps) {
  const { isOpen, today, isSubmitting, onClose, onSubmit } = props;
  const { data: options, isLoading } = useConsumerReasonOptions(isOpen);
  const [reason, setReason] = useState<UserSuspensionReason | "">("");
  const [detail, setDetail] = useState("");
  const [endsOn, setEndsOn] = useState("");

  const selected = options?.suspensionReasons.find(
    (option) => option.code === reason
  );
  const detailRequired = selected?.detailRequired ?? false;
  const term = options?.suspensionTerm;
  const canSubmit =
    reason !== "" &&
    endsOn !== "" &&
    endsOn >= today &&
    (!detailRequired || detail.trim() !== "") &&
    !isSubmitting;

  const handleClose = () => {
    setReason("");
    setDetail("");
    setEndsOn("");
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      title={PROVISIONAL.suspendTitle}
      width={520}
      onClose={handleClose}
      bodyClassName={BODY_CLASS}
      footer={
        <>
          <button type="button" className={BTN_SECONDARY} onClick={handleClose}>
            취소
          </button>
          <button
            type="button"
            className={BTN_DANGER}
            disabled={!canSubmit}
            onClick={() =>
              reason &&
              onSubmit({
                reason,
                reasonDetail: detail.trim() || null,
                endsOn,
              })
            }
          >
            {PROVISIONAL.suspendTitle}
          </button>
        </>
      }
    >
      <Label required htmlFor="consumer-suspend-reason">
        정지 사유
      </Label>
      <select
        id="consumer-suspend-reason"
        className={MODAL_SELECT_CLASS}
        style={MODAL_SELECT_CHEVRON_STYLE}
        value={reason}
        disabled={isLoading}
        onChange={(event) =>
          setReason(event.target.value as UserSuspensionReason | "")
        }
      >
        <option value="">
          {isLoading ? "불러오는 중…" : "정지 사유 선택"}
        </option>
        {options?.suspensionReasons.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>

      <Label
        required={detailRequired}
        optional={detailRequired ? undefined : "선택"}
        htmlFor="consumer-suspend-detail"
      >
        상세 사유
      </Label>
      <textarea
        id="consumer-suspend-detail"
        className={MODAL_TEXTAREA_CLASS}
        maxLength={SUSPEND_DETAIL_MAX_LENGTH}
        value={detail}
        onChange={(event) => setDetail(event.target.value)}
      />
      <p className={MHINT_CLASS}>
        “기타(직접 입력)”를 선택한 경우에만 상세 사유가 필수입니다.
      </p>

      <Label required htmlFor="consumer-suspend-ends-on">
        정지 기간
      </Label>
      <div className="flex items-center gap-2">
        <input
          className={`${INPUT_CLASS} w-[130px] tabular-nums`}
          value={formatKstDate(today)}
          aria-label="정지 시작일"
          disabled
          readOnly
        />
        <span className="text-[11px] text-sz-n-500">~</span>
        <input
          id="consumer-suspend-ends-on"
          type="date"
          className={`${INPUT_CLASS} w-[150px] tabular-nums`}
          min={today}
          value={endsOn}
          onChange={(event) => setEndsOn(event.target.value)}
        />
        <span className="text-[11px] text-sz-n-500">
          {PROVISIONAL.autoReleaseHint}{" "}
          <b className="font-semibold">{PROVISIONAL.autoReleaseStrong}</b>
        </span>
      </div>

      <div className="mt-2.5 rounded-[6px] border border-sz-n-200 px-3 py-[9px] text-[12px] leading-[1.8]">
        <div className="flex gap-2">
          <span className="w-[84px] shrink-0 text-sz-n-600">
            이의 신청 기한
          </span>
          <span>
            {term ? (
              <>
                통지 후{" "}
                <b className="font-semibold">
                  {term.appealBusinessDays}영업일 이상
                </b>{" "}
                ·{" "}
                <span className="tabular-nums">
                  {formatKstDate(term.appealDeadlineAt)}
                </span>
                까지
              </>
            ) : (
              "—"
            )}
          </span>
        </div>
        <div className="flex gap-2">
          <span className="w-[84px] shrink-0 text-sz-n-600">소명 검토</span>
          <span>
            접수 후{" "}
            {term?.appealReviewBusinessDays != null ? (
              <b className="font-semibold">
                {term.appealReviewBusinessDays}영업일
              </b>
            ) : (
              <>
                <b className="font-semibold">N영업일</b>{" "}
                <span className="text-sz-n-400">
                  {PROVISIONAL.policyPending}
                </span>
              </>
            )}
          </span>
        </div>
      </div>

      <Warn tone="danger">
        {PROVISIONAL.suspendWarning.lead}
        <b className="font-semibold">{PROVISIONAL.suspendWarning.blocked}</b>
        {PROVISIONAL.suspendWarning.mid}
        <b className="font-semibold">{PROVISIONAL.suspendWarning.allowed}</b>
        {PROVISIONAL.suspendWarning.mid2}
        <b className="font-semibold">{PROVISIONAL.suspendWarning.appeal}</b>
        {PROVISIONAL.suspendWarning.tail}
        <b className="font-semibold">{PROVISIONAL.suspendWarning.withdrawal}</b>
        {PROVISIONAL.suspendWarning.end}
      </Warn>
    </ModalShell>
  );
}

// ── M2 마스킹 해제 사유 ──────────────────────────────────────────

interface UnmaskModalProps {
  isOpen: boolean;
  /** 마스킹된 이름(홍*동) — 모달 첫 줄 */
  maskedName: string | null;
  /** 10분 자동 만료 뒤에만 직전 사유를 프리필한다(A3) — 그 밖에는 null */
  prefill: UserPrivacyAccessReason | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (reason: UserPrivacyAccessReason) => void;
}

/**
 * M2 — 마스킹 해제 사유. 정형 사유 4종 선택 단독(기타 · 상세 없음 — 사유 축은 통계로 집계).
 * 실행 버튼은 위험이 아니라 인디고다(파괴가 아니라 기록되는 조회).
 */
export function UnmaskModal(props: UnmaskModalProps) {
  const { isOpen } = props;
  if (!isOpen) return null;
  // 열릴 때마다 새로 그려 프리필이 매번 다시 적용되게 한다
  return <UnmaskModalBody {...props} />;
}

function UnmaskModalBody(props: UnmaskModalProps) {
  const { maskedName, prefill, isSubmitting, onClose, onSubmit } = props;
  const { data: options, isLoading } = useConsumerReasonOptions(true);
  const [reason, setReason] = useState<UserPrivacyAccessReason | "">(
    prefill ?? ""
  );

  return (
    <ModalShell
      isOpen
      title="마스킹 해제"
      width={520}
      onClose={onClose}
      bodyClassName={BODY_CLASS}
      footer={
        <>
          <button type="button" className={BTN_SECONDARY} onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className={BTN_PRIMARY}
            disabled={reason === "" || isSubmitting}
            onClick={() => reason && onSubmit(reason)}
          >
            해제
          </button>
        </>
      }
    >
      <b className="font-semibold">{maskedName ?? "—"}</b> 소비자의{" "}
      <b className="font-semibold">이름 · 생년월일 · 휴대폰</b>을 해제합니다.
      <Label required htmlFor="consumer-unmask-reason">
        해제 사유
      </Label>
      <select
        id="consumer-unmask-reason"
        className={MODAL_SELECT_CLASS}
        style={MODAL_SELECT_CHEVRON_STYLE}
        value={reason}
        disabled={isLoading}
        onChange={(event) =>
          setReason(event.target.value as UserPrivacyAccessReason | "")
        }
      >
        <option value="">
          {isLoading ? "불러오는 중…" : "해제 사유 선택"}
        </option>
        {options?.privacyUnmaskReasons.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      <Warn tone="info">
        해제 범위는{" "}
        <b className="font-semibold">이 소비자 1건 · 이 세션 한정</b>
        입니다 — 다른 소비자로 이동하면 다시 마스킹됩니다. 열람 사실은 사유와
        함께 <b className="font-semibold">처리 이력에 즉시 기록</b>되며{" "}
        <b className="font-semibold">CI/DI는 해제 대상이 아닙니다</b>.
      </Warn>
    </ModalShell>
  );
}

// ── M3 메모 삭제 확인 ────────────────────────────────────────────

/**
 * M3 — 메모 삭제 확인. 대상 본문을 그대로 보여 다른 항목을 지우는 사고를 막는다. 사유는 받지 않는다
 * (삭제 사실이 이력에 남는다).
 */
export function MemoDeleteModal(props: {
  memo: ConsumerMemo | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (memo: ConsumerMemo) => void;
}) {
  const { memo, isSubmitting, onClose, onConfirm } = props;

  return (
    <ModalShell
      isOpen={memo !== null}
      title="메모 삭제"
      width={400}
      onClose={onClose}
      bodyClassName={BODY_CLASS}
      footer={
        <>
          <button type="button" className={BTN_SECONDARY} onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className={BTN_DANGER}
            disabled={isSubmitting}
            onClick={() => memo && onConfirm(memo)}
          >
            삭제
          </button>
        </>
      }
    >
      {memo && (
        <>
          <span className="tabular-nums">
            {formatDateTimeShort(memo.createdAt)}
          </span>
          에 기입한 메모를 삭제합니다.
          <div className="mt-2.5 whitespace-pre-wrap rounded-[6px] bg-sz-n-50 px-[11px] py-[9px] text-[12px] leading-[1.7] text-sz-n-700">
            {memo.content}
          </div>
          <p className={`${MHINT_CLASS} mt-3`}>
            삭제하면 목록에서 사라지고{" "}
            <b className="font-semibold">복구할 수 없습니다</b>. 삭제한 사실은
            처리 이력에 남습니다.
          </p>
        </>
      )}
    </ModalShell>
  );
}

// ── M4 정지 해제 ────────────────────────────────────────────────

interface ReleaseModalProps {
  isOpen: boolean;
  detail: ConsumerDetail;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (reason: UserReleaseReason) => void;
}

/**
 * M4 — 정지 해제. 되돌리는 조치라 정보 톤 · 인디고 버튼이고 상세 사유란이 없다(해제 사유 3종).
 * 원 정지 사유 · 처리자 · 일시와 소명 문의 번호를 다시 보여 준다 — 소명은 1:1 문의로만 받으므로
 * 해제 판단의 근거가 그 문의에 있다.
 */
export function ReleaseModal(props: ReleaseModalProps) {
  const { isOpen, detail, isSubmitting, onClose, onSubmit } = props;
  const navigate = useNavigate();
  const { data: options, isLoading } = useConsumerReasonOptions(isOpen);
  const [reason, setReason] = useState<UserReleaseReason | "">("");
  const sanction = detail.statusCard.sanction;
  const appeal = sanction?.appealInquiries[0] ?? null;

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      title="정지 해제"
      width={520}
      onClose={handleClose}
      bodyClassName={BODY_CLASS}
      footer={
        <>
          <button type="button" className={BTN_SECONDARY} onClick={handleClose}>
            취소
          </button>
          <button
            type="button"
            className={BTN_PRIMARY}
            disabled={reason === "" || isSubmitting}
            onClick={() => reason && onSubmit(reason)}
          >
            해제
          </button>
        </>
      }
    >
      <b className="font-semibold">{detail.nickname}</b> 계정을{" "}
      <b className="font-semibold">활성</b>으로 되돌립니다.
      {sanction && (
        <div className="mt-2.5 rounded-[6px] bg-sz-n-50 px-3 py-2.5 text-[11px] leading-[1.8] text-sz-n-700">
          현재 정지 ·{" "}
          <b className="font-semibold">{sanction.reasonLabel ?? "—"}</b>
          <br />
          {sanction.suspendedByName ?? "—"} ·{" "}
          <span className="tabular-nums">
            {formatDateTimeShort(sanction.suspendedAt)}
          </span>
          <br />
          {appeal ? (
            <>
              소명 문의{" "}
              <button
                type="button"
                className={`${FLINK_CLASS} tabular-nums`}
                onClick={() =>
                  navigate(
                    `${PENDING_TARGET_PATHS.INQUIRIES}/${appeal.inquiryId}`
                  )
                }
              >
                {appeal.inquiryNumber}
              </button>{" "}
              · {appeal.answered ? "답변완료" : "답변 대기"}
            </>
          ) : (
            "소명 문의 없음"
          )}
        </div>
      )}
      <Label required htmlFor="consumer-release-reason">
        해제 사유
      </Label>
      <select
        id="consumer-release-reason"
        className={MODAL_SELECT_CLASS}
        style={MODAL_SELECT_CHEVRON_STYLE}
        value={reason}
        disabled={isLoading}
        onChange={(event) =>
          setReason(event.target.value as UserReleaseReason | "")
        }
      >
        <option value="">
          {isLoading ? "불러오는 중…" : "해제 사유 선택"}
        </option>
        {options?.releaseReasons.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      <Warn tone="info">
        해제하면 소비자는{" "}
        <b className="font-semibold">로그인·주문이 즉시 다시 가능</b>해지고 해제
        사실이 알림으로 발송됩니다.{" "}
        <b className="font-semibold">정지 이력과 사유는 그대로 보존</b>되며,
        해제 사유·처리자·일시가 이력에 추가됩니다.
      </Warn>
    </ModalShell>
  );
}
