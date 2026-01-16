import ChevronIcon from "@/common/components/Sidebar/ChevronIcon";
import type { CollapseAPI, CollapseItem } from "@/components/ui/collapse";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AddFilterModal from "@/features/category/components/AddFilterModal/AddFilterModal";
import type { Category } from "@/features/category/services/categoryService";
import type { FilterItem } from "@/features/filter/components/FilterCollapse/FilterCollapse";
import { FunnelPlus, PlusIcon, TrashIcon } from "lucide-react";
import { useState, type KeyboardEvent, type MouseEvent } from "react";

interface CategoryCollapseContentProps {
  item: CollapseItem<Category>;
  depth: number;
  onChange: (category: Category) => void;
  api: CollapseAPI;

  isOpen?: boolean;
  hasChildren?: boolean;
  onAddCategory?: (category: Category, depth: number) => void;
  onRemoveCategory: (category: Category) => void;
  isLeaf?: boolean;
}

/**
 *  현재 1, 2, 3 depth 동일하게 해당 컴포넌트 사용 중이지만
 *  추후 3depth 렌더 전용 컴포넌트 필요해보임
 */

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
    api,
    depth,
    isLeaf = false,
  } = props;
  const [isAddFilterModalOpen, setIsAddFilterModalOpen] = useState(false);
  const [category, setCategory] = useState(item.data);
  const [isEdit, setIsEdit] = useState(false);

  const handleClickText = (e: MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
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

  const handleAddCategory = (e: MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    onAddCategory?.(category, depth);
    api.openItem(item.id);
  };

  const handleRemoveCategory = (e: MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    onRemoveCategory(category);
  };

  const handleClickAddFilter = (e: MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    setIsAddFilterModalOpen(true);
  };

  const handleAddFilter = (filters: Array<FilterItem>) => {
    console.log(filters);
  };

  return (
    <div className="flex flex-row items-center gap-2 w-full">
      <AddFilterModal
        open={isAddFilterModalOpen}
        onOpenChange={setIsAddFilterModalOpen}
        onAddFilter={handleAddFilter}
      />
      <div className="flex-1">
        {isEdit ? (
          <Input
            autoFocus
            value={category.name}
            onChange={(e) => handleChangeName(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            onClick={handleClickText}
            className="text-sm font-medium text-foreground"
          >
            {category.name}
          </span>
        )}
      </div>

      <div className="flex flex-row items-center gap-2">
        {depth > 1 && (
          <Tooltip>
            <TooltipTrigger>
              <FunnelPlus
                onClick={handleClickAddFilter}
                className="w-4 h-4 cursor-pointer"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>필터 연결</p>
            </TooltipContent>
          </Tooltip>
        )}

        {!isLeaf && (
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
        )}
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
        {hasChildren && isOpen !== undefined && (
          <span className="ml-2 shrink-0 text-muted-foreground cursor-pointer">
            <ChevronIcon isOpen={isOpen} />
          </span>
        )}
      </div>
    </div>
  );
}
