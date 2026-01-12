import type { SortOption } from "@/common/components/Table/types";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface SortButtonProps {
  sortKey: string;
  sortOption?: SortOption;
}

export default function SortButton(props: SortButtonProps) {
  const { sortKey, sortOption } = props;

  const isActive = sortOption?.sortKey === sortKey;
  const currentOrder = sortOption?.sortOrder;

  return (
    <div className="flex flex-col gap-[2px]">
      <ArrowUpIcon
        style={{
          color: currentOrder === "asc" && isActive ? "#FFFFFF" : "#BCC2CE",
        }}
      />
      <ArrowDownIcon
        style={{
          color: currentOrder === "desc" && isActive ? "#FFFFFF" : "#BCC2CE",
        }}
      />
    </div>
  );
}
