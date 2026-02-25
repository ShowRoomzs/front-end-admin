import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateCoupon } from "@/features/coupon/hooks/useCreateCoupon";
import type { CreateCouponRequest } from "@/features/coupon/types/coupon";
import { useState } from "react";
import toast from "react-hot-toast";

interface CreateCouponModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateCouponModal(props: CreateCouponModalProps) {
  const { open, onOpenChange } = props;
  const { mutateAsync: createCoupon, isPending } = useCreateCoupon();

  const [formData, setFormData] = useState<CreateCouponRequest>({
    name: "",
    couponCode: "",
    discountType: "PERCENTAGE",
    discountValue: 0,
    minOrderAmount: undefined,
    maxDiscountAmount: undefined,
    validFrom: "",
    validTo: "",
  });

  const [discountValueInput, setDiscountValueInput] = useState<string>("");
  const [minOrderAmountInput, setMinOrderAmountInput] = useState<string>("");
  const [maxDiscountAmountInput, setMaxDiscountAmountInput] =
    useState<string>("");

  const handleChange = (
    key: Exclude<
      keyof CreateCouponRequest,
      "discountValue" | "minOrderAmount" | "maxDiscountAmount"
    >,
    value: string | number | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("쿠폰명을 입력해주세요.");
      return;
    }
    if (!formData.couponCode.trim()) {
      toast.error("쿠폰 코드를 입력해주세요.");
      return;
    }
    const discountValue = Number(discountValueInput);
    if (!discountValueInput || discountValue <= 0) {
      toast.error("할인 값을 입력해주세요.");
      return;
    }
    if (formData.discountType === "PERCENTAGE" && discountValue > 100) {
      toast.error("퍼센트 할인은 최대 100까지 입력 가능합니다.");
      return;
    }

    const minOrderAmount = minOrderAmountInput
      ? Number(minOrderAmountInput)
      : undefined;
    const maxDiscountAmount = maxDiscountAmountInput
      ? Number(maxDiscountAmountInput)
      : undefined;

    if (minOrderAmount !== undefined && minOrderAmount <= 0) {
      toast.error("최소 주문 금액은 양수여야 합니다.");
      return;
    }
    if (maxDiscountAmount !== undefined && maxDiscountAmount <= 0) {
      toast.error("최대 할인 금액은 양수여야 합니다.");
      return;
    }

    if (!formData.validFrom) {
      toast.error("유효 시작일을 입력해주세요.");
      return;
    }
    if (!formData.validTo) {
      toast.error("유효 종료일을 입력해주세요.");
      return;
    }
    if (new Date(formData.validFrom) >= new Date(formData.validTo)) {
      toast.error("유효 종료일은 유효 시작일보다 이후여야 합니다.");
      return;
    }

    try {
      await createCoupon({
        ...formData,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        validFrom: `${formData.validFrom}:00`,
        validTo: `${formData.validTo}:00`,
      });
      toast.success("쿠폰이 등록되었습니다.");
      handleClose();
    } catch {
      toast.error("쿠폰 등록에 실패했습니다.");
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      couponCode: "",
      discountType: "PERCENTAGE",
      discountValue: 0,
      minOrderAmount: undefined,
      maxDiscountAmount: undefined,
      validFrom: "",
      validTo: "",
    });
    setDiscountValueInput("");
    setMinOrderAmountInput("");
    setMaxDiscountAmountInput("");
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    } else {
      onOpenChange(open);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>쿠폰 등록</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">쿠폰명 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="쿠폰명을 입력하세요"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="couponCode">쿠폰 코드 *</Label>
            <Input
              id="couponCode"
              value={formData.couponCode}
              onChange={(e) => handleChange("couponCode", e.target.value)}
              placeholder="쿠폰 코드를 입력하세요"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="discountType">할인 타입 *</Label>
            <Select
              value={formData.discountType}
              onValueChange={(value) => handleChange("discountType", value)}
            >
              <SelectTrigger id="discountType" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">퍼센트</SelectItem>
                <SelectItem value="FIXED_AMOUNT">고정 금액</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="discountValue">할인 값 *</Label>
            <Input
              id="discountValue"
              type="text"
              value={discountValueInput}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || /^\d+$/.test(value)) {
                  const numValue = Number(value);
                  if (
                    value === "" ||
                    (formData.discountType === "PERCENTAGE"
                      ? numValue <= 100
                      : true)
                  ) {
                    setDiscountValueInput(value);
                  }
                }
              }}
              placeholder="할인 값을 입력하세요"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="minOrderAmount">최소 주문 금액</Label>
            <Input
              id="minOrderAmount"
              type="text"
              value={minOrderAmountInput}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || /^\d+$/.test(value)) {
                  const numValue = Number(value);
                  if (value === "" || numValue > 0) {
                    setMinOrderAmountInput(value);
                  }
                }
              }}
              placeholder="최소 주문 금액을 입력하세요"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="maxDiscountAmount">최대 할인 금액</Label>
            <Input
              id="maxDiscountAmount"
              type="text"
              value={maxDiscountAmountInput}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || /^\d+$/.test(value)) {
                  const numValue = Number(value);
                  if (value === "" || numValue > 0) {
                    setMaxDiscountAmountInput(value);
                  }
                }
              }}
              placeholder="최대 할인 금액을 입력하세요"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="validFrom">유효 시작일 *</Label>
            <Input
              id="validFrom"
              type="datetime-local"
              value={formData.validFrom}
              onChange={(e) => handleChange("validFrom", e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="validTo">유효 종료일 *</Label>
            <Input
              id="validTo"
              type="datetime-local"
              value={formData.validTo}
              onChange={(e) => handleChange("validTo", e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} isLoading={isPending}>
            등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
