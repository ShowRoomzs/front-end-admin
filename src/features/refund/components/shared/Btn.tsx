import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

/*
  시안 `.btn` — 12px/500 · 32px · 좌우 14px. `.btn-sm`은 28px · 좌우 12px(표 안 버튼).
  비활성은 시안 `.btn:disabled`(n-100 면 + n-200 테두리 + n-400 글자)를 그대로 쓴다.
  공용 Button(shadcn)은 14px 베이스라 12px 라벨로 짜인 어드민 시안과 어긋난다(계약 관리와 같은 판단).
*/
const BASE =
  "inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[6px] px-3.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed disabled:border disabled:border-sz-n-200 disabled:bg-sz-n-100 disabled:text-sz-n-400";

const VARIANT_CLASS = {
  primary: "bg-sz-accent-500 text-white hover:bg-sz-accent-600",
  secondary:
    "border border-sz-n-300 bg-white text-sz-n-900 hover:bg-sz-n-100 hover:border-sz-n-400",
} as const;

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANT_CLASS;
  small?: boolean;
  isLoading?: boolean;
}

export default function Btn(props: BtnProps) {
  const {
    variant = "secondary",
    small = false,
    isLoading = false,
    className,
    children,
    disabled,
    type = "button",
    ...rest
  } = props;

  return (
    <button
      type={type}
      className={cn(
        BASE,
        VARIANT_CLASS[variant],
        small && "h-7 px-3",
        className
      )}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
