import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import type { Columns } from "@/common/components/Table/types";
import { formatDateOnly } from "@/common/utils/formatDate";
import type { AdminProductListItem } from "@/features/product/services/productService";
import {
  getDisplayStatusBadge,
  getGroupBuyStatusBadge,
} from "@/features/product/utils/statusBadge";

/**
 * 등록/수정일은 **1열로 통합**한다 — 최신 날짜 + "(등록)"/"(수정)" 표기(§12-1).
 * 수정된 적이 없으면 등록일만 뜬다.
 */
function renderTimestamp(record: AdminProductListItem) {
  const isModified =
    !!record.modifiedAt && record.modifiedAt !== record.createdAt;
  const date = isModified ? record.modifiedAt : record.createdAt;

  return (
    <span className="text-[11px] text-sz-n-500">
      {formatDateOnly(date)} {isModified ? "(수정)" : "(등록)"}
    </span>
  );
}

export const PRODUCT_LIST_COLUMNS: Columns<AdminProductListItem> = [
  {
    key: "thumbnailUrl",
    label: "",
    width: 56,
    render: (value) => {
      const url = value as string | null;
      return (
        <div className="h-9 w-9 overflow-hidden rounded-[6px] bg-sz-n-200">
          {url && (
            <img
              src={url}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
        </div>
      );
    },
  },
  {
    key: "name",
    label: "상품명",
    width: 170,
    render: (value, record) => (
      // 폭을 지정하지 않으면 상품명이 남는 공간을 다 먹어 브랜드 열이 밀린다(§4-7)
      <div className="min-w-0">
        <span
          className="block max-w-[170px] truncate text-[13px] font-medium text-sz-n-900"
          title={value as string}
        >
          {value as string}
        </span>
        {record.sellerProductCode && (
          <span className="text-[11px] text-sz-n-500">
            {record.sellerProductCode}
          </span>
        )}
      </div>
    ),
  },
  {
    key: "marketName",
    label: "브랜드",
    width: 120,
  },
  {
    key: "regularPrice",
    label: "정가",
    width: 90,
    render: (value) => `${(value as number).toLocaleString()}원`,
  },
  {
    key: "stock",
    label: "재고(SKU)",
    align: "center",
    width: 90,
    // 재고 0이면 숫자 없이 품절 배지만 표시한다(§3-4 · rev.4에서 숫자 제거로 확정)
    render: (value) => {
      const stock = value as number | null | undefined;
      // == 로 null·undefined를 함께 걸러야 한다 — 조합이 없는 상품은 서버가 값을 안 준다
      if (stock == null) {
        return "—";
      }
      if (stock === 0) {
        return (
          <StatusBadge variant="neutral" hideDot>
            품절
          </StatusBadge>
        );
      }
      return stock.toLocaleString();
    },
  },
  {
    key: "displayStatus",
    label: "진열 상태",
    align: "center",
    width: 110,
    render: (_value, record) => {
      const { variant, label } = getDisplayStatusBadge(record.displayStatus);
      return <StatusBadge variant={variant}>{label}</StatusBadge>;
    },
  },
  {
    key: "groupBuyStatus",
    label: "공구 상태",
    align: "center",
    width: 100,
    render: (_value, record) => {
      const { variant, label } = getGroupBuyStatusBadge(record.groupBuyStatus);
      return (
        <StatusBadge variant={variant} hideDot>
          {label}
        </StatusBadge>
      );
    },
  },
  {
    key: "createdAt",
    label: "등록/수정일",
    align: "center",
    width: 130,
    render: (_value, record) => renderTimestamp(record),
  },
];
