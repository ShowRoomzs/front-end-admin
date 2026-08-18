import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { Columns } from "@/common/components/Table/types";
import { formatDateOnly } from "@/common/utils/formatDate";
import type { TermsListItem } from "@/features/terms/types/terms";
import { getTermsDocumentVariant } from "@/features/terms/utils/statusBadge";

interface TermsColumnHandlers {
  onRegisterVersion: (document: TermsListItem) => void;
}

/**
 * 시안 컬럼 폭 — 문서명 auto / 대상 110 / 버전 90 / 상태 110 / 시행일 130 / 관리 150.
 * `fitWidth`가 비례 배분하므로 합이 1000이다.
 *
 * **문서 1건 = 1행**이고 표시 버전은 시행중(또는 시행 예정) 1개뿐이다(§21-3).
 * 버전을 전부 나열하면 8종 문서가 20행을 넘긴다 — 과거 버전은 문서 상세의 이력에서 본다.
 *
 * 관리 열에 `[상세]` 버튼을 두지 않는다. 상세 진입은 **행 클릭**이다 — 디자인시스템의
 * "행 클릭으로 상세 이동, 별도 상세 버튼 금지" 규칙과 충돌한다.
 */
export const createTermsListColumns = (
  handlers: TermsColumnHandlers
): Columns<TermsListItem> => [
  {
    key: "name",
    label: "문서명",
    width: 410,
    render: (value) => (
      <span className="block truncate text-[13px] font-medium text-sz-n-900">
        {value as string}
      </span>
    ),
  },
  {
    key: "targetName",
    label: "대상",
    width: 110,
    // 대상 셀렉트를 두지 않는 대신 이 열에서 바로 읽히게 한다(§21-3)
    render: (value) => (
      <span className="text-[12px] text-sz-n-500">{value as string}</span>
    ),
  },
  {
    key: "version",
    label: "버전",
    width: 90,
    // 서버가 `v3.1` 형태로 내려주므로 접두를 덧붙이지 말 것
    render: (value) => (
      <span className="text-[12px] tabular-nums text-sz-n-900">
        {(value as string | null) ?? "—"}
      </span>
    ),
  },
  {
    key: "statusName",
    label: "상태",
    width: 110,
    align: "center",
    render: (value, record) => (
      <StatusBadge variant={getTermsDocumentVariant(record.status)}>
        {(value as string | null) ?? "—"}
      </StatusBadge>
    ),
  },
  {
    key: "effectiveDate",
    label: "시행일",
    width: 130,
    align: "center",
    render: (value) => (
      <span className="text-[11px] tabular-nums text-sz-n-500">
        {formatDateOnly(value as string | null)}
      </span>
    ),
  },
  {
    key: "virtual",
    label: "관리",
    width: 150,
    align: "center",
    preventRowClick: true,
    /*
      구버전 행은 관리 열을 **비운다**(`—`). 후속 문서로 대체돼 새 버전을 붙일 대상이
      아니므로 조회만 가능하다 — 여기에 버튼을 살려 두면 어디에 붙는 버전인지 모호해진다.
    */
    render: (_value, record) =>
      record.canRegisterNewVersion ? (
        <button
          type="button"
          onClick={() => handlers.onRegisterVersion(record)}
          className="inline-flex h-[26px] items-center rounded-[6px] border border-sz-n-300 bg-white px-2.5 text-[11px] font-medium text-sz-n-700 hover:border-sz-n-400 hover:bg-sz-n-100"
        >
          새 버전 등록
        </button>
      ) : (
        <span className="text-[11px] text-sz-n-400">—</span>
      ),
  },
];
