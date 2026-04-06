import { forwardRef } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Option } from "@/common/types/option";

interface FormRadioGroupProps<T = string> {
  options: Array<Option<T>>;
  disabled?: boolean;
  onChange?: (value: T) => void;
  value?: T;
}

const FormRadioGroupInner = <T,>(
  props: FormRadioGroupProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) => {
  const { options, disabled = false, onChange, value } = props;

  return (
    <RadioGroup
      ref={ref}
      value={String(value)}
      onValueChange={(val) => {
        const option = options.find((opt) => String(opt.value) === val);
        if (option) {
          onChange?.(option.value);
        }
      }}
      disabled={disabled}
      className="flex gap-4"
    >
      {options.map((option) => (
        <div key={String(option.value)} className="flex items-center space-x-2">
          <RadioGroupItem
            value={String(option.value)}
            id={String(option.value)}
          />
          <Label htmlFor={String(option.value)} className="font-normal">
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};

const FormRadioGroup = forwardRef(FormRadioGroupInner) as <T = string>(
  props: FormRadioGroupProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => ReturnType<typeof FormRadioGroupInner>;

export default FormRadioGroup;
