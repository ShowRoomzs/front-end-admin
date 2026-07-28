import StatusBadge from "@/common/components/StatusBadge/StatusBadge";
import { PurgedValue } from "@/common/components/DetailCard/DetailCard";
import type { Columns } from "@/common/components/Table/types";
import { formatDate, formatDateOnly } from "@/common/utils/formatDate";
import { maskPhoneNumber } from "@/common/utils/maskPhoneNumber";
import type {
  SellerRegistrationInfo,
  SellerUserInfo,
} from "@/features/seller/services/sellerService";
import { formatElapsed, isSlaExceeded } from "@/features/seller/utils/elapsedTime";
import { getApplicationStatusBadge } from "@/features/seller/utils/statusBadge";

export const SELLER_REGISTRATION_COLUMNS: Columns<SellerRegistrationInfo> = [
  {
    key: "marketName",
    label: "브랜드명",
    render: (value) => (
      <span className="text-[13px] font-medium text-sz-n-900">
        {value as string}
      </span>
    ),
  },
  {
    key: "name",
    label: "담당자",
    // 반려 건은 계정·제출 정보가 파기되어 값이 내려오지 않는다
    render: (value) => (value as string | null) ?? <PurgedValue />,
  },
  {
    key: "phoneNumber",
    label: "연락처",
    render: (value) => {
      const phoneNumber = value as string | null;
      if (!phoneNumber) {
        return <PurgedValue />;
      }
      // 번호는 코드 값이 아니라 대조하는 값이라 세로 정렬(tabular-nums)이 유리하다
      return (
        <span className="tabular-nums tracking-[0.1px] text-sz-n-700">
          {maskPhoneNumber(phoneNumber)}
        </span>
      );
    },
  },
  {
    key: "businessType",
    label: "사업자 구분",
    render: (value) => (value as string | null) ?? "—",
  },
  {
    key: "createdAt",
    label: "신청일",
    render: (value) => (
      <span className="text-[11px] text-sz-n-500">
        {formatDateOnly(value as string)}
      </span>
    ),
  },
  {
    // 서버가 elapsedTime을 더 이상 내려주지 않아 신청일로 직접 계산한다
    key: "createdAt",
    label: "경과",
    align: "center",
    render: (_value, record) => {
      // 처리가 끝난 건은 경과 시간을 노출하지 않는다
      if (record.status !== "PENDING") {
        return "—";
      }
      const elapsed = formatElapsed(record.createdAt);
      if (!elapsed) {
        return "—";
      }
      return isSlaExceeded(record.createdAt) ? (
        <span className="font-semibold text-sz-warning-text">{elapsed}</span>
      ) : (
        elapsed
      );
    },
  },
  {
    key: "status",
    label: "상태",
    align: "center",
    render: (_value, record) => {
      const { variant, label } = getApplicationStatusBadge(
        record.status,
        record.createdAt
      );
      return <StatusBadge variant={variant}>{label}</StatusBadge>;
    },
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
