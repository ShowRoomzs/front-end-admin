import { getColumnKey } from "@/common/components/Table/config";
import type {
  Column,
  ColumnRenderOptions,
  Columns,
  RowDragOptions,
} from "@/common/components/Table/types";
import useTableFixed from "@/common/hooks/useTableFixed";
import { cn } from "@/lib/utils";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { useCallback, useRef } from "react";

interface TableBodyProps<T> {
  columns: Columns<T>;
  data: Array<T>;
  onRowClick?: (record: T) => void;
  bodyClassName?: string;
  rowDrag?: RowDragOptions<T>;
}

export default function TableBody<T>(props: TableBodyProps<T>) {
  const { columns, data, onRowClick, bodyClassName = "", rowDrag } = props;
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

  const renderCells = (
    row: T,
    index: number,
    options?: ColumnRenderOptions
  ) =>
    columns.map((col: Column<T>) => {
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
              ? col.render(row[col.key as keyof T], row, index, options)
              : row[col.key as keyof T]
                ? (row[col.key as keyof T] as string)
                : "-"}
          </div>
        </td>
      );
    });

  if (rowDrag?.enabled) {
    return (
      <Droppable droppableId={rowDrag.droppableId}>
        {(provided) => (
          <tbody
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="bg-white"
          >
            {data.map((row, index) => (
              <Draggable
                key={rowDrag.getDraggableId(row)}
                draggableId={rowDrag.getDraggableId(row)}
                index={index}
              >
                {(draggableProvided, snapshot) => (
                  <tr
                    ref={draggableProvided.innerRef}
                    {...draggableProvided.draggableProps}
                    className={cn(
                      rowClickClassName,
                      snapshot.isDragging && "bg-[#FFFBF0]"
                    )}
                    onClick={() => handleRowClick(row)}
                  >
                    {renderCells(row, index, {
                      dragHandleProps: draggableProvided.dragHandleProps,
                    })}
                  </tr>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </tbody>
        )}
      </Droppable>
    );
  }

  return (
    <tbody className="bg-white">
      {data.map((row, index) => (
        <tr
          key={index}
          className={rowClickClassName}
          onClick={() => handleRowClick(row)}
        >
          {renderCells(row, index)}
        </tr>
      ))}
    </tbody>
  );
}
