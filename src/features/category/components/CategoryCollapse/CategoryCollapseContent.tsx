import Image from "@/common/components/Image/Image";
import ChevronIcon from "@/common/components/Sidebar/ChevronIcon";
import type { CollapseAPI, CollapseItem } from "@/components/ui/collapse";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Category } from "@/features/category/services/categoryService";
import {
  FunnelPlus,
  ImageOff,
  ImagePlus,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import {
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import toast from "react-hot-toast";

interface CategoryCollapseContentProps {
  item: CollapseItem<Category>;
  depth: number;
  onChange: (category: Category) => void;
  api: CollapseAPI;

  isOpen?: boolean;
  hasChildren?: boolean;
  onAddCategory?: (category: Category, depth: number) => void;
  onRemoveCategory: (category: Category) => void;
  onClickAddFilter: (categoryId: number | string) => void;
  onClickAddImage?: (category: Category, file: File) => Promise<string>; // file url 반환
  isLeaf?: boolean;
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
    api,
    depth,
    onClickAddFilter,
    isLeaf = false,
    onClickAddImage,
  } = props;
  const [category, setCategory] = useState(item.data);
  const [isEdit, setIsEdit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // 아직db에 저장되지 않은 데이터는 id 타입이 string임(nanoid로 생성)
  const isNotCreatedValue = typeof item.id === "string";

  const handleClickAddFilter = (e: MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    if (isNotCreatedValue) {
      toast.error("카테고리 저장 후 필터 연결 가능합니다.");
      return;
    }
    onClickAddFilter(item.id);
  };

  const handleClickAddImage = (e: MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleChangeFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onClickAddImage) {
      const iconUrl = await onClickAddImage(category, file);
      if (iconUrl) {
        setCategory({ ...category, iconUrl });
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const hasImageDepth = depth === 2;
  const hasFilterDepth = depth > 1;
  return (
    <div className="flex flex-row items-center gap-2 w-full">
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onClickCapture={(e) => e.stopPropagation()}
        onChange={handleChangeFile}
      />
      {hasImageDepth && (
        <div>
          {category.iconUrl ? (
            <Image showPreview className="w-4 h-4" src={category.iconUrl} />
          ) : (
            <ImageOff className="w-4 h-4" color="gray" />
          )}
        </div>
      )}
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
        {/* 2depth 카테고리에만 이미지 추가 버튼 표시 */}
        {hasImageDepth && (
          <Tooltip>
            <TooltipTrigger>
              <ImagePlus
                onClick={handleClickAddImage}
                className="w-4 h-4 cursor-pointer"
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>이미지 추가</p>
            </TooltipContent>
          </Tooltip>
        )}
        {hasFilterDepth && (
          <Tooltip>
            <TooltipTrigger>
              <FunnelPlus
                onClick={handleClickAddFilter}
                className="w-4 h-4 cursor-pointer"
                color={isNotCreatedValue ? "gray" : "black"}
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
