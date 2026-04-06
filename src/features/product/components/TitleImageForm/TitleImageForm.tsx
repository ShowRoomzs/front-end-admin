import FormController from "@/common/components/Form/FormController";
import FormItem from "@/common/components/Form/FormItem";
import type { ProductDetailFormData } from "@/features/product/pages/ProductDetailPage";
import type { Control } from "react-hook-form";

interface TitleImageFormProps {
  control: Control<ProductDetailFormData>;
}

export default function TitleImageForm(props: TitleImageFormProps) {
  const { control } = props;

  return (
    <FormController
      name="titleImage"
      control={control}
      render={({ field }) => (
        <FormItem required label="대표 이미지">
          {field.value ? (
            <img
              src={field.value}
              alt="대표 이미지"
              className="w-40 h-48 object-cover rounded-md border border-gray-200"
            />
          ) : (
            <div className="w-40 h-48 flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-400">
              이미지 없음
            </div>
          )}
        </FormItem>
      )}
    />
  );
}
