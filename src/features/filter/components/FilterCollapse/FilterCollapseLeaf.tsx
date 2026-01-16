import type { CollapseAPI, CollapseItem } from "@/components/ui/collapse";
import type { FilterItem } from "@/features/filter/components/FilterCollapse/FilterCollapse";
import { Trash } from "lucide-react";
import { useMemo } from "react";

interface FilterCollapseLeafProps {
  item: CollapseItem<FilterItem>;
  api: CollapseAPI;
}

export default function FilterCollapseLeaf(props: FilterCollapseLeafProps) {
  const { item } = props;
  const leafItem = useMemo(() => {
    const originLeaf = item.data?.values?.find(
      (v) => v.value === Number(item.id.toString().split("-")[1])
    );
    return {
      ...item,
      ...originLeaf,
    };
  }, [item]);

  return (
    <div className="flex flex-row items-center justify-between w-full">
      <div className="flex flex-row items-center gap-2">
        <span className="text-sm font-medium text-foreground">
          {leafItem.label}
        </span>
        {leafItem.extra && (
          <span className="text-sm text-muted-foreground">
            {leafItem.extra}
          </span>
        )}
      </div>
      <Trash
        width={16}
        height={16}
        className="cursor-pointer justify-self-end"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
