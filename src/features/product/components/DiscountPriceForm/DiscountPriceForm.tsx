import FormDisplay from "@/common/components/Form/FormDisplay";
import FormItem from "@/common/components/Form/FormItem";
import { useCallback } from "react";
import { useWatch, type Control } from "react-hook-form";
import type { ProductDetailFormData } from "@/features/product/pages/ProductDetailPage";

interface DiscountPriceFormProps {
  control: Control<ProductDetailFormData>;
}

export default function DiscountPriceForm(props: DiscountPriceFormProps) {
  const { control } = props;

  const regularPrice = useWatch({
    control,
    name: "regularPrice",
    defaultValue: 0,
  });

  const discountRate = useWatch({
    control,
    name: "discountRate",
    defaultValue: 0,
  });

  const isDiscount = useWatch({
    control,
    name: "isDiscount",
    defaultValue: false,
  });

  const getDiscountedPrice = useCallback(() => {
    const regularPriceNum = Number(regularPrice);
    const discountRateNum = Number(discountRate);
    if (isDiscount) {
      return Math.max(regularPriceNum - discountRateNum, 0).toLocaleString();
    }

    return regularPriceNum.toLocaleString();
  }, [discountRate, isDiscount, regularPrice]);

  return (
    <FormItem label="할인 판매가">
      <FormDisplay value={getDiscountedPrice()} />
    </FormItem>
  );
}
