import { apiInstance } from "@/common/lib/apiInstance";
import { ModalShell } from "@/common/components/ModalShell/ModalShell";
import { Checkbox } from "@/components/ui/checkbox";
import { INPUT_CLASS } from "@/features/contract/components/shared/styles";
import {
  DIALOG_BODY_CLASS,
  DialogRow,
  DialogStatus,
  Dim,
  Sub,
} from "@/features/refund/components/modals/DialogParts";
import Btn from "@/features/refund/components/shared/Btn";
import { SELECT_CHEVRON_STYLE } from "@/features/refund/constants/params";
import { REFUND_QUERY_KEYS } from "@/features/refund/constants/queryKeys";
import { useGetRefundDetail } from "@/features/refund/hooks/useAdminRefund";
import type {
  RefundItem,
  RefundTransferCompleteRequest,
} from "@/features/refund/types";
import { formatMonthDayTime, formatWon } from "@/features/refund/utils/format";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface TransferModalProps {
  /** 목록 행 — 송금액은 목록 `amount`(상세에는 금액 칸이 없다) */
  record: RefundItem;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (body: RefundTransferCompleteRequest) => void;
}

/** `GET /v1/common/banks` — 금융결제원 표준 코드(배포된 공용 API) */
interface Bank {
  code: string;
  name: string;
}

function useBanks() {
  return useQuery({
    queryKey: [REFUND_QUERY_KEYS.DETAIL, "banks"],
    queryFn: async () => {
      const { data } = await apiInstance.get<Array<Bank>>("/common/banks");
      return data;
    },
    staleTime: 60 * 60_000,
  });
}

const FIELD_CLASS = cn(INPUT_CLASS, "h-8 px-2.5 text-[12px]");

/** 시안 `.mlabel` + 필수 표시 */
function Label(props: { children: string }) {
  return (
    <div className="mb-1 mt-3 text-[11px] font-medium text-sz-n-600">
      {props.children}
      <span className="ml-0.5 text-sz-danger-text">*</span>
    </div>
  );
}

/**
 * 시안 06c rev.8 M3 — 운영자 계좌 송금 처리(원래 결제액 초과분 · 기-93 보완).
 * 운영자가 은행에서 **직접 송금한 뒤** 송금 완료 체크로 기록만 남긴다 — 시스템은 송금하지 않는다.
 * 소비자 계좌는 1:1 문의로 받은 값을 넣고, 서버가 소비자가 저장해 둔 환불 계좌(`suggestedAccount`)를
 * 주면 기본값으로 채운다. 처리자 · 일시는 서버가 저장 때 남긴다. 체크 전에는 버튼이 비활성이다.
 * `POST /transfer-complete`는 main에만 있다(개발 서버 미배포 — 송금 행도 배포 뒤에야 생긴다).
 */
export default function TransferModal(props: TransferModalProps) {
  const { record, isPending, onClose, onConfirm } = props;
  const {
    data: detail,
    isLoading,
    isError,
  } = useGetRefundDetail(record.refundTaskId);
  const { data: banks } = useBanks();
  const transfer = detail?.transfer ?? null;
  const suggested = transfer?.suggestedAccount ?? null;

  // 상세가 오면 기본값을 한 번 채운다 — 운영자가 고친 값은 덮지 않는다
  const [touched, setTouched] = useState(false);
  const [form, setForm] = useState({
    bankCode: "",
    accountNumber: "",
    holderName: "",
  });
  const [confirmed, setConfirmed] = useState(false);
  const values =
    touched || !suggested
      ? form
      : {
          bankCode: suggested.bankCode,
          accountNumber: suggested.accountNumber,
          holderName: suggested.holderName,
        };
  const change = (patch: Partial<typeof form>) => {
    setForm({ ...values, ...patch });
    setTouched(true);
  };

  const done = transfer?.transferred ?? null;
  const canSave =
    Boolean(transfer?.transferable) &&
    values.bankCode !== "" &&
    values.accountNumber.trim() !== "" &&
    values.holderName.trim() !== "" &&
    confirmed;
  const handleClose = () => {
    if (!isPending) onClose();
  };

  return (
    <ModalShell
      isOpen
      title={`계좌 송금 처리 — ${record.refundNo}`}
      width={520}
      onClose={handleClose}
      bodyClassName={DIALOG_BODY_CLASS}
      footer={
        <>
          <Btn disabled={isPending} onClick={handleClose}>
            닫기
          </Btn>
          {!done && (
            <Btn
              variant="primary"
              disabled={!canSave}
              isLoading={isPending}
              onClick={() =>
                onConfirm({
                  bankCode: values.bankCode,
                  accountNumber: values.accountNumber.trim(),
                  holderName: values.holderName.trim(),
                  transferConfirmed: true,
                })
              }
            >
              송금 완료 저장
            </Btn>
          )}
        </>
      }
    >
      {isLoading && <DialogStatus>불러오는 중입니다…</DialogStatus>}
      {isError && (
        <DialogStatus>
          송금 정보를 불러오지 못했습니다. 닫고 다시 시도해 주세요.
        </DialogStatus>
      )}
      {detail && (
        <>
          <DialogRow label="항목">
            {[detail.source.label, detail.source.ref, detail.order.orderNumber]
              .filter(Boolean)
              .join(" · ")}
          </DialogRow>
          <DialogRow label="송금액">
            <b className="tabular-nums">{formatWon(record.amount)}</b>{" "}
            <Sub>· 기본 배송비 편도 정액 · 원래 결제액 초과분</Sub>
          </DialogRow>

          {done ? (
            <>
              <DialogRow label="소비자 계좌">
                {done.bankName ?? done.bankCode}{" "}
                <span className="tabular-nums">{done.accountNumberMasked}</span>{" "}
                · {done.holderName}
              </DialogRow>
              <DialogRow label="처리자 · 일시">
                {done.transferredByName ?? "운영자"} ·{" "}
                {formatMonthDayTime(done.transferredAt)}
              </DialogRow>
            </>
          ) : (
            <>
              <Label>소비자 계좌</Label>
              <div className="flex gap-2">
                <select
                  aria-label="은행"
                  className={cn(FIELD_CLASS, "w-[130px] appearance-none pr-7")}
                  style={SELECT_CHEVRON_STYLE}
                  value={values.bankCode}
                  onChange={(event) => change({ bankCode: event.target.value })}
                >
                  <option value="">은행 선택</option>
                  {/* 목록을 받기 전이거나 목록 밖 코드여도 기본값이 빈칸으로 보이지 않게 남긴다 */}
                  {suggested &&
                    !banks?.some(
                      (bank) => bank.code === suggested.bankCode
                    ) && (
                      <option value={suggested.bankCode}>
                        {suggested.bankName ?? suggested.bankCode}
                      </option>
                    )}
                  {(banks ?? []).map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
                <input
                  aria-label="계좌번호"
                  autoComplete="off"
                  maxLength={30}
                  className={cn(FIELD_CLASS, "flex-1 tabular-nums")}
                  value={values.accountNumber}
                  onChange={(event) =>
                    change({
                      accountNumber: event.target.value.replace(/[^\d-]/g, ""),
                    })
                  }
                />
                <input
                  aria-label="예금주"
                  autoComplete="off"
                  maxLength={50}
                  className={cn(FIELD_CLASS, "w-[90px]")}
                  value={values.holderName}
                  onChange={(event) =>
                    change({ holderName: event.target.value })
                  }
                />
              </div>
              <p className="mt-1 text-[11px] text-sz-n-500">
                {transfer?.linkedInquiryId
                  ? `1:1 문의 #${transfer.linkedInquiryId}로 받은 계좌입니다. `
                  : "1:1 문의로 받은 계좌를 넣으세요. "}
                예금주가 <b>주문자 실명</b>과 같은지 확인하세요.
              </p>

              <Label>송금 확인</Label>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-[6px] border border-sz-n-200 px-3 py-2.5">
                <Checkbox
                  className="mt-0.5"
                  checked={confirmed}
                  onCheckedChange={(value) => setConfirmed(value === true)}
                />
                <span className="text-[12px] leading-[1.65]">
                  위 계좌로{" "}
                  <b className="tabular-nums">{formatWon(record.amount)}</b>을{" "}
                  <b>송금 완료</b>했습니다
                </span>
              </label>

              <div className="mt-2.5">
                <DialogRow label="처리자 · 일시">
                  <Dim>저장 시 자동 기록 — 처리자 · 저장 시각</Dim>
                </DialogRow>
              </div>
              {!transfer?.transferable && (
                <p className="mb-0 mt-2.5 text-[11px] leading-[1.7] text-sz-n-500">
                  지금은 기록할 수 없습니다 — {detail.statusLabel}
                </p>
              )}
            </>
          )}

          <div className="mt-3 flex gap-2 rounded-[6px] bg-sz-info-bg px-3 py-2.5 text-[11px] leading-[1.6] text-sz-info-text">
            <span>i</span>
            <span>
              송금은 운영자가 은행에서 직접 합니다 — 이 화면은 <b>기록</b>만
              남깁니다. 저장하면 소비자에게 송금 완료가 통지되고, 브랜드
              정산에는{" "}
              <b>「− 운임 정산 {record.amount.toLocaleString("ko-KR")}」</b>이
              그대로 반영됩니다.
            </span>
          </div>
        </>
      )}
    </ModalShell>
  );
}
