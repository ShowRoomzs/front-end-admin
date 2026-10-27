import {
  ModalFieldError,
  ModalLabel,
  ModalShell,
} from "@/common/components/ModalShell/ModalShell";
import Btn from "@/features/contract/components/shared/Btn";
import { WarnBox } from "@/features/post/components/shared/PostParts";
import { MODAL_SELECT_CHEVRON_STYLE } from "@/features/post/constants/params";
import {
  useGetPolicyClauses,
  useGetSuspensionReasons,
} from "@/features/post/hooks/useAdminPost";
import type {
  AdminPostPolicy,
  PostPolicyClause,
  PostSuspensionReason,
  SuspendPostBody,
} from "@/features/post/types";
import { policyValue } from "@/features/post/utils/view";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

/*
  모달은 열릴 때만 마운트한다(상세 페이지가 조건부로 그린다) — 닫았다 열면 지난 입력이 남지 않는다.
*/

/** 시안 `.msel` · `.mta` — 32px · 13px · 포커스 링 */
const SELECT_CLASS =
  "h-8 w-full cursor-pointer appearance-none rounded-[6px] border border-sz-n-300 bg-white py-0 pl-2.5 pr-8 text-[13px] text-sz-n-900 outline-none focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";
const TEXTAREA_CLASS =
  "w-full resize-y rounded-[6px] border border-sz-n-300 bg-white px-2.5 pb-1.5 pt-[7px] text-[13px] leading-[1.6] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";
/** 시안 `.mhint` */
const HINT_CLASS = "mt-1.5 text-[11px] text-sz-n-500";
const BODY_CLASS = "text-[12px] leading-[1.7] text-sz-n-700";

/** 시안 `.mlabel` 사이 간격 — 첫 라벨은 0, 이후 16px */
function Field(props: { children: ReactNode; first?: boolean }) {
  return <div className={props.first ? "" : "mt-4"}>{props.children}</div>;
}

// ------------------------------------------------------------------ C4 노출 중지

interface SuspendModalProps {
  /** 신고를 받아 내릴 때 가장 많은 신고 사유를 그대로 잇는다(신고 → 중지가 같은 코드 축) */
  initialReason?: PostSuspensionReason | null;
  policy: AdminPostPolicy | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (body: SuspendPostBody) => void;
}

/**
 * C4 — 사유 · 근거 규정 2개가 필수(선택 전 버튼 비활성). 근거 규정은 이의 신청 · 반려 심사의 판단 기준이다.
 * 설명은 선택이고, 기타처럼 `detailRequired` 사유면 필수다(서버 400).
 */
export function SuspendModal(props: SuspendModalProps) {
  const { initialReason, policy, isPending, onClose, onSubmit } = props;
  const { data: reasons = [] } = useGetSuspensionReasons();
  const { data: clauses = [] } = useGetPolicyClauses();
  const [reason, setReason] = useState<PostSuspensionReason | "">(
    initialReason ?? ""
  );
  // null = 운영자가 아직 고르지 않음 → 사유의 추천 조항(suggestedFor)을 기본 선택으로 보인다.
  // 서버는 사유 ↔ 조항 조합을 검증하지 않으니 운영자가 바꿔도 된다.
  const [clause, setClause] = useState<PostPolicyClause | null>(null);
  const [detail, setDetail] = useState("");

  const suggested =
    clauses.find((item) => reason && item.suggestedFor?.includes(reason))
      ?.code ?? "";
  const effectiveClause = clause ?? suggested;

  const reasonItem = reasons.find((item) => item.code === reason);
  const detailRequired = Boolean(reasonItem?.detailRequired);
  const detailMissing = detailRequired && detail.trim().length === 0;
  const canSubmit = Boolean(reason && effectiveClause) && !detailMissing;

  const submit = () => {
    if (!reason || !effectiveClause || detailMissing) return;
    const text = detail.trim();
    onSubmit({
      reasonCode: reason,
      policyClause: effectiveClause,
      ...(text ? { reasonDetail: text } : {}),
    });
  };

  return (
    <ModalShell
      isOpen
      title="게시물 노출 중지"
      width={520}
      onClose={onClose}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            취소
          </Btn>
          <Btn
            variant="dangerSolid"
            disabled={!canSubmit}
            isLoading={isPending}
            onClick={submit}
          >
            노출 중지
          </Btn>
        </>
      }
    >
      <Field first>
        <ModalLabel required>사유</ModalLabel>
        <select
          aria-label="사유"
          className={SELECT_CLASS}
          style={MODAL_SELECT_CHEVRON_STYLE}
          value={reason}
          onChange={(event) => {
            setReason(event.target.value as PostSuspensionReason);
            setClause(null);
          }}
        >
          <option value="" disabled>
            사유 선택
          </option>
          {reasons.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
              {item.operatorOnly ? " (운영자 전용)" : ""}
              {item.detailRequired ? "(직접 입력)" : ""}
            </option>
          ))}
        </select>
      </Field>
      <Field>
        <ModalLabel required>근거 규정</ModalLabel>
        <select
          aria-label="근거 규정"
          className={SELECT_CLASS}
          style={MODAL_SELECT_CHEVRON_STYLE}
          value={effectiveClause}
          onChange={(event) =>
            setClause(event.target.value as PostPolicyClause)
          }
        >
          <option value="" disabled>
            근거 규정 선택
          </option>
          {clauses.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </select>
      </Field>
      <Field>
        {detailRequired ? (
          <ModalLabel required>작성자에게 전달할 설명</ModalLabel>
        ) : (
          <ModalLabel optionalText="선택">작성자에게 전달할 설명</ModalLabel>
        )}
        <textarea
          aria-label="작성자에게 전달할 설명"
          className={cn(TEXTAREA_CLASS, "min-h-16")}
          maxLength={500}
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
        />
        {detailMissing && (
          <ModalFieldError>
            기타 사유는 설명을 함께 적어야 합니다.
          </ModalFieldError>
        )}
      </Field>
      <WarnBox className="mt-4">
        중지하면 앱 쇼룸에서 <b>즉시 사라지고</b> 작성자에게 사유·근거
        규정·기한이 <b>알림으로 발송</b>됩니다. 작성자는{" "}
        <b className="tabular-nums">
          {policyValue(policy?.appealDeadlineDays)}일
        </b>{" "}
        안에 <b>이의 신청 1회</b>를 할 수 있고, 기한 내 신청하지 않으면{" "}
        <b>영구 삭제</b>됩니다. 중지 기간에는 작성자도 사진·본문을 수정할 수
        없습니다.
      </WarnBox>
    </ModalShell>
  );
}

// ------------------------------------------------------------------ C7 이의 신청 반려

interface RejectAppealModalProps {
  postTitle: string;
  policy: AdminPostPolicy | null;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
}

/** C7 — 반려는 영구 삭제와 같은 행위라 별도 확인을 받는다. 반려 사유 필수 · 작성자에게 그대로 전달 */
export function RejectAppealModal(props: RejectAppealModalProps) {
  const { postTitle, policy, isPending, onClose, onSubmit } = props;
  const [comment, setComment] = useState("");
  const text = comment.trim();

  return (
    <ModalShell
      isOpen
      title="이의 신청 반려"
      width={520}
      onClose={onClose}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            취소
          </Btn>
          <Btn
            variant="dangerSolid"
            disabled={!text}
            isLoading={isPending}
            onClick={() => text && onSubmit(text)}
          >
            반려
          </Btn>
        </>
      }
    >
      <div className={BODY_CLASS}>
        <b className="font-semibold text-sz-n-900">{postTitle}</b> 게시물의 이의
        신청을 반려합니다.
      </div>
      <Field>
        <ModalLabel required>반려 사유</ModalLabel>
        <textarea
          aria-label="반려 사유"
          className={cn(TEXTAREA_CLASS, "min-h-20")}
          maxLength={500}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
        <p className={HINT_CLASS}>
          반려 사유는 작성자에게 그대로 전달되며 알림 이력에 영구 보존됩니다.
        </p>
      </Field>
      <WarnBox className="mt-4">
        반려하면 게시물은{" "}
        <b>유예 기간({policyValue(policy?.downloadGraceDays)}일)</b> 동안 내려간
        상태로 남고, 그동안 <b>작성자만 사진 원본을 내려받을 수 있습니다</b>.
        유예가 끝나면 <b>영구 삭제</b>되어 작성자 목록 · 쇼룸 · 인사이트에서
        사라지며, 원문은 운영자 콘솔에서만 조회되다가 보관 기간이 지나면
        파기됩니다. 되돌릴 수 없습니다.
      </WarnBox>
    </ModalShell>
  );
}

// ------------------------------------------------------------------ 확인 모달(시안에 없음 — 실데이터 보호)

interface ConfirmNoteModalProps {
  title: string;
  confirmLabel: string;
  message: ReactNode;
  /** 메모 입력 — 없으면 확인만 받는다 */
  note?: { label: string; hint?: string; maxLength: number };
  isPending: boolean;
  onClose: () => void;
  onSubmit: (note: string) => void;
}

/**
 * 신고 종결(C3) · 조치 취소 · 재게시(C5) · 승인 · 재게시(C6)의 확인 단계.
 * 시안은 버튼만 그렸지만 누르면 작성자에게 알림이 가거나(조치 취소 · 승인) 신고가 닫혀 되돌릴 수 없으므로
 * 확인을 한 번 받는다. 메모는 서버 요청의 선택 필드(note · comment)다.
 */
export function ConfirmNoteModal(props: ConfirmNoteModalProps) {
  const { title, confirmLabel, message, note, isPending, onClose, onSubmit } =
    props;
  const [value, setValue] = useState("");

  return (
    <ModalShell
      isOpen
      title={title}
      width={400}
      onClose={onClose}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            취소
          </Btn>
          <Btn
            variant="primary"
            isLoading={isPending}
            onClick={() => onSubmit(value.trim())}
          >
            {confirmLabel}
          </Btn>
        </>
      }
    >
      <div className={BODY_CLASS}>{message}</div>
      {note && (
        <Field>
          <ModalLabel optionalText="선택">{note.label}</ModalLabel>
          <textarea
            aria-label={note.label}
            className={cn(TEXTAREA_CLASS, "min-h-16")}
            maxLength={note.maxLength}
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          {note.hint && <p className={HINT_CLASS}>{note.hint}</p>}
        </Field>
      )}
    </ModalShell>
  );
}
