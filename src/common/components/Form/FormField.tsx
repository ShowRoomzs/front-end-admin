import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  children: ReactNode;
  labelWidth?: string;
}

export default function FormField(props: FormFieldProps) {
  const { label, children, labelWidth = "w-20" } = props;

  return (
    <div className="flex items-center gap-4">
      <label className={`text-sm font-medium whitespace-nowrap ${labelWidth}`}>
        {label}
      </label>
      {children}
    </div>
  );
}
