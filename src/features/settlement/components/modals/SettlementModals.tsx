import { formatFileSize } from "@/common/utils/formatFileSize";
import Btn from "@/features/contract/components/shared/Btn";
import {
  GbModal,
  MHint,
  MLabel,
  MSelect,
  MWarn,
} from "@/features/groupBuy/components/shared/GbParts";
import { TDim } from "@/features/settlement/components/shared/StlParts";
import {
  BRAND_INVOICE_MAX_BYTES,
  INVOICE_VERIFY_OPTIONS,
} from "@/features/settlement/constants/params";
import { adminSettlementService } from "@/features/settlement/services/adminSettlementService";
import type {
  BrandInvoicePayload,
  InvoiceVerifyResult,
  PayoutAccountSource,
  RedistributePayload,
  SettlementDetail,
  TaxDocument,
} from "@/features/settlement/types";
import {
  NETWORK_ERROR_MESSAGE,
  readApiError,
  saveBlob,
} from "@/features/settlement/utils/apiError";
import {
  elapsedDays,
  md,
  won,
  ymd,
  ymdhm,
} from "@/features/settlement/utils/format";
import { accountText } from "@/features/settlement/utils/view";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { useRef, useState, type ReactNode } from "react";

/** 모달 본문의 회색 요약 박스(시안 인라인 스타일 — `--n-50` · 11px · 행간 1.8) */
function SummaryBox(props: { children: ReactNode }) {
  return (
    <div className="mt-2.5 rounded-[6px] bg-sz-n-50 px-3 py-2.5 text-[11px] leading-[1.8] text-sz-n-700 [&_b]:font-semibold [&_b]:text-sz-n-900">
      {props.children}
    </div>
  );
}

const INPUT_CLASS =
  "h-8 rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-1.5 text-[13px] text-sz-n-900 outline-none placeholder:text-sz-n-400 focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50";

/** 시안 `.merr` — 형식 오류 · 파일 형식/용량 오류 · 서버가 거절한 이유 */
function MErr(props: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-1.5 text-[11px] text-sz-danger-text">
      {props.children}
    </p>
  );
}

// ── M3 재분배 ────────────────────────────────────────

const ACCOUNT_SOURCE_OPTIONS: Array<{
  value: PayoutAccountSource;
  label: string;
}> = [
  {
    value: "CURRENT_PROFILE",
    label: "회원 정보의 현재 계좌로 다시 지급 — 수취자가 계좌를 고친 뒤",
  },
  {
    value: "PREVIOUS",
    label: "지난 지시 계좌 그대로 재시도 — PG 일시 장애 등 계좌와 무관한 실패",
  },
];

/**
 * 금액을 재계산하지 않는다 — 확정 금액을 그대로 PG에 재지시한다(`POST …/payouts/{payoutId}/redistribute`).
 * 운영자는 계좌를 입력하지 않고 계좌 출처(회원 정보 현재 계좌 · 지난 지시 계좌)만 고른다.
 */
export function RedistributeModal(props: {
  detail: SettlementDetail;
  isPending: boolean;
  /** 서버가 거절한 이유(계좌 없음 등) — 모달을 닫지 않고 아래에 보인다 */
  serverError: string | null;
  onClose: () => void;
  onSubmit: (payload: RedistributePayload) => void;
}) {
  const { detail, isPending, serverError, onClose, onSubmit } = props;
  const failed = detail.rail.failedPayout;
  const payout = detail.payouts?.rows.find(
    (row) => row.payoutId === failed?.payoutId
  );
  const [accountSource, setAccountSource] =
    useState<PayoutAccountSource>("CURRENT_PROFILE");
  if (!failed) return null;
  const days = elapsedDays(failed.failedAt);
  const remaining = Math.max(0, failed.retryLimit - failed.attempt);
  const account = payout ? accountText(payout) : null;
  return (
    <GbModal
      title="재분배"
      onClose={onClose}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            취소
          </Btn>
          <Btn
            variant="primary"
            isLoading={isPending}
            onClick={() =>
              onSubmit({ payoutId: failed.payoutId, accountSource })
            }
          >
            재분배
          </Btn>
        </>
      }
    >
      <b className="font-semibold text-sz-n-900">
        {payout?.payeeName ?? failed.payeeLabel}
      </b>{" "}
      {failed.payeeLabel} 몫{" "}
      <b className="font-semibold tabular-nums text-sz-n-900">
        {won(failed.amount)}원
      </b>
      을 다시 지급합니다.
      <SummaryBox>
        반환 사유 <b>{failed.failReason ?? failed.failCode ?? "—"}</b> · PG 반환{" "}
        {ymdhm(failed.failedAt)}
        {days !== null && (
          <>
            {" "}
            · <b>{days}일 경과</b>
          </>
        )}
        <br />
        지난 계좌 <span className="tabular-nums">{account ?? "—"}</span>
        <br />
        확정 금액 <b className="tabular-nums">{won(failed.amount)}원</b>{" "}
        <TDim>— 재계산 없이 그대로 지급</TDim>
      </SummaryBox>
      <MLabel required>지급 계좌</MLabel>
      <MSelect
        aria-label="지급 계좌"
        value={accountSource}
        onChange={(event) =>
          setAccountSource(event.target.value as PayoutAccountSource)
        }
      >
        {ACCOUNT_SOURCE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </MSelect>
      {serverError && <MErr>{serverError}</MErr>}
      <MHint>
        계좌 변경은{" "}
        <b className="font-semibold text-sz-n-900">수취자가 회원 정보에서</b>{" "}
        합니다 — 운영자가 계좌를 입력하지 않습니다.
      </MHint>
      <MWarn>
        재분배는 <b className="font-semibold">PG에 재지시</b>하는 것이며
        플랫폼이 대금을 보관하지 않으므로{" "}
        <b className="font-semibold">즉시 입금되지 않습니다</b>. 재분배는 최대{" "}
        {failed.retryLimit}회(남은 횟수{" "}
        <b className="font-semibold">{remaining}회</b>)이고, 넘으면{" "}
        <b className="font-semibold">수동 이체 절차</b>로 넘어갑니다.
      </MWarn>
    </GbModal>
  );
}

// ── M4 승인번호 대조 ─────────────────────────────────

/** 운영자는 승인번호를 입력하지 않고 대조만 한다 — 결과는 일치 / 반려 사유 3종 */
export function InvoiceVerifyModal(props: {
  detail: SettlementDetail;
  document: TaxDocument;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (result: InvoiceVerifyResult) => void;
}) {
  const { detail, document, isPending, onClose, onSubmit } = props;
  const [result, setResult] = useState<InvoiceVerifyResult>("MATCH");
  const platformName =
    detail.payouts?.rows.find((row) => row.payee === "PLATFORM")?.payeeName ??
    "플랫폼";
  return (
    <GbModal
      title={`승인번호 대조 — ${document.counterpartyName}`}
      onClose={onClose}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            취소
          </Btn>
          <Btn
            variant="primary"
            isLoading={isPending}
            onClick={() => onSubmit(result)}
          >
            확인
          </Btn>
        </>
      }
    >
      인플루언서가 발행한 세금계산서를{" "}
      <b className="font-semibold text-sz-n-900">홈택스 매입 내역</b>과
      대조합니다.
      <SummaryBox>
        입력 승인번호{" "}
        <b className="tabular-nums">{document.approvalNumber ?? "—"}</b> ·{" "}
        {md(document.submittedAt)} 입력
        <br />
        기대값 공급가{" "}
        <b className="tabular-nums">{won(document.supplyAmount)}</b> · 부가세{" "}
        <b className="tabular-nums">{won(document.vatAmount)}</b> · 합계{" "}
        <b className="tabular-nums">{won(document.totalAmount)}원</b>
        <br />
        공급받는자 {platformName}
      </SummaryBox>
      <MLabel required>대조 결과</MLabel>
      <MSelect
        aria-label="대조 결과"
        value={result}
        onChange={(event) =>
          setResult(event.target.value as InvoiceVerifyResult)
        }
      >
        {INVOICE_VERIFY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </MSelect>
      <MHint>
        반려를 고르면 사유가{" "}
        <b className="font-semibold text-sz-n-900">쇼룸 스튜디오</b>에 그대로
        표시되고 인플루언서가 재입력합니다.
      </MHint>
      <MWarn info>
        확인하면 <b className="font-semibold">지급 보류가 풀리고</b> 인플루언서
        지급 예정일이 <b className="font-semibold">확인일 + 3영업일</b>로
        정해집니다.
      </MWarn>
    </GbModal>
  );
}

// ── M5 브랜드 세금계산서 발행본 등록 ─────────────────

/** 국세청 승인번호 — 숫자 24자리(하이픈은 있어도 없어도 된다) */
function approvalDigits(value: string): string | null {
  const trimmed = value.trim();
  if (!/^[0-9-]+$/.test(trimmed)) return null;
  const digits = trimmed.replace(/-/g, "");
  return digits.length === 24 ? digits : null;
}

/** 서버 형식 `00000000-00000000-00000000`으로 맞춘다 */
function toApprovalNumber(digits: string): string {
  return `${digits.slice(0, 8)}-${digits.slice(8, 16)}-${digits.slice(16)}`;
}

export interface BrandInvoiceErrors {
  file: string | null;
  approvalNumber: string | null;
}

/**
 * 외부 발행 서비스가 없어 운영자가 홈택스에서 발행한 뒤 여기에 등록한다(multipart).
 * 필수 3개(PDF · 승인번호 · 발행일) — 빈 값은 버튼 비활성만, 승인번호 형식 · 파일 형식/용량만 에러 문구.
 */
export function BrandInvoiceModal(props: {
  document: TaxDocument;
  isPending: boolean;
  /** 서버가 거절한 이유 — 해당 칸 아래에 보인다 */
  serverErrors: BrandInvoiceErrors;
  onClose: () => void;
  onSubmit: (payload: BrandInvoicePayload) => void;
}) {
  const { document, isPending, serverErrors, onClose, onSubmit } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [approvalNo, setApprovalNo] = useState("");
  const [approvalTouched, setApprovalTouched] = useState(false);
  const [issuedDate, setIssuedDate] = useState(() =>
    dayjs().format("YYYY-MM-DD")
  );

  const digits = approvalDigits(approvalNo);
  const showApprovalError =
    approvalTouched && approvalNo.trim() !== "" && digits === null;
  const canSubmit = Boolean(file) && digits !== null && issuedDate !== "";

  const handleFile = (selected: File | undefined) => {
    if (!selected) return;
    const isPdf =
      selected.type === "application/pdf" ||
      selected.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFile(null);
      setFileError("PDF 파일만 등록할 수 있습니다.");
      return;
    }
    if (selected.size > BRAND_INVOICE_MAX_BYTES) {
      setFile(null);
      setFileError("10MB 이하 파일만 등록할 수 있습니다.");
      return;
    }
    setFileError(null);
    setFile(selected);
  };

  const fileMessage = fileError ?? serverErrors.file;
  const approvalMessage = showApprovalError
    ? "승인번호는 숫자 24자리입니다(하이픈은 포함해도 됩니다)."
    : serverErrors.approvalNumber;

  return (
    <GbModal
      title={`${document.typeLabel} 발행본 등록 — ${document.counterpartyName}`}
      onClose={onClose}
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
              file &&
              digits &&
              onSubmit({
                documentId: document.documentId,
                file,
                approvalNumber: toApprovalNumber(digits),
                issuedDate,
              })
            }
          >
            등록
          </Btn>
        </>
      }
    >
      운영팀이 <b className="font-semibold text-sz-n-900">홈택스에서 발행한</b>{" "}
      세금계산서를 등록합니다.
      <SummaryBox>
        공급받는자 <b>{document.counterpartyName}</b> · {document.direction}
        <br />
        공급가 <b className="tabular-nums">{won(document.supplyAmount)}</b> ·
        부가세 <b className="tabular-nums">{won(document.vatAmount)}</b> · 발행
        기한 <b className="tabular-nums">{ymd(document.dueDate)}</b>
      </SummaryBox>
      <MLabel required>발행본 PDF</MLabel>
      <div
        className={cn(
          "flex items-center justify-between gap-2.5 rounded-[6px] border border-dashed bg-sz-n-50 px-3 py-2.5",
          fileMessage ? "border-sz-danger-text" : "border-sz-n-300"
        )}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          handleFile(event.dataTransfer.files[0]);
        }}
      >
        <span
          className={cn(
            "min-w-0 truncate text-[12px]",
            file ? "text-sz-n-900" : "text-sz-n-500"
          )}
        >
          {file
            ? `${file.name} · ${formatFileSize(file.size)}`
            : "PDF를 끌어다 놓거나 선택하세요 · 10MB 이하"}
        </span>
        <Btn variant="secondary" onClick={() => fileInputRef.current?.click()}>
          파일 선택
        </Btn>
        <input
          ref={fileInputRef}
          type="file"
          aria-label="발행본 PDF 선택"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
      {fileMessage && <MErr>{fileMessage}</MErr>}
      <MLabel required>국세청 승인번호</MLabel>
      <input
        className={cn(
          INPUT_CLASS,
          "w-full tabular-nums",
          approvalMessage && "border-sz-danger-text"
        )}
        aria-label="국세청 승인번호"
        aria-invalid={Boolean(approvalMessage)}
        placeholder="24자리 · 숫자와 하이픈"
        value={approvalNo}
        onChange={(event) => setApprovalNo(event.target.value)}
        onBlur={() => setApprovalTouched(true)}
      />
      {approvalMessage && <MErr>{approvalMessage}</MErr>}
      <MLabel required>발행일</MLabel>
      <input
        type="date"
        aria-label="발행일"
        className={cn(INPUT_CLASS, "w-[160px] tabular-nums")}
        value={issuedDate}
        max={dayjs().format("YYYY-MM-DD")}
        onChange={(event) => setIssuedDate(event.target.value)}
      />
      <MWarn info>
        등록하면 파트너센터 [다운로드]가 열리고 처리 이력에{" "}
        <b className="font-semibold">「발행본 등록 · 운영자」</b>로 남습니다.
        정상 등록된 건에는 이 버튼이 다시 보이지 않습니다(덮어쓰기 방지 · 정정은
        수정세금계산서로).
      </MWarn>
    </GbModal>
  );
}

// ── 원천세 신고 자료(07a 툴바) ───────────────────────

/**
 * 그 달에 인플루언서 몫이 지급된 비사업자 정산을 엑셀로 받는다(`GET …/withholding-report?month=YYYY-MM`).
 * 주민등록번호가 들어 있어 서버가 내려받을 때마다 반출 기록(운영자 · 월 · 행 수)을 남긴다.
 */
export function WithholdingReportModal(props: { onClose: () => void }) {
  const { onClose } = props;
  // 원천세는 지급한 달의 다음 달 10일까지 신고한다 — 기본값은 지난달
  const [month, setMonth] = useState(() =>
    dayjs().subtract(1, "month").format("YYYY-MM")
  );
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = async () => {
    setIsPending(true);
    setError(null);
    try {
      const blob =
        await adminSettlementService.downloadWithholdingReport(month);
      saveBlob(blob, `원천세신고자료_${month}.xlsx`);
      onClose();
    } catch (cause) {
      const { message } = await readApiError(cause);
      setError(message ?? NETWORK_ERROR_MESSAGE);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <GbModal
      title="원천세 신고 자료"
      onClose={onClose}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>
            취소
          </Btn>
          <Btn
            variant="primary"
            disabled={!/^\d{4}-\d{2}$/.test(month)}
            isLoading={isPending}
            onClick={download}
          >
            내려받기
          </Btn>
        </>
      }
    >
      그 달에{" "}
      <b className="font-semibold text-sz-n-900">
        인플루언서 몫이 지급된 비사업자
      </b>{" "}
      정산의 원천징수 합계를 엑셀로 내려받습니다(지급명세서 제출용).
      <MLabel required>지급 월</MLabel>
      <input
        type="month"
        aria-label="지급 월"
        className={cn(INPUT_CLASS, "w-[160px] tabular-nums")}
        value={month}
        max={dayjs().format("YYYY-MM")}
        onChange={(event) => setMonth(event.target.value)}
      />
      {error && <MErr>{error}</MErr>}
      <MWarn>
        파일에 <b className="font-semibold">주민등록번호</b>가 들어 있습니다 —
        내려받을 때마다 반출 기록(운영자 · 월 · 행 수)이 남습니다. 보관 · 전달에
        주의해 주세요.
      </MWarn>
    </GbModal>
  );
}
