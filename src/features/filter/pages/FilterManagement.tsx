import { usePromiseQueue } from "@/common/hooks/usePromiseQueue/usePromiseQueue";
import { queryClient } from "@/common/lib/queryClient";
import { Button } from "@/components/ui/button";
import FilterCollapse from "@/features/filter/components/FilterCollapse/FilterCollapse";
import { FILTERS_QUERY_KEY } from "@/features/filter/constants/queryKey";
import { useGetFilters } from "@/features/filter/hooks/useGetFilters";
import type {
  Filter,
  FilterValue,
} from "@/features/filter/services/filterService";
import { PlusIcon } from "lucide-react";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const DEFAULT_FILTER_ITEM: Omit<Filter, "id" | "sortOrder"> = {
  filterKey: "",
  label: "",
  filterType: "CHECKBOX",
  condition: "OR",
  isActive: true,
  values: [],
};

export default function FilterManagement() {
  const { data: filters } = useGetFilters();

  const { create, remove, update, execute, isLoading } = usePromiseQueue({
    originData: filters,
    endpoint: "/admin/filters",
    keyString: "id",
  });
  const [localFilterItems, setLocalFilterItems] = useState<Array<Filter>>([]);

  useEffect(() => {
    if (filters) {
      setLocalFilterItems(filters);
    }
  }, [filters]);

  const handleChange = (
    updatedItems: Array<Filter>,
    changedItems: Array<Filter>
  ) => {
    setLocalFilterItems(updatedItems);
    changedItems.forEach(update);
  };

  const handleAddFilter = useCallback(() => {
    const newFilter: Filter = {
      ...DEFAULT_FILTER_ITEM,
      id: nanoid(),
      sortOrder: filters?.length ?? 0,
    };
    create(newFilter);
    setLocalFilterItems((prev) => [...prev, newFilter]);
  }, [create, filters?.length]);

  const handleAddValues = useCallback(
    (filter: Filter) => {
      const newValue: FilterValue = {
        id: nanoid(),
        value: "",
        label: "",
        extra: null,
        isActive: true,
        sortOrder: filter.values?.length ?? 0,
      };
      const newFilter: Filter = {
        ...filter,
        values: [...filter.values, newValue],
      };
      update(newFilter);
      setLocalFilterItems((prev) =>
        prev.map((item) => (item.id === filter.id ? newFilter : item))
      );
    },
    [update]
  );
  const handleClickSave = useCallback(async () => {
    await execute();

    queryClient.invalidateQueries({ queryKey: [FILTERS_QUERY_KEY] });
    toast.success("정상적으로 저장되었습니다.");
  }, [execute]);

  const handleRemoveFilter = useCallback(
    (filter: Filter) => {
      setLocalFilterItems((prev) =>
        prev.filter((item) => item.id !== filter.id)
      );
      remove(filter);
    },
    [remove]
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-end gap-2 items-center">
        <Button onClick={handleAddFilter} variant={"outline"} className="w-fit">
          필터 추가
          <PlusIcon className="w-fit" />
        </Button>
        <Button
          onClick={handleClickSave}
          isLoading={isLoading}
          variant="default"
          className="w-fit"
        >
          저장
        </Button>
      </div>
      <FilterCollapse
        items={localFilterItems || []}
        onChange={handleChange}
        onAddValues={handleAddValues}
        onRemove={handleRemoveFilter}
      />
    </div>
  );
}
