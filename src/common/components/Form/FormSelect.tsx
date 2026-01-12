import { forwardRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Option } from "@/common/types/option";

interface FormSelectProps {
  options: Array<Option<string | null>>;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  value?: string;
  className?: string;
}

const FormSelect = forwardRef<HTMLButtonElement, FormSelectProps>(
  (props, ref) => {
    const {
      options,
      placeholder,
      disabled = false,
      onChange,
      value,
      className,
    } = props;

    return (
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger ref={ref} className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={2}>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value as string}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);

FormSelect.displayName = "FormSelect";

export default FormSelect;
