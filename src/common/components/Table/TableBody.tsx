import { getColumnKey } from "@/common/components/Table/config";
import type { Column, Columns } from "@/common/components/Table/types";
import useTableFixed from "@/common/hooks/useTableFixed";
import { cn } from "@/lib/utils";
import { useCallback, useRef } from "react";

interface TableBodyProps<T> {
  columns: Columns<T>;
  data: Array<T>;
  onRowClick?: (record: T) => void;
  bodyClassName?: string;
}

export default function TableBody<T>(props: TableBodyProps<T>) {
  const { columns, data, onRowClick, bodyClassName = "" } = props;
  const { getColumnFixedStyle } = useTableFixed<T>(columns, false);
  const isRowClickClass = onRowClick ? "cursor-pointer" : "";
  const rowClickClassName = cn("group hover:bg-[#FFFBF0]", isRowClickClass);
  const cellRef = useRef<Record<string, HTMLTableCellElement>>({});
  const handleRowClick = useCallback(
    (record: T) => {
      onRowClick?.(record);
    },
    [onRowClick]
  );

  const handleCellClick = (
    e: React.MouseEvent<HTMLTableCellElement>,
    col: Column<T>,
    rowIndex: number
  ) => {
    if (col.delegateClick) {
      e.stopPropagation();
      const cell = cellRef.current[`${col.key.toString()}-${rowIndex}`];
      const child = cell?.children[0].children[0] as HTMLDivElement;
      child?.click();
    }
    if (col.preventRowClick) {
      e.stopPropagation();
    }
  };
  return (
    <tbody className="bg-white">
      {data.map((row, index) => (
        <tr
          key={index}
          className={rowClickClassName}
          onClick={() => handleRowClick(row)}
        >
          {columns.map((col: Column<T>) => {
            const width = col.width;
            const alignClass =
              col.align === "center"
                ? "justify-center"
                : col.align === "right"
                ? "justify-end"
                : "justify-start";

            const key = getColumnKey(col, false);
            const tableBodyClassName = cn(
              `flex text-[#00000099] text-[12px]`,
              alignClass,
              bodyClassName
            );
            return (
              <td
                key={key}
                id={key}
                ref={(el) => {
                  if (el) {
                    cellRef.current[`${col.key.toString()}-${index}`] = el;
                  }
                }}
                onClick={(e) => handleCellClick(e, col, index)}
                className={`px-4 py-[8px] border-b border-gray-200 ${
                  col.fixed ? "bg-white group-hover:bg-[#FFFBF0]" : ""
                }`}
                style={{
                  width: width ? `${width}px` : undefined,
                  minWidth: width ? `${width}px` : undefined,
                  maxWidth: width ? `${width}px` : undefined,
                  ...getColumnFixedStyle(col),
                }}
              >
                <div className={tableBodyClassName}>
                  {col?.render
                    ? col.render(row[col.key as keyof T], row, index)
                    : row[col.key as keyof T]
                    ? (row[col.key as keyof T] as string)
                    : "-"}
                </div>
              </td>
            );
          })}
        </tr>
      ))}
    </tbody>
  );
}
