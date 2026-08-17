import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { Columns } from "@/common/components/Table/types";
import { formatDateTimeShort } from "@/common/utils/formatDate";
import type { InquiryListItem } from "@/features/inquiry/types/inquiry";
import { getInquiryStatusBadge } from "@/features/inquiry/utils/statusBadge";

/**
 * 시안 컬럼 폭 — 유형 11.5% / 문의 내용 auto / 작성자 10% / 접수일시 14% /
 * 답변일시 14% / 경과 10% / 상태 11%. `fitWidth`가 비례 배분하므로 합이 1000이다.
 *
 * **참조 주문 컬럼은 일부러 없다** — 폭만 먹고 행 판별에는 쓰이지 않아 상세로 내렸고,
 * 그 자리에 작성자를 넣어 "누가 물었는지"가 목록에서 바로 보이게 했다(§17-2).
 * 담당자 배정 · CSV 내보내기 · 정렬 셀렉트도 의도적으로 두지 않는다.
 */
export const INQUIRY_COLUMNS: Columns<InquiryListItem> = [
  {
    key: "typeName",
    label: "유형",
    width: 115,
    // 유형은 상태값이 아니므로 중립·점 없음 — 상태 배지와 시각적으로 구분한다
    render: (value) => (
      <StatusBadge variant="neutral" hideDot>
        {value as string}
      </StatusBadge>
    ),
  },
  {
    key: "content",
    label: "문의 내용",
    width: 295,
    // 제목 필드를 두지 않는 도메인이라(§17-8 #3) 본문 첫 줄이 곧 목록의 제목이다
    render: (value) => (
      <span className="block truncate text-[13px] font-medium text-sz-n-900">
        {value as string}
      </span>
    ),
  },
  {
    key: "writerName",
    label: "작성자",
    width: 100,
    render: (value) => (
      <span className="text-[12px] text-sz-n-900">{value as string}</span>
    ),
  },
  {
    key: "createdAt",
    label: "접수일시",
    width: 140,
    align: "center",
    render: (value) => (
      <span className="text-[11px] tabular-nums text-sz-n-500">
        {formatDateTimeShort(value as string)}
      </span>
    ),
  },
  {
    key: "answeredAt",
    label: "답변일시",
    width: 140,
    align: "center",
    // 미답변이면 `—` (formatDateTimeShort가 null을 그렇게 처리한다)
    render: (value) => (
      <span className="text-[11px] tabular-nums text-sz-n-500">
        {formatDateTimeShort(value as string | null)}
      </span>
    ),
  },
  {
    key: "elapsedText",
    label: "경과",
    width: 100,
    align: "center",
    /*
      경과는 **모든 행에 값이 있다** — 미답변이면 지금까지, 답변 건이면 접수→답변
      소요다(§17-6). 비는 케이스가 없다고 보고 만들었으니 빈 값 분기를 넣지 말 것.
      값은 서버 계산값을 그대로 쓴다. 클라이언트 시각으로 다시 계산하면 운영자 PC
      시계가 틀어졌을 때 SLA 표시가 어긋난다.
    */
    render: (value, record) => (
      <span
        className={`text-[12px] tabular-nums ${
          record.slaExceeded
            ? "font-semibold text-sz-warning-text"
            : "text-sz-n-900"
        }`}
      >
        {value as string}
      </span>
    ),
  },
  {
    key: "status",
    label: "상태",
    width: 110,
    align: "center",
    render: (_value, record) => {
      const { variant, label } = getInquiryStatusBadge(
        record.status,
        record.slaExceeded
      );
      return <StatusBadge variant={variant}>{label}</StatusBadge>;
    },
  },
];
