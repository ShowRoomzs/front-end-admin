import { ModalShell } from "@/common/components/ModalShell/ModalShell";
import Btn from "@/features/contract/components/shared/Btn";
import { CheckListRow } from "@/features/contract/components/shared/CheckRow";
import DateTimeField from "@/features/contract/components/shared/DateTimeField";
import { TermRow, Terms } from "@/features/contract/components/shared/Terms";
import {
  CheckBox,
  MLabel,
  ModalWarn,
} from "@/features/contract/components/modals/ModalParts";
import type {
  AdminContractApproveRequest,
  AdminContractDetail,
} from "@/features/contract/types";
import {
  toParts,
  toServerDateTime,
  type DateTimeParts,
} from "@/features/contract/utils/datetime";
import { useState } from "react";

interface ApproveModalProps {
  detail: AdminContractDetail;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (body: AdminContractApproveRequest) => void;
}

/**
 * 시안 C1 — 검토 승인 · 서명 요청. 승인은 버튼 하나로 끝나지 않는다: API가 없어 운영자가
 * 모두싸인에 **먼저 올려 보낸 뒤** 승인한다. 체크 3항목(수신자 · 업로드 · 발송)은 기록이 아니라
 * 확인용이고, 발송 일시·서명 기한은 모두싸인에서 정해진 값을 옮겨 적는다(우리가 계산하지 않는다).
 * 필수 미입력 → 에러 문구 없이 버튼만 비활성.
 */
export default function ApproveModal(props: ApproveModalProps) {
  const { detail, isPending, onClose, onConfirm } = props;
  const { contract } = detail;
  const [checks, setChecks] = useState([false, false, false]);
  const [sentAt, setSentAt] = useState<DateTimeParts>(() => toParts(null));
  const [deadline, setDeadline] = useState<DateTimeParts>(() => ({
    date: "",
    hour: "23",
    minute: "55",
  }));

  const sentValue = toServerDateTime(sentAt);
  const deadlineValue = toServerDateTime(deadline);
  // 기한은 발송 뒤여야 한다(서버도 같은 순서를 검증한다) — 필수 미충족처럼 버튼만 막는다
  const canSubmit =
    checks.every(Boolean) &&
    sentValue !== null &&
    deadlineValue !== null &&
    deadlineValue > sentValue;

  const toggle = (index: number, value: boolean) =>
    setChecks((prev) => prev.map((item, i) => (i === index ? value : item)));

  return (
    <ModalShell
      isOpen
      title="검토 승인 · 서명 요청"
      width={520}
      onClose={onClose}
      bodyClassName="max-h-[70vh] overflow-y-auto p-5 text-[12px] leading-[1.7] text-sz-n-700"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            취소
          </Btn>
          <Btn
            variant="primary"
            disabled={!canSubmit}
            isLoading={isPending}
            onClick={() =>
              sentValue &&
              deadlineValue &&
              onConfirm({
                recipientsRegistered: checks[0],
                documentUploaded: checks[1],
                requestSent: checks[2],
                signatureRequestedAt: sentValue,
                signatureDeadlineAt: deadlineValue,
              })
            }
          >
            승인
          </Btn>
        </>
      }
    >
      <b className="font-semibold text-sz-n-900">{contract.title}</b>(
      {contract.contractNumber})를 승인합니다. 상세 화면에서 내려받은 계약서를{" "}
      <b className="font-semibold text-sz-n-900">모두싸인에 올려 발송한 뒤</b>{" "}
      이 창에서 승인을 눌러 주세요.
      <Terms className="my-4 px-3">
        <TermRow label="수신자 ①" labelWidth={96} className="py-2">
          {[contract.brand.name, contract.brand.email]
            .filter(Boolean)
            .join(" · ")}
        </TermRow>
        <TermRow label="수신자 ②" labelWidth={96} className="py-2">
          {contract.creator
            ? [contract.creator.name, contract.creator.email]
                .filter(Boolean)
                .join(" · ")
            : "—"}
        </TermRow>
        <TermRow label="문서명" labelWidth={96} className="py-2">
          {contract.title} 계약서 ({contract.contractNumber})
        </TermRow>
      </Terms>
      <MLabel required first>
        모두싸인 업로드 확인
      </MLabel>
      <CheckBox>
        <CheckListRow checked={checks[0]} onChange={(v) => toggle(0, v)}>
          수신자 <b className="font-semibold">2명</b>을 브랜드·인플루언서 순으로
          등록했습니다
        </CheckListRow>
        <CheckListRow checked={checks[1]} onChange={(v) => toggle(1, v)}>
          내려받은 <b className="font-semibold">계약서 PDF를 그대로 업로드</b>
          했습니다{" "}
          <span className="text-[11px] text-sz-n-500">
            — 내용을 다시 입력하지 않습니다
          </span>
        </CheckListRow>
        <CheckListRow checked={checks[2]} onChange={(v) => toggle(2, v)}>
          발송을 완료했습니다
        </CheckListRow>
      </CheckBox>
      <MLabel required>서명 요청 발송 일시</MLabel>
      <DateTimeField
        ariaLabel="서명 요청 발송 일시"
        value={sentAt}
        onChange={setSentAt}
      />
      <MLabel required>모두싸인에 설정한 서명 기한</MLabel>
      <DateTimeField
        ariaLabel="서명 기한"
        value={deadline}
        onChange={setDeadline}
      />
      <p className="mt-1.5 text-[11px] text-sz-n-500">
        둘 다 <b className="font-semibold">모두싸인에서 정해진 값</b>을 옮겨
        적습니다 — 발송 일시는 양측 화면의 「서명 요청 발송」이, 서명 기한은{" "}
        <b className="font-semibold">만료 판단의 기준</b>이 됩니다.
      </p>
      <ModalWarn>
        승인하면 양측 상태가 <b>서명 진행중</b>으로 바뀌고{" "}
        <b>브랜드 편집 잠금이 유지</b>됩니다. 발송 전에 승인하면 양측이{" "}
        <b>오지 않은 메일을 기다립니다</b> — 반드시 <b>보낸 뒤</b> 누르세요.
      </ModalWarn>
    </ModalShell>
  );
}
