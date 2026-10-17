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
  INVOICE_CHECK_OPTIONS,
} from "@/features/settlement/constants/params";
import type {
  BrandInvoicePayload,
  InvoiceCheckResult,
  RedistributePayload,
  SettlementDetail,
} from "@/features/settlement/types";
import { md, won, ymd, ymdhm } from "@/features/settlement/utils/format";
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

/** 시안 `.merr` — 형식 오류 · 파일 형식/용량 오류에만 쓴다(필수 미입력은 버튼 비활성만) */
function MErr(props: { children: ReactNode }) {
  return (
    <p role="alert" className="mt-1.5 text-[11px] text-sz-danger-text">
      {props.children}
    </p>
  );
}

// ── M3 재분배 ────────────────────────────────────────

/**
 * 금액을 재계산하지 않는다 — 확정 금액을 그대로 PG에 재지시한다.
 * 운영자는 계좌를 입력하지 않고 회원 정보의 갱신된 계좌를 「선택」할 뿐이다.
 */
export function RedistributeModal(props: {
  detail: SettlementDetail;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (payload: RedistributePayload) => void;
}) {
  const { detail, isPending, onClose, onSubmit } = props;
  const failure = detail.failure;
  const [account, setAccount] = useState<RedistributePayload["account"]>(
    failure?.updatedAccount ? "UPDATED" : "EXISTING"
  );
  if (!failure) return null;
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
            onClick={() => onSubmit({ account })}
          >
            재분배
          </Btn>
        </>
      }
    >
      <b className="font-semibold text-sz-n-900">{failure.recipientName}</b>{" "}
      {failure.shareLabel} 몫{" "}
      <b className="font-semibold tabular-nums text-sz-n-900">
        {won(failure.amount)}원
      </b>
      을 다시 지급합니다.
      <SummaryBox>
        반환 사유 <b>{failure.reason}</b> · PG 반환 {ymdhm(failure.returnedAt)}{" "}
        · <b>{failure.elapsedDays}일 경과</b>
        <br />
        기존 계좌 <span className="tabular-nums">{failure.account}</span>
        <br />
        확정 금액 <b className="tabular-nums">{won(failure.amount)}원</b>{" "}
        <TDim>— 재계산 없이 그대로 지급</TDim>
      </SummaryBox>
      <MLabel required>지급 계좌</MLabel>
      <MSelect
        value={account}
        onChange={(event) =>
          setAccount(event.target.value as RedistributePayload["account"])
        }
      >
        {failure.updatedAccount && (
          <option value="UPDATED">
            회원 정보의 갱신된 계좌 사용 — {failure.updatedAccount}
          </option>
        )}
        <option value="EXISTING">기존 계좌로 재시도</option>
      </MSelect>
      <MHint>
        계좌 변경은{" "}
        <b className="font-semibold text-sz-n-900">
          인플루언서가 회원 정보에서
        </b>{" "}
        합니다 — 운영자가 계좌를 입력하지 않습니다.
      </MHint>
      <MWarn>
        재분배는 <b className="font-semibold">PG에 재지시</b>하는 것이며
        플랫폼이 대금을 보관하지 않으므로{" "}
        <b className="font-semibold">즉시 입금되지 않습니다</b>(영업일 기준
        1~2일). 같은 사유로 <b className="font-semibold">2회 더 실패</b>하면 PG
        재시도가 차단되고 <b className="font-semibold">수동 이체 절차</b>로
        넘어갑니다.
      </MWarn>
    </GbModal>
  );
}

// ── M4 승인번호 대조 ─────────────────────────────────

/** 운영자는 승인번호를 입력하지 않고 대조만 한다 — 결과는 일치 / 반려 사유 3종 */
export function InvoiceCheckModal(props: {
  detail: SettlementDetail;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (result: InvoiceCheckResult) => void;
}) {
  const { detail, isPending, onClose, onSubmit } = props;
  const invoice = detail.evidence.find(
    (item) => item.kind === "INFLUENCER_INVOICE"
  );
  const [result, setResult] = useState<InvoiceCheckResult>("MATCH");
  if (!invoice) return null;
  return (
    <GbModal
      title={`승인번호 대조 — ${detail.showroomName}`}
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
        입력 승인번호 <b className="tabular-nums">{invoice.approvalNo}</b> ·{" "}
        {md(invoice.inputAt)} 입력
        <br />
        기대값 공급가 <b className="tabular-nums">{won(invoice.supply)}</b> ·
        부가세 <b className="tabular-nums">{won(invoice.vat)}</b> · 합계{" "}
        <b className="tabular-nums">{won(invoice.supply + invoice.vat)}원</b>
        <br />
        공급받는자 {detail.taxParties.platformName} ·{" "}
        <span className="tabular-nums">{detail.taxParties.platformBizNo}</span>
      </SummaryBox>
      <MLabel required>대조 결과</MLabel>
      <MSelect
        value={result}
        onChange={(event) =>
          setResult(event.target.value as InvoiceCheckResult)
        }
      >
        {INVOICE_CHECK_OPTIONS.map((option) => (
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
        정해집니다. 첨부 PDF가 있으면 스튜디오 [다운로드]도 열립니다.
      </MWarn>
    </GbModal>
  );
}

// ── M5 브랜드 세금계산서 발행본 등록 ─────────────────

/** 국세청 승인번호 — 숫자 24자리(하이픈은 있어도 된다) */
function isApprovalNoValid(value: string): boolean {
  return /^[0-9-]+$/.test(value) && value.replace(/-/g, "").length === 24;
}

/**
 * 외부 발행 서비스가 없어 운영자가 홈택스에서 발행한 뒤 여기에 등록한다.
 * 필수 3개(PDF · 승인번호 · 발행일) — 빈 값은 버튼 비활성만, 승인번호 형식 · 파일 형식/용량만 에러 문구.
 */
export function BrandInvoiceModal(props: {
  detail: SettlementDetail;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (payload: BrandInvoicePayload) => void;
}) {
  const { detail, isPending, onClose, onSubmit } = props;
  const invoice = detail.evidence.find((item) => item.kind === "BRAND_INVOICE");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [approvalNo, setApprovalNo] = useState("");
  const [approvalTouched, setApprovalTouched] = useState(false);
  const [issuedAt, setIssuedAt] = useState(() => dayjs().format("YYYY-MM-DD"));

  if (!invoice) return null;

  const approvalValid = isApprovalNoValid(approvalNo.trim());
  const showApprovalError =
    approvalTouched && approvalNo.trim() !== "" && !approvalValid;
  const canSubmit = Boolean(file) && approvalValid && issuedAt !== "";

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

  return (
    <GbModal
      title={`브랜드 세금계산서 발행본 등록 — ${detail.brandName}`}
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
              onSubmit({ file, approvalNo: approvalNo.trim(), issuedAt })
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
        공급받는자 <b>{detail.brandName}</b> ·{" "}
        <span className="tabular-nums">
          {detail.taxParties.brandBizNoMasked}
        </span>{" "}
        · 수신 이메일 {detail.taxParties.brandTaxEmail}
        <br />
        공급가 <b className="tabular-nums">{won(invoice.supply)}</b> · 부가세{" "}
        <b className="tabular-nums">{won(invoice.vat)}</b> · 발행 기한{" "}
        <b className="tabular-nums">{ymd(invoice.dueAt)}</b>
      </SummaryBox>
      <MLabel required>발행본 PDF</MLabel>
      <div
        className={cn(
          "flex items-center justify-between gap-2.5 rounded-[6px] border border-dashed bg-sz-n-50 px-3 py-2.5",
          fileError ? "border-sz-danger-text" : "border-sz-n-300"
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
            file ? "text-sz-n-900" : "text-[11px] text-sz-n-500"
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
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>
      {fileError && <MErr>{fileError}</MErr>}
      <MLabel required>국세청 승인번호</MLabel>
      <input
        className={cn(
          INPUT_CLASS,
          "w-full tabular-nums",
          showApprovalError && "border-sz-danger-text"
        )}
        placeholder="24자리 · 숫자와 하이픈"
        value={approvalNo}
        onChange={(event) => setApprovalNo(event.target.value)}
        onBlur={() => setApprovalTouched(true)}
      />
      {showApprovalError && (
        <MErr>승인번호는 숫자 24자리입니다(하이픈은 포함해도 됩니다).</MErr>
      )}
      <MLabel required>발행일</MLabel>
      <input
        type="date"
        className={cn(INPUT_CLASS, "w-[160px] tabular-nums")}
        value={issuedAt}
        max={dayjs().format("YYYY-MM-DD")}
        onChange={(event) => setIssuedAt(event.target.value)}
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
