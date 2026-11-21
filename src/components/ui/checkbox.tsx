import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      // DS `.fp-box` — 15px · 1.5px n-300 · r 4px · 켬 accent-500 면 + 흰 체크 9px(세 앱 합의 11-21)
      className={cn(
        "peer size-[15px] shrink-0 rounded-[4px] border-[1.5px] border-sz-n-300 bg-white transition-colors outline-none focus-visible:border-sz-accent-500 focus-visible:ring-[3px] focus-visible:ring-sz-accent-50 data-[state=checked]:border-sz-accent-500 data-[state=checked]:bg-sz-accent-500 data-[state=checked]:text-white aria-invalid:border-sz-danger-text disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-[9px]" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
