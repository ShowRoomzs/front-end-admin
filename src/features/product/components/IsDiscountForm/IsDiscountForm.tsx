import FormController from "@/common/components/Form/FormController";
import FormItem from "@/common/components/Form/FormItem";
import FormRadioGroup from "@/common/components/Form/FormRadioGroup";
import type { ProductDetailFormData } from "@/features/product/pages/ProductDetailPage";
import type { Control } from "react-hook-form";

interface IsDiscountFormProps {
  control: Control<ProductDetailFormData>;
}

export default function IsDiscountForm(props: IsDiscountFormProps) {
  const { control } = props;

  return (
    <FormController
      name="isDiscount"
      control={control}
      render={({ field }) => (
        <FormItem label="할인">
          <FormRadioGroup<boolean>
            options={[
              { label: "설정", value: true },
              { label: "설정 안함", value: false },
            ]}
            value={field.value}
            onChange={field.onChange}
            disabled
          />
        </FormItem>
      )}
    />
  );
}
