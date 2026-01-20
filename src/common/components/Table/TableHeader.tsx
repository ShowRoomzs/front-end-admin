import type { Columns, SortOption } from "@/common/components/Table/types";
import SortButton from "../SortButton/SortButton";
import type { SortOrder } from "@/common/types/page";
import useTableFixed from "@/common/hooks/useTableFixed";
import { cn } from "@/lib/utils";
import { getColumnKey } from "@/common/components/Table/config";

interface TableHeaderProps<T> {
  columns: Columns<T>;
  sortOption?: SortOption;
  onSortChange?: (sortKey: string, sortOrder: SortOrder) => void;
  headerClassName?: string;
  defaultSortKey?: string;
  defaultSortOrder?: SortOrder;
}

export default function TableHeader<T>(props: TableHeaderProps<T>) {
  const {
    columns,
    sortOption,
    onSortChange,
    headerClassName = "",
    defaultSortKey = "createdAt",
    defaultSortOrder = "desc",
  } = props;
  const { getColumnFixedStyle } = useTableFixed<T>(columns, true);

  const handleSort = (key: string) => {
    if (!onSortChange) return;

    const isActive = sortOption?.sortKey === key;
    const currentOrder = sortOption?.sortOrder;

    if (isActive) {
      if (currentOrder === "desc") {
        onSortChange(key, "asc");
      } else if (currentOrder === "asc") {
        // 초기화
        onSortChange(defaultSortKey, defaultSortOrder);
      } else {
        onSortChange(key, "desc");
      }
    } else {
      onSortChange(key, "desc");
    }
  };

  return (
    <thead className="bg-[#0A2B84] h-[44px]">
      <tr>
        {columns.map((col, index) => {
          const sortKey = col.key.toString();
          const width = col.width;
          const alignClass =
            col.align === "center"
              ? "justify-center"
              : col.align === "right"
                ? "justify-end"
                : "justify-start";

          const isSortable = col.sortable && onSortChange;
          const justify = col.justify || (isSortable && "between");
          const getJustifyClassName = () => {
            switch (justify) {
              case "between":
                return "justify-between";
              case "center":
                return "justify-center gap-4";
              case "start":
                return "justify-start gap-4";
              case "end":
                return "justify-end gap-4";
              default:
                return "";
            }
          };
          const key = getColumnKey(col, true);
          return (
            <th
              key={key}
              id={key}
              className={cn(
                "px-4 py-3",
                index === 0 && "rounded-tl-[0px]",
                index === columns.length - 1 && "rounded-tr-[0px]",
                col.fixed && "bg-[#0A2B84]"
              )}
              style={{
                width: width ? `${width}px` : undefined,
                minWidth: width ? `${width}px` : undefined,
                maxWidth: width ? `${width}px` : undefined,
                textAlign: col.align || "left",
                ...getColumnFixedStyle(col),
              }}
            >
              <div
                className={cn(
                  "flex items-center",
                  alignClass,
                  isSortable && "cursor-pointer select-none",
                  getJustifyClassName()
                )}
                onClick={() => isSortable && handleSort(sortKey)}
              >
                <span
                  className={cn(
                    "text-white text-[11px] font-[700]",
                    headerClassName
                  )}
                >
                  {col.label}
                </span>
                {isSortable && (
                  <SortButton sortKey={sortKey} sortOption={sortOption} />
                )}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
