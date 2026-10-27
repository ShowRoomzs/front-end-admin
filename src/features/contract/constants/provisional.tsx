/*
  【잠정】 문구 — 시안 ui-admin-01 rev.9의 기-05(계약 성립 시점 · 해지) · 기-06(직권 취소 동의 확인).
  변호사 확인 뒤 바뀔 수 있어 화면 컴포넌트에 흩어 두지 않고 여기 한 곳에 모은다(CHANGELOG 「구조는 만들되
  문구와 조건은 설정값으로」). 강조(굵게) 위치까지 시안 그대로다.
*/

/** C4 공구 생성 경고 — 기-05 성립 시점 */
export const CREATE_GROUP_BUY_WARN = (
  <>
    <b>되돌릴 수 없습니다.</b> 처리하는 즉시 <b>공구가 생성</b>됩니다 — 계약은
    양측 서명 완료 시점에 <b>이미 성립</b>했습니다. 서명 일시가 틀렸다면{" "}
    <b>지금이 마지막 정정 기회</b>입니다.
  </>
);

/** C6 직권 취소 — 상대방 동의 확인 체크(기-06) */
export const CANCEL_CONSENT_CHECK = (
  <>
    <b className="font-semibold">상대방 동의</b>를 운영팀 채널에서 확인했습니다{" "}
    <span className="text-[11px] text-sz-n-500">
      — 요청하지 않은 쪽의 동의가 없으면 취소할 수 없습니다
    </span>
  </>
);

/** C6 직권 취소 경고 — 결과는 양측 운영팀 채널 카드(기-06) */
export const CANCEL_WARN = (
  <>
    취소는 <b>종결 상태</b>입니다 — 되돌릴 수 없고 같은 조건으로 진행하려면
    브랜드가 <b>새 계약을 작성</b>해야 합니다. 사유와 설명은{" "}
    <b>양측 운영팀 채널에 카드</b>로 전달됩니다. 이미 서명한 쪽의 서명도 효력을
    잃습니다.
  </>
);

/** C7 해지 처리 — 확인 체크 2개(기-05 · 기-06) */
export const TERMINATE_CONSENT_CHECK = (
  <>
    <b className="font-semibold">상대방 동의</b>를 운영팀 채널에서 확인했습니다
  </>
);

export const TERMINATE_NOT_OPENED_CHECK = (
  <>
    공구가 <b className="font-semibold">아직 오픈되지 않았음</b>을 확인했습니다
  </>
);

/** C7 해지 처리 경고 */
export const TERMINATE_WARN = (
  <>
    해지는 <b>종결 상태</b>입니다 — <b>생성된 공구가 함께 종료</b>되고 되돌릴 수
    없습니다. 사유와 설명은 <b>양측 운영팀 채널에 카드</b>로 전달됩니다.
  </>
);

/** B5 레일 — [해지 처리] 아래 힌트 */
export const TERMINABLE_HINT = (
  <>
    <b className="font-semibold">공구 오픈 전</b>에는 당사자 요청과 상대방
    동의를 확인해 계약을 <b className="font-semibold">해지</b>할 수 있습니다.
    오픈 후 중단은 <b className="font-semibold">공구 관리의 중단</b>입니다.
  </>
);

/** B7 레일 — 해지 결과 힌트 */
export const TERMINATED_HINT = (
  <>
    당사자 요청 · 상대방 동의로 <b className="font-semibold">해지</b>됐습니다 —
    되돌릴 수 없습니다. 같은 조건으로 진행하려면 브랜드가{" "}
    <b className="font-semibold">새 계약을 작성</b>해야 합니다.
  </>
);

/** B7 서명 진행 카드 캡션 */
export const TERMINATED_CARD_NOTE = "양측 서명 완료 · 계약 성립 후 해지로 종결";

/** B7 · 이력 — 서명 현황 저장으로 양측 서명이 찬 줄에 붙는 성립 표시(기-05) */
export const ESTABLISHED_SUFFIX = "(계약 성립)";
