import type { CollapseAPI, CollapseItem } from "@/components/ui/collapse";
import type { FilterItem } from "@/features/filter/components/FilterCollapse/FilterCollapse";
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

  return <div>leaf</div>;
}
