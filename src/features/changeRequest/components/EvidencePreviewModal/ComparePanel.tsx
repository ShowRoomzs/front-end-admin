import { formatDateTimeShort } from "@/common/utils/formatDate";
import type {
  ChangeDiffRow,
  ChangeRequestApprovalImpact,
  ChangeRequestCompareItem,
  ChangeRequestHolderCheck,
  ChangeRequestReferenceItem,
  ChangeRequestType,
} from "@/features/changeRequest/services/changeRequestService";
import {
  formatBirthday,
  isBusinessTypeChange,
} from "@/features/changeRequest/utils/requester";
import type { ReactNode } from "react";

interface ComparePanelProps {
  type: ChangeRequestType;
  diffRows: Array<ChangeDiffRow>;
  referenceItems: Array<ChangeRequestReferenceItem>;
  holderCheck: ChangeRequestHolderCheck | null;
  compareItems?: Array<ChangeRequestCompareItem> | null;
  approvalImpact?: ChangeRequestApprovalImpact | null;
}

/**
 * 미리보기 우측 대조 패널(C5 · C5b · C6).
 *
 * - 브랜드 사업자 정보(C5) · 정산 계좌(C6) · 인플루언서 계좌(C4b → C6 재사용): 항목별 `현재 값 → 요청 값` 쌍
 *   + 대조 기준(사업자 정보 / 본인 인증 정보).
 * - 인플루언서 사업자 구분 변경(C5b): 서버가 서류와 맞출 값(`compareItems`)을 따로 준다 — 성명 · 생년월일 ·
 *   사업자등록번호 · 개업일/폐업일. 「일치」는 서버가 확인한 행(`serverCheck = MATCH`)에만 붙인다.
 *   주민등록번호는 패널에서도 마스킹 그대로다(서류에 전체 번호가 없어 대조 대상이 아니다).
 */
export default function ComparePanel(props: ComparePanelProps) {
  const { type } = props;

  return isBusinessTypeChange(type) ? (
    <BusinessTypePanel {...props} />
  ) : (
    <RequestValuePanel {...props} />
  );
}

function SectionTitle({
  children,
  first,
}: {
  children: ReactNode;
  first?: boolean;
}) {
  return (
    <div
      className={`mb-2 border-b border-sz-n-200 pb-1.5 text-[11px] font-semibold text-sz-n-500 ${
        first ? "" : "mt-4"
      }`}
    >
      {children}
    </div>
  );
}

function PlainRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-sz-n-100 py-2.5 last:border-b-0">
      <div className="mb-0.5 text-[11px] text-sz-n-500">{label}</div>
      <div className="text-[13px] font-semibold leading-snug text-sz-n-900">
        {children}
      </div>
    </div>
  );
}

function Note({
  tone,
  children,
}: {
  tone: "info" | "warn";
  children: ReactNode;
}) {
  return tone === "warn" ? (
    <div className="mt-4 flex gap-[7px] rounded-[6px] bg-sz-danger-bg px-3 py-2.5 text-[11px] leading-relaxed text-sz-danger-text">
      <span>!</span>
      <span>{children}</span>
    </div>
  ) : (
    <div className="mt-4 flex gap-[7px] rounded-[6px] bg-sz-n-100 px-3 py-2.5 text-[11px] leading-relaxed text-sz-n-600">
      <span>ⓘ</span>
      <span>{children}</span>
    </div>
  );
}

/** C5 · C6 — 요청 값 대조(브랜드 2종 · 인플루언서 계좌) */
function RequestValuePanel(props: ComparePanelProps) {
  const { type, diffRows, referenceItems, holderCheck } = props;
  const isCreatorAccount = type === "CREATOR_ACCOUNT";
  const isAccount = type === "SETTLEMENT_ACCOUNT" || isCreatorAccount;
  // 인플루언서 계좌의 예금주는 판정 행(CHECK)이라 changed=false로 오지만 통장 사본과 맞춰야 할 값이다
  const rows = diffRows.filter(
    (row) => row.changed || (isCreatorAccount && row.source === "CHECK")
  );

  return (
    <>
      <SectionTitle first>서류와 대조할 요청 값</SectionTitle>
      {rows.length === 0 ? (
        <p className="py-2.5 text-[12px] text-sz-n-500">
          변경 요청된 항목이 없습니다.
        </p>
      ) : (
        rows.map((row) => (
          <div
            key={row.fieldKey}
            className="border-b border-sz-n-100 py-2.5 last:border-b-0"
          >
            <div className="mb-0.5 text-[11px] text-sz-n-500">{row.label}</div>
            <div className="mb-px text-[11px] text-sz-n-500 line-through decoration-sz-n-400">
              {row.currentValue || "—"}
            </div>
            <div className="text-[13px] font-semibold leading-snug text-sz-accent-600">
              {row.requestedValue || "—"}
            </div>
          </div>
        ))
      )}

      {referenceItems.length > 0 && (
        <>
          <SectionTitle>
            {isCreatorAccount
              ? "대조 기준 (본인 인증 정보)"
              : isAccount
                ? "대조 기준 (사업자 정보)"
                : "참고 항목 (변경 대상 아님)"}
          </SectionTitle>
          {referenceItems.map((item) => (
            <div
              key={item.label}
              className="border-b border-sz-n-100 py-2.5 last:border-b-0"
            >
              <div className="mb-0.5 text-[11px] text-sz-n-500">
                {item.label}
              </div>
              <div className="text-[13px] font-medium text-sz-n-900">
                {item.value || "—"}
              </div>
            </div>
          ))}
        </>
      )}

      {holderCheck?.mismatch ? (
        isCreatorAccount ? (
          <Note tone="warn">
            <b>예금주 불일치 주의</b> — 요청 예금주가{" "}
            <b>{holderCheck.requestedHolder ?? requestedHolderOf(diffRows)}</b>
            인데 본인 인증 실명은 <b>{holderCheck.currentHolder}</b>입니다. 타인
            명의 계좌는 등록할 수 없으므로, 통장 사본의 예금주 표기를 확인하고
            다르면 반려하세요.
          </Note>
        ) : (
          <Note tone="warn">
            <b>예금주 불일치 주의</b> — 요청 예금주가{" "}
            <b>{holderCheck.requestedHolder}</b>인데 사업자등록증 상호는{" "}
            <b>{holderCheck.companyName}</b>입니다. 법인 사업자는 법인 명의
            계좌만 등록할 수 있으므로, 통장 사본의 예금주 표기를 확인하고 다르면
            반려하세요.
          </Note>
        )
      ) : (
        <Note tone="info">
          {isCreatorAccount ? (
            <>
              위 <b>대조 기준</b>은 통장 사본의 예금주가 본인 실명과 맞는지
              확인하는 데 씁니다.
            </>
          ) : isAccount ? (
            <>
              위 <b>대조 기준</b>은 예금주가 사업자 명의와 맞는지 확인하는 데
              씁니다.
            </>
          ) : (
            <>
              위 <b>참고 항목</b>은 변경 대상이 아니지만 <b>동일 사업자인지</b>{" "}
              확인하는 데 씁니다 — 사업자등록번호가 다르면 반려하고 신규
              입점으로 안내하세요.
            </>
          )}
        </Note>
      )}
    </>
  );
}

/** 인플루언서 계좌 상세는 예금주를 holderCheck가 아니라 대조표 CHECK 행의 요청 값으로 준다 */
function requestedHolderOf(diffRows: Array<ChangeDiffRow>) {
  return diffRows.find((row) => row.source === "CHECK")?.requestedValue ?? "—";
}

/** C5b — 사업자 구분 변경(사업자등록증 · 폐업사실증명원)과 본인확인 정보 대조 */
function BusinessTypePanel(props: ComparePanelProps) {
  const { type, referenceItems, compareItems, approvalImpact } = props;
  const toIndividual = type === "TO_INDIVIDUAL";

  return (
    <>
      <SectionTitle first>서류와 대조할 값 (본인확인 정보)</SectionTitle>
      {(compareItems ?? []).map((item) => (
        <PlainRow key={item.key} label={item.label}>
          <CompareValue item={item} toIndividual={toIndividual} />
        </PlainRow>
      ))}

      {referenceItems.length > 0 && (
        <>
          <SectionTitle>참고 항목 (대조 대상 아님)</SectionTitle>
          {referenceItems.map((item) => (
            <PlainRow key={item.label} label={item.label}>
              {item.value || "—"}
              {referenceSuffix(item, approvalImpact)}
            </PlainRow>
          ))}
        </>
      )}

      <Note tone="info">
        {toIndividual ? (
          <>
            폐업사실증명원에는 주민등록번호 전체가 없어 <b>성명 · 생년월일</b>로
            본인 여부를 대조합니다. <b>폐업일이 요청일 이후</b>이거나
            사업자등록번호가 다르면 반려하세요.
          </>
        ) : (
          <>
            사업자등록증의 <b>대표자명</b>이 본인확인 실명과 같은지 대조합니다.{" "}
            <b>개업일이 요청일 이후</b>이거나 사업자등록번호가 요청 값과 다르면
            반려하세요.
          </>
        )}
      </Note>
    </>
  );
}

function CompareValue({
  item,
  toIndividual,
}: {
  item: ChangeRequestCompareItem;
  toIndividual: boolean;
}) {
  const value =
    item.key === "BIRTHDAY" ? formatBirthday(item.value) : item.value;

  // 개업일 · 폐업일 — 서버는 값을 모른다(서류에만 있다). 기준 시각만 준다
  if (!value && item.mustBeBefore) {
    return (
      <span className="font-medium text-sz-n-700">
        서류에서 확인 · 요청일({formatDateTimeShort(item.mustBeBefore)}) 이전
      </span>
    );
  }
  if (item.serverCheck === "MISMATCH") {
    return <span className="text-sz-danger-text">{value || "—"} · 불일치</span>;
  }
  if (item.serverCheck === "MATCH") {
    return <>{value || "—"} · 일치</>;
  }
  // 비사업자 전환의 사업자등록번호는 요청 값이 아니라 지금 등록된 번호다(C5b)
  if (toIndividual && item.key === "BUSINESS_REG_NUMBER") {
    return <>{value || "—"} · 현재 등록값</>;
  }
  return <>{value || "—"}</>;
}

function referenceSuffix(
  item: ChangeRequestReferenceItem,
  approvalImpact?: ChangeRequestApprovalImpact | null
) {
  if (item.label === "주민등록번호") {
    return " · 마스킹 유지";
  }
  if (
    item.label === "정산 계좌 예금주" &&
    approvalImpact?.accountChangeRequired
  ) {
    return " · 승인 후 실명 계좌 필요";
  }
  return null;
}
