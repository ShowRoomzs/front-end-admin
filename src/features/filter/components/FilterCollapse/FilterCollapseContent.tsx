import Toggle from "@/common/components/Toggle/Toggle";
import ChevronIcon from "@/common/components/Sidebar/ChevronIcon";
import type { CollapseAPI, CollapseItem } from "@/components/ui/collapse";
import type { FilterItem } from "@/features/filter/components/FilterCollapse/FilterCollapse";
import EditableField from "@/features/filter/components/EditableField/EditableField";
import {
  FILTER_CONDITION_OPTIONS,
  FILTER_TYPE_OPTIONS,
} from "@/features/filter/constants/filter";
import type {
  FilterCondition,
  FilterUIType,
} from "@/features/filter/types/filter";
import { useEffect, useState } from "react";
import { PlusIcon, Trash } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FilterCollapseContentProps {
  item: CollapseItem<FilterItem>;
  isOpen?: boolean;
  hasChildren?: boolean;
  api: CollapseAPI;
  onChange: (item: FilterItem) => void;
}

export default function FilterCollapseContent(
  props: FilterCollapseContentProps
) {
  const { item, isOpen, hasChildren, onChange, api } = props;

  const [label, setLabel] = useState(item.data?.label ?? "");
  const [key, setKey] = useState(item.data?.key ?? "");
  const [isActive, setIsActive] = useState(item.data?.isActive ?? false);

  useEffect(() => {
    if (item.data) {
      setLabel(item.data.label ?? "");
      setKey(item.data.key ?? "");
      setIsActive(item.data.isActive ?? false);
    }
  }, [item.data]);

  if (!item.data) {
    return null;
  }

  const handleChangeKey = (value: string) => {
    setKey(value);
    onChange({ ...item.data, key: value } as FilterItem);
  };

  const handleChangeLabel = (value: string) => {
    setLabel(value);
    onChange({ ...item.data, label: value } as FilterItem);
  };

  const handleChangeType = (value: FilterUIType | null) => {
    if (value !== null) {
      onChange({ ...item.data, type: value } as FilterItem);
    }
  };

  const handleChangeCondition = (value: FilterCondition) => {
    onChange({ ...item.data, condition: value } as FilterItem);
  };

  const handleChangeIsActive = (checked: boolean) => {
    setIsActive(checked);
    onChange({ ...item.data, isActive: checked } as FilterItem);
  };

  const handleAddValue = () => {
    const currentValues = item.data?.values ?? [];
    const newValueId = Math.max(0, ...currentValues.map((v) => v.value), 0) + 1;
    const newValue = {
      value: newValueId,
      label: `새로운 필터#${newValueId}`,
      extra: null,
    };
    onChange({
      ...item.data,
      values: [...currentValues, newValue],
    } as FilterItem);
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
        <EditableField<FilterUIType | null>
          type="select"
          label="Type"
          isEdit={true}
          value={item.data.type}
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
      <Tooltip>
        <TooltipTrigger asChild>
          <Trash
            width={16}
            height={16}
            className="cursor-pointer"
            onClick={(e) => e.stopPropagation()}
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
