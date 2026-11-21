import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/*
  DS v1.2 `.btn` — 32px · 12px/500 · 모서리 6px · 좌우 14px · gap 6px.
  disabled는 모든 종류 공통(n-100 면 + n-200 테두리 + n-400 글자), opacity로 흐리지 않는다.
  secondary와 outline은 같은 DS `.btn-secondary`다.
*/
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:border disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-sz-accent-50 aria-invalid:border aria-invalid:border-sz-danger-text",
  {
    variants: {
      variant: {
        default: "bg-sz-accent-500 text-white hover:bg-sz-accent-600",
        destructive: "bg-sz-danger-text text-white hover:bg-[#8f2828]",
        outline:
          "border border-sz-n-300 bg-white text-sz-n-900 hover:bg-sz-n-100",
        secondary:
          "border border-sz-n-300 bg-white text-sz-n-900 hover:bg-sz-n-100",
        ghost: "bg-transparent text-sz-n-600 hover:bg-sz-n-100",
        link: "text-sz-accent-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-3.5",
        sm: "h-7 px-3",
        lg: "h-10 px-5 text-[13px]",
        icon: "size-8",
        "icon-sm": "size-7",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  isLoading = false,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isLoading?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || isLoading}
      {...props}
    >
      {children}
      {isLoading && <Loader2 className="animate-spin" />}
    </Comp>
  );
}

// buttonVariants는 이 파일 안에서만 쓴다(밖으로 내보내면 fast refresh 규칙에 걸린다)
export { Button };
