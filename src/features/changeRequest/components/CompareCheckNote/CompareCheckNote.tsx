import type {
  ChangeRequestCompareItem,
  ChangeRequestHolderCheck,
  ChangeRequestType,
} from "@/features/changeRequest/services/changeRequestService";
import {
  formatBirthday,
  isAccountChange,
} from "@/features/changeRequest/utils/requester";
import type { ReactNode } from "react";

interface CompareCheckNoteProps {
  type: ChangeRequestType;
  changedFieldLabels: Array<string>;
  holderCheck: ChangeRequestHolderCheck | null;
  compareItems?: Array<ChangeRequestCompareItem> | null;
}

/**
 * 시안 `.chk-note` — 서류에서 **무엇을 맞춰봐야 하는지** 운영자에게 못 박는 안내 박스.
 *
 * 대조표는 값을 보여줄 뿐이고, 이 박스가 "이 요청에서 실수하기 쉬운 지점"을 짚는다.
 * 계좌 변경(브랜드 정산 계좌 · 인플루언서 계좌)은 잘못 승인하면 돈이 엉뚱한 곳으로 나가므로
 * 유형 자체를 위험색으로 둔다. 대조 기준만 다르다 — 브랜드는 사업자 상호, 인플루언서는 본인 실명(기-22).
 */
export default function CompareCheckNote(props: CompareCheckNoteProps) {
  const { type, changedFieldLabels, holderCheck, compareItems } = props;
  const isDanger = isAccountChange(type);

  return (
    <div
      className={`flex gap-[9px] rounded-[6px] px-3.5 py-3 text-[11px] leading-relaxed ${
        isDanger
          ? "bg-sz-danger-bg text-sz-n-700"
          : "bg-sz-warning-bg text-sz-n-700"
      }`}
    >
      <span
        className={`mt-px inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
          isDanger ? "bg-sz-danger-text" : "bg-sz-warning-text"
        }`}
      >
        !
      </span>
      <div>
        {renderBody(type, changedFieldLabels, holderCheck, compareItems ?? [])}
      </div>
    </div>
  );
}

function B({ children }: { children: ReactNode }) {
  return <b className="text-sz-n-900">{children}</b>;
}

function renderBody(
  type: ChangeRequestType,
  changedFieldLabels: Array<string>,
  holderCheck: ChangeRequestHolderCheck | null,
  compareItems: Array<ChangeRequestCompareItem>
) {
  // 본인확인 실명 — 인플루언서 건은 서버가 currentHolder(= 실명)로 준다
  const realName = holderCheck?.currentHolder;

  switch (type) {
    case "SETTLEMENT_ACCOUNT":
      return (
        <>
          <B>대조 확인 항목 — 오지급 위험</B>
          <br />
          통장 사본의 <B>예금주</B>가 사업자등록증 상호
          {holderCheck?.companyName && (
            <>
              (<B>{holderCheck.companyName}</B>)
            </>
          )}
          와 일치하는지 반드시 확인하세요. 법인 사업자는 <B>법인 명의 계좌만</B>{" "}
          등록할 수 있습니다. 승인 즉시 다음 정산 회차부터 이 계좌로 지급됩니다.
          {holderCheck?.mismatch && (
            <>
              {" "}
              <b className="text-sz-danger-text">
                현재 요청한 예금주(&ldquo;{holderCheck.requestedHolder}&rdquo;)
                가 상호와 다릅니다.
              </b>
            </>
          )}
        </>
      );
    case "CREATOR_ACCOUNT":
      // C4b — 처리 뒤에는 실명이 마스킹돼 내려온다(그래도 같은 문장으로 둔다)
      return (
        <>
          <B>대조 확인 항목 — 오지급 위험</B>
          <br />
          통장 사본의 <B>예금주</B>가 <B>본인 실명</B>
          {realName && (
            <>
              (본인인증 이름 <B>{realName}</B>)
            </>
          )}
          과 일치하는지 확인하세요. 타인 명의 계좌는 등록할 수 없습니다. 승인
          즉시 다음 지급부터 이 계좌로 지급됩니다.
          {holderCheck?.mismatch && (
            <>
              {" "}
              <b className="text-sz-danger-text">
                요청한 예금주가 본인 실명과 다릅니다.
              </b>
            </>
          )}
        </>
      );
    case "TO_BUSINESS":
      // C3a — 국세청 상태 조회는 이 화면에 붙이지 않는다(확인 필요 ⓖ · 홈택스 수동)
      return (
        <>
          <B>대조 확인 항목</B>
          <br />
          사업자등록증의{" "}
          <B>대표자명이 본인확인 실명{realName ? `(${realName})` : ""}</B>과
          같은지, 사업자등록번호가 요청 값과 같은지 확인하세요. 등록증의{" "}
          <B>개업일</B>이 요청일 이후면 아직 효력이 없는 번호입니다.{" "}
          <B>국세청 사업자 상태(계속 · 휴업 · 폐업)</B> 조회는 이 화면에서 하지
          않습니다 — 홈택스에서 직접 확인합니다.
        </>
      );
    case "TO_INDIVIDUAL": {
      // C3b — 주민등록번호는 마스킹 그대로, 본인 여부는 성명 · 생년월일로만 대조한다
      const birthday = formatBirthday(
        compareItems.find((item) => item.key === "BIRTHDAY")?.value
      );
      const identity = [realName, birthday].filter(Boolean).join(" · ");
      return (
        <>
          <B>대조 확인 항목</B>
          <br />
          폐업사실증명원의 <B>대표자 성명 · 생년월일</B>이 본인확인 정보
          {identity ? `(${identity})` : ""}와 같은지, <B>폐업일</B>이 요청일
          이전인지 확인하세요. 주민등록번호는 마스킹 상태로 두고{" "}
          <B>성명 · 생년월일로만</B> 대조합니다. 사업자 등록이 살아 있는 채로
          비사업자 원천징수를 하면 소득 구분이 틀어집니다.
        </>
      );
    }
    default:
      return (
        <>
          <B>대조 확인 항목</B>
          <br />
          첨부된 사업자등록증의{" "}
          <B>
            {changedFieldLabels.length > 0
              ? changedFieldLabels.join("·")
              : "변경 항목"}
          </B>
          가 변경 요청 값과 일치하는지 확인하세요.{" "}
          <B>사업자등록번호는 변경 요청 대상이 아니므로</B> 브랜드가 값을 넣을
          수 없습니다 — 번호가 바뀐 경우는 정보 변경이 아니라{" "}
          <B>신규 입점 심사</B> 대상입니다.
        </>
      );
  }
}
