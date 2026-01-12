import { memo } from "react";
import FormCategorySelector, {
  type CategoryValue,
} from "@/common/components/Form/FormCategorySelector";
import FormInput from "@/common/components/Form/FormInput";
import FormSelect from "@/common/components/Form/FormSelect";
import type { Option } from "@/common/types/option";
import { Label } from "@/components/ui/label";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { RadioGroup } from "@radix-ui/react-radio-group";

type FilterType = "radio" | "category" | "input" | "select";

interface FilterItemProps<T> {
  type: FilterType;
  fieldKey: string;
  value: T;
  onChange: (value: T) => void;
  options?: Array<Option<string | null>>;
  placeholder?: string;
  onSubmit?: () => void;
}

function FilterItemComponent<T>(props: FilterItemProps<T>) {
  const { type, fieldKey, value, onChange, options, placeholder, onSubmit } =
    props;

  switch (type) {
    case "radio": {
      return (
        <RadioGroup
          value={value as string}
          onValueChange={onChange as (value: string) => void}
          className="flex gap-6"
        >
          {options?.map((o) => (
            <div
              key={`${fieldKey}-${o.value}`}
              className="flex items-center gap-2"
            >
              <RadioGroupItem
                value={o.value as string}
                id={`${fieldKey}-${o.value}`}
              />
              <Label
                htmlFor={`${fieldKey}-${o.value}`}
                className="cursor-pointer"
              >
                {o.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      );
    }
    case "category":
      return (
        <FormCategorySelector
          value={Number(value)}
          onChange={onChange as (value: CategoryValue) => void}
        />
      );
    case "input":
      return (
        <FormInput
          value={value as string}
          onChange={onChange as (value: string) => void}
          placeholder={placeholder}
          onKeyDown={(e) => e.key === "Enter" && onSubmit?.()}
        />
      );
    case "select":
      return (
        <FormSelect
          className="min-w-32"
          options={options ?? []}
          placeholder={placeholder}
          onChange={onChange as (value: string) => void}
          value={value as string}
        />
      );
  }
}

export const FilterItem = memo(
  FilterItemComponent
) as typeof FilterItemComponent;
