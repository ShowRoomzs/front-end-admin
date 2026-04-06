import FormController from "@/common/components/Form/FormController";
import FormOptionCombinationTable from "@/common/components/Form/FormOptionCombinationTable";
import type { ProductDetailFormData } from "@/features/product/pages/ProductDetailPage";
import type { Control } from "react-hook-form";

interface OptionCombinationsFormProps {
  control: Control<ProductDetailFormData>;
}

export default function OptionCombinationsForm(
  props: OptionCombinationsFormProps
) {
  const { control } = props;

  return (
    <FormController
      name="optionCombinations"
      control={control}
      render={({ field }) => (
        <FormOptionCombinationTable combinations={field.value} disabled />
      )}
    />
  );
}
