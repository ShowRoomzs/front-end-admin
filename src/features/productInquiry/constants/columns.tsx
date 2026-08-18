import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { Columns } from "@/common/components/Table/types";
import { formatDateOnly } from "@/common/utils/formatDate";
import type { ProductInquiryListItem } from "@/features/productInquiry/types/productInquiry";
import { getProductInquiryStatusVariant } from "@/features/productInquiry/utils/statusBadge";

/**
 * 시안 컬럼 폭 — 문의 유형 10% / 질문 32% / 상품 18% / 브랜드 12% / 등록일 10% /
 * 답변일 10% / 상태 12%. `fitWidth`가 비례 배분하므로 합이 1000이다.
 *
 * **작성자·공개 여부 컬럼은 일부러 없다** — 7개로 이미 포화이고, 목록의 판별 기준은
 * "어떤 상품의 어떤 질문인가"이지 누가 썼는지가 아니다. 둘 다 상세에서 확인한다.
 * 경과·SLA 컬럼도 두지 않는다 — 답변 주체가 브랜드라서 운영자 SLA가 아니다(§18-8 #3).
 */
export const PRODUCT_INQUIRY_COLUMNS: Columns<ProductInquiryListItem> = [
  {
    key: "typeName",
    label: "문의 유형",
    width: 100,
    // 유형은 상태값이 아니므로 중립·점 없음 — 상태 배지와 시각적으로 구분한다
    render: (value) => (
      <StatusBadge variant="neutral" hideDot>
        {value as string}
      </StatusBadge>
    ),
  },
  {
    key: "content",
    label: "질문",
    width: 300,
    render: (value) => (
      <span className="block truncate text-[13px] font-medium text-sz-n-900">
        {value as string}
      </span>
    ),
  },
  {
    key: "productName",
    label: "상품",
    width: 180,
    render: (value) => (
      <span className="block truncate text-[12px] text-sz-n-900">
        {value as string}
      </span>
    ),
  },
  {
    key: "brandName",
    label: "브랜드",
    width: 120,
    render: (value) => (
      <span className="block truncate text-[12px] text-sz-n-900">
        {value as string}
      </span>
    ),
  },
  {
    key: "createdAt",
    label: "등록일",
    width: 100,
    align: "center",
    // 시안은 목록에서 날짜만 보여준다(상세에 시·분까지 있다)
    render: (value) => (
      <span className="text-[11px] tabular-nums text-sz-n-500">
        {formatDateOnly(value as string)}
      </span>
    ),
  },
  {
    key: "answeredAt",
    label: "답변일",
    width: 100,
    align: "center",
    // 미답변이면 `—` (formatDateOnly가 null을 그렇게 처리한다)
    render: (value) => (
      <span className="text-[11px] tabular-nums text-sz-n-500">
        {formatDateOnly(value as string | null)}
      </span>
    ),
  },
  {
    key: "statusLabel",
    label: "상태",
    width: 100,
    align: "center",
    // 맨 뒷열 고정 — 어드민 목록 공통 규격이라 순서를 바꾸지 말 것
    render: (value, record) => (
      <StatusBadge
        variant={getProductInquiryStatusVariant(
          record.status,
          record.exposureStatus
        )}
      >
        {value as string}
      </StatusBadge>
    ),
  },
];
