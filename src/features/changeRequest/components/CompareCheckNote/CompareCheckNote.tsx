import type {
  ChangeRequestHolderCheck,
  ChangeRequestType,
} from "@/features/changeRequest/services/changeRequestService";

interface CompareCheckNoteProps {
  type: ChangeRequestType;
  changedFieldLabels: Array<string>;
  holderCheck: ChangeRequestHolderCheck | null;
}

/**
 * 시안 `.chk-note` — 서류에서 **무엇을 맞춰봐야 하는지** 운영자에게 못 박는 안내 박스.
 *
 * 대조표는 값을 보여줄 뿐이고, 이 박스가 "이 요청에서 실수하기 쉬운 지점"을 짚는다.
 * 정산 계좌는 잘못 승인하면 돈이 엉뚱한 곳으로 나가므로 유형 자체를 위험색으로 둔다.
 */
export default function CompareCheckNote(props: CompareCheckNoteProps) {
  const { type, changedFieldLabels, holderCheck } = props;
  const isSettlement = type === "SETTLEMENT_ACCOUNT";

  return (
    <div
      className={`flex gap-[9px] rounded-[6px] px-3.5 py-3 text-[11px] leading-relaxed ${
        isSettlement
          ? "bg-sz-danger-bg text-sz-n-700"
          : "bg-sz-warning-bg text-sz-n-700"
      }`}
    >
      <span
        className={`mt-px inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
          isSettlement ? "bg-sz-danger-text" : "bg-sz-warning-text"
        }`}
      >
        !
      </span>
      <div>
        {isSettlement ? (
          <>
            <b className="text-sz-n-900">대조 확인 항목 — 오지급 위험</b>
            <br />
            통장 사본의 <b className="text-sz-n-900">예금주</b>가 사업자등록증
            상호
            {holderCheck?.companyName && (
              <>
                (<b className="text-sz-n-900">{holderCheck.companyName}</b>)
              </>
            )}
            와 일치하는지 반드시 확인하세요. 법인 사업자는{" "}
            <b className="text-sz-n-900">법인 명의 계좌만</b> 등록할 수 있습니다.
            승인 즉시 다음 정산 회차부터 이 계좌로 지급됩니다.
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
        ) : (
          <>
            <b className="text-sz-n-900">대조 확인 항목</b>
            <br />
            첨부된 사업자등록증의{" "}
            <b className="text-sz-n-900">
              {changedFieldLabels.length > 0
                ? changedFieldLabels.join("·")
                : "변경 항목"}
            </b>
            가 변경 요청 값과 일치하는지 확인하세요.{" "}
            <b className="text-sz-n-900">
              사업자등록번호는 변경 요청 대상이 아니므로
            </b>{" "}
            브랜드가 값을 넣을 수 없습니다 — 번호가 바뀐 경우는 정보 변경이 아니라{" "}
            <b className="text-sz-n-900">신규 입점 심사</b> 대상입니다.
          </>
        )}
      </div>
    </div>
  );
}
