"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

import { cn } from "@/lib/utils";

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      // DS `.fp-box`와 같은 크기 · 색의 원 — 15px · 1.5px n-300 · 켬 accent-500 테두리 + 안쪽 점(세 앱 합의 11-21)
      className={cn(
        "aspect-square size-[15px] shrink-0 rounded-full border-[1.5px] border-sz-n-300 bg-white transition-colors outline-none focus-visible:border-sz-accent-500 focus-visible:ring-[3px] focus-visible:ring-sz-accent-50 data-[state=checked]:border-sz-accent-500 aria-invalid:border-sz-danger-text disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-full items-center justify-center"
      >
        <span className="size-[7px] rounded-full bg-sz-accent-500" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
