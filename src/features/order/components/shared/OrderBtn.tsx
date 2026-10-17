import {
  BTN_DANGER,
  BTN_DANGER_O,
  BTN_PRIMARY,
  BTN_SECONDARY,
} from "@/features/order/components/shared/styles";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type OrderBtnVariant = "primary" | "secondary" | "dangerOutline" | "danger";

const VARIANT_CLASS: Record<OrderBtnVariant, string> = {
  primary: BTN_PRIMARY,
  secondary: BTN_SECONDARY,
  dangerOutline: BTN_DANGER_O,
  danger: BTN_DANGER,
};

interface OrderBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: OrderBtnVariant;
  /** 레일 폼·카드 안에서는 가로를 꽉 채운다(시안 `.rl-b .btn` · `.ifm .btn`) */
  block?: boolean;
}

/** 시안 `.btn` 계열 — 주문 조회 전용. 비활성 버튼에 인라인 opacity를 덧씌우지 않는다(DS `.btn:disabled`) */
export default function OrderBtn(props: OrderBtnProps) {
  const {
    variant = "secondary",
    block = false,
    className,
    type = "button",
    ...rest
  } = props;
  return (
    <button
      type={type}
      className={cn(VARIANT_CLASS[variant], block && "w-full", className)}
      {...rest}
    />
  );
}
