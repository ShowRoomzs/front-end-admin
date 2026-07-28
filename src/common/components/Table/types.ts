import type { PaginationProps } from "@/common/components/Pagination/Pagination";
import type { SortOrder } from "@/common/types/page";
import type {
  DraggableProvidedDragHandleProps,
  DropResult,
} from "@hello-pangea/dnd";
import type { ReactNode } from "react";

export type TableFixed = "left" | "right";
export type TableKey = "checkbox" | "number" | "virtual";
export interface ColumnRenderOptions {
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}
export interface Column<T, K extends keyof T = keyof T> {
  key: K | TableKey;
  label: string | ReactNode;
  render?: (
    value: T[K],
    record: T,
    index: number,
    options?: ColumnRenderOptions
  ) => ReactNode;
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
export interface RowDragOptions<T> {
  enabled: boolean;
  droppableId: string;
  getDraggableId: (record: T) => string;
  onDragEnd: (result: DropResult) => void;
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
  rowDrag?: RowDragOptions<T>;
  /** 데이터가 없을 때 표시할 내용. 미지정 시 기본 문구를 쓴다(툴바·카드 프레임은 유지). */
  emptyState?: ReactNode;
  /**
   * 고정 폭(1880px) 대신 컨테이너 폭에 맞춰 컬럼을 분배해 가로 스크롤을 없앤다.
   * 컬럼 수가 적어 한 화면에 다 들어가는 목록에 쓴다.
   */
  fitWidth?: boolean;
  /**
   * 남은 높이를 채우지 않고 내용 높이에 맞춘다(마지막 행 바로 아래에 페이지네이션이 붙는다).
   * 내부 세로 스크롤 대신 페이지 전체가 스크롤된다.
   */
  autoHeight?: boolean;
  /**
   * autoHeight 모드에서 스크롤 없이 보여줄 최대 행 수.
   * 이 수를 넘으면 본문만 내부 스크롤되고 페이지네이션은 그 아래에 고정된다.
   */
  maxRows?: number;
}
