/**
 * 시안 `.msel` — 모달 안 셀렉트(높이 32px)의 화살표.
 *
 * 브라우저 기본 화살표는 OS·브라우저마다 위치와 모양이 달라 시안과 어긋난다
 * (가장자리에 바짝 붙어 그려진다). 시안은 화살표를 직접 그려 **오른쪽에서 10px**
 * 안쪽에 두므로, `appearance-none`으로 기본 화살표를 지우고 이 배경을 대신 깐다.
 *
 * Tailwind 임의값으로는 데이터 URI가 파싱되지 않아 인라인 스타일로 넣는다.
 * 함께 쓸 클래스: `h-8 appearance-none py-1.5 pl-2.5 pr-[30px]`
 *
 * [DS v1.2] 채워진 삼각형 → **스트로크 셰브론**으로 교체하고 높이를 36 → 32px로 낮췄다.
 * 파트너센터가 rev.8에서 먼저 옮겨간 규격이고, 어드민도 여기에 맞춘다.
 *
 * 목록 툴바 셀렉트도 이 화살표를 쓴다(세 앱 합의 11-21 — 시안 `.sel-sm` 28px 대신
 * DS 32px · 13px, `dsStyle.ts`의 `SELECT_TOOLBAR_CLASS`와 함께).
 */
export const MODAL_SELECT_CHEVRON_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'><path d='M1 1L5 5L9 1' stroke='%235B5F68' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
} as const;
