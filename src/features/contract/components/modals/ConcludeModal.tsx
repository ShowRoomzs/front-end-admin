import { ModalShell } from "@/common/components/ModalShell/ModalShell";
import { formatDateTimeShort } from "@/common/utils/formatDate";
import Btn from "@/features/contract/components/shared/Btn";
import { TermRow, Terms } from "@/features/contract/components/shared/Terms";
import {
  ModalWarn,
  MODAL_SUMMARY_CLASS,
} from "@/features/contract/components/modals/ModalParts";
import type { AdminContractDetail } from "@/features/contract/types";
import { formatKRW } from "@/features/contract/utils/format";
import { formatMonthDayTime } from "@/features/contract/utils/datetime";

interface ConcludeModalProps {
  detail: AdminContractDetail;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * 시안 C4 — 체결 완료 처리. 이 화면에서 **유일하게 불가역**한 조치라 서명 기록 · 업로드 문서 ·
 * 생성될 공구를 다시 나열한다(서명 일시가 틀렸다면 지금이 마지막 정정 기회).
 * 실행 버튼은 주 액션 — 파괴가 아니라 성립이다.
 */
export default function ConcludeModal(props: ConcludeModalProps) {
  const { detail, isPending, onClose, onConfirm } = props;
  const { contract, signature, documents, fixedFee } = detail;
  const fileName = (type: string) =>
    documents.find((document) => document.type === type && document.exists)
      ?.fileName ?? "—";

  return (
    <ModalShell
      isOpen
      title="체결 완료 처리"
      width={520}
      onClose={onClose}
      bodyClassName="p-5 text-[12px] leading-[1.7] text-sz-n-700"
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            취소
          </Btn>
          <Btn variant="primary" isLoading={isPending} onClick={onConfirm}>
            체결 완료
          </Btn>
        </>
      }
    >
      <b className="font-semibold text-sz-n-900">{contract.title}</b>(
      {contract.contractNumber})를 체결 완료 처리합니다.
      <Terms className={MODAL_SUMMARY_CLASS}>
        <TermRow label="브랜드 서명" labelWidth={96} className="py-2">
          <span className="tabular-nums">
            {contract.brand.name} ·{" "}
            {formatDateTimeShort(signature.brandSignedAt)}
          </span>
        </TermRow>
        <TermRow label="인플루언서 서명" labelWidth={96} className="py-2">
          <span className="tabular-nums">
            {contract.creator?.name ?? "—"} ·{" "}
            {formatDateTimeShort(signature.creatorSignedAt)}
          </span>
        </TermRow>
        <TermRow label="서명 PDF" labelWidth={96} className="py-2">
          {fileName("SIGNED_PDF")}
        </TermRow>
        <TermRow label="감사추적인증서" labelWidth={96} className="py-2">
          {fileName("AUDIT_TRAIL")}
        </TermRow>
        <TermRow label="생성될 공구" labelWidth={96} className="py-2">
          <span className="tabular-nums">
            {contract.title} · {formatMonthDayTime(contract.startAt)} ~{" "}
            {formatMonthDayTime(contract.endAt)}
          </span>
        </TermRow>
      </Terms>
      <ModalWarn>
        <b>되돌릴 수 없습니다.</b> 처리하는 즉시 계약이 성립하고{" "}
        <b>공구가 생성</b>되며, 양측 화면이 <b>체결완료</b>로 바뀝니다. 서명
        일시가 틀렸다면 <b>지금이 마지막 정정 기회</b>입니다 — 체결 후에는
        계약을 새로 작성해야 합니다.
      </ModalWarn>
      <ModalWarn tone="info">
        생성된 공구는 <b>준비중</b>으로 시작합니다 — 인플루언서가 게시물을
        등록하고 운영자가 <b>오픈 승인</b>해야 열립니다(공구 관리 소관).
        {fixedFee.amount ? (
          <>
            {" "}
            고정 지급비 <b>{formatKRW(fixedFee.amount)}</b>은{" "}
            <b>브랜드가 직접 지급</b>하며 플랫폼이 중개하지 않습니다.
          </>
        ) : null}
      </ModalWarn>
    </ModalShell>
  );
}
