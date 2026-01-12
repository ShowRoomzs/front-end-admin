import type { Columns } from "@/common/components/Table/types";
import { formatDate } from "@/common/utils/formatDate";
import { SELLER_REGISTRATION_STATUS } from "@/features/user/constants/params";
import type { SellerRegistrationInfo } from "@/features/user/services/sellerService";

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
    render: (v) =>
      SELLER_REGISTRATION_STATUS[v as keyof typeof SELLER_REGISTRATION_STATUS],
  },
];
