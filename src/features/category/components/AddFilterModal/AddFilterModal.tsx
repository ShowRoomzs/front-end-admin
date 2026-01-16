import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FilterItem } from "@/features/filter/components/FilterCollapse/FilterCollapse";
import { DUMMY_FILTER_ITEMS } from "@/features/filter/pages/FilterManagement";
import FilterTree from "@/features/category/components/FilterTree/FilterTree";
import { useState } from "react";

interface AddFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFilter: (filters: Array<FilterItem>) => void;
}

export default function AddFilterModal(props: AddFilterModalProps) {
  const { onAddFilter, onOpenChange, open } = props;
  const [selectedFilterIds, setSelectedFilterIds] = useState<
    Array<number | string>
  >([]);

  const handleSave = () => {
    const selectedFilters = DUMMY_FILTER_ITEMS.map((item) => {
      const isItemSelected = selectedFilterIds.includes(item.id);
      const selectedValues =
        item.values?.filter((value) =>
          selectedFilterIds.includes(`${item.id}-${value.value}`)
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
    }).filter((item): item is FilterItem => item !== null);

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
          items={DUMMY_FILTER_ITEMS}
          selectedFilterIds={selectedFilterIds}
          onChange={setSelectedFilterIds}
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
