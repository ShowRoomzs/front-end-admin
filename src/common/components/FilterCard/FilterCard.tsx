import FormField from "@/common/components/Form/FormField";
import Section from "@/common/components/Section/Section";
import type { Option } from "@/common/types/option";
import type { BaseParams } from "@/common/types/page";
import { Button } from "@/components/ui/button";
import { useCallback, useMemo } from "react";
import { FilterItem } from "./FilterItem";

type FilterType = "radio" | "category" | "input" | "select";

export type FilterOption<P> = {
  [K in keyof P]: {
    type: FilterType;
    key: K;
    subFilterOption?: FilterOption<P>;

    options?: Array<Option<string | null>>;
    placeholder?: string;
  };
}[keyof P];
export type FilterOptionGroup<P> = Record<string, Array<FilterOption<P>>>;
interface FilterCardProps<P> {
  options: FilterOptionGroup<P>;
  params: P;
  onChange: (key: keyof P, value: P[keyof P]) => void;
  onSubmit?: () => void;
  onReset?: () => void;
}

export default function FilterCard<P extends BaseParams>(
  props: FilterCardProps<P>
) {
  const { options, params, onChange, onReset, onSubmit } = props;

  const handleChangeMap = useMemo(() => {
    const map = new Map<keyof P, (value: P[keyof P]) => void>();
    Object.values(options)
      .flat()
      .forEach((option) => {
        if (!map.has(option.key)) {
          map.set(option.key, (value: P[keyof P]) => {
            if (option.type === "category") {
              const categoryValue = value as {
                main: number | null;
                sub: number | null;
                detail: number | null;
              };
              const { detail, main, sub } = categoryValue;
              onChange(option.key, (detail ?? sub ?? main) as P[keyof P]);
            } else {
              onChange(option.key, value);
            }
          });
        }
      });
    return map;
  }, [onChange, options]);

  const renderContent = useCallback(
    (option: FilterOption<P>) => {
      const handleChange = handleChangeMap.get(option.key);
      if (!handleChange) return null;

      return (
        <FilterItem
          key={String(option.key)}
          type={option.type}
          fieldKey={String(option.key)}
          value={params[option.key]}
          onChange={handleChange}
          options={option.options}
          placeholder={option.placeholder}
          onSubmit={onSubmit}
        />
      );
    },
    [params, handleChangeMap, onSubmit]
  );

  const renderField = useCallback(
    (label: string, options: Array<FilterOption<P>>) => {
      return (
        <FormField key={label} label={label}>
          <div className="flex flex-row gap-2 items-center">
            {options.map(renderContent)}
          </div>
        </FormField>
      );
    },
    [renderContent]
  );

  return (
    <Section className="shrink-0">
      <div className="space-y-4">
        {Object.entries(options).map(([label, options]) =>
          renderField(label, options)
        )}
      </div>
      <div className="absolute right-4 top-4 flex flex-row gap-4">
        <Button
          onClick={onSubmit}
          variant="default"
          size="default"
          className="px-6"
        >
          검색하기
        </Button>
        <Button
          onClick={onReset}
          variant="outline"
          size="default"
          className="px-6"
        >
          초기화
        </Button>
      </div>
    </Section>
  );
}
