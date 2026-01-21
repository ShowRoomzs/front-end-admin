import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FilterTree from "@/features/category/components/FilterTree/FilterTree";
import { useEffect, useState } from "react";
import { useGetFilters } from "@/features/filter/hooks/useGetFilters";
import type { Filter } from "@/features/filter/services/filterService";
import type {
  Category,
  CategoryFilter,
} from "@/features/category/services/categoryService";
import { extractFilterIds } from "@/features/category/utils/extractFilterIds";

interface AddFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFilters: Array<CategoryFilter | Category>;
  onAddFilter: (filters: Array<Filter>) => void;
  disabledFilterIds?: Array<number | string>;
}

export default function AddFilterModal(props: AddFilterModalProps) {
  const {
    onAddFilter,
    onOpenChange,
    open,
    initialFilters,
    disabledFilterIds = [],
  } = props;
  const { data: filters } = useGetFilters();
  const [selectedFilterIds, setSelectedFilterIds] = useState<
    Array<number | string>
  >([]);

  useEffect(() => {
    if (initialFilters.length > 0) {
      const flattenFilterIds = extractFilterIds(
        initialFilters as Array<CategoryFilter | Filter>
      );
      setSelectedFilterIds(flattenFilterIds);
    }
  }, [initialFilters]);
  if (!filters) {
    return null;
  }

  const handleSave = () => {
    const selectedFilters = filters
      .map((item) => {
        const isItemSelected = selectedFilterIds.includes(item.id);
        const selectedValues =
          item.values?.filter((value) =>
            selectedFilterIds.includes(`${item.id}-${value.id}`)
          ) ?? [];

        if (isItemSelected) {
          return item;
        }

        if (selectedValues.length > 0) {
          return {
            ...item,
            values: selectedValues,
          };
        }

        return null;
      })
      .filter((item): item is Filter => item !== null);

    onAddFilter(selectedFilters);
    setSelectedFilterIds([]);
    onOpenChange(false);
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedFilterIds([]);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        onClick={(e) => e.stopPropagation()}
        className="sm:max-w-[500px]"
      >
        <DialogHeader>
          <DialogTitle>필터 추가</DialogTitle>
        </DialogHeader>
        <FilterTree
          items={filters}
          selectedFilterIds={selectedFilterIds}
          onChange={setSelectedFilterIds}
          disabledFilterIds={disabledFilterIds}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
