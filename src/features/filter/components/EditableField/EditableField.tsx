import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Option } from "@/common/types";
import { type KeyboardEvent, type MouseEvent } from "react";

interface EditableFieldBaseProps {
  label: string;
  isEdit: boolean;
  onEditClick?: (e: MouseEvent) => void;
  className?: string;
}

interface EditableInputFieldProps extends EditableFieldBaseProps {
  type: "input";
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

interface EditableSelectFieldProps<
  T = string | null,
> extends EditableFieldBaseProps {
  type: "select";
  value: T;
  onChange: (value: T) => void;
  options: Array<Option<T>>;
  placeholder?: string;
}

interface EditableSwitchFieldProps extends EditableFieldBaseProps {
  type: "switch";
  checked: boolean;
  onChange: (checked: boolean) => void;
}

type EditableFieldProps<T = string | null> =
  | EditableInputFieldProps
  | EditableSelectFieldProps<T>
  | EditableSwitchFieldProps;

export default function EditableField<T = string | null>(
  props: EditableFieldProps<T>
) {
  const { label, isEdit, className } = props;

  const handleWrapperClick = (e: MouseEvent<HTMLDivElement>) => {
    if (props.type !== "input") {
      e.stopPropagation();
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {label}
        </span>
        {isEdit ? (
          <div onClick={handleWrapperClick} className="flex-1">
            {props.type === "input" && (
              <Input
                onClick={(e) => e.stopPropagation()}
                onKeyDown={props.onKeyDown}
                value={props.value}
                onChange={(e) => props.onChange(e.target.value)}
                placeholder={props.placeholder}
                className="h-8 w-[100px]"
              />
            )}
            {props.type === "select" && (
              <Select
                value={
                  props.value === null || props.value === undefined
                    ? "__null__"
                    : String(props.value)
                }
                onValueChange={(val) => {
                  const option = props.options.find((opt) => {
                    if (opt.value === null || opt.value === undefined) {
                      return val === "__null__";
                    }
                    return String(opt.value) === val;
                  });
                  if (option) {
                    props.onChange(option.value);
                  }
                }}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder={props.placeholder} />
                </SelectTrigger>
                <SelectContent position="popper">
                  {props.options.map((option, index) => {
                    const optionValue =
                      option.value === null || option.value === undefined
                        ? "__null__"
                        : String(option.value);
                    return (
                      <SelectItem
                        key={optionValue || `option-${index}`}
                        value={optionValue}
                      >
                        {option.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
            {props.type === "switch" && (
              <Switch
                checked={props.checked}
                onCheckedChange={props.onChange}
              />
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">
            {props.type === "input" && props.value}
            {props.type === "select" &&
              (props.options.find((opt) => opt.value === props.value)?.label ??
                "NULL")}
            {props.type === "switch" && (props.checked ? "Active" : "Inactive")}
          </span>
        )}
      </div>
    </div>
  );
}
