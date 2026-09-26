import { ModalShell } from "@/common/components/ModalShell/ModalShell";
import {
  formatDateTimeShort,
  parseServerDateTime,
} from "@/common/utils/formatDate";
import Btn from "@/features/contract/components/shared/Btn";
import { CheckListRow } from "@/features/contract/components/shared/CheckRow";
import { TermRow, Terms } from "@/features/contract/components/shared/Terms";
import {
  CheckBox,
  MLabel,
  ModalWarn,
} from "@/features/contract/components/modals/ModalParts";
import type { AdminContractDetail } from "@/features/contract/types";
import dayjs from "dayjs";
import { useState } from "react";

interface ExpireModalProps {
  detail: AdminContractDetail;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/** 재확인 체크 문구에 들어갈 「누구의 서명이 없는지」 */
function missingSigner(detail: AdminContractDetail) {
  const { brandSignedAt, creatorSignedAt } = detail.signature;
  if (!brandSignedAt && !creatorSignedAt) return "양측 서명";
  if (!creatorSignedAt) return "인플루언서 서명";
  return "브랜드 서명";
}

function SignCell(props: { value: string | null }) {
  return props.value ? (
    <>완료 · {formatDateTimeShort(props.value)}</>
  ) : (
    <span className="text-sz-danger-text">없음</span>
  );
}

/**
 * 시안 C5 — 만료 처리. 만료는 자동 판정이 아니라 운영자가 확인해 닫는다.
 * 모두싸인에는 서명이 들어왔는데 우리 화면에 반영되지 않았을 수 있으므로
 * **대시보드 재확인 체크가 필수**이고 기한 경과일·마지막 확인 시점을 병기한다.
 */
export default function ExpireModal(props: ExpireModalProps) {
  const { detail, isPending, onClose, onConfirm } = props;
  const { contract, signature } = detail;
  const [rechecked, setRechecked] = useState(false);
  const asOfDays = signature.asOf
    ? dayjs().diff(parseServerDateTime(signature.asOf), "day")
    : null;

  return (
    <ModalShell
      isOpen
      title="만료 처리"
      width={480}
      onClose={onClose}
      bodyClassName="p-5 text-[12px] leading-[1.7] text-sz-n-700"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            취소
          </Btn>
          <Btn
            variant="danger"
            disabled={!rechecked}
            isLoading={isPending}
            onClick={onConfirm}
          >
            만료 처리
          </Btn>
        </>
      }
    >
      <b className="font-semibold text-sz-n-900">{contract.title}</b>(
      {contract.contractNumber})를 <b className="font-semibold">만료</b>로
      종결합니다.
      <Terms className="my-4 px-3">
        <TermRow label="서명 기한" labelWidth={96} className="py-2">
          <span className="tabular-nums">
            {formatDateTimeShort(signature.deadlineAt)}
            {signature.deadlinePassedDays > 0 && (
              <>
                {" "}
                ·{" "}
                <b className="font-semibold">
                  {signature.deadlinePassedDays}일 경과
                </b>
              </>
            )}
          </span>
        </TermRow>
        <TermRow label="브랜드 서명" labelWidth={96} className="py-2">
          <span className="tabular-nums">
            <SignCell value={signature.brandSignedAt} />
          </span>
        </TermRow>
        <TermRow label="인플루언서 서명" labelWidth={96} className="py-2">
          <span className="tabular-nums">
            <SignCell value={signature.creatorSignedAt} />
          </span>
        </TermRow>
        <TermRow label="기준 시각" labelWidth={96} className="py-2">
          <span className="tabular-nums">
            {formatDateTimeShort(signature.asOf ?? signature.requestedAt)}
            {asOfDays !== null && (
              <span className="text-sz-n-500">
                {" "}
                · {asOfDays > 0 ? `${asOfDays}일 전 확인` : "오늘 확인"}
              </span>
            )}
          </span>
        </TermRow>
      </Terms>
      <MLabel required first>
        확인
      </MLabel>
      <CheckBox>
        <CheckListRow checked={rechecked} onChange={setRechecked}>
          모두싸인 대시보드에서{" "}
          <b className="font-semibold">{missingSigner(detail)}이 없음</b>을 다시
          확인했습니다
        </CheckListRow>
      </CheckBox>
      {asOfDays !== null && asOfDays > 0 && (
        <p className="mt-1.5 text-[11px] text-sz-n-500">
          마지막 확인이 <b className="font-semibold">{asOfDays}일 전</b>입니다 —
          그 사이 서명이 들어왔을 수 있습니다.
        </p>
      )}
      <ModalWarn>
        만료는 <b>종결 상태</b>입니다 — 되돌릴 수 없고 같은 조건으로 진행하려면
        브랜드가 <b>새 계약을 작성</b>해야 합니다. 서명이 이미 완료된 건을
        만료시키면 <b>성립한 계약을 닫는 것</b>이 됩니다.
      </ModalWarn>
    </ModalShell>
  );
}
