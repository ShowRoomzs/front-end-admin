import type { PaginationProps } from "@/common/components/Pagination/Pagination";
import type { SortOrder } from "@/common/types/page";
import type { ReactNode } from "react";

export type TableFixed = "left" | "right";
export type TableKey = "checkbox" | "number" | "virtual";
export interface Column<T, K extends keyof T = keyof T> {
  key: K | TableKey;
  label: string | ReactNode;
  render?: (value: T[K], record: T, index: number) => ReactNode;
  renderFooter?: (values: Array<T[K]>) => ReactNode | string;
  renderToExcel?: (
    value: T[K],
    record: T,
    data: Array<T>,
    index: number
  ) => string | number;
  sortable?: boolean;
  width?: number;
  align?: "left" | "center" | "right";
  fixed?: TableFixed;
  justify?: "between" | "center" | "start" | "end";
  delegateClick?: boolean;
  preventRowClick?: boolean;
}
export type Columns<T> = Array<Column<T>>;
export interface SortOption {
  sortKey: string;
  sortOrder: SortOrder;
}
export interface TableProps<T, K extends keyof T = keyof T> {
  columns: Columns<T>;
  data: Array<T>;
  pageInfo?: PaginationProps;
  isLoading?: boolean;
  showCheckbox?: boolean;
  rowKey?: K;
  renderFooter?: ReactNode;
  onRowClick?: (record: T) => void;
  checkedKeys?: Array<T[K]>;
  onCheckedKeysChange?: (checkedKeys: Array<T[K]>) => void;
  sortOption?: SortOption;
  onSortChange?: (sortKey: string, sortOrder: SortOrder) => void;
  bodyClassName?: string;
  headerClassName?: string;
}
