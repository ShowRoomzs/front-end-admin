import FormController from "@/common/components/Form/FormController";
import FormInput from "@/common/components/Form/FormInput";
import FormItem from "@/common/components/Form/FormItem";
import type { ProductDetailFormData } from "@/features/product/pages/ProductDetailPage";
import type { Control } from "react-hook-form";

interface ProductNameFormProps {
  control: Control<ProductDetailFormData>;
}

export default function ProductNameForm(props: ProductNameFormProps) {
  const { control } = props;

  return (
    <FormController
      name="productName"
      control={control}
      render={({ field }) => (
        <FormItem label="상품명" required>
          <FormInput
            value={field.value}
            placeholder="상품명을 입력해 주세요"
            maxLength={100}
            onChange={field.onChange}
            disabled
          />
        </FormItem>
      )}
    />
  );
}
