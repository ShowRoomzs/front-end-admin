import FormController from "@/common/components/Form/FormController";
import FormItem from "@/common/components/Form/FormItem";
import type { ProductDetailFormData } from "@/features/product/pages/ProductDetailPage";
import type { Control } from "react-hook-form";

interface CoverImagesFormProps {
  control: Control<ProductDetailFormData>;
}

export default function CoverImagesForm(props: CoverImagesFormProps) {
  const { control } = props;

  return (
    <FormController
      name="coverImages"
      control={control}
      render={({ field }) => (
        <FormItem required label="커버 이미지">
          {field.value.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {field.value.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`커버 이미지 ${index + 1}`}
                  className="w-40 h-40 object-cover rounded-md border border-gray-200"
                />
              ))}
            </div>
          ) : (
            <div className="w-40 h-40 flex items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-400">
              이미지 없음
            </div>
          )}
        </FormItem>
      )}
    />
  );
}
