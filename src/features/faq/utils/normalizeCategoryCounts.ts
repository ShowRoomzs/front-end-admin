import type { FaqCategoryCounts } from "@/features/faq/types/faq";

/**
 * 목록 응답의 카테고리 건수를 `{ 카테고리키: 건수 }` 한 가지 모양으로 눌러 준다.
 *
 * 서버가 배열(`[{ key, count }, ...]`)로 주는데 객체 맵으로 착각하고 `Object.entries`를
 * 돌리면 인덱스 "0".."5"가 키로 잡히고 값이 객체라, 합계가 `0[object Object]...`라는
 * 문자열이 돼 탭 배지에 그대로 찍힌다. 실제로 그렇게 깨졌었다.
 *
 * 배포 서버와 로컬 저장소의 FAQ API 버전이 서로 다르고 응답 계약이 이 저장소에 없어,
 * 양쪽 모양을 모두 받아들이고 숫자로 확인된 값만 통과시킨다. 화면이 서버 버전에
 * 끌려다니지 않게 하는 게 목적이므로, 계약이 확정되면 이 함수만 좁히면 된다.
 */

const KEY_FIELDS = ["key", "category", "categoryKey", "name"] as const;
const COUNT_FIELDS = ["count", "totalCount", "total", "cnt"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickString(
  row: Record<string, unknown>,
  fields: ReadonlyArray<string>
) {
  for (const field of fields) {
    const value = row[field];
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }
  return undefined;
}

function pickNumber(
  row: Record<string, unknown>,
  fields: ReadonlyArray<string>
) {
  for (const field of fields) {
    const value = row[field];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

export function normalizeCategoryCounts(
  raw: unknown
): FaqCategoryCounts | undefined {
  if (Array.isArray(raw)) {
    const entries = raw.reduce<Array<[string, number]>>((acc, item) => {
      if (!isRecord(item)) {
        return acc;
      }
      const key = pickString(item, KEY_FIELDS);
      const count = pickNumber(item, COUNT_FIELDS);
      if (key !== undefined && count !== undefined) {
        acc.push([key, count]);
      }
      return acc;
    }, []);

    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  if (isRecord(raw)) {
    const entries = Object.entries(raw).filter(
      (entry): entry is [string, number] =>
        typeof entry[1] === "number" && Number.isFinite(entry[1])
    );

    return entries.length > 0 ? Object.fromEntries(entries) : undefined;
  }

  // 필드 자체가 없는 서버 버전 — 배지를 그리지 않는다
  return undefined;
}
