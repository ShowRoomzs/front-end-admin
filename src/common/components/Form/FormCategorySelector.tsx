import { forwardRef, useMemo, useState, useEffect, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetCategory } from "@/features/category/hooks/useGetCategory";

export interface CategoryValue {
  main: number | null;
  sub: number | null;
  detail: number | null;
}

interface FormCategorySelectorProps {
  onChange?: (data: CategoryValue) => void;
  value?: CategoryValue | number;
}

const FormCategorySelector = forwardRef<
  HTMLButtonElement,
  FormCategorySelectorProps
>((props, ref) => {
  const { onChange, value } = props;

  const { categoryMap } = useGetCategory();

  const getCategoryHierarchy = useCallback(
    (
      categoryId: number
    ): { main: number | null; sub: number | null; detail: number | null } => {
      if (!categoryMap) {
        return { main: null, sub: null, detail: null };
      }

      const category = categoryMap.byId.get(categoryId);
      if (!category) {
        return { main: null, sub: null, detail: null };
      }

      if (!category.parentId) {
        return { main: categoryId, sub: null, detail: null };
      }

      const parent = categoryMap.byId.get(category.parentId);
      if (!parent) {
        return { main: null, sub: null, detail: null };
      }

      if (!parent.parentId) {
        return { main: parent.categoryId, sub: categoryId, detail: null };
      }

      const grandParent = categoryMap.byId.get(parent.parentId);
      if (!grandParent) {
        return { main: null, sub: null, detail: null };
      }

      return {
        main: grandParent.categoryId,
        sub: parent.categoryId,
        detail: categoryId,
      };
    },
    [categoryMap]
  );

  const [selectedMain, setSelectedMain] = useState<number | null>(null);
  const [selectedSub, setSelectedSub] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!categoryMap || isInitialized) return;

    if (!value) {
      setIsInitialized(true);
      return;
    }

    const hierarchy =
      typeof value === "number" ? getCategoryHierarchy(value) : value;

    setSelectedMain(hierarchy.main);
    setSelectedSub(hierarchy.sub);
    setSelectedDetail(hierarchy.detail);
    setIsInitialized(true);
  }, [categoryMap, value, getCategoryHierarchy, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !categoryMap) return;

    const newValue =
      typeof value === "number" ? getCategoryHierarchy(value) : value;

    const isChanged =
      newValue?.main !== selectedMain ||
      newValue?.sub !== selectedSub ||
      newValue?.detail !== selectedDetail;

    if (isChanged) {
      setSelectedMain(newValue?.main ?? null);
      setSelectedSub(newValue?.sub ?? null);
      setSelectedDetail(newValue?.detail ?? null);
    }
  }, [
    value,
    selectedMain,
    selectedSub,
    selectedDetail,
    getCategoryHierarchy,
    isInitialized,
    categoryMap,
  ]);

  const subCategories = useMemo(() => {
    if (!selectedMain || !categoryMap) return [];
    return categoryMap.byParentId.get(selectedMain) || [];
  }, [selectedMain, categoryMap]);

  const detailCategories = useMemo(() => {
    if (!selectedSub || !categoryMap) return [];
    return categoryMap.byParentId.get(selectedSub) || [];
  }, [selectedSub, categoryMap]);

  const handleMainChange = (mainStr: string) => {
    const main = Number(mainStr);
    setSelectedMain(main);
    setSelectedSub(null);
    setSelectedDetail(null);
    onChange?.({ main, sub: null, detail: null });
  };

  const handleSubChange = (subStr: string) => {
    const sub = Number(subStr);
    setSelectedSub(sub);
    setSelectedDetail(null);
    onChange?.({ main: selectedMain, sub, detail: null });
  };

  const handleDetailChange = (detailStr: string) => {
    const detail = Number(detailStr);
    setSelectedDetail(detail);
    onChange?.({ main: selectedMain, sub: selectedSub, detail });
  };
  if (!categoryMap) {
    return (
      <div className="text-sm text-muted-foreground">카테고리 로딩 중...</div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Select
        value={selectedMain?.toString() ?? ""}
        onValueChange={handleMainChange}
      >
        <SelectTrigger ref={ref} className="flex-1">
          <SelectValue placeholder="대분류 선택" />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          {categoryMap.mainCategories.map((category) => (
            <SelectItem
              key={category.categoryId}
              value={category.categoryId.toString()}
            >
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground">&gt;</span>

      <Select
        value={selectedSub?.toString() ?? ""}
        onValueChange={handleSubChange}
        disabled={!selectedMain}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="중분류 선택" />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          {subCategories.map((category) => (
            <SelectItem
              key={category.categoryId}
              value={category.categoryId.toString()}
            >
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground">&gt;</span>

      <Select
        value={selectedDetail?.toString() ?? ""}
        onValueChange={handleDetailChange}
        disabled={!selectedSub}
      >
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="소분류 선택" />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          {detailCategories.map((category) => (
            <SelectItem
              key={category.categoryId}
              value={category.categoryId.toString()}
            >
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});

FormCategorySelector.displayName = "FormCategorySelector";

export default FormCategorySelector;
