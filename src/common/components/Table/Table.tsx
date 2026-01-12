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

const MAX_TABLE_WIDTH = 1760;

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
  } = props;
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

      const widths = columns.reduce((acc, col, colIndex) => {
        const width = cells[colIndex]?.getBoundingClientRect().width || 0;
        acc[getColumnKeyWithLabel(col)] = width;
        return acc;
      }, {} as Record<string, number>);

      return widths;
    },
    [columns]
  );

  const handleMeasureWidths = useCallback(() => {
    if (
      !headerTableRef.current ||
      !bodyTableRef.current ||
      Object.values(colWidths).length > 0
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

      const maxWidth = Math.max(bodyWidth, headerWidth);
      measuredWidths[colKey] = col.width ?? maxWidth;
    });

    const totalWidth = Object.values(measuredWidths).reduce(
      (sum, w) => sum + w,
      0
    );

    const absoluteWidths = columns.reduce(
      (abs, col) => (col.width ? abs + col.width : abs),
      0
    );

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
        const ratio = measuredWidths[colKey] / (totalWidth - absoluteWidths);

        measuredWidths[colKey] = ratio * (MAX_TABLE_WIDTH - absoluteWidths);
      });
    }
    setColWidths(measuredWidths);
  }, [colWidths, columns, getRowWidths]);

  useEffect(() => {
    handleMeasureWidths();
    if (!isMounted) {
      setIsMounted(true);
    }
  }, [handleMeasureWidths, isMounted]);

  const totalTableWidth = useMemo(() => {
    const total = Object.values(colWidths).reduce((sum, w) => sum + w, 0);
    return total > 0 ? total : MAX_TABLE_WIDTH;
  }, [colWidths]);

  const renderColGroup = useCallback(() => {
    return (
      <colgroup>
        {columns.map((col) => (
          <col
            key={getColumnKeyWithLabel(col)}
            style={{ width: colWidths[getColumnKeyWithLabel(col)] }}
          />
        ))}
      </colgroup>
    );
  }, [colWidths, columns]);

  const renderContent = useCallback(() => {
    if (!hasData) {
      if (isLoading) {
        return (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              animation: "spin 1s linear infinite",
            }}
          >
            <Loader2Icon />
          </div>
        );
      }
      return (
        <div className="absolute flex items-center justify-center h-full w-full">
          <div className="text-sm text-gray-500">데이터가 없습니다</div>
        </div>
      );
    }

    return (
      <div style={{ minWidth: totalTableWidth }}>
        <table ref={bodyTableRef} className="border-separate border-spacing-0">
          {renderColGroup()}
          <TableBody<T>
            columns={columns}
            data={data}
            onRowClick={onRowClick}
            bodyClassName={bodyClassName}
          />
        </table>
      </div>
    );
  }, [
    columns,
    data,
    hasData,
    isLoading,
    onRowClick,
    renderColGroup,
    totalTableWidth,
    bodyClassName,
  ]);

  return (
    <div
      className="font-noto flex flex-col flex-1 min-h-0 bg-white transition-opacity duration-200 rounded-lg overflow-hidden"
      style={{ opacity: isMounted ? 1 : 0 }}
    >
      <div
        id="table-layout"
        ref={headerScrollRef}
        className="overflow-x-auto overflow-y-hidden scrollbar-hidden"
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
            className="border-separate border-spacing-0"
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
      <div className="flex flex-row flex-1 overflow-hidden relative">
        <div
          ref={bodyScrollRef}
          className="flex-1 overflow-auto scrollbar-hidden"
        >
          {renderContent()}
        </div>
        {hasData && (
          <div className="absolute right-0 top-0 h-full">
            <ScrollBar direction="vertical" scrollRef={bodyScrollRef} />
          </div>
        )}
      </div>
      {hasData && (
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
