import FormController from "@/common/components/Form/FormController";
import FormInput from "@/common/components/Form/FormInput";
import FormItem from "@/common/components/Form/FormItem";
import type { ProductDetailFormData } from "@/features/product/pages/ProductDetailPage";
import type { Control } from "react-hook-form";

interface RegularPriceFormProps {
  control: Control<ProductDetailFormData>;
}

export default function RegularPriceForm(props: RegularPriceFormProps) {
  const { control } = props;

  return (
    <FormController
      name="regularPrice"
      control={control}
      render={({ field }) => (
        <FormItem required label="판매가">
          <FormInput
            type="number"
            value={field.value}
            onChange={field.onChange}
            min={0}
            disabled
          />
        </FormItem>
      )}
    />
  );
}
