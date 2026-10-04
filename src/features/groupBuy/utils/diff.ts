/*
  게시물 판본 대조 — 서버는 차분을 계산하지 않고 판본 원문만 내린다(PostRevisionItem).
  게시물은 문단 하나가 길어 줄 단위로 비교하면 한 글자만 바뀌어도 문단 전체가 바뀐 것으로 보인다.
  그래서 문장(마침표·물음표·느낌표 뒤 공백, 줄바꿈) 단위로 끊어 LCS로 맞춘다.
*/

export type DiffKind = "same" | "removed" | "added";

export interface DiffPart {
  text: string;
  kind: DiffKind;
}

/** 문장 단위로 자른다 — 끝의 공백·줄바꿈은 그 문장에 붙여 둬서 다시 이으면 원문이 된다 */
function splitSentences(text: string): Array<string> {
  return text.split(/(?<=\n)|(?<=[.!?…]["'”’)\]]?\s)/).filter(Boolean);
}

/** 앞뒤 공백만 다른 문장은 같은 문장으로 본다 */
const same = (a: string, b: string) => a.trim() === b.trim();

/**
 * 두 판본의 문장 차이 — 기준 판에서 빠진 문장(removed)과 비교 판에 새로 생긴 문장(added).
 * 각 판의 원문 순서를 그대로 유지해 양쪽 칸에 나란히 그린다.
 */
export function diffSentences(
  before: string,
  after: string
): { before: Array<DiffPart>; after: Array<DiffPart>; changed: boolean } {
  const a = splitSentences(before);
  const b = splitSentences(after);
  const rows = a.length;
  const cols = b.length;
  // lcs[i][j] = a[i..] · b[j..]의 최장 공통 문장 수
  const lcs = Array.from({ length: rows + 1 }, () =>
    new Array<number>(cols + 1).fill(0)
  );
  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = cols - 1; j >= 0; j -= 1) {
      lcs[i][j] = same(a[i], b[j])
        ? lcs[i + 1][j + 1] + 1
        : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const left: Array<DiffPart> = [];
  const right: Array<DiffPart> = [];
  let i = 0;
  let j = 0;
  while (i < rows && j < cols) {
    if (same(a[i], b[j])) {
      left.push({ text: a[i], kind: "same" });
      right.push({ text: b[j], kind: "same" });
      i += 1;
      j += 1;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      left.push({ text: a[i], kind: "removed" });
      i += 1;
    } else {
      right.push({ text: b[j], kind: "added" });
      j += 1;
    }
  }
  for (; i < rows; i += 1) {
    left.push({ text: a[i], kind: "removed" });
  }
  for (; j < cols; j += 1) {
    right.push({ text: b[j], kind: "added" });
  }

  const changed =
    left.some((part) => part.kind !== "same" && part.text.trim() !== "") ||
    right.some((part) => part.kind !== "same" && part.text.trim() !== "");
  return { before: left, after: right, changed };
}
