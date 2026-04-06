import FormController from "@/common/components/Form/FormController";
import FormItem from "@/common/components/Form/FormItem";
import type { ProductDetailFormData } from "@/features/product/pages/ProductDetailPage";
import type { Control } from "react-hook-form";

interface DescriptionFormProps {
  control: Control<ProductDetailFormData>;
}

export default function DescriptionForm(props: DescriptionFormProps) {
  const { control } = props;

  return (
    <FormController
      name="description"
      control={control}
      render={({ field }) => (
        <FormItem required label="상세설명">
          <div
            className="prose prose-sm max-w-none min-h-[300px] p-4 border rounded-lg bg-gray-50"
            dangerouslySetInnerHTML={{ __html: field.value }}
          />
        </FormItem>
      )}
    />
  );
}
