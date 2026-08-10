import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import TableHeader from "./TableHeader";
import TableBody from "./TableBody";
import TableFooter from "./TableFooter";
import Pagination from "@/common/components/Pagination/Pagination";
import { produce, type Draft } from "immer";
import { Checkbox } from "@/components/ui/checkbox";
import ScrollBar from "../ScrollBar/ScrollBar";
import type { TableKey, TableProps } from "@/common/components/Table/types";
import { Loader2Icon } from "lucide-react";
import { useSyncHorizontalScroll } from "@/common/hooks/useSyncHorizontalScroll";
import { getColumnKeyWithLabel } from "@/common/components/Table/config";
import { DragDropContext } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";

const MAX_TABLE_WIDTH = 1880; // 최대 테이블 너비
// 본문 행 1개 높이: 상하 패딩 14px + 12px 본문 줄높이 + 구분선 1px
const ROW_HEIGHT = 47;

export default function Table<T, K extends keyof T = keyof T>(
  props: TableProps<T, K>
) {
  const {
    columns: originColumns = [],
    data = [],
    renderFooter,
    showCheckbox,
    checkedKeys: originCheckedKeys = [],
    onCheckedKeysChange,
    onRowClick,
    pageInfo,
    rowKey,
    isLoading = false,
    sortOption,
    bodyClassName = "",
    headerClassName = "",
    onSortChange,
    rowDrag,
    emptyState,
    fitWidth = false,
    autoHeight = false,
    maxRows,
  } = props;

  // autoHeight 모드에서 행이 maxRows를 넘으면 본문만 내부 스크롤한다
  const bodyMaxHeight =
    autoHeight && maxRows ? maxRows * ROW_HEIGHT : undefined;
  const isBodyScrollable = !autoHeight || bodyMaxHeight !== undefined;
  const [checkedKeys, setCheckedKeys] = useState<Array<T[K]>>(
    originCheckedKeys as Array<T[K]>
  );
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [isMounted, setIsMounted] = useState(false);
  const [headerScrollRef, bodyScrollRef] = useSyncHorizontalScroll();
  const bodyTableRef = useRef<HTMLTableElement>(null);
  const headerTableRef = useRef<HTMLTableElement>(null);

  const hasData = data.length > 0;

  useEffect(() => {
    if (!onCheckedKeysChange) {
      return;
    }
    onCheckedKeysChange(checkedKeys);
  }, [checkedKeys, onCheckedKeysChange]);

  useEffect(() => {
    setCheckedKeys((prev) => {
      const prevSet = new Set(prev);
      if (
        originCheckedKeys.length === prev.length &&
        originCheckedKeys.every((key) => prevSet.has(key))
      ) {
        return prev;
      }

      return originCheckedKeys as Array<T[K]>;
    });
  }, [originCheckedKeys]);

  const handleChangeAllCheckbox = useCallback(
    (newChecked: boolean) => {
      if (!rowKey) {
        return;
      }
      if (newChecked) {
        const newCheckedKeys = data.map((item) => item[rowKey] as T[K]);
        setCheckedKeys(newCheckedKeys);
      } else {
        setCheckedKeys([]);
      }
    },
    [data, rowKey]
  );

  const handleChangeCheckbox = useCallback(
    (record: T, newChecked: boolean) => {
      setCheckedKeys(
        produce((draft) => {
          if (!draft || !rowKey) {
            return;
          }
          const value = record[rowKey] as Draft<T[K]>;
          if (newChecked) {
            const index = draft.indexOf(value);
            if (index === -1) {
              draft.push(value);
            }
          } else {
            const index = draft.indexOf(value);
            if (index > -1) {
              draft.splice(index, 1);
            }
          }
        })
      );
    },
    [rowKey]
  );

  const columns = useMemo(() => {
    let columns = originColumns;
    const hasAllWidth = columns.every((col) => col.width);

    if (hasAllWidth) {
      columns = [
        ...columns,
        {
          key: "virtual" as TableKey,
          label: "",
          render: () => null,
        },
      ];
    }

    if (showCheckbox) {
      columns = [
        {
          key: "checkbox" as TableKey,
          label: (
            <Checkbox
              checked={checkedKeys.length === data.length && data.length > 0}
              onCheckedChange={handleChangeAllCheckbox}
              className="flex items-center justify-center"
            />
          ),
          render: (_value, record: T) => (
            <Checkbox
              className="flex items-center justify-center"
              checked={
                rowKey ? checkedKeys.includes(record[rowKey] as T[K]) : false
              }
              onCheckedChange={(newChecked) =>
                handleChangeCheckbox(record, newChecked as boolean)
              }
            />
          ),
          width: 55,
          align: "center" as const,
          fixed: "left" as const,
          delegateClick: true,
        },
        ...columns,
      ];
    }

    return columns;
  }, [
    checkedKeys,
    data.length,
    handleChangeAllCheckbox,
    handleChangeCheckbox,
    originColumns,
    rowKey,
    showCheckbox,
  ]);

  const getRowWidths = useCallback(
    (table: Element, isHeader: boolean = false): Record<string, number> => {
      const targetTag = isHeader ? "th" : "td";
      const row = isHeader
        ? table.querySelector("thead tr")
        : table.querySelector("tbody tr");

      if (!row) {
        return {};
      }

      const cells = row.querySelectorAll(targetTag);

      const widths = columns.reduce(
        (acc, col, colIndex) => {
          const width = cells[colIndex]?.getBoundingClientRect().width || 0;
          acc[getColumnKeyWithLabel(col)] = width;
          return acc;
        },
        {} as Record<string, number>
      );

      return widths;
    },
    [columns]
  );

  const handleMeasureWidths = useCallback(() => {
    if (
      !headerTableRef.current ||
      !bodyTableRef.current ||
      Object.values(colWidths).length > 0 ||
      isLoading
    ) {
      return;
    }
    const headerWidths = getRowWidths(headerTableRef.current, true);
    setColWidths(headerWidths);

    const bodyWidths = getRowWidths(bodyTableRef.current, false);
    const measuredWidths: Record<string, number> = {};

    columns.forEach((col) => {
      const colKey = getColumnKeyWithLabel(col);
      const headerWidth = headerWidths[colKey];
      const bodyWidth = bodyWidths[colKey];

      // 우선순위
      // 1. columns 상수에서 지정한 col.width
      // 2. bodyWidth와 headerWidth 중 큰 값
      const maxWidth = Math.max(bodyWidth, headerWidth);
      measuredWidths[colKey] = col.width ?? maxWidth;
    });

    // 너비 조정되기 전 초기 전체 width
    const totalWidth = Object.values(measuredWidths).reduce(
      (sum, w) => sum + w,
      0
    );

    // 컨테이너 폭에 맞추는 모드: 측정한 자연 너비를 비율(%)로 환산해
    // 헤더·바디 두 테이블이 같은 비율을 공유하도록 한다(별도 table이라 정렬이 어긋나면 안 됨)
    if (fitWidth) {
      if (totalWidth <= 0) {
        return;
      }
      const ratios: Record<string, number> = {};
      columns.forEach((col) => {
        const colKey = getColumnKeyWithLabel(col);
        ratios[colKey] = (measuredWidths[colKey] / totalWidth) * 100;
      });
      setColWidths(ratios);
      return;
    }

    // col.width가 있는 컬럼 너비의 합
    const absoluteWidths = columns.reduce(
      (abs, col) => (col.width ? abs + col.width : abs),
      0
    );

    // 전부 width가 있는 경우 뒷부분 채워주는 가상 컬럼 너비 계산
    if (totalWidth === absoluteWidths) {
      const virtualColWidth = MAX_TABLE_WIDTH - absoluteWidths;
      setColWidths((prev) => ({ ...prev, virtual: virtualColWidth }));
      return;
    }

    if (totalWidth < MAX_TABLE_WIDTH) {
      columns.forEach((col) => {
        if (col.width) {
          return;
        }
        const colKey = getColumnKeyWithLabel(col);
        // 비율 = 현재 컬럼 너비 / 조정되어야하는 전체 width(절대값을 갖는 컬럼 제외한 나머지 컬럼의 너비)
        const ratio = measuredWidths[colKey] / (totalWidth - absoluteWidths);

        // 조정된 컬럼 너비 = 비율 * 분배되어야할 전체 width(절대값을 갖는 컬럼 제외한 나머지 컬럼의 너비)
        measuredWidths[colKey] = ratio * (MAX_TABLE_WIDTH - absoluteWidths);
      });
    }
    setColWidths(measuredWidths);
  }, [colWidths, columns, getRowWidths, isLoading, fitWidth]);

  useEffect(() => {
    handleMeasureWidths();
    if (!isMounted) {
      setIsMounted(true);
    }
  }, [handleMeasureWidths, isMounted]);

  // 측정 전에는 auto 레이아웃이어야 컬럼별 자연 너비가 나온다.
  // 처음부터 table-fixed를 걸면 콜그룹이 비어 있어 균등 분할된 값이 측정된다.
  const isFitWidthMeasured = fitWidth && Object.keys(colWidths).length > 0;

  // fitWidth 모드에서는 최소 너비를 강제하지 않아 가로 스크롤이 생기지 않는다
  const totalTableWidth = useMemo(() => {
    if (fitWidth) {
      return undefined;
    }
    const total = Object.values(colWidths).reduce((sum, w) => sum + w, 0);
    return total > 0 ? total : MAX_TABLE_WIDTH;
  }, [colWidths, fitWidth]);

  const renderColGroup = useCallback(() => {
    return (
      <colgroup>
        {columns.map((col) => {
          const colKey = getColumnKeyWithLabel(col);
          const width = colWidths[colKey];
          return (
            <col
              key={colKey}
              style={{
                width:
                  fitWidth && width != null ? `${width}%` : width,
              }}
            />
          );
        })}
      </colgroup>
    );
  }, [colWidths, columns, fitWidth]);

  const renderContent = useCallback(() => {
    if (!hasData) {
      // 데이터 없음 and 로딩 중 : Spinner
      if (isLoading) {
        return (
          <div
            className={cn(
              "w-full flex items-center justify-center",
              autoHeight ? "py-12" : "h-full"
            )}
            style={{
              animation: "spin 1s linear infinite",
            }}
          >
            <Loader2Icon />
          </div>
        );
      }
      // 데이터 없음 and 로딩 완료 : EmptyView
      // autoHeight일 때는 부모 높이가 0이라 absolute/h-full을 쓰면 보이지 않는다
      return (
        <div
          className={cn(
            "flex w-full items-center justify-center",
            !autoHeight && "absolute h-full"
          )}
        >
          {emptyState ?? (
            <div className="text-sm text-sz-n-500">데이터가 없습니다</div>
          )}
        </div>
      );
    }

    const tableContent = (
      <div style={{ minWidth: totalTableWidth }}>
        <table
          ref={bodyTableRef}
          className={cn(
            "border-separate border-spacing-0",
            fitWidth && "w-full",
            isFitWidthMeasured && "table-fixed"
          )}
        >
          {renderColGroup()}
          <TableBody<T>
            columns={columns}
            data={data}
            onRowClick={onRowClick}
            bodyClassName={bodyClassName}
            rowDrag={rowDrag}
          />
        </table>
      </div>
    );

    if (rowDrag?.enabled) {
      return (
        <DragDropContext onDragEnd={rowDrag.onDragEnd}>
          {tableContent}
        </DragDropContext>
      );
    }

    return tableContent;
  }, [
    columns,
    data,
    hasData,
    isLoading,
    onRowClick,
    renderColGroup,
    totalTableWidth,
    bodyClassName,
    rowDrag,
    emptyState,
    fitWidth,
    isFitWidthMeasured,
    autoHeight,
  ]);

  return (
    <div
      className={cn(
        "flex flex-col bg-white transition-opacity duration-200 rounded-lg overflow-hidden",
        !autoHeight && "flex-1 min-h-0"
      )}
      style={{ opacity: isMounted ? 1 : 0 }}
    >
      {/*
        shrink-0 필수 — 이 래퍼는 세로 flex 아이템이라 기본값(flex-shrink:1)이면
        본문이 가용 높이를 넘길 때 헤더가 0px까지 눌리고, overflow-y-hidden이
        눌린 부분을 잘라내 머리글이 통째로 사라진다(행이 적을 땐 멀쩡해 보인다).
      */}
      <div
        id="table-layout"
        ref={headerScrollRef}
        className="shrink-0 overflow-x-auto overflow-y-hidden scrollbar-hidden"
      >
        <div
          style={{
            minWidth: totalTableWidth,
          }}
        >
          <table
            style={{
              minWidth: !hasData || isLoading ? totalTableWidth : undefined,
            }}
            className={cn(
              "border-separate border-spacing-0",
              fitWidth && "w-full",
              isFitWidthMeasured && "table-fixed"
            )}
            ref={headerTableRef}
          >
            {renderColGroup()}
            <TableHeader<T>
              columns={columns}
              sortOption={sortOption}
              onSortChange={onSortChange}
              headerClassName={headerClassName}
            />
          </table>
        </div>
      </div>
      <div
        className={cn(
          "flex flex-row relative",
          !autoHeight && "flex-1 overflow-hidden"
        )}
      >
        <div
          ref={bodyScrollRef}
          className={cn(
            "flex-1 scrollbar-hidden",
            isBodyScrollable && "overflow-auto"
          )}
          style={{ maxHeight: bodyMaxHeight }}
        >
          {renderContent()}
        </div>
        {hasData && isBodyScrollable && (
          <div className="absolute right-0 top-0 h-full">
            <ScrollBar direction="vertical" scrollRef={bodyScrollRef} />
          </div>
        )}
      </div>
      {hasData && !fitWidth && (
        <ScrollBar direction="horizontal" scrollRef={bodyScrollRef} />
      )}

      <div className="shrink-0">
        <TableFooter
          renderLeft={renderFooter}
          renderRight={
            pageInfo && hasData ? <Pagination {...pageInfo} /> : undefined
          }
        />
      </div>
    </div>
  );
}
