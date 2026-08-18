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
  const rowClickClassName = cn("group hover:bg-sz-accent-50", isRowClickClass);
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

  const renderCells = (row: T, index: number, options?: ColumnRenderOptions) =>
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
        `flex text-sz-n-900 text-[12px]`,
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
          /*
            구분선 위계: 본문 행 사이는 --n-100. 첫 행은 헤더 경계선과 이중선이 되지 않도록 생략.

            행 높이는 **50px 고정**이다(디자인시스템 규격). 예전처럼 패딩만 주면 행 높이가
            셀 안에 무엇이 들어갔는지에 따라 달라졌다 — 관리 열 버튼(26px)이 있는 목록은
            54px, 상품 썸네일(36px)이 있는 목록은 64px, 배지뿐인 목록은 48px이라 페이지를
            옮길 때마다 행 간격이 달라 보였다. 패딩은 이제 최소 여백일 뿐이고 높이를 정하지
            않으므로, 새 셀 내용을 넣을 때 42px(50 - 상하 패딩)을 넘지 않는지만 보면 된다.
          */
          className={cn(
            "h-[50px] px-4 py-1.5 align-middle",
            index !== 0 && "border-t border-sz-n-100",
            col.fixed && "bg-white group-hover:bg-sz-accent-50"
          )}
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
