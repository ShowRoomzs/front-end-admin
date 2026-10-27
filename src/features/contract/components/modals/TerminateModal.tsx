import { ModalShell } from "@/common/components/ModalShell/ModalShell";
import { FLink } from "@/features/contract/components/detail/Rows";
import {
  CheckBox,
  MLabel,
  MODAL_SELECT_CLASS,
  MODAL_SUMMARY_CLASS,
  MODAL_TEXTAREA_CLASS,
  ModalWarn,
} from "@/features/contract/components/modals/ModalParts";
import Btn from "@/features/contract/components/shared/Btn";
import { CheckListRow } from "@/features/contract/components/shared/CheckRow";
import { TermRow, Terms } from "@/features/contract/components/shared/Terms";
import { TERMINATION_REASONS } from "@/features/contract/constants/labels";
import {
  SELECT_CHEVRON_STYLE,
  TERMINATE_EXPLANATION_MAX,
} from "@/features/contract/constants/params";
import {
  TERMINATE_CONSENT_CHECK,
  TERMINATE_NOT_OPENED_CHECK,
  TERMINATE_WARN,
} from "@/features/contract/constants/provisional";
import type {
  AdminContractDetail,
  AdminContractTerminateRequest,
  ContractTerminationReasonCode,
} from "@/features/contract/types";
import { formatMonthDayTime } from "@/features/contract/utils/datetime";
import { useState, type ReactNode } from "react";

interface TerminateModalProps {
  detail: AdminContractDetail;
  isPending: boolean;
  onClose: () => void;
  onOpenThread?: () => void;
  onConfirm: (body: AdminContractTerminateRequest) => void;
}

/** 시안 C7 「현재 상태」 — 「계약 성립 · 공구 생성됨(GRB-…) · 오픈 전」 */
function currentStateText(detail: AdminContractDetail) {
  const { groupBuyNumber } = detail.groupBuy;
  return groupBuyNumber
    ? `계약 성립 · 공구 생성됨(${groupBuyNumber}) · 오픈 전`
    : "계약 성립 · 공구 생성 전";
}

/**
 * 시안 C7 — 해지 처리(rev.9 기-05 【잠정】). 계약은 양측 서명 때 성립하므로 성립 뒤 닫는 일은 취소가 아니라
 * 해지다 — 공구 오픈 전에만 열리고 생성된 공구도 함께 종료된다. 직권 취소(C6)와 같은 구조로 **상대방 동의 확인**
 * 체크를 두고(기-06), 서명 요청이 이미 끝나 모두싸인 체크 대신 **공구 오픈 전 확인** 체크를 둔다.
 * 사유 · 설명은 양측 운영팀 채널 카드에 그대로 나가므로 둘 다 필수다. 필수 미입력 → 버튼만 비활성.
 * 브랜드가 파트너센터에서 넣은 해지 요청이 있으면 그 요청을 처리하고, 없으면 운영자 처리로 기록된다.
 */
export default function TerminateModal(props: TerminateModalProps) {
  const { detail, isPending, onClose, onOpenThread, onConfirm } = props;
  const { contract, terminationRequest } = detail;
  const [reasonCode, setReasonCode] = useState<
    ContractTerminationReasonCode | ""
  >("");
  const [explanation, setExplanation] = useState("");
  const [consent, setConsent] = useState(false);
  const [notOpened, setNotOpened] = useState(false);

  const canSubmit =
    reasonCode !== "" && explanation.trim().length > 0 && consent && notOpened;

  // 시안 「무드코스메틱 · 운영팀 채널 스레드 열기 ↗」 — 요청이 없으면 운영자 처리
  let requestSummary: ReactNode = "요청 없음 — 운영자 처리";
  if (terminationRequest) {
    requestSummary = [
      terminationRequest.requesterName,
      ["운영팀 채널", formatMonthDayTime(terminationRequest.requestedAt)]
        .filter(Boolean)
        .join(" "),
    ]
      .filter(Boolean)
      .join(" · ");
  }

  return (
    <ModalShell
      isOpen
      title="해지 처리"
      width={520}
      onClose={onClose}
      bodyClassName="max-h-[70vh] overflow-y-auto p-5 text-[12px] leading-[1.7] text-sz-n-700"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            닫기
          </Btn>
          <Btn
            variant="dangerSolid"
            disabled={!canSubmit}
            isLoading={isPending}
            onClick={() =>
              reasonCode !== "" &&
              onConfirm({
                reasonCode,
                explanation: explanation.trim(),
                counterpartyConsentConfirmed: consent,
                groupBuyNotOpenedConfirmed: notOpened,
                requestId: terminationRequest?.requestId ?? null,
              })
            }
          >
            해지 처리
          </Btn>
        </>
      }
    >
      <b className="font-semibold text-sz-n-900">{contract.title}</b>(
      {contract.contractNumber}) 계약을 <b className="font-semibold">해지</b>
      합니다.
      <Terms className={MODAL_SUMMARY_CLASS}>
        <TermRow label="현재 상태" labelWidth={96} className="py-2">
          {currentStateText(detail)}
        </TermRow>
        <TermRow label="요청" labelWidth={96} className="py-2">
          <span className="tabular-nums">{requestSummary}</span>{" "}
          {onOpenThread && <FLink onClick={onOpenThread}>스레드 열기 ↗</FLink>}
          {terminationRequest?.reasonLabel && (
            <span className="mt-0.5 block text-[11px] text-sz-n-500">
              {[terminationRequest.reasonLabel, terminationRequest.memo]
                .filter(Boolean)
                .join(" — ")}
            </span>
          )}
        </TermRow>
      </Terms>
      <MLabel required>해지 사유</MLabel>
      <select
        className={MODAL_SELECT_CLASS}
        style={SELECT_CHEVRON_STYLE}
        value={reasonCode}
        onChange={(event) =>
          setReasonCode(
            event.target.value as ContractTerminationReasonCode | ""
          )
        }
      >
        <option value="">사유를 선택하세요</option>
        {TERMINATION_REASONS.map((reason) => (
          <option key={reason.code} value={reason.code}>
            {reason.label}
          </option>
        ))}
      </select>
      <MLabel required>양측에 전달할 설명</MLabel>
      <textarea
        className={MODAL_TEXTAREA_CLASS}
        style={{ minHeight: 64 }}
        maxLength={TERMINATE_EXPLANATION_MAX}
        placeholder="해지 사유와 이후 진행 방법을 적어 주세요."
        value={explanation}
        onChange={(event) => setExplanation(event.target.value)}
      />
      <MLabel required>확인</MLabel>
      <CheckBox>
        <CheckListRow checked={consent} onChange={setConsent}>
          {TERMINATE_CONSENT_CHECK}
        </CheckListRow>
        <CheckListRow checked={notOpened} onChange={setNotOpened}>
          {TERMINATE_NOT_OPENED_CHECK}
        </CheckListRow>
      </CheckBox>
      <ModalWarn>{TERMINATE_WARN}</ModalWarn>
    </ModalShell>
  );
}
