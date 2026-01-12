import type { Column } from "@/common/components/Table/types";

export function getColumnKey<T>(column: Column<T>, isHeader: boolean) {
  return `${column.key.toString()}-${column.label}-${
    isHeader ? "header" : "body"
  }`;
}

export const calculateFixedPositions = <T>(
  columns: Column<T>[],
  isHeader: boolean = false
) => {
  const leftFixed: { [key: string]: string } = {};
  const rightFixed: { [key: string]: string } = {};

  let leftOffset = 0;
  let rightOffset = 0;

  columns.forEach((column) => {
    if (column.fixed === "left") {
      leftFixed[column.key.toString()] = `${leftOffset}px`;
      const targetNode = document.getElementById(
        getColumnKey(column, isHeader)
      );
      const width = targetNode?.getBoundingClientRect().width as number;

      leftOffset += width;
    }
  });

  const rightFixedColumns = columns
    .filter((col) => col.fixed === "right")
    .reverse();
  rightFixedColumns.forEach((column) => {
    rightFixed[column.key.toString()] = `${rightOffset}px`;
    const targetNode = document.getElementById(getColumnKey(column, isHeader));
    const width = targetNode?.getBoundingClientRect().width as number;
    rightOffset += width;
  });

  return { leftFixed, rightFixed };
};

export const getFixedStyle = <T>(
  column: Column<T>,
  leftFixed: { [key: string]: string },
  rightFixed: { [key: string]: string },
  isHeader = false,
  isCurrentFixed = false
) => {
  const baseStyle: React.CSSProperties = {};
  if (!column.fixed) {
    return;
  }
  baseStyle.position = "sticky";
  baseStyle.zIndex = isHeader ? 10 : 5;
  if (column.fixed === "left") {
    baseStyle.left = leftFixed[column.key.toString()];
    if (isCurrentFixed) {
      baseStyle.transition = "box-shadow 0.2s ease-in-out";
      baseStyle.boxShadow = "4px 0 10px rgba(0, 0, 0, 0.06)";
    }
  }
  if (column.fixed === "right") {
    baseStyle.right = rightFixed[column.key.toString()];
    if (isCurrentFixed) {
      baseStyle.transition = "box-shadow 0.2s ease-in-out";
      baseStyle.boxShadow = "-4px 0 10px rgba(0, 0, 0, 0.06)";
    }
  }
  return baseStyle;
};

export const getAbsoluteWidths = <T>(columns: Column<T>[]) => {
  const absolutePositions: { [key: string]: string } = columns.reduce(
    (acc, col) => {
      const targetNode = document.getElementById(getColumnKey(col, false));
      const width = targetNode?.getBoundingClientRect().width as number;
      acc[col.key.toString()] = `${width}px`;
      return acc;
    },
    {} as { [key: string]: string }
  );

  return absolutePositions;
};
export function getColumnKeyWithLabel<T>(column: Column<T>) {
  return `${column.key.toString()}-${column.label}`;
}
