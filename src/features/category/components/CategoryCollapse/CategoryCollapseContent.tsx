import ChevronIcon from "@/common/components/Sidebar/ChevronIcon";
import type { CollapseAPI, CollapseItem } from "@/components/ui/collapse";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Category } from "@/features/category/services/categoryService";
import { PlusIcon, TrashIcon } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

interface CategoryCollapseContentProps {
  item: CollapseItem<Category>;
  depth: number;
  isOpen: boolean;
  hasChildren: boolean;
  onChange: (category: Category) => void;
  onAddCategory: (category: Category, depth: number) => void;
  onRemoveCategory: (category: Category) => void;
  api: CollapseAPI;
}

export default function CategoryCollapseContent(
  props: CategoryCollapseContentProps
) {
  const {
    hasChildren,
    isOpen,
    item,
    onChange,
    onAddCategory,
    onRemoveCategory,
    depth,
    api,
  } = props;
  const [category, setCategory] = useState(item.data);
  const [isEdit, setIsEdit] = useState(false);

  const handleClickText = () => {
    setIsEdit(true);
  };

  if (!category) {
    return null;
  }

  const handleChangeName = (name: string) => {
    setCategory({ ...category, name });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEdit(false);
      onChange(category);
    } else if (e.key === "Escape") {
      setIsEdit(false);
      setCategory(item.data);
    }
  };

  const handleBlur = () => {
    setIsEdit(false);
    onChange(category);
  };

  const handleAddCategory = () => {
    onAddCategory(category, depth);
    api.toggleItem(item.id);
  };

  const handleRemoveCategory = () => {
    onRemoveCategory(category);
  };

  return (
    <div className="flex flex-row items-center gap-2 w-full">
      {isEdit ? (
        <Input
          value={category.name}
          onChange={(e) => handleChangeName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      ) : (
        <span
          onClick={handleClickText}
          className="flex-1 text-sm font-medium text-foreground"
        >
          {category.name}
        </span>
      )}

      <div className="flex flex-row items-center gap-2">
        <Tooltip>
          <TooltipTrigger>
            <PlusIcon
              onClick={handleAddCategory}
              className="w-4 h-4 cursor-pointer"
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>카테고리 추가</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <TrashIcon
              onClick={handleRemoveCategory}
              className="w-4 h-4 cursor-pointer"
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>카테고리 제거</p>
          </TooltipContent>
        </Tooltip>
        {hasChildren && (
          <span className="ml-2 shrink-0 text-muted-foreground cursor-pointer">
            <ChevronIcon isOpen={isOpen} />
          </span>
        )}
      </div>
    </div>
  );
}
