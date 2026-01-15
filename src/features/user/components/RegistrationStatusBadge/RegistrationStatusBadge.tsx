import { SELLER_REGISTRATION_STATUS } from "@/features/seller/constants/params";
import type { SellerRegistrationStatus } from "@/features/seller/services/sellerService";

interface StatusBadgeProps {
  status: Exclude<SellerRegistrationStatus, null>;
}

export default function RegistrationStatusBadge(props: StatusBadgeProps) {
  const { status } = props;

  const statusText = SELLER_REGISTRATION_STATUS[status];

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
}
