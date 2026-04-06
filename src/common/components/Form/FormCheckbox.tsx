import { forwardRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface FormCheckboxProps {
  label: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

const FormCheckbox = forwardRef<HTMLButtonElement, FormCheckboxProps>(
  (props, ref) => {
    const { label, checked, onCheckedChange, disabled = false } = props;

    const id = `checkbox-${label.replace(/\s+/g, "-")}`;

    return (
      <div className="flex items-center space-x-2">
        <Checkbox
          ref={ref}
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
        <Label
          htmlFor={id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          {label}
        </Label>
      </div>
    );
  }
);

FormCheckbox.displayName = "FormCheckbox";

export default FormCheckbox;
