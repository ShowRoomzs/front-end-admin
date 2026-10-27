import type { PostPolicyClause } from "@/features/post/types";

/*
  【잠정】 · 운영정책 위임 문구를 한 곳에 모은다.

  - 근거 규정 조항 번호 · 문구는 운영정책 문서가 아직 없어 가정값이다(시안 rev.7 기-24 · 54 설계 0-4).
    조항 목록 자체는 서버 `GET /posts/policy-clauses`가 내리고, 지난 조치의 문구는 조치 시점 스냅샷(`policyRef`)을 그대로 보인다.
  - 이의 신청 기한(7일) · 심사 기한(3영업일) · 반려 유예(7일) · 보관(N개월)은 숫자를 하드코딩하지 않는다 —
    상세 응답 `policy`(설정 post.*)에서 받는다. 값이 오지 않으면 「N일」처럼 자리만 둔다.
*/

/** 근거 규정이 실린 문서 · 장 — 목록 머리 버튼 · 근거 규정 안내 모달 제목 */
export const POLICY_CHAPTER = "서비스 운영정책 — 커뮤니티 장";

/** 게시물 비율 허용 범위 — 스튜디오 업로드 규칙(첫 사진 기준) */
export const ASPECT_RATIO_RULE = "첫 사진 기준 · 허용 1.91:1~4:5";

/** 비공개 보관 기간 근거 대기 — 시안 C8 · C10 「(N개월 · 약관 근거 조항 필요 · 법률 자문 대기)」 */
export const RETENTION_PENDING_NOTE = "약관 근거 조항 필요 · 법률 자문 대기";

/**
 * 같은 사유 안에서 조항으로 갈라 읽는 꼬리표 — 「허위 · 과장 정보(의약품 오인)」.
 * 「의료적 효능 표현」은 별도 사유가 아니라 허위 · 과장 정보의 근거 규정(3조 4항)으로 구분한다(rev.3 ①).
 */
export const CLAUSE_SHORT_TAG: Partial<Record<PostPolicyClause, string>> = {
  ARTICLE_3_4: "의약품 오인",
};

/** 「(3조 4항)」 — 조항 코드에서 번호만 뽑는다. 문구가 바뀌어도 코드 체계는 서버 enum을 따른다 */
export const CLAUSE_NUMBER: Record<PostPolicyClause, string> = {
  ARTICLE_3_2: "3조 2항",
  ARTICLE_3_4: "3조 4항",
  ARTICLE_4_1: "4조 1항",
  ARTICLE_4_3: "4조 3항",
  ARTICLE_5: "5조",
};

/** 정책값이 오지 않았을 때 숫자 자리 */
export const POLICY_PLACEHOLDER = "N";
