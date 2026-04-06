import FormController from "@/common/components/Form/FormController";
import FormInput from "@/common/components/Form/FormInput";
import FormItem from "@/common/components/Form/FormItem";
import type { ProductDetailFormData } from "@/features/product/pages/ProductDetailPage";
import type { Control } from "react-hook-form";

interface ProductNoticeFormProps {
  control: Control<ProductDetailFormData>;
}

const NOTICE_FIELDS: Array<{ key: keyof ProductDetailFormData["productNotice"]; label: string }> = [
  { key: "origin", label: "제조국" },
  { key: "material", label: "소재" },
  { key: "color", label: "색상" },
  { key: "size", label: "치수" },
  { key: "manufacturer", label: "제조자" },
  { key: "washingMethod", label: "세탁 방법" },
  { key: "manufactureDate", label: "제조년월" },
  { key: "asInfo", label: "A/S안내 및 연락처" },
  { key: "qualityAssurance", label: "품질 보증 기준" },
];

export default function ProductNoticeForm(props: ProductNoticeFormProps) {
  const { control } = props;

  return (
    <>
      {NOTICE_FIELDS.map(({ key, label }) => (
        <FormController
          key={key}
          name={`productNotice.${key}`}
          control={control}
          render={({ field }) => (
            <FormItem required label={label}>
              <FormInput
                value={field.value ?? ""}
                onChange={field.onChange}
                disabled
              />
            </FormItem>
          )}
        />
      ))}
    </>
  );
}
