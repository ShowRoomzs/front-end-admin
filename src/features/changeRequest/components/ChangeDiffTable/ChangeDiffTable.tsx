import type { ChangeDiffRow } from "@/features/changeRequest/services/changeRequestService";

interface ChangeDiffTableProps {
  rows: Array<ChangeDiffRow>;
}

/**
 * 시안 `table.diff` — 항목 / 현재 값 / 변경 요청 값 대조표.
 *
 * 공용 `Table`을 쓰지 않는다. 그쪽은 페이징·정렬·행 클릭이 달린 목록 위젯이고,
 * 여기는 고정 행 수의 정적 대조표라 필요한 게 하나도 없다.
 *
 * 서버는 **변경된 행만이 아니라 유형별 고정 전체 행**을 내려준다. 바뀌지 않은 항목까지
 * 함께 보여야 운영자가 "이 요청이 건드리지 않은 값"을 서류와 대조할 수 있기 때문이다.
 */
export default function ChangeDiffTable(props: ChangeDiffTableProps) {
  const { rows } = props;

  return (
    <div className="overflow-hidden rounded-[6px] border border-sz-n-200">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-[180px] bg-sz-n-100 px-4 py-2.5 text-left text-[11px] font-medium text-sz-n-600">
              항목
            </th>
            <th className="bg-sz-n-100 px-4 py-2.5 text-left text-[11px] font-medium text-sz-n-600">
              현재 값
            </th>
            <th className="bg-sz-n-100 px-4 py-2.5 text-left text-[11px] font-medium text-sz-n-600">
              변경 요청 값
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.fieldKey}
              className={`border-t border-sz-n-100 ${
                row.changed ? "bg-sz-accent-50" : ""
              }`}
            >
              <td className="px-4 py-[11px] align-top text-[11px] text-sz-n-500">
                {row.label}
              </td>
              <td
                className={`px-4 py-[11px] align-top text-[12px] ${
                  row.changed
                    ? "text-sz-n-500 line-through decoration-sz-n-400"
                    : "text-sz-n-900"
                }`}
              >
                {row.currentValue || "—"}
              </td>
              <td className="px-4 py-[11px] align-top text-[12px]">
                <RequestedValue row={row} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * `locked`를 `changed`보다 먼저 본다 — 잠긴 행도 requestedValue가 null이라
 * 순서를 뒤집으면 "변경 요청 불가"가 "변경 없음"에 먹힌다.
 */
function RequestedValue({ row }: { row: ChangeDiffRow }) {
  if (row.locked) {
    return (
      <span className="text-[11px] font-medium text-sz-n-500">
        변경 요청 불가
      </span>
    );
  }
  if (!row.changed || row.requestedValue === null) {
    return <span className="text-[11px] text-sz-n-400">변경 없음</span>;
  }
  return (
    <span className="font-semibold text-sz-accent-600">
      {row.requestedValue}
    </span>
  );
}
