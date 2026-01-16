import { Collapse, type CollapseItem } from "@/components/ui/collapse";
import FilterCollapseContent from "@/features/filter/components/FilterCollapse/FilterCollapseContent";
import FilterCollapseLeaf from "@/features/filter/components/FilterCollapse/FilterCollapseLeaf";
import type {
  FilterCondition,
  FilterUIType,
} from "@/features/filter/types/filter";
import { useCallback, useMemo, useState } from "react";

export interface FilterItem {
  id: number;
  key: string;
  label: string;
  type: FilterUIType;
  isActive: boolean;
  condition: FilterCondition;
  values?: Array<{
    value: number;
    label: string;
    extra: string | null;
  }>;
}

interface FilterCollapseProps {
  items: FilterItem[];
  onChange?: (item: FilterItem) => void;
}

export default function FilterCollapse(props: FilterCollapseProps) {
  const { items, onChange } = props;
  const [openKeys, setOpenKeys] = useState<Set<number | string>>(new Set());

  const collapseItems = useMemo(() => {
    const result: Array<CollapseItem<FilterItem>> = [];

    items.forEach((item, index) => {
      // 1뎁스: 필터 아이템
      result.push({
        id: item.id,
        parentId: null,
        order: index,
        data: item,
      });

      // 2뎁스: values
      if (item.values && item.values.length > 0) {
        item.values.forEach((value, valueIndex) => {
          result.push({
            id: `${item.id}-${value.value}`,
            parentId: item.id,
            order: valueIndex,
            data: {
              ...item,
              values: [value],
            },
          });
        });
      }
    });

    return result;
  }, [items]);

  const handleChange = useCallback(
    (item: FilterItem) => {
      onChange?.(item);
    },
    [onChange]
  );

  return (
    <Collapse
      draggable
      items={collapseItems}
      openKeys={openKeys}
      maxDepth={2}
      onOpenKeysChange={setOpenKeys}
      renderItem={(props, api) => (
        <FilterCollapseContent {...props} api={api} onChange={handleChange} />
      )}
      renderLeafItem={(props, api) => (
        <FilterCollapseLeaf {...props} api={api} />
      )}
    />
  );
}
