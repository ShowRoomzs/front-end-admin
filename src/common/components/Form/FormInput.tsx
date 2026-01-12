import { forwardRef } from "react";
import { Input } from "@/components/ui/input";

interface FormInputProps {
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  value?: string | number;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>((props, ref) => {
  const {
    placeholder,
    maxLength,
    disabled = false,
    value,
    onChange,
    onBlur,
    id,
    type = "text",
    min,
    max,
    onKeyDown,
  } = props;

  return (
    <Input
      ref={ref}
      id={id}
      type={type}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      onBlur={onBlur}
      min={min}
      max={max}
      onKeyDown={onKeyDown}
    />
  );
});

FormInput.displayName = "FormInput";

export default FormInput;
