import {
  calculateFixedPositions,
  getAbsoluteWidths,
  getFixedStyle,
} from "@/common/components/Table/config";
import type {
  Column,
  Columns,
  TableFixed,
} from "@/common/components/Table/types";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

interface Cell {
  targetKey: string;
  startWidth: string;
  position: TableFixed;
}
interface TableInfo {
  [key: string]: string;
}
type TableFixedInfo = Record<TableFixed, TableInfo>;
type FixedGroups = Record<TableFixed, Array<Cell>>;

export default function useTableFixed<T>(
  columns: Columns<T>,
  isHeader: boolean = false
) {
  const [tableFixedInfo, setTableFixedInfo] = useState<TableFixedInfo>({
    left: {},
    right: {},
  });
  const [currentFixedGroup, setCurrentFixedGroup] =
    useState<Array<Cell> | null>(null);
  const [absoluteWidths, setAbsoluteWidths] = useState<TableInfo>({});
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const tableRef = document.querySelector("#table-layout");

  const handleResize = useCallback(() => {
    const absoluteWidths = getAbsoluteWidths(columns);
    const { leftFixed, rightFixed } = calculateFixedPositions(
      columns,
      isHeader
    );
    setTableFixedInfo({ left: leftFixed, right: rightFixed });

    setAbsoluteWidths(absoluteWidths);
  }, [columns, isHeader]);
  const processFixedGroup = useCallback(
    (
      columns: Array<Column<T>>,
      position: TableFixed,
      maxScrollLeft?: number
    ): Array<Cell> => {
      const fixedCells: Array<Cell> = [];
      let accumulatedWidth = 0;
      let currentGroup: Cell | null = null;

      const targetColumns =
        position === "right" ? [...columns].reverse() : columns;

      targetColumns.forEach((cur) => {
        const columnWidth =
          Number(absoluteWidths[cur.key.toString()]?.replace("px", "")) || 0;

        if (cur.fixed === position) {
          let startWidth: string;

          if (position === "right" && maxScrollLeft !== undefined) {
            const fixedTriggerPosition = Math.max(
              0,
              maxScrollLeft - accumulatedWidth
            );
            startWidth = `${fixedTriggerPosition}px`;
          } else {
            startWidth = `${accumulatedWidth}px`;
          }

          if (!currentGroup || currentGroup.position !== position) {
            currentGroup = {
              position,
              startWidth,
              targetKey: cur.key.toString(),
            };
            fixedCells.push({
              position,
              startWidth,
              targetKey: cur.key.toString(),
            });
          } else {
            currentGroup.targetKey = cur.key.toString();
            fixedCells[fixedCells.length - 1].targetKey = cur.key.toString();
          }
        } else {
          accumulatedWidth += columnWidth;
          currentGroup = null;
        }
      });

      return position === "right" ? fixedCells.reverse() : fixedCells;
    },
    [absoluteWidths]
  );

  const getFixedGroup = useCallback((): FixedGroups => {
    const tableContainer = document.querySelector("#table-layout");

    if (!tableContainer) {
      return { left: [], right: [] };
    }

    const tableWidth = tableContainer.scrollWidth;
    const containerWidth = tableContainer.clientWidth;
    const maxScrollLeft = Math.max(0, tableWidth - containerWidth);

    const leftFixedCells = processFixedGroup(columns, "left");
    const rightFixedCells = processFixedGroup(columns, "right", maxScrollLeft);

    return {
      left: leftFixedCells,
      right: rightFixedCells,
    };
  }, [columns, processFixedGroup]);

  const getCurrentFixedGroup = useCallback(
    (
      scrollLeft: number,
      fixedTargetGroup: FixedGroups
    ): Array<Cell> | undefined => {
      const result: Array<Cell> = [];
      const leftFixedCell = fixedTargetGroup.left
        .reverse()
        .find((cell) => Number(cell.startWidth.replace("px", "")) < scrollLeft);
      const rightFixedCell = fixedTargetGroup.right.find(
        (cell) => Number(cell.startWidth.replace("px", "")) > scrollLeft
      );
      if (leftFixedCell) {
        result.push(leftFixedCell);
      }
      if (rightFixedCell) {
        result.push(rightFixedCell);
      }

      return result;
    },
    []
  );
  const handleScrollTable = useCallback(() => {
    const fixedGroup = getFixedGroup();
    const scrollLeft = tableRef?.scrollLeft || 0;
    const currentFixedGroup = getCurrentFixedGroup(scrollLeft, fixedGroup);
    if (!currentFixedGroup) {
      return;
    }
    setCurrentFixedGroup(currentFixedGroup);
  }, [getFixedGroup, getCurrentFixedGroup, tableRef?.scrollLeft]);

  useEffect(() => {
    tableRef?.addEventListener("scroll", handleScrollTable);
    return () => {
      tableRef?.removeEventListener("scroll", handleScrollTable);
    };
  }, [handleScrollTable, tableRef]);

  useLayoutEffect(() => {
    handleResize();

    const onResize = () => {
      handleResize();
    };
    window.addEventListener("resize", onResize);

    const key = `${columns[0]?.key as string}` as string;
    const cell = key
      ? document.getElementById(
          `${key.toString()}${isHeader ? "-header" : "-body"}`
        )
      : null;
    const tableEl =
      (cell?.closest("table") as HTMLElement | null) ||
      (document.querySelector("table.table-layout") as HTMLElement | null);

    if (tableEl && "ResizeObserver" in window) {
      resizeObserverRef.current = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserverRef.current.observe(tableEl);
    }

    const tbodyEl = tableEl?.querySelector("tbody");
    if (tbodyEl) {
      mutationObserverRef.current = new MutationObserver(() => {
        handleResize();
      });
      mutationObserverRef.current.observe(tbodyEl, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      window.removeEventListener("resize", onResize);
      resizeObserverRef.current?.disconnect();
      mutationObserverRef.current?.disconnect();
    };
  }, [handleResize, columns, isHeader]);

  const isColumnFixed = useCallback(
    (columnKey: string) => {
      if (!currentFixedGroup?.length) return false;

      return currentFixedGroup.some((cell) => cell.targetKey === columnKey);
    },
    [currentFixedGroup]
  );

  const getColumnFixedStyle = (column: Column<T>) => {
    const isCurrentFixed = isColumnFixed(column.key.toString());

    return getFixedStyle(
      column,
      tableFixedInfo.left,
      tableFixedInfo.right,
      isHeader,
      isCurrentFixed
    );
  };

  return { getColumnFixedStyle };
}
