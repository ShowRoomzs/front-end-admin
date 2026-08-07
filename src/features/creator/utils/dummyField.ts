/**
 * 본인인증(PASS) 미연동 구간의 더미값 표시.
 *
 * 백엔드 `CreatorApplicationService.apply()`는 PASS 연동 전까지 모든 신청서에
 * 아래 고정값을 그대로 저장한다(`CreatorApplicationDetailResponse.DUMMY_*`).
 * 이 값이 실명·생년월일·연락처로 화면에 그대로 뜨면 운영자가 실제 인증 정보로
 * 오인하므로 `-더미-`로 바꿔 보여준다.
 *
 * 값을 비교해서 치환하므로, 백엔드가 PASS를 붙여 진짜 값을 내려주기 시작하면
 * 프론트를 고치지 않아도 그 즉시 실제 값이 표시된다.
 */
const DUMMY_VALUES = new Set(["홍길동", "1990-01-01", "010-1234-5678"]);

const DUMMY_LABEL = "-더미-";

export function markDummy(value: string | null | undefined) {
  if (!value) {
    return value ?? null;
  }
  return DUMMY_VALUES.has(value) ? DUMMY_LABEL : value;
}
