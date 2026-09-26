import { ModalShell } from "@/common/components/ModalShell/ModalShell";
import Btn from "@/features/contract/components/shared/Btn";
import { SELECT_CHEVRON_STYLE } from "@/features/contract/constants/params";
import { REJECT_REASONS } from "@/features/contract/constants/labels";
import {
  MLabel,
  MODAL_SELECT_CLASS,
  MODAL_TEXTAREA_CLASS,
  ModalWarn,
} from "@/features/contract/components/modals/ModalParts";
import type {
  AdminContractDetail,
  ContractReviewRejectReason,
} from "@/features/contract/types";
import { useState } from "react";

const DETAIL_MAX = 1000;

interface RejectModalProps {
  detail: AdminContractDetail;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (reasonCode: ContractReviewRejectReason, detail: string) => void;
}

/**
 * 시안 C2 — 검토 반려. 사유는 **제목 + 상세 2단**이고 둘 다 필수다(파트너 B3d가 그 구조로 받는다 —
 * 고칠 방법이 없으면 브랜드가 같은 내용으로 재요청한다). 문구가 브랜드 화면에 그대로 노출됨을 고지한다.
 * 실행 버튼은 흰 배경 + 위험색 글자 — 반려는 파괴가 아니라 되돌림이다.
 */
export default function RejectModal(props: RejectModalProps) {
  const { detail, isPending, onClose, onConfirm } = props;
  const [reasonCode, setReasonCode] = useState<ContractReviewRejectReason | "">(
    ""
  );
  const [text, setText] = useState("");
  const canSubmit = reasonCode !== "" && text.trim().length > 0;

  return (
    <ModalShell
      isOpen
      title="검토 반려"
      width={520}
      onClose={onClose}
      bodyClassName="p-5 text-[12px] leading-[1.7] text-sz-n-700"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            취소
          </Btn>
          <Btn
            variant="danger"
            disabled={!canSubmit}
            isLoading={isPending}
            onClick={() =>
              reasonCode !== "" && onConfirm(reasonCode, text.trim())
            }
          >
            반려
          </Btn>
        </>
      }
    >
      <b className="font-semibold text-sz-n-900">{detail.contract.title}</b>(
      {detail.contract.contractNumber})의 검토를 반려합니다.
      <MLabel required>반려 사유</MLabel>
      <select
        className={MODAL_SELECT_CLASS}
        style={SELECT_CHEVRON_STYLE}
        value={reasonCode}
        onChange={(event) =>
          setReasonCode(event.target.value as ContractReviewRejectReason | "")
        }
      >
        <option value="">사유를 선택하세요</option>
        {REJECT_REASONS.map((reason) => (
          <option key={reason.code} value={reason.code}>
            {reason.label}
          </option>
        ))}
      </select>
      <MLabel required>브랜드에게 전달할 설명</MLabel>
      <textarea
        className={MODAL_TEXTAREA_CLASS}
        maxLength={DETAIL_MAX}
        placeholder="무엇을 어떻게 고쳐야 하는지 적어 주세요."
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <p className="mt-1.5 text-[11px] text-sz-n-500">
        사유와 설명은{" "}
        <b className="font-semibold">브랜드 계약 화면에 그대로 노출</b>됩니다 —
        내부 메모를 적지 마세요.
      </p>
      <ModalWarn>
        반려하면 <b>브랜드 편집이 다시 열리고</b> 알림이 발송됩니다.{" "}
        <b>반려를 되돌리는 기능은 없습니다</b> — 잘못 반려했으면 스레드로 알리고
        재요청을 받으세요.
      </ModalWarn>
    </ModalShell>
  );
}
