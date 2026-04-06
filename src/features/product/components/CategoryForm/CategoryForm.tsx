import FormController from "@/common/components/Form/FormController";
import FormDisplay from "@/common/components/Form/FormDisplay";
import FormItem from "@/common/components/Form/FormItem";
import type { ProductDetailFormData } from "@/features/product/pages/ProductDetailPage";
import type { Control } from "react-hook-form";

interface CategoryFormProps {
  control: Control<ProductDetailFormData>;
}

export default function CategoryForm(props: CategoryFormProps) {
  const { control } = props;

  return (
    <FormController
      name="categoryName"
      control={control}
      render={({ field }) => (
        <FormItem label="카테고리">
          <FormDisplay value={field.value || "-"} />
        </FormItem>
      )}
    />
  );
}
