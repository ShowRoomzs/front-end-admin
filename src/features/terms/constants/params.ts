import type {
  TermsListParams,
  TermsTarget,
  TermsType,
  TermsTypeFilter,
} from "@/features/terms/types/terms";

export const TERMS_PAGE_SIZES = [20, 50, 100];

export const TERMS_INITIAL_PARAMS: TermsListParams = {
  page: 1,
  size: TERMS_PAGE_SIZES[0],
  type: "ALL",
  keyword: "",
};

interface TabDef {
  label: string;
  value: TermsTypeFilter;
}

/** 유형 탭 4종 — 서버 `AdminTermsTypeFilter`와 순서까지 같다 */
export const TERMS_TYPE_TABS: Array<TabDef> = [
  { label: "전체", value: "ALL" },
  { label: "이용 약관", value: "TERMS_OF_SERVICE" },
  { label: "개인정보처리방침", value: "PRIVACY_POLICY" },
  { label: "마케팅 동의", value: "MARKETING_CONSENT" },
];

/**
 * 등록 화면의 유형·대상 셀렉트 옵션.
 *
 * 조회 옵션 엔드포인트가 없어 프론트가 들고 있다 — 서버 `TermsType`·`TermsTarget`
 * enum과 1:1이므로 값을 늘릴 때는 BE enum을 먼저 확인할 것.
 */
export const TERMS_TYPE_OPTIONS: Array<{ code: TermsType; label: string }> = [
  { code: "TERMS_OF_SERVICE", label: "이용 약관" },
  { code: "PRIVACY_POLICY", label: "개인정보처리방침" },
  { code: "MARKETING_CONSENT", label: "마케팅 동의" },
];

export const TERMS_TARGET_OPTIONS: Array<{ code: TermsTarget; label: string }> =
  [
    { code: "ALL", label: "전체" },
    { code: "USER", label: "소비자" },
    { code: "BRAND", label: "브랜드" },
    { code: "INFLUENCER", label: "인플루언서" },
  ];

/** 최초 등록 버전 — 입력받지 않는다. 고르게 하면 `v0.9` 같은 값이 들어온다(§21-5) */
export const TERMS_FIRST_VERSION = "v1.0";

/** 사전 고지 기간 — **임시값이다.** 법률 검토 대기(§21-7 미결 2번) */
export const TERMS_NOTICE_PERIOD_DAYS = 21;
