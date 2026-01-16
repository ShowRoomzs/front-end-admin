import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function Toggle(props: ToggleProps) {
  const { checked, onCheckedChange, label, disabled, className } = props;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          {label}
        </span>
      )}
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}
