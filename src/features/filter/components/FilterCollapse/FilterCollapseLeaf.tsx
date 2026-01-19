import Toggle from "@/common/components/Toggle/Toggle";
import type { CollapseAPI, CollapseItem } from "@/components/ui/collapse";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type {
  Filter,
  FilterValue,
} from "@/features/filter/services/filterService";
import { Trash } from "lucide-react";
import { useCallback, useMemo } from "react";

interface FilterCollapseLeafProps {
  item: CollapseItem<Filter>;
  api: CollapseAPI;
  onChange: (filter: Filter) => void;
  onRemove: (parentId: number | string, filterValue: FilterValue) => void;
}

export default function FilterCollapseLeaf(props: FilterCollapseLeafProps) {
  const { item, onChange, onRemove } = props;
  // collapse 자체 구조가 재귀적이라 data.values에서 추출하여 사용해야함
  const leafItem = useMemo(() => {
    return item.data?.values.find((v) => v.id === item.id);
  }, [item]);
  const handleChange = useCallback(
    (key: keyof FilterValue, value: FilterValue[keyof FilterValue]) => {
      const newValues = item.data?.values.map((v) =>
        v.id === item.id ? { ...v, [key]: value } : v
      );
      onChange({ ...item.data, values: newValues } as Filter);
    },
    [item.data, item.id, onChange]
  );

  if (!leafItem) {
    return null;
  }
  return (
    <div className="flex flex-row items-center justify-between w-full">
      <div className="flex flex-row items-center gap-2">
        <span className="text-sm font-medium text-foreground">Label</span>
        <Input
          value={leafItem.label}
          onChange={(e) => {
            handleChange("label", e.target.value);
          }}
        />
        <span className="text-sm font-medium text-foreground">Value</span>
        <Input
          value={leafItem.value}
          onChange={(e) => {
            handleChange("value", e.target.value);
          }}
        />
        <span className="text-sm text-muted-foreground">Extra</span>
        <Input
          value={leafItem.extra ?? ""}
          onChange={(e) => {
            handleChange("extra", e.target.value);
          }}
        />
        <Toggle
          label="Active"
          checked={leafItem.isActive ?? false}
          onCheckedChange={(checked) => {
            handleChange("isActive", checked);
          }}
        />
      </div>
      <Tooltip>
        <TooltipTrigger>
          <Trash
            width={16}
            height={16}
            className="cursor-pointer justify-self-end"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.parentId as number | string, leafItem);
            }}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>필터 항목 삭제</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
