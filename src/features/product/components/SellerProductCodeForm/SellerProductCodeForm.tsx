import FormController from "@/common/components/Form/FormController";
import FormInput from "@/common/components/Form/FormInput";
import FormItem from "@/common/components/Form/FormItem";
import type { ProductDetailFormData } from "@/features/product/pages/ProductDetailPage";
import type { Control } from "react-hook-form";

interface SellerProductCodeFormProps {
  control: Control<ProductDetailFormData>;
}

export default function SellerProductCodeForm(
  props: SellerProductCodeFormProps
) {
  const { control } = props;

  return (
    <FormController
      name="sellerProductCode"
      control={control}
      render={({ field }) => (
        <FormItem label="판매자상품코드">
          <FormInput
            value={field.value}
            onChange={field.onChange}
            disabled
          />
        </FormItem>
      )}
    />
  );
}
