import Toggle from "@/common/components/Toggle/Toggle";
import ChevronIcon from "@/common/components/Sidebar/ChevronIcon";
import type { CollapseAPI, CollapseItem } from "@/components/ui/collapse";
import EditableField from "@/features/filter/components/EditableField/EditableField";
import {
  FILTER_CONDITION_OPTIONS,
  FILTER_TYPE_OPTIONS,
} from "@/features/filter/constants/filter";

import { useEffect, useState } from "react";
import { PlusIcon, Trash } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NO_VALUE_FILTERS } from "@/features/filter/components/FilterCollapse/config";
import type {
  Filter,
  FilterCondition,
  FilterType,
} from "@/features/filter/services/filterService";

interface FilterCollapseContentProps {
  item: CollapseItem<Filter>;
  isOpen?: boolean;
  hasChildren?: boolean;
  api: CollapseAPI;
  onChange: (filter: Filter) => void;
  onAddValues: (filter: Filter) => void;
  onRemove: (filter: Filter) => void;
}

export default function FilterCollapseContent(
  props: FilterCollapseContentProps
) {
  const { item, isOpen, hasChildren, onChange, onAddValues, api, onRemove } =
    props;

  const [label, setLabel] = useState(item.data?.label ?? "");
  const [key, setKey] = useState(item.data?.filterKey ?? "");
  const [isActive, setIsActive] = useState(item.data?.isActive ?? false);

  useEffect(() => {
    if (item.data) {
      setLabel(item.data.label ?? "");
      setKey(item.data.filterKey ?? "");
      setIsActive(item.data.isActive ?? false);
    }
  }, [item.data]);

  if (!item.data) {
    return null;
  }

  const handleChangeKey = (value: string) => {
    setKey(value);
    onChange({ ...item.data, filterKey: value } as Filter);
  };

  const handleChangeLabel = (value: string) => {
    setLabel(value);
    onChange({ ...item.data, label: value } as Filter);
  };

  const handleChangeType = (value: FilterType | null) => {
    // TODO : NO_VALUE_FILTERS 포함된 아이템이라면 자식 노드 제거
    if (value !== null) {
      onChange({ ...item.data, filterType: value } as Filter);
    }
  };

  const handleChangeCondition = (value: FilterCondition | null) => {
    onChange({ ...item.data, condition: value } as Filter);
  };

  const handleChangeIsActive = (checked: boolean) => {
    setIsActive(checked);
    onChange({ ...item.data, isActive: checked } as Filter);
  };

  const handleAddValue = () => {
    if (!item.data) {
      return;
    }
    onAddValues(item.data);
    api.openItem(item.id);
  };

  return (
    <div className="flex flex-row items-center gap-3 w-full min-h-[40px]">
      <div className="flex-1 flex flex-row items-center gap-6 flex-wrap">
        <EditableField
          type="input"
          label="Key"
          isEdit={true}
          value={key}
          onChange={handleChangeKey}
          className="min-w-[100px]"
        />
        <EditableField
          type="input"
          label="Label"
          isEdit={true}
          value={label}
          onChange={handleChangeLabel}
          className="min-w-[100px]"
        />
        <EditableField<FilterType | null>
          type="select"
          label="Type"
          isEdit={true}
          value={item.data.filterType}
          onChange={handleChangeType}
          options={FILTER_TYPE_OPTIONS}
          className="min-w-[140px]"
        />
        <EditableField<FilterCondition>
          type="select"
          label="Condition"
          isEdit={true}
          value={item.data.condition}
          onChange={handleChangeCondition}
          options={FILTER_CONDITION_OPTIONS}
          className="min-w-[120px]"
        />

        <Toggle
          label="Active"
          checked={isActive}
          onCheckedChange={handleChangeIsActive}
          className="min-w-[100px]"
        />
      </div>
      {!NO_VALUE_FILTERS.includes(item.data.filterType) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <PlusIcon
              width={16}
              height={16}
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleAddValue();
              }}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>필터 항목 추가</p>
          </TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Trash
            width={16}
            height={16}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item.data as Filter);
            }}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>필터 항목 삭제</p>
        </TooltipContent>
      </Tooltip>
      {hasChildren && isOpen !== undefined && <ChevronIcon isOpen={isOpen} />}
    </div>
  );
}
