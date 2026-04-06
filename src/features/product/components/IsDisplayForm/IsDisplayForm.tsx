import FormController from "@/common/components/Form/FormController";
import FormItem from "@/common/components/Form/FormItem";
import FormRadioGroup from "@/common/components/Form/FormRadioGroup";
import type { ProductDetailFormData } from "@/features/product/pages/ProductDetailPage";
import type { Control } from "react-hook-form";

interface IsDisplayFormProps {
  control: Control<ProductDetailFormData>;
}

export default function IsDisplayForm(props: IsDisplayFormProps) {
  const { control } = props;

  return (
    <FormController
      name="isDisplay"
      control={control}
      render={({ field }) => (
        <FormItem label="진열상태" required>
          <FormRadioGroup<boolean>
            options={[
              { label: "진열", value: true },
              { label: "미진열", value: false },
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
