import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <div className="flex flex-row gap-4 items-center">
      <input
        type={type}
        data-slot="input"
        className={cn(
          // DS v1.2 `.inp` — 32px · 13px · 패딩 6/10 · 모서리 6px · n-300 테두리 · n-400 placeholder
          "file:text-sz-n-900 placeholder:text-sz-n-400 selection:bg-sz-accent-500 selection:text-white h-8 w-full min-w-0 rounded-[6px] border border-sz-n-300 bg-white px-2.5 py-1.5 text-[13px] text-sz-n-900 transition-[color,box-shadow,border-color] outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-[13px] file:font-medium disabled:cursor-not-allowed disabled:bg-sz-n-100 disabled:text-sz-n-500",
          "focus:border-sz-accent-500 focus:ring-[3px] focus:ring-sz-accent-50",
          "aria-invalid:border-sz-danger-text",
          className
        )}
        {...props}
      />
      {props?.maxLength && props?.maxLength > 0 && (
        <span className="text-sm text-gray-500">
          {typeof props.value === "string" ? props.value.length : 0}/
          {props.maxLength}
        </span>
      )}
    </div>
  );
}

export { Input };
