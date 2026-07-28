/**
 * 목록 화면용 연락처 마스킹 (예: 010-1234-5678 → 010-****-5678).
 *
 * 상세 화면에서는 마스킹하지 않는다 — 심사자가 제출 서류와 대조해야 하기 때문.
 */
export function maskPhoneNumber(phoneNumber: string | null): string {
  if (!phoneNumber) {
    return "";
  }

  const parts = phoneNumber.split("-");
  if (parts.length === 3) {
    return `${parts[0]}-${"*".repeat(parts[1].length)}-${parts[2]}`;
  }

  // 하이픈이 없는 경우: 뒤 4자리만 남기고 가운데를 가린다
  const digits = phoneNumber.replace(/\D/g, "");
  if (digits.length < 8) {
    return phoneNumber;
  }
  const head = digits.slice(0, 3);
  const tail = digits.slice(-4);
  return `${head}-${"*".repeat(digits.length - 7)}-${tail}`;
}
