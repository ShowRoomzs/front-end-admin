import type {
  ChangeDiffRow,
  ChangeRequestApprovalImpact,
  ChangeRequestHolderCheck,
  ChangeRequestType,
} from "@/features/changeRequest/services/changeRequestService";

interface ChangeDiffTableProps {
  rows: Array<ChangeDiffRow>;
  type: ChangeRequestType;
  /** CHECK 행(예금주 판정)을 그릴 때만 쓴다 */
  holderCheck: ChangeRequestHolderCheck | null;
  approvalImpact?: ChangeRequestApprovalImpact | null;
}

/**
 * 시안 `table.diff` — 항목 / 현재 값 / 변경 요청 값 대조표.
 *
 * 공용 `Table`을 쓰지 않는다. 그쪽은 페이징·정렬·행 클릭이 달린 목록 위젯이고,
 * 여기는 고정 행 수의 정적 대조표라 필요한 게 하나도 없다.
 *
 * 서버는 **변경된 행만이 아니라 유형별 고정 전체 행**을 내려준다. 바뀌지 않은 항목까지
 * 함께 보여야 운영자가 "이 요청이 건드리지 않은 값"을 서류와 대조할 수 있기 때문이다.
 *
 * 인플루언서 건(rev.7~8)은 행 성격(`source`)이 섞인다 — 서류로만 확인하는 DOCUMENT 행과
 * 예금주 규칙을 판정하는 CHECK 행은 「변경 요청 값」 자리에 값 대신 확인 결과를 그린다.
 * 옛 응답(브랜드)에는 `source`가 없어 전부 REQUEST로 본다.
 */
export default function ChangeDiffTable(props: ChangeDiffTableProps) {
  const { rows, type, holderCheck, approvalImpact } = props;

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
          {rows.map((row) => {
            const isCheck = row.source === "CHECK";
            const isDocument = row.source === "DOCUMENT";
            // 판정 · 서류 확인 행은 바뀌는 값이 아니라 강조하지 않는다(시안 C3a · C4b)
            const highlighted = row.changed && !isCheck && !isDocument;
            // 인플루언서 계좌의 예금주 행은 시안(C4b)이 현재 · 요청 값을 바뀐 행처럼 그린다
            const strikeCurrent =
              highlighted || (isCheck && type === "CREATOR_ACCOUNT");

            return (
              <tr
                key={row.fieldKey}
                className={`border-t border-sz-n-100 ${
                  highlighted ? "bg-sz-accent-50" : ""
                }`}
              >
                <td className="px-4 py-[11px] align-top text-[11px] text-sz-n-500">
                  {row.label}
                </td>
                <td
                  className={`px-4 py-[11px] align-top text-[12px] ${
                    strikeCurrent
                      ? "text-sz-n-500 line-through decoration-sz-n-400"
                      : "text-sz-n-900"
                  }`}
                >
                  {row.currentValue || "—"}
                  {isCheck && approvalImpact?.accountChangeRequired && (
                    <span className="ml-1 text-[11px] text-sz-n-500">
                      (상호)
                    </span>
                  )}
                </td>
                <td className="px-4 py-[11px] align-top text-[12px]">
                  <RequestedValue
                    row={row}
                    type={type}
                    holderCheck={holderCheck}
                    approvalImpact={approvalImpact}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

interface RequestedValueProps {
  row: ChangeDiffRow;
  type: ChangeRequestType;
  holderCheck: ChangeRequestHolderCheck | null;
  approvalImpact?: ChangeRequestApprovalImpact | null;
}

/**
 * `locked`를 `changed`보다 먼저 본다 — 잠긴 행도 requestedValue가 null이라
 * 순서를 뒤집으면 "변경 요청 불가"가 "변경 없음"에 먹힌다.
 */
function RequestedValue(props: RequestedValueProps) {
  const { row, type, holderCheck, approvalImpact } = props;

  if (row.locked) {
    return (
      <span className="text-[11px] font-medium text-sz-n-500">
        변경 요청 불가
      </span>
    );
  }
  if (row.source === "DOCUMENT") {
    // 상호 · 대표자는 받지 않는다 — 운영자가 등록증에서 읽는다(C3a)
    return (
      <span className="text-[11px] text-sz-n-500">
        {row.requestedValue ? `${row.requestedValue} ` : ""}(운영자 확인)
      </span>
    );
  }
  if (row.source === "CHECK") {
    return (
      <HolderCheckValue
        row={row}
        type={type}
        holderCheck={holderCheck}
        approvalImpact={approvalImpact}
      />
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

/**
 * 예금주 판정 행.
 * - 인플루언서 계좌(C4b): 요청 예금주를 그대로 보이고, 본인 실명과 다르면 위험색.
 * - 사업자 구분 변경(C3a · C3b): 승인 뒤 예금주 규칙(대표자명 / 본인 실명)에 지금 계좌가 맞는지.
 *   서버는 상호 명의 계좌를 받기 전(§55 B-9)이라 `accountChangeRequired`를 항상 false로 준다.
 */
function HolderCheckValue(props: RequestedValueProps) {
  const { row, type, holderCheck, approvalImpact } = props;

  if (type === "CREATOR_ACCOUNT") {
    return (
      <span
        className={`font-semibold ${
          holderCheck?.mismatch ? "text-sz-danger-text" : "text-sz-accent-600"
        }`}
      >
        {row.requestedValue || "—"}
      </span>
    );
  }

  const rule = approvalImpact?.accountHolderRuleAfter ?? holderCheck?.rule;
  const needsChange =
    Boolean(approvalImpact?.accountChangeRequired) ||
    Boolean(holderCheck?.mismatch);
  const isRepresentative = rule === "REPRESENTATIVE_NAME";

  if (needsChange) {
    return (
      <span className="text-sz-warning-text">
        {isRepresentative ? "✕ 대표자명 또는 상호 필요" : "✕ 본인 실명 필요"}
      </span>
    );
  }
  return (
    <span className="text-sz-success-text">
      {isRepresentative ? "✓ 대표자명과 일치" : "✓ 본인 실명과 일치"}
    </span>
  );
}
