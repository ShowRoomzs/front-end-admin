import type { Columns } from "@/common/components/Table/types";
import { formatDate } from "@/common/utils/formatDate";
import type {
  SellerRegistrationInfo,
  SellerRegistrationStatus,
  SellerUserInfo,
} from "@/features/seller/services/sellerService";
import RegistrationStatusBadge from "@/features/user/components/RegistrationStatusBadge/RegistrationStatusBadge";

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
    render: (v) => (
      <RegistrationStatusBadge
        status={v as Exclude<SellerRegistrationStatus, null>}
      />
    ),
  },
];

export const SELLER_USER_COLUMNS: Columns<SellerUserInfo> = [
  {
    key: "marketName",
    label: "마켓명",
    width: 300,
  },
  {
    key: "mainCategory",
    label: "대표 카테고리",
    align: "center",
    width: 200,
  },
  {
    key: "sellerName",
    label: "판매 담당자 이름",
    width: 200,
  },
  {
    key: "phoneNumber",
    label: "판매 담당자 연락처",
    width: 200,
  },
  {
    key: "createdAt",
    label: "가입일",
    render: (value) => formatDate(value as string),
    width: 200,
  },
  {
    key: "productCount",
    label: "등록 상품 수",
    align: "center",
    width: 100,
    render: (value) => `${(Number(value) || 0).toLocaleString()} ea`,
  },
];
