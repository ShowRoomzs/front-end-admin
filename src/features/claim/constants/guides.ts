import type { ClaimDetail } from "@/features/claim/types";

/*
  「운영자 조치」 카드의 안내 문구 — 조치할 수 없는 건에서만 보인다. `**굵게**` 표기는 화면에서 <b>로 바뀐다(Emphasis).

  이 화면에서 운영자가 실행하는 일은 반려 이의 인용 · 검수 무응답 환불 둘뿐이다(둘 다 서버 판단값으로 폼이 열린다).
  나머지 단계는 브랜드·소비자의 일이라 「조치할 것이 없습니다」와 그 이유만 적는다 —
  독촉 버튼은 두지 않는다(기한을 넘기면 시스템이 자동으로 알린다).
*/

const NONE = "조치할 것이 없습니다 — ";

export function operatorGuide(detail: ClaimDetail): string {
  const row = detail.claim.summary;
  if (row.openedByOperator && row.stage === "COLLECT_WAIT") {
    return "개설 뒤로는 **일반 반품과 같은 흐름**입니다 — 소비자 회수 송장 입력 → 브랜드 검수 → 통과 시 PG 자동 환불. 브랜드가 검수에서 반려하면 소비자 이의는 반려 보류 건과 같은 경로로 받습니다.";
  }
  if (row.outcome) {
    switch (row.outcome.code) {
      case "REFUND_PENDING":
        return `${NONE}환불 대기 중입니다. 운영자 사유 환불로 편입된 건은 **환불 관리**에서 재확인 후 실행됩니다.`;
      case "RESHIPPING":
        return `${NONE}재발송이 나갔고 도착하면 자동으로 종결됩니다.`;
      case "REFUNDED":
        return `${NONE}환불로 종결됐습니다.`;
      case "EXCHANGED":
        return `${NONE}교환이 끝났고 구매확정 타이머는 7일 새로 시작됩니다.`;
      default:
        return `${NONE}종결된 건입니다.`;
    }
  }
  switch (row.stage) {
    case "COLLECT_WAIT":
      return `${NONE}회수 송장 입력은 **소비자**의 일입니다. 송장 7일 미입력은 자동 취소됩니다.`;
    case "COLLECTING":
      return `${NONE}회수는 소비자와 택배사의 일이고, 입고 확인은 **브랜드**가 합니다.`;
    case "INSPECTION":
      return row.overdue
        ? `${NONE}검수는 **브랜드**의 일이고 기한 경과는 **시스템이 자동으로 알립니다**. 자동 알림이 대행 조건 횟수에 닿으면 이 자리에서 **검수 무응답 환불**을 열 수 있습니다.`
        : `${NONE}검수는 **브랜드**의 일이고, 기한(입고 + 2영업일)을 넘기면 **시스템이 자동으로 알립니다**.`;
    case "RESHIP":
      return `${NONE}재발송은 **브랜드**의 일입니다.`;
    case "REJECT_HOLD":
      return row.type === "EXCHANGE"
        ? `${NONE}교환 반려에 대한 이의 인용은 아직 받지 않습니다(기획 확정 전). 소비자 이의는 **1:1 문의 답변**으로 안내합니다.`
        : `${NONE}소비자의 재발송비 결제를 기다리는 중입니다. 소비자 이의가 들어오면 이 자리에서 **운영자 사유 환불**로 받습니다.`;
    default:
      return `${NONE}종결된 건입니다.`;
  }
}
