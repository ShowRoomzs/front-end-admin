import { ModalShell } from "@/common/components/ModalShell/ModalShell";
import Btn from "@/features/contract/components/shared/Btn";
import { TermRow, Terms } from "@/features/contract/components/shared/Terms";
import {
  ModalWarn,
  MODAL_SUMMARY_CLASS,
} from "@/features/contract/components/modals/ModalParts";
import type { AdminContractDetail } from "@/features/contract/types";
import {
  formatMonthDayTime,
  sameMinute,
} from "@/features/contract/utils/datetime";
import dayjs from "dayjs";
import type { ReactNode } from "react";

interface SignatureSaveModalProps {
  detail: AdminContractDetail;
  /** 저장할 값(서버 전송 형식) — null이면 미서명 */
  brandAfter: string | null;
  creatorAfter: string | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function signText(value: string | null) {
  return value ? `서명 완료 · ${formatMonthDayTime(value)}` : "대기";
}

/** before → after 한 칸 — 바뀌지 않았으면 「(변경 없음)」 */
function Diff(props: { before: string | null; after: string | null }) {
  const { before, after } = props;
  if (sameMinute(before, after)) {
    return (
      <>
        {before ? (
          signText(before)
        ) : (
          <span className="text-sz-n-500">대기</span>
        )}{" "}
        <span className="text-sz-n-500">(변경 없음)</span>
      </>
    );
  }
  const beforeNode: ReactNode = before ? (
    signText(before)
  ) : (
    <span className="text-sz-n-500">대기</span>
  );
  return (
    <>
      {beforeNode} → <b className="font-semibold">{signText(after)}</b>
    </>
  );
}

/**
 * 시안 C3 — 서명 현황 저장 확인. 유일한 목적은 **기준 시각의 무게**를 알리는 것이다:
 * 저장 시각이 양측 화면의 「확인 시점 기준」에 그대로 나간다. 변경 내역을 before → after로 보여 주고,
 * 체결 완료 전까지 되돌릴 수 있음을 명시한다. 확인 버튼은 주 액션(파괴적이지 않다).
 */
export default function SignatureSaveModal(props: SignatureSaveModalProps) {
  const { detail, brandAfter, creatorAfter, isPending, onClose, onConfirm } =
    props;
  const { signature, contract } = detail;
  const bothAfter = brandAfter !== null && creatorAfter !== null;
  const bothBefore =
    signature.brandSignedAt !== null && signature.creatorSignedAt !== null;
  const now = dayjs().format("MM.DD HH:mm");

  return (
    <ModalShell
      isOpen
      title="서명 현황 저장"
      width={480}
      onClose={onClose}
      bodyClassName="p-5 text-[12px] leading-[1.7] text-sz-n-700"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            취소
          </Btn>
          <Btn variant="primary" isLoading={isPending} onClick={onConfirm}>
            저장
          </Btn>
        </>
      }
    >
      모두싸인에서 확인한 값을 저장합니다.
      <Terms className={MODAL_SUMMARY_CLASS}>
        <TermRow label="브랜드" labelWidth={96} className="py-2">
          <span className="tabular-nums">
            <Diff before={signature.brandSignedAt} after={brandAfter} />
          </span>
        </TermRow>
        <TermRow label="인플루언서" labelWidth={96} className="py-2">
          <span className="tabular-nums">
            <Diff before={signature.creatorSignedAt} after={creatorAfter} />
          </span>
        </TermRow>
        <TermRow label="기준 시각" labelWidth={96} className="py-2">
          <span className="tabular-nums">
            {signature.asOf ? formatMonthDayTime(signature.asOf) : "—"} →{" "}
            <b className="font-semibold">{now}</b>
          </span>
        </TermRow>
      </Terms>
      <ModalWarn>
        저장 시각이 <b>양측 화면의 「운영자가 확인한 시점 기준」</b>이 됩니다 —
        브랜드와 인플루언서는 이 시각을 <b>운영자가 모두싸인을 확인한 때</b>로
        읽습니다. 대시보드를 보지 않고 저장하면{" "}
        <b>시각만 새로워지고 값은 그대로</b>인 화면이 나갑니다.
      </ModalWarn>
      {bothAfter && !bothBefore && (
        <ModalWarn tone="info">
          양측 서명이 모두 완료로 바뀌므로 저장 후 상태가 <b>체결 처리 대기</b>
          가 됩니다. 잘못 입력했으면 <b>체결 완료 전까지 체크를 해제</b>해
          되돌릴 수 있습니다.
        </ModalWarn>
      )}
      {!bothAfter && contract.status === "CONCLUSION_PENDING" && (
        <ModalWarn tone="info">
          서명 완료가 해제되므로 저장 후 상태가 <b>서명 진행중</b>으로
          돌아갑니다. 올린 체결 문서는 그대로 남습니다.
        </ModalWarn>
      )}
    </ModalShell>
  );
}
