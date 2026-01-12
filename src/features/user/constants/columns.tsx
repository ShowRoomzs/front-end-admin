import type { Columns } from "@/common/components/Table/types";
import { formatDate } from "@/common/utils/formatDate";
import { SELLER_REGISTRATION_STATUS } from "@/features/user/constants/params";
import type { SellerRegistrationInfo } from "@/features/user/services/sellerService";
import type { ReactElement } from "react";

const getStatusBadge = (status: string): ReactElement => {
  const statusText =
    SELLER_REGISTRATION_STATUS[
      status as keyof typeof SELLER_REGISTRATION_STATUS
    ];

  const statusStyles = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
    APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-300",
    REJECTED: "bg-red-100 text-red-800 border-red-300",
  };

  const style = statusStyles[status as keyof typeof statusStyles];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${style}`}
    >
      {statusText}
    </span>
  );
};

export const SELLER_REGISTRATION_COLUMNS: Columns<SellerRegistrationInfo> = [
  {
    key: "sellerId",
    label: "신청 ID",
    align: "center",
  },
  {
    key: "marketName",
    label: "마켓명",
  },
  {
    key: "createdAt",
    label: "신청일",
    render: (v) => formatDate(v as string),
  },
  {
    key: "marketName",
    label: "판매 담당자 이름 / 연락처",
    render: (_v, record) => `${record.name} / ${record.phoneNumber}`,
  },
  {
    key: "status",
    label: "상태",
    align: "center",
    render: (v) => getStatusBadge(v as string),
  },
];
