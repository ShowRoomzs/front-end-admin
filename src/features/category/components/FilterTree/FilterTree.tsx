import { Checkbox } from "@/components/ui/checkbox";
import type {
  Filter,
  FilterValue,
} from "@/features/filter/services/filterService";
import { ChevronRight } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type React from "react";

interface FilterTreeProps {
  items: Array<Filter>;
  selectedFilterIds?: Array<number | string>;
  onChange?: (selectedIds: Array<number | string>) => void;
  disabledFilterIds?: Array<number | string>;
}

export default function FilterTree(props: FilterTreeProps) {
  const {
    items,
    selectedFilterIds = [],
    onChange,
    disabledFilterIds = [],
  } = props;
  const [expandedIds, setExpandedIds] = useState<Set<number | string>>(
    new Set()
  );

  const selectedIdsSet = useMemo(
    () => new Set(selectedFilterIds),
    [selectedFilterIds]
  );

  const disabledIdsSet = useMemo(
    () => new Set(disabledFilterIds),
    [disabledFilterIds]
  );

  const getLeafNodeIds = useMemo(() => {
    const fn = (filterItem: Filter): Array<number | string> => {
      if (filterItem.values && filterItem.values.length > 0) {
        return filterItem.values.map((v) => `${filterItem.id}-${v.id}`);
      }
      return [filterItem.id];
    };

    return fn;
  }, []);

  const isChecked = useCallback(
    (
      filterItem: Filter,
      isValue?: boolean,
      valueId?: number | string
    ): boolean => {
      if (isValue && valueId !== undefined) {
        return selectedIdsSet.has(`${filterItem.id}-${valueId}`);
      }

      const leafIds = getLeafNodeIds(filterItem);
      return leafIds.every((id) => selectedIdsSet.has(id));
    },
    [getLeafNodeIds, selectedIdsSet]
  );

  const isDisabled = useCallback(
    (
      filterItem: Filter,
      isValue?: boolean,
      valueId?: number | string
    ): boolean => {
      if (isValue && valueId !== undefined) {
        return disabledIdsSet.has(`${filterItem.id}-${valueId}`);
      }

      const leafIds = getLeafNodeIds(filterItem);
      return leafIds.some((id) => disabledIdsSet.has(id));
    },
    [getLeafNodeIds, disabledIdsSet]
  );

  const toggleExpand = useCallback((filterId: number | string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(filterId)) {
        next.delete(filterId);
      } else {
        next.add(filterId);
      }
      return next;
    });
  }, []);

  const handleCheckChange = useCallback(
    (
      filterItem: Filter,
      checked: boolean,
      isValue?: boolean,
      valueId?: number | string
    ) => {
      if (!onChange) return;

      const newSelectedIds = new Set(selectedFilterIds);

      if (isValue && valueId !== undefined) {
        const valueKey = `${filterItem.id}-${valueId}`;
        if (checked) {
          newSelectedIds.add(valueKey);
        } else {
          newSelectedIds.delete(valueKey);
        }
      } else {
        const leafIds = getLeafNodeIds(filterItem);
        if (checked) {
          leafIds.forEach((id) => newSelectedIds.add(id));
        } else {
          leafIds.forEach((id) => newSelectedIds.delete(id));
        }
      }

      onChange(Array.from(newSelectedIds));
    },
    [getLeafNodeIds, onChange, selectedFilterIds]
  );

  const renderFilterItem = useMemo(() => {
    const fn = (filterItem: Filter, depth: number = 0): React.ReactNode => {
      const hasValues = filterItem.values && filterItem.values.length > 0;
      const isExpanded = expandedIds.has(filterItem.id);
      const checked = isChecked(filterItem);
      const disabled = isDisabled(filterItem);

      return (
        <div key={filterItem.id}>
          <div
            className="flex items-center gap-2 py-1 hover:bg-accent cursor-pointer"
            style={{ paddingLeft: `${depth * 20 + 8}px` }}
            onClick={(e) => {
              if (
                e.target instanceof HTMLElement &&
                e.target.closest("button")
              ) {
                return;
              }
              if (hasValues) {
                toggleExpand(filterItem.id);
              }
            }}
          >
            {hasValues && (
              <button
                className="flex items-center justify-center w-4 h-4"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(filterItem.id);
                }}
              >
                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
              </button>
            )}
            {!hasValues && <div className="w-4" />}
            <Checkbox
              checked={checked}
              disabled={disabled}
              onCheckedChange={(checked) => {
                handleCheckChange(filterItem, checked === true);
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <span
              className={`text-sm ${disabled ? "text-muted-foreground" : ""}`}
            >
              {filterItem.label}
            </span>
          </div>
          {hasValues && isExpanded && filterItem.values && (
            <div>
              {filterItem.values.map((value: FilterValue) => {
                const valueChecked = isChecked(filterItem, true, value.id);
                const valueDisabled = isDisabled(filterItem, true, value.id);
                return (
                  <div
                    key={`${filterItem.id}-${value.id}`}
                    className="flex items-center gap-2 py-1 hover:bg-accent cursor-pointer"
                    style={{ paddingLeft: `${(depth + 1) * 20 + 24}px` }}
                  >
                    <div className="w-4" />
                    <Checkbox
                      checked={valueChecked}
                      disabled={valueDisabled}
                      onCheckedChange={(checked) => {
                        handleCheckChange(
                          filterItem,
                          checked === true,
                          true,
                          value.id
                        );
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span
                      className={`text-sm ${
                        valueDisabled
                          ? "text-muted-foreground"
                          : valueChecked
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                      }`}
                    >
                      {value.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    };

    return fn;
  }, [expandedIds, isChecked, isDisabled, toggleExpand, handleCheckChange]);

  return (
    <div className="max-h-[400px] overflow-y-auto">
      {items.map((item) => renderFilterItem(item))}
    </div>
  );
}
