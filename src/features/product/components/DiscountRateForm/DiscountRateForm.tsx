import FormController from "@/common/components/Form/FormController";
import FormInput from "@/common/components/Form/FormInput";
import FormItem from "@/common/components/Form/FormItem";
import type { ProductDetailFormData } from "@/features/product/pages/ProductDetailPage";
import type { Control } from "react-hook-form";

interface DiscountRateFormProps {
  control: Control<ProductDetailFormData>;
}

export default function DiscountRateForm(props: DiscountRateFormProps) {
  const { control } = props;

  return (
    <FormController
      name="discountRate"
      control={control}
      render={({ field }) => (
        <FormItem label="">
          <FormInput
            disabled
            type="number"
            value={field.value}
            onChange={field.onChange}
            min={0}
          />
        </FormItem>
      )}
    />
  );
}
