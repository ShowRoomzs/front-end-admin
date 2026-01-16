import { Button } from "@/components/ui/button";
import FilterCollapse, {
  type FilterItem,
} from "@/features/filter/components/FilterCollapse/FilterCollapse";
import { produce } from "immer";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

export const DUMMY_FILTER_ITEMS: Array<FilterItem> = [
  {
    id: 1,
    key: "gender",
    label: "성별",
    type: "checkbox",
    isActive: true,
    condition: "OR",
    values: [
      { value: 101, label: "남성", extra: null },
      { value: 102, label: "여성", extra: null },
    ],
  },
  {
    id: 2,
    key: "color",
    label: "색상",
    type: "color",
    condition: "OR",
    isActive: true,
    values: [
      {
        value: 201,
        label: "블랙",
        extra: "#000000",
      },
      {
        value: 202,
        label: "화이트",
        extra: "#FFFFFF",
      },
    ],
  },
  {
    id: 3,
    key: "price",
    label: "가격",
    condition: null,
    isActive: true,
    type: "range", // 가격 범위(min, max)는 프론트 상수로 관리
  },
  {
    id: 4,
    key: "brand",
    label: "브랜드",
    condition: null,
    isActive: true,
    type: "brand", // 프론트단에서 brand관련 api 호출 후 자체적으로 항목 처리
  },
];

export default function FilterManagement() {
  const [localFilterItems, setLocalFilterItems] =
    useState<Array<FilterItem>>(DUMMY_FILTER_ITEMS);

  const handleChange = (item: FilterItem) => {
    setLocalFilterItems(
      produce((draft) => {
        const index = draft.findIndex((v) => v.id === item.id);
        if (index !== -1) {
          draft[index] = { ...item };
        }
      })
    );
  };

  console.log(localFilterItems);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row justify-end gap-2 items-center">
        <Button variant={"outline"} className="w-fit">
          필터 추가
          <PlusIcon className="w-fit" />
        </Button>
        <Button variant="default" className="w-fit">
          저장
        </Button>
      </div>
      <FilterCollapse items={localFilterItems} onChange={handleChange} />
    </div>
  );
}
